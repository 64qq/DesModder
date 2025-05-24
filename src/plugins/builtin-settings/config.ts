import { defineConfig } from "#plugins/config.ts";

export const settingsConfigList = defineConfig<SettingsConfig>()({
  advancedStyling: {
    type: "boolean",
    default: true,
  },
  graphpaper: {
    type: "boolean",
    default: true,
  },
  zoomButtons: {
    type: "boolean",
    default: true,
    shouldShow: (config) => !!config.graphpaper,
  },
  expressions: {
    type: "boolean",
    default: true,
    shouldShow: (config) => !!config.graphpaper,
  },
  authorFeatures: {
    type: "boolean",
    default: false,
  },
  pointsOfInterest: {
    type: "boolean",
    default: true,
  },
  trace: {
    type: "boolean",
    default: true,
  },
  keypad: {
    type: "boolean",
    default: true,
  },
  showPerformanceMeter: {
    type: "boolean",
    default: false,
  },
});

export const specialConfigList = defineConfig<SpecialConfig>()({
  showIDs: {
    type: "boolean",
    default: false,
  },
});

export const configList = [
  ...settingsConfigList,
  ...specialConfigList,
] as const;

export interface SettingsConfig {
  advancedStyling: boolean;
  graphpaper: boolean;
  authorFeatures: boolean;
  pointsOfInterest: boolean;
  trace: boolean;
  /** We will ignore expressions (treat it as true) if graphpaper is false. */
  expressions: boolean;
  /** We will ignore zoomButtons (treat it as false) if graphpaper is false. */
  zoomButtons: boolean;
  keypad: boolean;
  showPerformanceMeter: boolean;
}

export interface SpecialConfig {
  showIDs: boolean;
}

export interface BuiltinSettingsSettings
  extends SettingsConfig,
    SpecialConfig {}
