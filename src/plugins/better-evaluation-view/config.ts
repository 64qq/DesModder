import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<BetterEvaluationViewSettings>()({
  floats: {
    type: "boolean",
    default: false,
  },
  lists: {
    type: "boolean",
    default: false,
  },
  colors: {
    type: "boolean",
    default: true,
  },
  colorLists: {
    type: "boolean",
    default: true,
    shouldShow: (current) => current.lists && current.colors,
  },
});

export interface BetterEvaluationViewSettings {
  floats: boolean;
  lists: boolean;
  colors: boolean;
  colorLists: boolean;
}
