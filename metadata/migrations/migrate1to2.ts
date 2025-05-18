import Metadata, { MetadataV1 } from "../interface";

export default function migrate1to2(state: MetadataV1): Metadata {
  const stateOut: Metadata = {
    version: 2 as const,
    expressions: {},
  };
  for (const pinnedID of state.pinnedExpressions ?? []) {
    stateOut.expressions[pinnedID] = {
      pinned: true,
    };
  }
  return stateOut;
}
