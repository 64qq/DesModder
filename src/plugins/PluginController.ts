import { ConfigItem, OptionalGenericSettings } from "./config";
import DSM from "#DSM";
import { PluginInstance } from ".";
import { ActionButton } from "../core-plugins/expr-action-buttons";
import { DispatchedEvent } from "../globals/extra-actions";
import { ComponentChild } from "#DCGView";

export class PluginController<
  Settings extends OptionalGenericSettings<Settings> = undefined,
> implements PluginInstance<Settings>
{
  static descriptionLearnMore?: string = undefined;
  static forceEnabled?: boolean = undefined;
  static config: readonly ConfigItem[] | undefined;
  /** Core plugins get enabled before all others and can't be disabled. */
  static isCore = false;
  calc = this.dsm.calc;
  cc = this.calc.controller;

  constructor(
    readonly dsm: DSM,
    public settings: Settings
  ) {}

  afterEnable() {}
  afterConfigChange() {}
  beforeDisable() {}
  afterDisable() {}

  /** Consumed by expr-action-buttons. This should really be a facet a la Codemirror. */
  actionButtons?: ActionButton[];

  /** Returning `"abort-later-handlers"` means don't run any later handlers. */
  handleDispatchedAction?(
    evt: DispatchedEvent
  ): "abort-later-handlers" | undefined;
  afterHandleDispatchedAction?(evt: DispatchedEvent): void;
  beforeUpdateTheComputedWorld?(): void;
  afterUpdateTheComputedWorld?(): void;
}

export type Replacer<T extends ComponentChild = ComponentChild> =
  | undefined
  | ((old: T) => ComponentChild);
export type Inserter = undefined | (() => ComponentChild);
