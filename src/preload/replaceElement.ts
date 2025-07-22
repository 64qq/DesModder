/** This file runs before Desmos is loaded */
import { Fragile } from "#globals";
import type {
  ComponentChild,
  ComponentConstructor,
  GenericProps,
  OrConst,
  PropOrConst,
  PropsChild,
} from "../DCGView";
import type { Inserter, Replacer } from "../plugins/PluginController";

type MaybeArray<T> = T | T[];
export type CreateElementWrappedProps<Props extends GenericProps<Props>> =
  OrConst<Props> & { children?: MaybeArray<PropOrConst<PropsChild<Props>>> };

export function createElementWrapped<Props extends GenericProps<Props>>(
  el: ComponentConstructor<Props>,
  props: CreateElementWrappedProps<Props>
) {
  const { DCGView } = Fragile;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const isChildrenOutsideProps =
    (DCGView as any).createElement({}, {}, "third-arg").children ===
    "third-arg";
  if (isChildrenOutsideProps) {
    const { children } = props;
    const childrenArr = !children
      ? []
      : Array.isArray(children)
        ? children
        : [children];
    // Old interface
    // TODO-remove-children-props
    return (DCGView as any).createElement(el, props, ...childrenArr);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return DCGView.createElement(el, props);
}

export function insertElement(creator: () => Inserter) {
  const { DCGView } = Fragile;
  return createElementWrapped(DCGView.Components.If, {
    predicate: () => !!creator(),
    children: () => creator()!(),
  });
}

export function replaceElement<T extends ComponentChild>(
  old: () => T,
  replacer: () => Replacer<T>,
  key: () => unknown = () => !!replacer()
) {
  const { DCGView } = (Desmos as any).Private.Fragile;
  return createElementWrapped(DCGView.Components.Switch, {
    key,
    children: () => (replacer() ?? ((x) => x))(old()),
  } as any);
}
