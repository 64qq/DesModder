// https://effect.website/docs/code-style/branded-types/#generalizing-branded-types
declare const BrandTypeId: unique symbol;

export interface Brand<in out ID extends string> {
  readonly [BrandTypeId]: Readonly<Record<ID, ID>>;
}
