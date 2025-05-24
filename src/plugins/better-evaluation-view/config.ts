import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<BetterEvaluationViewSettings>()({
  lists: {
    type: "boolean",
    default: true,
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
  lists: boolean;
  colors: boolean;
  colorLists: boolean;
}
