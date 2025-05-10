import DSM from "#DSM";
import "./fonts/style.css";
import { DWindowPreload, DesModderUtils } from "#globals";

declare const window: DWindowPreload;

const dsm = new DSM(window.Calc!);

window.DesModder = {
  controller: dsm,
  // Not used by DesModder, but some external scripts may still reference this
  exposedPlugins: dsm.enabledPlugins,
  ...DesModderUtils,
};
window.DSM = dsm;

dsm.init();
