import type DSM from "#DSM";
import { Prettify } from "#utils/utils.ts";

export type ConfigType = "boolean" | "string" | "number" | "color-list";
export type SettingValue = boolean | string | number | string[];

export type ConfigTypeToSettingValue<T extends ConfigType> = {
  boolean: boolean;
  string: string;
  number: number;
  "color-list": string[];
}[T];

export type InferConfigTypeFromSettingValue<T extends SettingValue> =
  T extends boolean
    ? "boolean"
    : T extends string
      ? "string"
      : T extends number
        ? "number"
        : T extends string[]
          ? "color-list"
          : never;

interface ConfigItemGeneric<
  TConfigType extends ConfigType,
  TSettings extends GenericSettings,
> {
  // indentation level for hierarchical relationships in settings
  // usually for when several settings only become relevant when another is enabled
  // default 0
  indentationLevel?: number;
  key: Extract<keyof TSettings, string>;
  shouldShow?: (current: TSettings, dsm: DSM) => boolean;
  type: TConfigType;
  default: ConfigTypeToSettingValue<TConfigType>;
  // display name and descriptions are managed in a translations file
}

export interface ConfigItemBoolean<TSettings extends GenericSettings = never>
  extends ConfigItemGeneric<"boolean", TSettings> {
  default: boolean;
}
export interface ConfigItemString<TSettings extends GenericSettings = never>
  extends ConfigItemGeneric<"string", TSettings> {
  variant: "color" | "password" | "text";
}
export interface ConfigItemNumber<TSettings extends GenericSettings = never>
  extends ConfigItemGeneric<"number", TSettings> {
  min: number;
  max: number;
  step: number;
  variant?: "range" | "number";
}
export interface ConfigItemColorList<TSettings extends GenericSettings = never>
  extends ConfigItemGeneric<"color-list", TSettings> {}

// Top type of ConfigItem["shouldShow"] should take the intersection of all the possible Settings, i.e., never
export type ConfigItem<TSettings extends GenericSettings<TSettings> = never> =
  | ConfigItemBoolean<TSettings>
  | ConfigItemString<TSettings>
  | ConfigItemNumber<TSettings>
  | ConfigItemColorList<TSettings>;

type BaseSettings = Record<string, SettingValue>;
// avoid errors like "Index signature for type 'string' is missing in type '...'"
export type GenericSettings<TSettings extends BaseSettings = BaseSettings> = {
  [K in keyof TSettings]-?: Extract<TSettings[K], SettingValue>;
};

type ConfigMapValue<TConfigItem> = TConfigItem extends TConfigItem
  ? Omit<TConfigItem, "key">
  : never;
type BaseConfigMap<TSettings extends GenericSettings<TSettings>> = Record<
  string,
  ConfigMapValue<ConfigItem<TSettings>>
>;

type InferConfigMapFromSettings<TSettings extends GenericSettings<TSettings>> =
  {
    [K in keyof TSettings]: ConfigMapValue<
      Extract<
        ConfigItem<TSettings>,
        { type: InferConfigTypeFromSettingValue<TSettings[K]> }
      >
    >;
  };

type ConfigMapToConfigList<
  TConfigMap extends BaseConfigMap<TSettings>,
  TSettings extends GenericSettings<TSettings>,
> = Prettify<
  (keyof TConfigMap extends infer K
    ? K extends keyof TConfigMap
      ? Prettify<Readonly<TConfigMap[K] & { key: K }>>
      : never
    : never)[]
>;

/**
 * Utility function to statically analyze the validity of the configurations
 */
export const defineConfig =
  // https://github.com/microsoft/TypeScript/issues/26242
  // I wish we had partial type inference
  <const TSettings extends GenericSettings<TSettings>>() =>
    <const TConfigMap extends InferConfigMapFromSettings<TSettings>>(
      configs: TConfigMap & BaseConfigMap<TSettings>
    ) =>
      Object.entries(configs).map(([key, config]) => ({
        key,
        ...config,
      })) as ConfigMapToConfigList<TConfigMap, TSettings>;
