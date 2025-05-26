/** This file runs before Desmos is loaded */
import { Fragile } from "#globals";
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

export function insertElement(creator: () => undefined | (() => any)) {
  const { DCGView } = (Desmos as any).Private.Fragile;
  return createElementWrapped(DCGView.Components.If, {
    predicate: () => !!creator(),
    children: () => creator()!(),
  } as any);
}

export function replaceElement<T extends ComponentChild>(
  old: () => T,
  replacer: () => Replacer<T>
) {
  const { DCGView } = Fragile;
  return DCGView.Components.IfElse(() => !!replacer(), {
    true: () => replacer()!(old()),
    false: () => old(),
  });
}
