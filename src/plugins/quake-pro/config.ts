import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<QuakeProSettings>()({
  magnification: {
    type: "number",
    default: 3,
    min: 1,
    max: 30,
    step: 0.1,
  },
});

export interface QuakeProSettings {
  magnification: number;
}
