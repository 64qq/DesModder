import { pick } from "#utils/utils.ts";
import { PluginController } from "../PluginController";
import {
  BuiltinSettingsSettings,
  configList,
  settingsConfigList,
  specialConfigList,
} from "./config";

const settingsKeys = settingsConfigList.map((e) => e.key);
const specialKeys = specialConfigList.map((e) => e.key);

function hasQueryFlag(s: string) {
  const params = new URLSearchParams(window.location.href);
  return params.has(s) && params.get(s) !== "false";
}

export default class BuiltinSettings extends PluginController<BuiltinSettingsSettings> {
  static id = "builtin-settings" as const;
  static enabledByDefault = true;
  static config = configList;
  initialSettings: null | BuiltinSettingsSettings = null;

  afterEnable() {
    this.initialSettings = { ...this.settings };
    for (const key of settingsKeys) {
      this.initialSettings[key] =
        (
          this.calc.settings as typeof this.calc.settings & {
            advancedStyling: boolean;
            authorFeatures: boolean;
            showPerformanceMeter: boolean;
          }
        )[key] ?? false;
    }
    for (const key of specialKeys) {
      switch (key) {
        case "showIDs":
          this.initialSettings[key] = hasQueryFlag("showIDs");
          break;
        default:
          key satisfies never;
      }
    }
    this.updateConfig(this.settings);
  }

  afterDisable() {
    if (this.initialSettings !== null) this.updateConfig(this.initialSettings);
  }

  afterConfigChange() {
    this.updateConfig(this.settings);
  }

  private updateURL(config: BuiltinSettingsSettings) {
    const params = new URLSearchParams(window.location.search);
    for (const key of specialKeys) {
      switch (key) {
        case "showIDs":
          if (config[key]) {
            params.set(key, "trueDSMDELETE");
          } else {
            params.delete(key);
          }
          break;
        default:
          key satisfies never;
      }
    }
    const { href } = window.location;
    const url = new URL(href);
    url.search = params.toString();
    const newURL = url.toString().replace(/=trueDSMDELETE/g, "");
    if (newURL !== href) {
      history.replaceState({}, "", newURL);
    }
  }

  private updateSettings(config: BuiltinSettingsSettings) {
    let { graphpaper, zoomButtons, expressions } = config;
    // zoomButtons is only allowed to be true if graphpaper is true.
    zoomButtons &&= graphpaper;
    // expressions must be true if graphpaper is false, to avoid softlock
    // https://github.com/DesModder/DesModder/issues/982
    expressions ||= !graphpaper;
    // Deal with zoomButtons needing to be off before graphpaper is disabled
    // But graphpaper needs to be on before zoomButtons is enabled.
    if (graphpaper) this.calc.updateSettings({ graphpaper });
    if (!zoomButtons) this.calc.updateSettings({ zoomButtons });
    // Copy so that the extraneous entries of config (such as showIDs)
    // do not get sent to `updateSettings`.
    const settings = pick(config, settingsKeys);
    this.calc.updateSettings({
      ...settings,
      zoomButtons,
      graphpaper,
      expressions,
    });
  }

  updateConfig(config: BuiltinSettingsSettings) {
    this.updateURL(config);
    this.updateSettings(config);
  }
}
