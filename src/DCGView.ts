/* eslint-disable @typescript-eslint/no-empty-object-type -- To represent empty props */
import { Brand } from "#common/utils.ts";
import { Fragile } from "#globals";
import {
  FunctionType,
  PartitionByAssignability,
  WrapInArray,
  Prettify,
  ClassValue,
} from "#utils/utils.ts";
import {
  createElementWrapped,
  CreateElementWrappedProps,
} from "./preload/replaceElement";

export const { DCGView } = Fragile;

type PropToFunc<T> = [T] extends [never]
  ? never
  : PartitionByAssignability<T, FunctionType> extends {
        assignable: infer Assignable;
        unassignable: infer Unassignable;
      }
    ? // Merges the return types of ToFunc'd union constituents while preserving those that are already functions.
      // `type PropToFunc<T> = T extends FunctionType ? T : () => T` causes assignability issues;
      // e.g. `(() => true) | (() => false)` is a subtype of `() => boolean`, but not vice versa (consider a function that randomly returns true or false).
      Assignable | ([Unassignable] extends [never] ? never : () => Unassignable)
    : never;

export type PropOrConst<T> = T | PropToFunc<T>;

export type OrConst<T> = {
  [K in keyof T]: PropOrConst<T[K]>;
};

type ToFunc<T> = {
  [K in keyof T]: PropToFunc<T[K]>;
};

export abstract class ClassComponent<
  PropsType extends GenericProps<PropsType> = GenericProps,
  Template = unknown,
> {
  props!: ToFunc<PropsType>;
  children?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_props: OrConst<PropsType>) {}
  init(): void {}
  abstract template(): Template;
  _element?:
    | { _domNode: HTMLElement }
    | {
        _domNode?: undefined;
        _element: { _domNode: HTMLElement };
      };
}

export interface MountedComponent {
  update: () => void;
}

abstract class IfComponent<T> extends ClassComponent<{
  predicate: () => boolean;
  children: () => T;
}> {}

abstract class ForComponent<T, U> extends ClassComponent<{
  each: () => T[];
  key: (elem: T) => string | number;
  children: (elem: T) => U;
}> {}

export interface IfElseSecondParam {
  true: () => ComponentChild;
  false: () => ComponentChild;
}

abstract class InputComponent extends ClassComponent<{
  value: () => string;
  onInput: (s: string) => void;
  required: boolean;
  placeholder: string;
  spellcheck: boolean;
}> {}

/** Switch expects one child which is a function returning a component */
abstract class SwitchComponent<K, T> extends ClassComponent<{
  key: () => K;
  children: (key: K) => T;
}> {}

export interface DCGViewModule {
  Components: {
    For: typeof ForComponent;
    If: typeof IfComponent;
    Input: typeof InputComponent;
    Switch: typeof SwitchComponent;
    SwitchUnion: {
      <Key extends string>(
        discriminant: () => Key,
        branches: {
          [K in Key]: (key: () => K) => ComponentChild;
        }
      ): ComponentTemplate;
      <Disc extends Record<Key, PropertyKey>, Key extends string>(
        discriminant: () => Disc,
        key: Key,
        branches: {
          [K in Disc[Key]]: (
            disc: () => Disc & Record<Key, K>
          ) => ComponentChild;
        }
      ): ComponentTemplate;
    };
    IfElse: (p: () => boolean, v: IfElseSecondParam) => ComponentTemplate;
  };
  Class: typeof ClassComponent;
  const: <T>(v: T) => () => T;
  createElement: <Props extends GenericProps<Props>>(
    comp: ComponentConstructor<Props>,
    props: WithCommonProps<ToFunc<Props>>
  ) => ComponentTemplate;
  // couldn't figure out type for `comp`, so I just put | any
  mountToNode: <Props extends GenericProps<Props>>(
    comp: ComponentConstructor<Props>,
    el: HTMLElement,
    props: WithCommonProps<ToFunc<Props>>
  ) => MountedComponent;
  unmountFromNode: (el: HTMLElement) => void;
}

export type ComponentConstructor<
  Props extends GenericProps<Props> = GenericProps,
> = string | typeof ClassComponent<Props>;

type BaseProps = Record<string, unknown>;
export type GenericProps<Props extends BaseProps = BaseProps> = {
  [K in keyof Props]: Props[K];
};
interface CommonProps {
  class?: () => ClassValue;
  didMount?: (elem: HTMLElement) => void;
  willUnmount?: () => void;
}
type WithCommonProps<T> = Omit<T, keyof CommonProps> & CommonProps;

// eslint-disable-next-line  @typescript-eslint/consistent-type-definitions
type NonNullish = {};
type Nullish = null | undefined;
type Unknown = Nullish | NonNullish;

type MaybeArray<T> = T | T[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- invariance
type ViewClassProps<ViewClass extends typeof ClassComponent<any>> =
  ViewClass extends typeof ClassComponent<infer Props> ? Props : never;

type FlattenedArrayValue<T> = T extends readonly unknown[]
  ? FlattenedArrayValue<T[number]>
  : T;
type IsLeafAssignable<T, C> = T extends readonly unknown[]
  ? false
  : T extends C
    ? true
    : false;
/**
 * Flattens T recursively and filters the types that is assignable to C
 */
type FlattenAndFilter<T extends readonly unknown[], C> = T extends readonly []
  ? []
  : // Actually unnecessary, but improves performance and increases tuple size limits
    IsLeafAssignable<T[number], C> extends true
    ? T
    : // case: [string, ...number[]]
      // `extends Unknown[]` to prevent Tail from being `unknown[]` when the type inference fails
      T extends readonly [infer Head, ...infer Tail extends Unknown[]]
      ? Head extends readonly unknown[]
        ? [...FlattenAndFilter<Head, C>, ...FlattenAndFilter<Tail, C>]
        : Head extends C
          ? [Head, ...FlattenAndFilter<Tail, C>]
          : FlattenAndFilter<Tail, C>
      : // case: [...string[], number]
        T extends readonly [...infer Init extends Unknown[], infer Last]
        ? Last extends readonly unknown[]
          ? [...FlattenAndFilter<Init, C>, ...FlattenAndFilter<Last, C>]
          : Last extends C
            ? [...FlattenAndFilter<Init, C>, Last]
            : FlattenAndFilter<Init, C>
        : // case: string[]
          Extract<FlattenedArrayValue<T>, C>[];

type UnwrapChildren<
  Children extends readonly unknown[],
  IsViewClassProps extends boolean,
  __Children extends readonly unknown[] = VariadicToDistributable<Children>,
> = IsViewClassProps extends true
  ? __Children extends []
    ? undefined
    : __Children extends [infer I]
      ? I
      : __Children
  : Children;

type VariadicToDistributable<T extends readonly unknown[]> = T extends T
  ? number extends T["length"]
    ? T extends readonly [infer Head, ...infer Tail]
      ? [Head, ...VariadicToDistributable<Tail>]
      : T extends readonly [...infer Init, infer Last]
        ? [...VariadicToDistributable<Init>, Last]
        : [] | [T[number]] | [T[number], T[number], ...T[number][]]
    : T
  : never;

type PossiblyArrayTypeToDistributableDeep<T> = unknown extends T
  ? Unknown | Unknown[]
  : T extends readonly unknown[]
    ? { [K in keyof T]: PossiblyArrayTypeToDistributableDeep<T[K]> }
    : T extends FunctionType
      ? T
      : object extends Required<T>
        ? T | Unknown[]
        : T;

/**
 * Constructs normalized children by flattening and filtering non-nullish types (the same as `DCGView.createElement`).
 *
 * Non-array object types with one or more keys are not considered to be 'possibly array' types, which is unsound though.
 */
type FlattenAndFilterNonNullish<Children> = FlattenAndFilter<
  PossiblyArrayTypeToDistributableDeep<[Children]>,
  NonNullish
>;

type WithPreprocessedChildren<
  Props,
  IsViewClassProps extends boolean,
> = Props extends Props
  ? Prettify<
      Omit<Props, "children"> & {
        children: UnwrapChildren<
          "children" extends keyof Props
            ? FlattenAndFilterNonNullish<Props["children"]>
            : NonNullish[],
          IsViewClassProps
        >;
      }
    >
  : never;

interface ComponentTemplateBase extends Brand<"ComponentTemplate"> {}
export interface ComponentTemplateFlagment<
  Children extends MaybeArray<ComponentChild> = MaybeArray<ComponentChild>,
> extends ComponentTemplateBase {
  isDCGElementSpec: true;
  type: "fragment";
  children: FlattenAndFilterNonNullish<Children>;
}
export interface ComponentTemplateWithTagName<
  Tag extends keyof JSX.IntrinsicElements | (string & {}) = string,
  Props extends CommonProps & {
    children?: MaybeArray<ComponentChild>;
  } & GenericProps = {},
> extends ComponentTemplateBase {
  isDCGElementSpec: true;
  type: "element";
  tagName: Tag;
  props: WithPreprocessedChildren<Props, false>;
}
export interface ComponentTemplateWithViewClass<
  ViewClass extends
    typeof ClassComponent<GenericProps> = typeof ClassComponent<{}>,
  Props extends CommonProps &
    ViewClassProps<ViewClass> = ViewClassProps<ViewClass>,
> extends ComponentTemplateBase {
  isDCGElementSpec: true;
  type: "view";
  viewClass: ViewClass;
  props: WithPreprocessedChildren<Props, true>;
}
export interface ComponentTemplateError extends ComponentTemplateBase {
  children: undefined;
}
export type ComponentTemplate =
  | ComponentTemplateFlagment
  | ComponentTemplateWithTagName
  | ComponentTemplateWithViewClass
  | ComponentTemplateError;

export type ComponentChild =
  | ComponentTemplate
  | null
  | undefined
  | string
  | (() => string);

export const { Class: Component, mountToNode, unmountFromNode } = DCGView;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicAttributes {
      class?: ClassValue;
    }
    type ElementType = ComponentConstructor;
    interface IntrinsicElements {
      div: any;
      i: any;
      span: any;
      img: any;
      p: any;
      a: any;
      input: any;
      label: any;
      strong: any;
      ul: any;
      ol: any;
      li: any;
      table: any;
      tr: any;
      th: any;
      td: any;
      button: any;
      br: any;
    }
    interface ElementChildrenAttribute {
      children: [];
    }
  }
}

export type PropsChild<P> = "children" extends keyof P
  ? WrapInArray<P["children"]>[number]
  : ComponentChild;

/**
 * If you know React, then you know DCGView.
 * Some exceptions:
 *  - DCGView was forked sometime in 2016, before React Fragments and some other features
 *  - use class instead of className
 *  - there's some function name changes, like React.Component → DCGView.Class,
 *    rerender → template.
 *    However, there are functional differences:
 *    template is only called once with the prop values, see the next point.
 *  - You don't want to write (<div color={this.props.color()}>...) because the prop value is
 *    executed only once and gives a fixed value. If that is what you want,
 *    it is more semantic to do (<div color={DCGView.const(this.props.color())}>...),
 *    but if you want the prop to change on component update, use
 *    (<div color={() => this.props.color()}>...</div>)
 *  - This wrapper automatically calls DCGView.const over bare non-function values,
 *    so be careful. Anything that needs to change should be wrapped in a function
 *  - DCGView or its components impose some requirements, like aria-label being required
 * I have not yet figured out how to set state, but most components should be
 * stateless anyway (state control in Model.js)
 */

export function jsx<Props extends GenericProps<Props>>(
  el: ComponentConstructor<Props>,
  props: OrConst<Omit<Props, "children">> | null,
  ..._children: PropsChild<Props>[]
): ComponentTemplate {
  // "Text should be a const or a getter:"
  const children = _children.map((e) =>
    typeof e === "string" ? (DCGView.const(e) as PropToFunc<typeof e>) : e
  );
  const fnProps = Object.entries(props ?? {}).reduce<
    Record<string, FunctionType>
  >((acc, [key, value]) => {
    // DCGView.createElement also expects 0-argument functions
    if (typeof value === "function") {
      // unsafe, but we don't care about passing class constructors or other function-like values
      acc[key] = value as FunctionType;
    } else {
      acc[key] = DCGView.const(value);
    }
    return acc;
  }, {}) as CreateElementWrappedProps<Props>;
  fnProps.children = children.length === 1 ? children[0] : children;
  return createElementWrapped(el, fnProps);
}
