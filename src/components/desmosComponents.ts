import { ExpressionModel, ItemModel } from "../globals/models";
import {
  ClassComponent,
  Component,
  ComponentChild,
  ComponentTemplate,
  ComponentTemplateError,
  ComponentTemplateFlagment,
  ComponentTemplateWithTagName,
  ComponentTemplateWithViewClass,
  DCGView,
} from "#DCGView";
import window, { CalcController, Fragile } from "#globals";
import { createElementWrapped } from "../preload/replaceElement";
import { WrapInArray } from "#utils/utils.ts";

export abstract class CheckboxComponent extends ClassComponent<{
  checked: boolean;
  disabled?: boolean;
  small?: boolean;
  ariaLabel: string;
  onChange: (checked: boolean) => void;
  children?: ComponentChild;
}> {}

export const { Checkbox } = Fragile;

export abstract class SegmentedControlComponent extends ClassComponent<{
  ariaGroupLabel: string;
  minButtonWidth?: number;
  disabled?: boolean;
  theme?: "mini" | "default";
  staticConfig: {
    key: string;
    label: () => string;
    ariaLabel?: () => string;
    selected: () => boolean;
    onSelect: () => void;
    icon?: () => string;
    tooltip?: () => unknown;
    tooltipGravity?: () => unknown;
    class?: () => string;
    focusHelperOptions?: unknown;
  }[];
}> {}

export const DesmosSegmentedControl = Fragile.SegmentedControl;

export interface MathQuillFieldOptions {
  overrideKeystroke: (key: string, evt: KeyboardEvent) => void;
  autoOperatorNames: Record<string, string>;
  autoCommands: Record<string, number>;
}

export interface DomFrag {
  insAtDirEnd: () => DomFrag;
  insDirOf: () => DomFrag;
  removeClass: (cls: string) => DomFrag;
  addClass: (cls: string) => DomFrag;
}

export interface MQCursor {
  parent?: MQCursor;
  latex?: () => string;
  [-1]: MQCursor | undefined;
  [1]: MQCursor | undefined;
  cursorElement?: HTMLElement;
  ctrlSeq?: string;
  _el?: HTMLElement;
  domFrag: () => DomFrag;
}

export interface MathQuillConfig {
  autoOperatorNames?: string;
  disableAutoSubstitutionInSubscripts?: boolean;
  autoCommands?: string;
  charsThatBreakOutOfSupSub?: string;
  autoSubscriptNumerals?: boolean;
  sumStartsWithNEquals?: boolean;
  leftRightIntoCmdGoes?: string;
  supSubsRequireOperand?: boolean;
  restrictMismatchedBrackets?: boolean;
  typingPercentWritesPercentOf?: boolean;
}

export interface MathQuillField {
  keystroke: (key: string, e?: KeyboardEvent) => void;
  latex: (input?: string) => string;
  typedText: (input: string) => void;
  config: (input: MathQuillConfig) => MathQuillField;
  focus: () => void;
  blur: () => void;
  __controller: {
    options: MathQuillFieldOptions;
    cursor: MQCursor;
    container: HTMLElement;
  };
  __options: MathQuillFieldOptions;
}

export abstract class MathQuillViewComponent extends ClassComponent<{
  latex: string;
  capExpressionSize: number | false;
  config: { autoOperatorNames: string };
  isFocused: boolean;
  getAriaLabel: string;
  getAriaPostLabel: string;
  onUserChangedLatex: (s: string) => void;
  onUserPressedKey?: (key: string, e: KeyboardEvent) => void;
  hasError?: boolean;
  selectOnFocus?: boolean;
  needsSystemKeypad?: boolean;
  onFocusedChanged?: (isFocused: boolean) => void;
  noFadeout?: boolean;
}> {}

export const MathQuillView = Fragile.MathquillView;

export abstract class InlineMathInputViewComponent extends ClassComponent<{
  containerClass?: string | Record<string, boolean>;
  latex: string;
  // capExpressionSize: number | false;
  // config: { autoOperatorNames: string };
  isFocused: boolean;
  ariaLabel: string;
  // ariaPostLabel: string;
  placeholder: string;
  handleLatexChanged: (s: string) => void;
  handlePressedKey?: (key: string, e: KeyboardEvent) => void;
  hasError?: boolean;
  selectOnFocus?: boolean;
  needsSystemKeypad?: boolean;
  handleFocusChanged?: (isFocused: boolean) => void;
  noFadeout?: boolean;
  readonly: boolean;
  controller: CalcController;
}> {}

/** General InlineMathInputView, without any defaults filled in */
export const InlineMathInputViewGeneral = Fragile.InlineMathInputView;

export const { For, If, IfElse, Input, Switch, SwitchUnion } =
  DCGView.Components;
export function Match<Disc extends { type: Key }, Key extends string>(
  discriminant: () => Disc,
  branches: {
    [K in Key]: (r: Disc & { type: K }) => ComponentChild;
  }
): ComponentTemplate {
  return createElementWrapped(Switch, {
    key: () => discriminant().type,
    children: () => {
      const d = discriminant();
      return branches[d.type](d);
    },
  });
}

export abstract class DStaticMathquillViewComponent extends ClassComponent<{
  latex: string;
  config: MathQuillConfig;
}> {}

export const DStaticMathquillView = Fragile.StaticMathquillView;

export abstract class TooltipComponent extends ClassComponent<{
  tooltip: string;
  gravity?: "n" | "e" | "s" | "w";
  children?: ComponentChild;
}> {}

export const { Tooltip } = Fragile;

interface ExpressionViewComponentTemplate
  extends ComponentTemplateWithTagName<
    "div",
    {
      "expr-id": () => ExpressionModel["id"];
      children: [
        ComponentTemplateWithTagName<
          "div",
          {
            class: () => "dcg-fade-container";
            children: [
              ComponentTemplateWithTagName<
                "div",
                {
                  class: () => "dcg-main";
                  children: [
                    ComponentTemplateWithViewClass,
                    ComponentTemplateWithViewClass,
                  ];
                }
              >,
              ComponentTemplateWithViewClass,
              ComponentTemplateWithViewClass,
            ];
          }
        >,
        ComponentTemplateWithTagName<
          "span",
          {
            children: [
              ComponentTemplateWithTagName<
                "span",
                {
                  class: () => "dcg-num";
                  children: () => ExpressionModel["displayIndex"];
                }
              >,
              ComponentTemplateWithTagName<
                "div",
                {
                  class: () => "dcg-tab-interior dcg-action-icon-mouse";
                  children: ComponentTemplateWithViewClass;
                }
              >,
              ComponentTemplateWithViewClass,
              ComponentTemplateWithViewClass,
            ];
          }
        >,
        ComponentTemplateWithViewClass,
      ];
    }
  > {}

export abstract class ExpressionViewComponent extends ClassComponent<
  ModelAndController & {
    onDragPending: () => void;
    isDragCopy: () => boolean;
  },
  ExpressionViewComponentTemplate
> {}

// `?` to avoid a crash if the replacement fails
const ExpressionView = window.DesModderFragile?.ExpressionView;

export abstract class IconViewComponent extends ClassComponent<{
  model: ItemModel;
  controller: CalcController;
}> {}

// `?` to avoid a crash if the replacement fails
export const ImageIconView = window.DesModderFragile?.ImageIconView;

interface ModelAndController {
  model: ExpressionModel;
  controller: CalcController;
}

type Children<T extends ComponentTemplate> = T extends
  | ComponentTemplateFlagment
  | ComponentTemplateError
  ? T["children"]
  : T extends ComponentTemplateWithTagName | ComponentTemplateWithViewClass
    ? T["props"]["children"]
    : never;

function children<T extends ComponentTemplate>(template: T) {
  const { children } = "children" in template ? template : template.props;
  return listWrap(children as Children<T>);
}

// <ExpressionIconView ... >
export class ExpressionIconView extends Component<ModelAndController> {
  template() {
    const template = exprTemplate(this);
    return children(children(children(template)[1])[1])[0];
  }
}

function listWrap<const T>(x: T) {
  return [x].flat() as WrapInArray<T>;
}

// <If predicate={this.shouldShowFooter}>
//   {() => <div class={this.getFooterClass()}> ...
export class FooterView extends Component<ModelAndController> {
  template() {
    const template = exprTemplate(this);
    return children(children(template)[0])[2];
  }
}

export abstract class EvaluationContainerComponent extends ClassComponent<{
  controller: CalcController;
  id: () => string;
}> {
  abstract controller: CalcController;
  // abstract cachedEvaluationRHS: EvaluationRHS;
  // abstract getEvaluationRHS(): EvaluationRHS;
}

function exprTemplate(
  self: InstanceType<typeof Component<ModelAndController>>
) {
  const n = new ExpressionView({
    model: () => self.props.model(),
    controller: () => self.props.controller(),
    onDragPending: () => {},
    isDragCopy: () => false,
  });
  n.init();
  return n.template();
}

export abstract class PromptSliderViewComponent extends ClassComponent<
  ModelAndController & {
    missingVariables?: string[];
    restoreFocusLocation?: () => void;
  }
> {
  abstract promptGroupId: `prompt-slider-${string}`;
  abstract getMissingBaseCases(): string[];
  abstract getMissingVariables(): string[];
}

export abstract class ToggleViewComponent extends ClassComponent<{
  ariaLabel: string;
  toggled: boolean;
  onChange: () => void;
}> {}
