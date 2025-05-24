import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<Config>()({
  reciprocalExponents2Surds: {
    type: "boolean",
    default: false,
  },
  derivativeLoopLimit: {
    type: "boolean",
    default: true,
  },
});

export interface Config {
  reciprocalExponents2Surds: boolean;
  derivativeLoopLimit: boolean;
}
