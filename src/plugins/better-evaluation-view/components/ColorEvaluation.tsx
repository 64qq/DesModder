import { ComponentChild, jsx } from "#DCGView";
import { StaticMathQuillView } from "#components";
import { TypedConstantValue, ValueType } from "#globals";
import { ColorValueType } from "..";

type TypedConstantColorValue = TypedConstantValue<ColorValueType>;

function _ColorEvaluation(val: TypedConstantColorValue) {
  return (
    <div class="dcg-evaluation-view__wrapped-value">
      <StaticMathQuillView
        latex={() => {
          const { valueType, value } = val;
          const length = 6;
          if (valueType === ValueType.ListOfColor) {
            return (
              "\\operatorname{rgb}\\left(\\left[" +
              value
                .slice(0, length)
                .map((clist) => `\\left(${clist.join(",")}\\right)`)
                .join(",") +
              (value.length > length
                ? `\\textcolor{gray}{...\\mathit{${
                    value.length - length
                  }\\ more}}`
                : "") +
              "\\right]\\right)"
            );
          } else {
            return "\\operatorname{rgb}\\left(" + value.join(",") + "\\right)";
          }
        }}
      />
    </div>
  );
}

export function ColorEvaluation(
  val: TypedConstantColorValue,
  swatch: ComponentChild
) {
  return (
    <span class="dsm-color-container">
      {_ColorEvaluation(val)}
      {swatch}
    </span>
  );
}
