import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<Config>()({
  compactFactor: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.001,
    default: 1,
    variant: "range",
  },
  hideFolderToggles: {
    type: "boolean",
    default: true,
    shouldShow: (_, dsm) =>
      !!dsm.calc.settings.advancedStyling || !!dsm.calc.settings.authorFeatures,
  },
  noSeparatingLines: {
    type: "boolean",
    default: false,
  },
  highlightAlternatingLines: {
    type: "boolean",
    default: true,
    shouldShow: (config) => config.noSeparatingLines,
  },
  hideEvaluations: {
    type: "boolean",
    default: false,
  },
  textFontSize: {
    type: "number",
    default: 16,
    min: 0,
    max: 100,
    step: 1,
  },
  mathFontSize: {
    type: "number",
    default: 18,
    min: 0,
    max: 100,
    step: 1,
  },
  bracketFontSizeFactor: {
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.001,
  },
  minimumFontSize: {
    type: "number",
    default: 10,
    min: 0,
    max: 100,
    step: 1,
    shouldShow: (config) => config.bracketFontSizeFactor !== 1,
  },
});

export interface Config {
  textFontSize: number;
  mathFontSize: number;
  bracketFontSizeFactor: number;
  minimumFontSize: number;
  noSeparatingLines: boolean;
  highlightAlternatingLines: boolean;
  compactFactor: number;
  hideEvaluations: boolean;
  hideFolderToggles: boolean;
}
