import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<MultilineSettings>()({
  determineLineBreaksAutomatically: {
    type: "boolean",
    default: true,
  },
  widthBeforeMultiline: {
    indentationLevel: 1,
    type: "number",
    default: 30,
    min: 0,
    max: Infinity,
    step: 1,
    shouldShow: (current) => current.determineLineBreaksAutomatically,
  },
  disableAutomaticLineBreaksForHandAlignedExpressions: {
    indentationLevel: 1,
    type: "boolean",
    default: true,
    shouldShow: (current) => current.determineLineBreaksAutomatically,
  },
  automaticallyMultilinify: {
    indentationLevel: 1,
    type: "boolean",
    default: true,
    shouldShow: (current) => current.determineLineBreaksAutomatically,
  },
  multilinifyDelayAfterEdit: {
    indentationLevel: 2,
    type: "number",
    default: 1000,
    min: 0,
    max: Infinity,
    step: 1,
    shouldShow: (current) =>
      current.automaticallyMultilinify &&
      current.determineLineBreaksAutomatically,
  },
  spacesToNewlines: {
    type: "boolean",
    default: true,
  },
});

export interface MultilineSettings {
  widthBeforeMultiline: number;
  automaticallyMultilinify: boolean;
  determineLineBreaksAutomatically: boolean;
  multilinifyDelayAfterEdit: number;
  spacesToNewlines: boolean;
  disableAutomaticLineBreaksForHandAlignedExpressions: boolean;
}
