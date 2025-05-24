import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<Config>()({
  splitProjects: {
    type: "boolean",
    default: false,
  },
  projectName: {
    type: "string",
    default: "Desmos Projects",
    variant: "text",
    shouldShow: (config: Config) => !config.splitProjects,
  },
  secretKey: {
    type: "string",
    variant: "password",
    default: "",
  },
});

export interface Config {
  splitProjects: boolean;
  projectName: string;
  secretKey: string;
}
