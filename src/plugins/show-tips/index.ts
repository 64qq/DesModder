import { createElementWrapped } from "../../preload/replaceElement";
import { Inserter, PluginController } from "../PluginController";
import Tip from "./Tip";

function apiContainer() {
  return document.querySelector(".dcg-container");
}

export default class ShowTips extends PluginController {
  static id = "show-tips" as const;
  static enabledByDefault = true;
  static config = undefined;

  afterEnable() {
    apiContainer()?.classList.add("dsm-show-tips");
  }

  afterDisable() {
    apiContainer()?.classList.remove("dsm-show-tips");
  }

  tipView(): Inserter {
    return () => createElementWrapped(Tip, { st: () => this });
  }
}
