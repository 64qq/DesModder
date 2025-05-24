import { DCGViewModule } from "../DCGView";
import Node from "#parsing/parsenode.ts";
import DSM from "#DSM";
import {
  CheckboxComponent,
  DStaticMathquillViewComponent,
  ExpressionViewComponent,
  IconViewComponent,
  InlineMathInputViewComponent,
  MathQuillField,
  MathQuillViewComponent,
  SegmentedControlComponent,
  TooltipComponent,
  MathQuillConfig,
  PromptSliderViewComponent,
} from "../components/desmosComponents";
import { PluginID } from "../plugins";
import { GenericSettings } from "../plugins/config";
import { ItemModel } from "./models";
import { GraphState } from "../../graph-state";
import { Calc, CalcController } from "./Calc";
import { format } from "#i18n";
import { drawGLesmosSketchToCtx } from "../plugins/GLesmos/drawGLesmosSketchToCtx";
import { insertElement, replaceElement } from "../preload/replaceElement";
import { Concrete, MergeUnion } from "#utils/utils.ts";

export const DesModderUtils = {
  format,
  drawGLesmosSketchToCtx,
} as const;

export const DSMInit = {
  insertElement,
  replaceElement,
} as const;

export interface DWindow extends Window {
  DesModder: {
    controller: DSM;
    exposedPlugins: DSM["enabledPlugins"];
  } & typeof DesModderUtils;
  DSM: DSM;
  DesModderPreload?: {
    pluginsForceDisabled: Set<PluginID>;
    pluginsEnabled: Record<PluginID, boolean | undefined>;
    pluginSettings: Record<PluginID, GenericSettings | undefined>;
  };
  DesModderFragile: {
    ExpressionView: Concrete<typeof ExpressionViewComponent>;
    ImageIconView: Concrete<typeof IconViewComponent>;
  };
  Desmos: Desmos;
}

export type DWindowPreload = Window & {
  /**
   * Don't use Calc directly, unless you're doing global setup for
   * the whole extension. Reference a specific `calc` object instead.
   */
  Calc?: Calc;
  /**
   * @see
   * [esbuild-plugin-inline]({@link ../../loaders/esbuild-plugin-inline.mjs})
   */
  dsm_workerAppend?: string;
} & MergeUnion<Partial<DWindow> | { DSM: typeof DSMInit }>;

type DesmosPublic = typeof Desmos;
interface Desmos extends DesmosPublic {
  Private: {
    Fragile: Fragile;
    Mathtools: Mathtools;
    Parser: Parser;
    MathquillConfig: MathquillConfig;
  };
  MathQuill: {
    config: (config: MathQuillConfig) => Desmos["MathQuill"];
  };
}

export interface LabelOptionsBase {
  zeroCutoff?: number;
  smallCutoff?: number;
  bigCutoff?: number;
  digits?: number;
  displayAsFraction?: boolean;
  addEllipses?: boolean;
  spaceConstrained?: boolean;
  scientificNotationDigits?: number;
}

type ComponentEmitType = "decimalString" | "latex" | (string & {});

interface Mathtools {
  Label: {
    truncatedLatexLabel: (
      label: number,
      labelOptions?: LabelOptionsBase
    ) => string;
    pointLabel: (
      label: [number, number],
      labelOptions?: LabelOptionsBase,
      emitComponentsAs?: ComponentEmitType
    ) => string;
    point3dLabel: (
      label: [number, number, number],
      labelOptions?: LabelOptionsBase,
      emitComponentsAs?: ComponentEmitType
    ) => string;
    complexNumberLabel: (
      label: [number, number],
      labelOptions?: LabelOptionsBase & {
        alwaysEmitImaginary?: boolean;
      },
      emitComponentsAs?: ComponentEmitType
    ) => string;
  };
  migrateToLatest: (s: GraphState) => GraphState;
}

export interface Parser {
  parse: (
    s: string,
    config?: {
      allowDt?: boolean;
      allowIndex?: boolean;
      disallowFrac?: boolean;
      trailingComma?: boolean;
      seedPrefix?: string;
      allowIntervalComprehensions?: boolean;
      disableParentheses?: boolean;
      disabledFeatures?: string[];
    }
  ) => Node;
}

interface MathquillConfig {
  getAutoCommands: (options?: {
    disallowAns?: boolean;
    disallowFrac?: boolean;
    additionalCommands?: string[];
  }) => string;
  getAutoOperators: (options?: {
    additionalOperators?: string[];
    includeGeometryFunctions?: boolean;
    include3DFunctions?: boolean;
    newStats?: boolean;
  }) => string;
}

declare let window: DWindow;

export default window;

interface Fragile {
  DCGView: DCGViewModule;
  PromptSliderView: typeof PromptSliderViewComponent;
  Checkbox: typeof CheckboxComponent;
  SegmentedControl: typeof SegmentedControlComponent;
  MathquillView: typeof MathQuillViewComponent & {
    getFocusedMathquill: () => MathQuillField | undefined;
  };
  InlineMathInputView: typeof InlineMathInputViewComponent;
  StaticMathquillView: typeof DStaticMathquillViewComponent;
  Tooltip: typeof TooltipComponent;
  ExpressionOptionsMenuView: {
    prototype: {
      getSections: {
        apply: (m: { model: ItemModel }) => Section[];
      };
    };
  };
  evaluateLatex: (s: string, getDegreeMode: boolean) => number;
  Keys: {
    lookup: (e: KeyboardEvent) => string;
    lookupChar: (e: KeyboardEvent) => string;
    isUndo: (e: KeyboardEvent) => boolean;
    isRedo: (e: KeyboardEvent) => boolean;
    isHelp: (e: KeyboardEvent) => boolean;
  };
  List: {
    removeItemById: (
      listModel: CalcController["listModel"],
      id: string
    ) => void;
    moveItemsTo: (
      listModel: CalcController["listModel"],
      from: number,
      to: number,
      n: number
    ) => void;
  };
  currentLanguage: () => string;
}

export const Fragile = new Proxy(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {} as Fragile,
  {
    get(_target, prop: keyof Fragile) {
      return window.Desmos?.Private?.Fragile?.[prop];
    },
  }
);

type Section = "colors-only" | "lines" | "points" | "fill" | "label" | "drag";

type Private = Desmos["Private"];
export const Private = new Proxy(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {} as Private,
  {
    get(_target, prop: keyof Private) {
      return window.Desmos?.Private?.[prop];
    },
  }
);

/* Object.fromEntries based on https://dev.to/svehla/typescript-object-fromentries-389c */
type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
type FromEntries<T> = T extends [infer Key, unknown][]
  ? {
      [K in Key extends string ? Key : string]: Extract<
        T[number],
        [K, unknown]
      >[1];
    }
  : Record<string, unknown>;

export type FromEntriesWithReadOnly<T> = FromEntries<DeepWriteable<T>>;

declare global {
  interface ObjectConstructor {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    fromEntries<T>(obj: T): FromEntriesWithReadOnly<T>;
  }
}

/**
 * Use `Console.warn` and related methods for logs that should be released
 * Use `console.log` (lowercase) when you're debugging, to avoid accidental commit
 * Use `/* eslint-disable no-console` and lowercase `console.log` on node scripts
 */
export const Console = globalThis.console;
