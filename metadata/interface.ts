export default interface Metadata {
  version: 2;
  expressions: Record<string, Expression | undefined>;
}

export interface Expression {
  pinned?: boolean;
  errorHidden?: boolean;
  glesmos?: boolean;
  glesmosLinesConfirmed?: boolean;
}

export interface MetadataV1 {
  pinnedExpressions?: string[];
}
