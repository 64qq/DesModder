import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<CustomMathQuillConfigSettings>()({
  superscriptOperators: {
    type: "boolean",
    default: false,
  },
  commaDelimiter: {
    type: "boolean",
    default: false,
  },
  delimiterOverride: {
    type: "string",
    variant: "text",
    default: ",",
    shouldShow: (current) => current.commaDelimiter,
  },
  extendedGreek: {
    type: "boolean",
    default: false,
  },
  subscriptReplacements: {
    type: "boolean",
    default: false,
  },
  noAutoSubscript: {
    type: "boolean",
    default: false,
  },
  noNEquals: {
    type: "boolean",
    default: false,
  },
  leftIntoSubscript: {
    type: "boolean",
    default: false,
  },
  subSupWithoutOp: {
    type: "boolean",
    default: false,
  },
  allowMixedBrackets: {
    type: "boolean",
    default: false,
  },
  noPercentOf: {
    type: "boolean",
    default: false,
  },
  lessFSpacing: {
    type: "boolean",
    default: false,
  },
});

export interface CustomMathQuillConfigSettings {
  superscriptOperators: boolean;
  commaDelimiter: boolean;
  delimiterOverride: string;
  extendedGreek: boolean;
  subscriptReplacements: boolean;
  noAutoSubscript: boolean;
  noNEquals: boolean;
  leftIntoSubscript: boolean;
  subSupWithoutOp: boolean;
  allowMixedBrackets: boolean;
  noPercentOf: boolean;
  lessFSpacing: boolean;
}
