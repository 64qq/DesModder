import type { Calc } from "#globals";
import { satisfiesType } from "#parsing/nodeTypes.ts";
import { Identifier } from "#parsing/parsenode.ts";
import traverse, { Path } from "#parsing/traverse.ts";
import { parseDesmosLatex } from "#utils/depUtils.ts";
import { MergeUnion } from "#utils/utils.ts";
import { ItemState } from "graph-state/state";

export const simpleKeys = [
  "latex",
  "colorLatex",
  "pointOpacity",
  "lineOpacity",
  "pointSize",
  "lineWidth",
] as const;
export const rootKeys = [
  ...simpleKeys,
  "labelSize",
  "labelAngle",
  "center",
  "opacity",
  "width",
  "height",
  "angle",
  "fillOpacity",
  "residualVariable",
  "fps",
  "resolution",
] as const;

export const nestedKeyContainers = [
  "slider",
  "parametricDomain",
  "polarDomain",
  "parametricDomain3Du",
  "parametricDomain3Dv",
  "parametricDomain3Dr",
  "parametricDomain3Dphi",
  "cdf",
  "vizProps",
] as const;

export const nestedKeys = [
  "max",
  "min",
  "step",
  "breadth",
  "axisOffset",
] as const;

type RootKey = (typeof rootKeys)[number];

function replace(calc: Calc, replaceLatex: (s: string) => string) {
  // replaceString is applied to stuff like labels
  // middle group in regex accounts for 1 layer of braces, sufficient for `Print ${a+2}`
  function replaceString(s: string) {
    // `from` should have "global" flag enabled in order to replace all
    return s.replace(/(?<=\$\{)((?:[^{}]|\{[^}]*\})+)(?=\})/g, replaceLatex);
  }
  const state = calc.getState();
  const { ticker } = state.expressions;
  if (ticker?.handlerLatex !== undefined) {
    ticker.handlerLatex = replaceLatex(ticker.handlerLatex);
  }
  if (ticker?.minStepLatex !== undefined) {
    ticker.minStepLatex = replaceLatex(ticker.minStepLatex);
  }
  state.expressions.list.forEach(
    (expr: MergeUnion<ItemState> & Partial<Record<RootKey, string>>) => {
      rootKeys.forEach((k) => {
        expr[k] &&= replaceLatex(expr[k]);
      });
      for (const sub of nestedKeyContainers) {
        const subExpr: MergeUnion<(typeof expr)[typeof sub]> = expr[sub];
        if (subExpr) {
          nestedKeys.forEach((k) => {
            subExpr[k] &&= replaceLatex(subExpr[k]);
          });
        }
      }
      expr.label &&= replaceString(expr.label);
      expr.columns?.forEach((col) => {
        simpleKeys.forEach((k) => {
          col[k] &&= replaceLatex(col[k]);
        });
        col.values &&= col.values.map(replaceLatex);
      });
      if (expr.clickableInfo?.latex) {
        expr.clickableInfo.latex = replaceLatex(expr.clickableInfo.latex);
      }
    }
  );
  calc.setState(state, {
    allowUndo: true,
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/** Replacing from (identifier) with to. */
function getReplacements(
  path: Path,
  fromParsed: Identifier,
  from: string,
  to: string
) {
  let span, line;
  switch (path.node.type) {
    case "Identifier":
      if (path.node._symbol === fromParsed._symbol) {
        // A normal identifier
        let { input, start, end } = path.node.getInputSpan();
        const span = input.slice(start, end);
        if (span.includes("^")) {
          // SupSub like x_{2}^3 may include the superscript.
          // Trim to just the x_{2} part
          end = start + span.indexOf("^");
        }
        return [
          {
            start,
            end,
            // If True → it's actually a differential like dx
            // path.parent?.node.type === "Integral" && path.index === 0
            replacement:
              path.node._errorSymbol === "d" + path.node._symbol
                ? "d" + to
                : to,
          },
        ];
      }
      break;
    case "FunctionCall":
      if (path.node._symbol === fromParsed._symbol) {
        span = path.node.getInputSpan();
        return [
          {
            start: span.start,
            end: span.start + from.length,
            replacement: to,
          },
        ];
      }
      break;
    case "Assignment":
    case "FunctionDefinition": {
      span = path.node.getInputSpan();
      line = path.node.getInputString();
      const eqIndex = line.indexOf("=");
      // Need this code (imperfect) to handle funky input like
      // replacing "a_{0}" in "  a_{0}    =    72 "
      const repl = line
        .slice(0, eqIndex)
        .replace(
          RegExp(
            String.raw`(?<=([,(]|^)(\s|\\ )*)` +
              escapeRegExp(from) +
              String.raw`(?=(\s|\\ )*((\\left)?\(|(\\right)?\)|,|$))`,
            "g"
          ),
          to
        );
      if (repl === line) break;
      return [
        {
          start: span.start,
          end: span.start + eqIndex,
          replacement: repl,
        },
      ];
    }
    case "Derivative": {
      span = path.node.getInputSpan();
      line = path.node.getInputString();
      const diffBottomStr = `{d${from}}`;
      const diffBottomStart = line.indexOf(diffBottomStr);
      if (diffBottomStart === -1) break;
      return [
        {
          start: span.start + diffBottomStart,
          end: span.start + diffBottomStart + diffBottomStr.length,
          replacement: `{d${to}}`,
        },
      ];
    }
  }
  return [];
}

export function replacer(from: string, to: string) {
  const fromParsed = parseDesmosLatex(from.trim());
  if (satisfiesType(fromParsed, "Identifier")) {
    // trim `from` to prevent inputs such as "  a" messing up matches that depend on `from` itself.
    from = from.trim();
    return (s: string) => {
      const node = parseDesmosLatex(s);
      if (satisfiesType(node, "Error")) {
        return s;
      }
      const idPositions: {
        start: number;
        end: number;
        replacement: string;
      }[] = [];
      traverse(node, {
        exit(path: Path) {
          idPositions.push(...getReplacements(path, fromParsed, from, to));
        },
      });
      // args don't necessarily go in latex order
      const sorted = idPositions.sort((a, b) => a.start - b.start);
      let acc = "";
      let endIndex = 0;
      for (const { start, end, replacement } of sorted) {
        // Conditional start >= endIndex to avoid double-replacement of the middle value
        // in And(Inequality, Inequality) which were not transformed to DoubleInequality.
        if (start >= endIndex) {
          acc += s.slice(endIndex, start);
          acc += replacement;
        }
        endIndex = end;
      }
      acc += s.slice(endIndex);
      return acc;
    };
  } else {
    // Sticky flag "y", global flag "g"
    const search = escapeRegExp(from);
    const regex = RegExp(`(?<before>.*?)(?<search>${search})`, "gy");
    const endsInCommand = /\\[a-zA-Z]+$/;
    const startsWithLetter = /^[a-zA-Z]/;
    return (s: string) => {
      regex.lastIndex = 0;
      let out = "";
      let r = regex.exec(s);
      let last = 0;
      if (!r) return s;
      for (; r; last = regex.lastIndex, r = regex.exec(s)) {
        if (last === regex.lastIndex) {
          // Empty match
          if (last >= s.length) break;
          out += s[last];
          regex.lastIndex++;
          continue;
        }
        const { before } = r.groups!;
        const insert = to;
        if (endsInCommand.test(out) && startsWithLetter.test(before))
          out += " ";
        out += before;
        if (endsInCommand.test(out) && startsWithLetter.test(insert))
          out += " ";
        out += insert;
      }
      const trailing = s.slice(last);
      if (endsInCommand.test(out) && startsWithLetter.test(trailing))
        out += " ";
      out += trailing;
      return out;
    };
  }
}

export function refactor(calc: Calc, from: string, to: string) {
  replace(calc, replacer(from, to));
}
