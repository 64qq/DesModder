import { Component, jsx } from "#DCGView";
import {
  Toggle,
  If,
  Checkbox,
  Tooltip,
  For,
  Match,
  IfElse,
  IconButton,
  Switch,
} from "#components";
import { format } from "#i18n";
import {
  SpecificPlugin,
  PluginID,
  plugins,
  PluginConfigItemKey,
  PluginConfigItemColorList,
  PluginConfigItemBoolean,
  PluginConfigItemNumber,
  PluginConfigItemString,
  PluginConfigItem,
} from "#plugins/index.ts";
import {
  ConfigItem,
  ConfigItemString,
  ConfigItemNumber,
  ConfigItemBoolean,
  ConfigItemColorList,
  ConfigItemToSettings,
} from "#plugins/config.ts";
import PillboxMenus from "..";
import "./Menu.less";
declare const VERSION: string;

export function MenuFunc(pm: PillboxMenus) {
  return <Menu pm={pm} />;
}

const categoryPlugins: Record<string, PluginID[]> = {
  core: [
    "builtin-settings",
    "GLesmos",
    "video-creator",
    "text-mode",
    "intellisense",
  ],
  utility: [
    "wolfram2desmos",
    "paste-image",
    "pin-expressions",
    "find-and-replace",
    "performance-info",
    "right-click-tray",
    "duplicate-expression-hotkey",
    "folder-tools",
    "custom-mathquill-config",
    "code-golf",
    "better-navigation",
  ],
  visual: [
    "set-primary-color",
    "better-evaluation-view",
    "show-tips",
    "hide-errors",
    "compact-view",
    "multiline",
    "syntax-highlighting",
  ],
  integrations: ["wakatime"],
};

const categories = ["core", "utility", "visual", "integrations"];

export default class Menu extends Component<{
  pm: PillboxMenus;
}> {
  pm!: PillboxMenus;

  init() {
    this.pm = this.props.pm();
  }

  template() {
    return (
      <div class="dcg-popover-interior">
        <div class="dcg-popover-title dsm-title-version-grid">
          {format("menu-desmodder-plugins")}
          <div class="dsm-version-number">v{VERSION}</div>
        </div>
        {categories.map((category) => (
          <div
            class="dcg-options-menu-section dsm-category-section"
            key={category}
          >
            <div class="dcg-options-menu-section-title dsm-plugin-title-bar">
              <div
                class={() => ({
                  "dsm-category-header": true,
                  "dsm-expanded": this.pm.isCategoryExpanded(category),
                })}
                onClick={() => this.pm.toggleCategoryExpanded(category)}
              >
                <div
                  class={() => ({
                    "dsm-caret-container": true,
                    "dsm-caret-expanded": this.pm.isCategoryExpanded(category),
                  })}
                >
                  <i class="dcg-icon-caret-down" />
                </div>
                <div>{categoryDisplayName(category)}</div>
              </div>
            </div>
            <If predicate={() => this.pm.isCategoryExpanded(category)}>
              {() => (
                <div class="dsm-category-container">
                  <For each={() => categoryPlugins[category]} key={(id) => id}>
                    {(pluginID: PluginID) =>
                      this.plugin(plugins.get(pluginID)!)
                    }
                  </For>
                </div>
              )}
            </If>
          </div>
        ))}
      </div>
    );
  }

  plugin(plugin: SpecificPlugin) {
    return (
      <div class="dcg-options-menu-section dsm-plugin-section" key={plugin.id}>
        <div class="dcg-options-menu-section-title dsm-plugin-title-bar">
          <div
            class="dsm-plugin-header"
            onClick={() => this.pm.togglePluginExpanded(plugin.id)}
          >
            <div
              class={() => ({
                "dsm-caret-container": true,
                "dsm-caret-expanded": plugin.id === this.pm.expandedPlugin,
              })}
            >
              <i class="dcg-icon-caret-down" />
            </div>
            <div>{pluginDisplayName(plugin)}</div>
          </div>
          <Toggle
            toggled={() => this.pm.dsm.isPluginEnabled(plugin.id)}
            disabled={() => !this.pm.dsm.isPluginToggleable(plugin.id)}
            onChange={() => this.pm.dsm.togglePlugin(plugin.id)}
          />
        </div>
        {
          <If predicate={() => plugin.id === this.pm.expandedPlugin}>
            {() => (
              <div class="dsm-plugin-info-body">
                <div class="dsm-plugin-description">
                  {pluginDesc(plugin)}
                  <If
                    predicate={() => plugin.descriptionLearnMore !== undefined}
                  >
                    {() => (
                      <a
                        href={() => plugin.descriptionLearnMore}
                        target="_blank"
                        onTap={(e: MouseEvent) => e.stopPropagation()}
                      >
                        {" "}
                        {format("menu-learn-more")}
                      </a>
                    )}
                  </If>
                </div>
                {this.getExpandedSettings()}
              </div>
            )}
          </If>
        }
      </div>
    );
  }

  getExpandedSettings() {
    if (this.pm.expandedPlugin === null) return null;
    const plugin = plugins.get(this.pm.expandedPlugin);
    if (plugin?.config === undefined) return null;
    const pluginSettings = this.pm.dsm.pluginSettings[this.pm.expandedPlugin];
    if (pluginSettings === undefined) return null;
    type ExpandedPluginConfigItem = PluginConfigItem & ConfigItem;
    const buildArgs = <T extends ExpandedPluginConfigItem>(item: T) =>
      [
        this.pm,
        item,
        plugin,
        pluginSettings as ConfigItemToSettings<T>,
      ] as const;
    return (
      <div>
        {plugin.config.map((item: ExpandedPluginConfigItem) => (
          <If
            predicate={() =>
              // contravariance
              item.shouldShow?.(pluginSettings as never, this.pm.dsm) ?? true
            }
          >
            {() =>
              indentation(
                item.indentationLevel ?? 0,
                Match(() => item, {
                  boolean: (item) => booleanOption(...buildArgs(item)),
                  string: (item) => stringOption(...buildArgs(item)),
                  number: (item) => numberOption(...buildArgs(item)),
                  "color-list": (item) => colorListOption(...buildArgs(item)),
                })
              )
            }
          </If>
        ))}
      </div>
    );
  }
}

function indentation(level: number, inner: any) {
  return (
    <Switch key={() => level}>
      {() => {
        if (level === 0) {
          return inner;
        } else {
          return (
            <div class="dsm-settings-indentation">
              {indentation(level - 1, inner)}
            </div>
          );
        }
      }}
    </Switch>
  );
}

function colorListOption(
  pm: PillboxMenus,
  item: ConfigItemColorList & PluginConfigItemColorList,
  plugin: SpecificPlugin,
  settings: ConfigItemToSettings<ConfigItemColorList>
) {
  const setValue = (newValue: string[]) =>
    pm.expandedPlugin &&
    pm.dsm.setPluginSetting(pm.expandedPlugin, item.key, newValue);

  const value = () => settings[item.key];

  return (
    <div class="dsm-settings-item">
      <div class="dsm-settings-color-list-container">
        <Tooltip tooltip={configItemDesc(plugin, item)} gravity="n">
          <label for={`dsm-settings-item__input-${item.key}`}>
            {configItemName(plugin, item)}
          </label>
        </Tooltip>
        {IfElse(() => value().length > 0, {
          true: () => (
            <div class="flex">
              <ol class="dsm-settings-color-list">
                <For
                  each={() => settings[item.key].map((e, i) => [e, i])}
                  key={([e, i]) => `${e}:${i}`}
                >
                  {([v, i]: [string, number]) => (
                    <div class="dsm-settings-color-list-item-container">
                      <input
                        type="color"
                        value={v}
                        onChange={(e: InputEvent) => {
                          const newValue = (e.target as HTMLInputElement).value;
                          setValue(
                            settings[item.key].map((e, j) =>
                              j === i ? newValue : e
                            )
                          );
                        }}
                      ></input>
                      <div class="add-remove-buttons">
                        <IconButton
                          onTap={() => {
                            setValue([
                              ...value().slice(0, i + 1),
                              "#FF0000",
                              ...value().slice(i + 1),
                            ]);
                          }}
                          iconClass={"dcg-icon-plus"}
                        ></IconButton>
                        <IconButton
                          onTap={() => {
                            setValue(value().filter((_, j) => j !== i));
                          }}
                          iconClass={"dcg-icon-remove"}
                        ></IconButton>
                      </div>
                    </div>
                  )}
                </For>
              </ol>
              <ResetButton pm={pm} key={item.key} />
            </div>
          ),
          false: () => (
            <div class="flex">
              <IconButton
                iconClass="dcg-icon-plus"
                onTap={() => {
                  setValue(["#FF0000"]);
                }}
              ></IconButton>
            </div>
          ),
        })}
      </div>
    </div>
  );
}

function numberOption(
  pm: PillboxMenus,
  item: ConfigItemNumber & PluginConfigItemNumber,
  plugin: SpecificPlugin,
  settings: ConfigItemToSettings<ConfigItemNumber>
) {
  const inputHandler = (e: InputEvent) => {
    const value = Number((e.target as HTMLInputElement)?.value);
    if (!isNaN(value)) {
      pm.expandedPlugin &&
        pm.dsm.setPluginSetting(pm.expandedPlugin, item.key, value);
    }
  };

  return (
    <div class="dsm-settings-item dsm-settings-number">
      <input
        type={item.variant ?? "number"}
        min={() => item.min}
        max={() => item.max}
        step={() => item.step}
        value={settings[item.key]}
        onChange={inputHandler}
        onInput={inputHandler}
        id={`dsm-settings-item__input-${item.key}`}
        onUpdate={(e: HTMLInputElement) =>
          !e.classList.contains("dcg-hovered") &&
          (e.value = settings[item.key].toString())
        }
      ></input>
      <Tooltip tooltip={configItemDesc(plugin, item)} gravity="n">
        <label for={`dsm-settings-item__input-${item.key}`}>
          {configItemName(plugin, item)}
        </label>
      </Tooltip>
      <ResetButton pm={pm} key={item.key} />
    </div>
  );
}

function booleanOption(
  pm: PillboxMenus,
  item: ConfigItemBoolean & PluginConfigItemBoolean,
  plugin: SpecificPlugin,
  settings: ConfigItemToSettings<ConfigItemBoolean>
) {
  const toggle = () =>
    pm.expandedPlugin &&
    pm.dsm.togglePluginSettingBoolean(pm.expandedPlugin, item.key);
  return (
    <div class="dsm-settings-item dsm-settings-boolean">
      <Checkbox
        onChange={toggle}
        checked={() => settings[item.key] ?? false}
        ariaLabel={() => item.key}
      ></Checkbox>
      <Tooltip tooltip={configItemDesc(plugin, item)} gravity="n">
        <div class="dsm-settings-label" onClick={toggle}>
          {configItemName(plugin, item)}
        </div>
      </Tooltip>
      <ResetButton pm={pm} key={item.key} />
    </div>
  );
}

function stringOption(
  pm: PillboxMenus,
  item: ConfigItemString & PluginConfigItemString,
  plugin: SpecificPlugin,
  settings: ConfigItemToSettings<ConfigItemString>
) {
  return (
    <div class="dsm-settings-item dsm-settings-color">
      <input
        type={item.variant}
        id={`dsm-settings-item__input-${item.key}`}
        value={settings[item.key]}
        onUpdate={(e: HTMLInputElement) =>
          !e.classList.contains("dcg-hovered") && (e.value = settings[item.key])
        }
        onChange={(evt: Event) =>
          pm.expandedPlugin &&
          pm.dsm.setPluginSetting(
            pm.expandedPlugin,
            item.key,
            (evt.target as HTMLInputElement).value
          )
        }
        onInput={(evt: Event) =>
          pm.expandedPlugin &&
          pm.dsm.setPluginSetting(
            pm.expandedPlugin,
            item.key,
            (evt.target as HTMLInputElement).value,
            true
          )
        }
      />
      <Tooltip tooltip={configItemDesc(plugin, item)} gravity="n">
        <label for={`dsm-settings-item__input-${item.key}`}>
          {configItemName(plugin, item)}
        </label>
      </Tooltip>
      <ResetButton pm={pm} key={item.key} />
    </div>
  );
}

class ResetButton extends Component<{
  pm: PillboxMenus;
  key: PluginConfigItemKey;
}> {
  pm!: PillboxMenus;
  key!: PluginConfigItemKey;

  init() {
    this.pm = this.props.pm();
    this.key = this.props.key();
  }

  template() {
    return (
      <If predicate={() => this.pm.canResetSetting(this.key)}>
        {() => (
          <div
            class="dsm-reset-btn"
            role="button"
            onTap={() => this.pm.resetSetting(this.key)}
          >
            <i class="dcg-icon-reset" />
          </div>
        )}
      </If>
    );
  }
}

function categoryDisplayName(id: string) {
  return format("category-" + id + "-name");
}

function pluginDisplayName(plugin: SpecificPlugin) {
  return format(plugin.id + "-name");
}

function pluginDesc(plugin: SpecificPlugin) {
  return format(plugin.id + "-desc");
}

function configItemDesc(plugin: SpecificPlugin, item: ConfigItem) {
  return format(plugin.id + "-opt-" + item.key + "-desc");
}

function configItemName(plugin: SpecificPlugin, item: ConfigItem) {
  return format(plugin.id + "-opt-" + item.key + "-name");
}
