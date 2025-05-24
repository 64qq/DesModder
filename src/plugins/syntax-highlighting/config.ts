import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<Config>()({
  bracketPairColorization: {
    type: "boolean",
    default: true,
  },
  bracketPairColorizationColors: {
    type: "color-list",
    default: ["#000000", "#369646", "#6042a6", "#a03f21"],
    shouldShow: (config) => config.bracketPairColorization,
  },
  bpcColorInText: {
    type: "boolean",
    default: false,
    shouldShow: (config) => config.bracketPairColorization,
  },
  thickenBrackets: {
    type: "number",
    variant: "range",
    min: 0,
    max: 10,
    step: 1,
    default: 0,
    shouldShow: (config) => config.bracketPairColorization,
  },
  highlightBracketBlocks: {
    type: "boolean",
    default: true,
  },
  highlightBracketBlocksHover: {
    type: "boolean",
    default: false,
  },
  underlineHighlightedRanges: {
    type: "boolean",
    default: false,
    shouldShow: (config) =>
      config.highlightBracketBlocks || config.highlightBracketBlocksHover,
  },
});

export interface Config {
  bracketPairColorizationColors: string[];
  bracketPairColorization: boolean;
  bpcColorInText: boolean;
  thickenBrackets: number;
  highlightBracketBlocks: boolean;
  highlightBracketBlocksHover: boolean;
  underlineHighlightedRanges: boolean;
}
