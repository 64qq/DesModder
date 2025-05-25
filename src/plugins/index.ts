/* eslint-disable @typescript-eslint/method-signature-style, @typescript-eslint/dot-notation */
import DSM from "#DSM";
import GLesmos from "./GLesmos";
import BetterEvaluationView from "./better-evaluation-view";
import BuiltinSettings from "./builtin-settings";
import CodeGolf from "./code-golf";
import CompactView from "./compact-view";
import CustomMathQuillConfig from "./custom-mathquill-config";
import DuplicateHotkey from "./duplicate-hotkey";
import ExprActionButtons, {
  ActionButton,
} from "../core-plugins/expr-action-buttons";
import FindReplace from "./find-replace";
import FolderTools from "./folder-tools";
import HideErrors from "./hide-errors";
import Intellisense from "./intellisense";
import ManageMetadata from "../core-plugins/manage-metadata";
import Multiline from "./multiline";
import PasteImage from "./paste-image";
import PerformanceInfo from "./performance-info";
import PillboxMenus from "../core-plugins/pillbox-menus";
import PinExpressions from "./pin-expressions";
import RightClickTray from "./right-click-tray";
import SetPrimaryColor from "./set-primary-color";
import ShowTips from "./show-tips";
import SyntaxHighlighting from "./syntax-highlighting";
import TextMode from "./text-mode";
import VideoCreator from "./video-creator";
import Wakatime from "./wakatime";
import WolframToDesmos from "./wolfram2desmos";
import BetterNavigation from "./better-navigation";
import OverrideKeystroke from "../core-plugins/override-keystroke";
import { DispatchedEvent } from "src/globals/extra-actions";
import type { ConfigItem, OptionalGenericSettings } from "./config";

/**
 * Life cycle:
 *
 * (.settings gets set before afterEnable)
 * afterEnable
 *
 * (.settings gets updated before afterConfigChange)
 * afterConfigChange
 *
 * beforeDisable
 * afterDisable
 */
export interface PluginInstance<
  Settings extends OptionalGenericSettings<Settings> = OptionalGenericSettings,
> {
  afterEnable(): void;
  afterConfigChange(): void;
  beforeDisable(): void;
  afterDisable(): void;
  settings: Settings;
  /** Consumed by expr-action-buttons. This should really be a facet a la Codemirror. */
  actionButtons?: ActionButton[];

  /** Returning `"abort-later-handlers"` means don't run any later handlers. */
  handleDispatchedAction?: (
    evt: DispatchedEvent
  ) => "abort-later-handlers" | undefined;
  afterHandleDispatchedAction?: (evt: DispatchedEvent) => void;
  beforeUpdateTheComputedWorld?: () => void;
  afterUpdateTheComputedWorld?: () => void;
}

export interface Plugin<
  Settings extends OptionalGenericSettings<Settings> = OptionalGenericSettings,
> {
  /** The ID is fixed permanently, even for future releases. It is kebab
   * case. If you rename the plugin, keep the ID the same for settings sync */
  id: string;
  // display name and descriptions are managed in a translations file
  descriptionLearnMore?: string;
  enabledByDefault: boolean;
  forceEnabled?: boolean;
  new (dsm: DSM, settings: Settings): PluginInstance<Settings>;
  // require passing undefined explicitly rather than omitting it
  config: Settings extends undefined
    ? undefined
    : readonly ConfigItem<Exclude<Settings, undefined>>[];
}

export const keyToPlugin = {
  pillboxMenus: PillboxMenus,
  builtinSettings: BuiltinSettings,
  betterEvaluationView: BetterEvaluationView,
  setPrimaryColor: SetPrimaryColor,
  wolframToDesmos: WolframToDesmos,
  pinExpressions: PinExpressions,
  videoCreator: VideoCreator,
  wakatime: Wakatime,
  findReplace: FindReplace,
  showTips: ShowTips,
  customMathQuillConfig: CustomMathQuillConfig,
  rightClickTray: RightClickTray,
  duplicateHotkey: DuplicateHotkey,
  glesmos: GLesmos,
  hideErrors: HideErrors,
  folderTools: FolderTools,
  textMode: TextMode,
  performanceInfo: PerformanceInfo,
  metadata: ManageMetadata,
  overrideKeystroke: OverrideKeystroke,
  multiline: Multiline,
  intellisense: Intellisense,
  compactView: CompactView,
  exprActionButtons: ExprActionButtons,
  codeGolf: CodeGolf,
  syntaxHighlighting: SyntaxHighlighting,
  betterNavigation: BetterNavigation,
  pasteImage: PasteImage,
};

export const pluginList = Object.values(keyToPlugin);

export const plugins = new Map(
  pluginList.map(
    // Plugin<Settings> is invariant. Shouldn't be a problem since it acts only as a minimal constraint to extract actual settings type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <P extends Plugin<any>>(
      plugin: P extends P ? P & Plugin<InstanceType<P>["settings"]> : never
    ): [P["id"], P] => [plugin.id, plugin]
  )
);

type KP = typeof keyToPlugin;
type KeyToPluginInstance = {
  readonly [K in keyof KP]: undefined | InstanceType<KP[K]>;
};
type IDToPluginInstance = {
  [K in keyof KP as KP[K]["id"]]?: InstanceType<KP[K]>;
};
export type PluginID = keyof IDToPluginInstance;
export type SpecificPlugin = KP[keyof KP];
type PluginConfig = Exclude<SpecificPlugin["config"], undefined>;
export type PluginConfigItem = PluginConfig[number];
export type PluginConfigItemKey = PluginConfigItem["key"];

export type PluginConfigItemColorList = Extract<
  PluginConfigItem,
  { type: "color-list" }
>;
export type PluginConfigItemNumber = Extract<
  PluginConfigItem,
  { type: "number" }
>;
export type PluginConfigItemBoolean = Extract<
  PluginConfigItem,
  { type: "boolean" }
>;
export type PluginConfigItemString = Extract<
  PluginConfigItem,
  { type: "string" }
>;

type Flatten<T> = {
  [K in keyof T]: T[keyof T];
};
// prettier-ignore
export class TransparentPlugins implements KeyToPluginInstance {
  /** Note that `enabledPlugins[id]` is truthy if and only if `id` is of
   * an enabled plugin. Otherwise, `enabledPlugins[id]` is undefined */
  private readonly ep: IDToPluginInstance = {};

  readonly enabledPlugins: Flatten<IDToPluginInstance> = this.ep;
  get enabledPluginIDs() {
    return Object.keys(this.ep) as PluginID[];
  }

  get pillboxMenus() { return this.ep["pillbox-menus"]; }
  get builtinSettings() { return this.ep["builtin-settings"]; }
  get betterEvaluationView() { return this.ep["better-evaluation-view"]; }
  get setPrimaryColor() { return this.ep["set-primary-color"]; }
  get wolframToDesmos() { return this.ep["wolfram2desmos"]; }
  get pinExpressions() { return this.ep["pin-expressions"]; }
  get videoCreator() { return this.ep["video-creator"]; }
  get wakatime() { return this.ep["wakatime"]; }
  get findReplace() { return this.ep["find-and-replace"]; }
  get showTips() { return this.ep["show-tips"]; }
  get customMathQuillConfig() { return this.ep["custom-mathquill-config"]; }
  get rightClickTray() { return this.ep["right-click-tray"]; }
  get duplicateHotkey() { return this.ep["duplicate-expression-hotkey"]; }
  get glesmos() { return this.ep["GLesmos"]; }
  get hideErrors() { return this.ep["hide-errors"]; }
  get folderTools() { return this.ep["folder-tools"]; }
  get textMode() { return this.ep["text-mode"]; }
  get performanceInfo() { return this.ep["performance-info"]; }
  get metadata() { return this.ep["manage-metadata"]; }
  get overrideKeystroke() { return this.ep["override-keystroke"]; }
  get intellisense() { return this.ep["intellisense"]; }
  get compactView() { return this.ep["compact-view"]; }
  get multiline() { return this.ep["multiline"]; }
  get exprActionButtons() { return this.ep["expr-action-buttons"]; }
  get codeGolf() { return this.ep["code-golf"]; }
  get syntaxHighlighting() { return this.ep["syntax-highlighting"]; }
  get betterNavigation() { return this.ep["better-navigation"]; }
  get pasteImage() { return this.ep["paste-image"]; }
}

export type IDToPluginSettings = {
  readonly [K in keyof KP as KP[K]["id"]]: InstanceType<KP[K]>["settings"];
};
