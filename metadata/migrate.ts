import Metadata, { MetadataV1 } from "./interface";
import { getBlankMetadata } from "./manage";
import migrate1to2 from "./migrations/migrate1to2";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((el) => typeof el === "string");

/**
 * Discriminate version 1 by using the presence of the pinnedExpressions
 *  property (it was the only property)
 */
const isMetadataV1 = (metadata: object): metadata is MetadataV1 =>
  "pinnedExpressions" in metadata && isStringArray(metadata.pinnedExpressions);

// might want schema validation (it doesn't check the validity of `metadata.expressions`)
const isMetadataV2 = (metadata: object): metadata is Metadata =>
  "version" in metadata &&
  "expressions" in metadata &&
  metadata.version === 2 &&
  typeof metadata.expressions === "object";

export default function migrateToLatest(metadata: unknown): Metadata {
  return migrateToLatestMaybe(metadata) ?? getBlankMetadata();
}

export function migrateToLatestMaybe(metadata: unknown): Metadata | undefined {
  if (typeof metadata !== "object" || metadata === null) return undefined;
  const metadataV2Maybe = isMetadataV1(metadata)
    ? migrate1to2(metadata)
    : metadata;
  if (!isMetadataV2(metadataV2Maybe)) {
    // Something went wrong with migration. Just return a blank metadata
    return undefined;
  }
  return metadataV2Maybe;
}
