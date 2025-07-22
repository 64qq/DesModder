/** This file runs before Desmos is loaded */
import type {
  ComponentChild,
  ComponentConstructor,
  GenericProps,
  OrConst,
} from "../DCGView";
import { Replacer } from "../plugins/PluginController";

export function createElementWrapped<Props extends GenericProps<Props>>(
  el: ComponentConstructor<Props>,
  props: OrConst<Props> & { children?: ComponentChild[] }
) {
  const { DCGView } = (Desmos as any).Private.Fragile;
  const isChildrenOutsideProps =
    DCGView.createElement({}, {}, "third-arg").children === "third-arg";
  if (isChildrenOutsideProps) {
    const { children } = props;
    const childrenArr = !children
      ? []
      : Array.isArray(children)
        ? children
        : [children];
    // Old interface
    // TODO-remove-children-props
    return DCGView.createElement(el, props, ...childrenArr);
  }
  return DCGView.createElement(el, props);
}

export function insertElement(creator: () => undefined | (() => any)) {
  const { DCGView } = (Desmos as any).Private.Fragile;
  return createElementWrapped(DCGView.Components.If, {
    predicate: () => !!creator(),
    children: () => creator()!(),
  } as any);
}

export function replaceElement<T>(old: () => T, replacer: () => Replacer<T>) {
  const { DCGView } = (Desmos as any).Private.Fragile;
  return DCGView.Components.IfElse(() => !!replacer(), {
    true: () => replacer()!(old()),
    false: () => old(),
  });
}
