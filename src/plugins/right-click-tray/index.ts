import { PluginController } from "../PluginController";

export default class RightClickTray extends PluginController {
  static id = "right-click-tray" as const;
  static enabledByDefault = true;
  static config = undefined;

  // modified by replacement
  public stopNextContextMenu = false;
}
