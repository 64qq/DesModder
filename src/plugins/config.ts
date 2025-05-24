import type DSM from "#DSM";

interface ConfigItemGeneric {
  // indentation level for hierarchical relationships in settings
  // usually for when several settings only become relevant when another is enabled
  // default 0
  indentationLevel?: number;
  key: string;
  // TODO proper type here
  shouldShow?: (current: any, dsm: DSM) => boolean;
  // display name and descriptions are managed in a translations file
}

export interface ConfigItemBoolean extends ConfigItemGeneric {
  type: "boolean";
  default: boolean;
}

export interface ConfigItemString extends ConfigItemGeneric {
  type: "string";
  variant: "color" | "password" | "text";
  default: string;
}
export interface ConfigItemNumber extends ConfigItemGeneric {
  type: "number";
  default: number;
  min: number;
  max: number;
  step: number;
  variant?: "range" | "number";
}
export interface ConfigItemColorList extends ConfigItemGeneric {
  type: "color-list";
  default: string[];
}

export type ConfigItem =
  | ConfigItemBoolean
  | ConfigItemString
  | ConfigItemNumber
  | ConfigItemColorList;

export type GenericSettings = Record<string, any>;
