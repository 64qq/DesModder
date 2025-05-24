import { defineConfig } from "#plugins/config.ts";

export const configList = defineConfig<WakatimeSettings>()({
  splitProjects: {
    type: "boolean",
    default: false,
  },
  projectName: {
    type: "string",
    default: "Desmos Projects",
    variant: "text",
    shouldShow: (config: WakatimeSettings) => !config.splitProjects,
  },
  secretKey: {
    type: "string",
    variant: "password",
    default: "",
  },
});

export interface WakatimeSettings {
  splitProjects: boolean;
  projectName: string;
  secretKey: string;
}
