import { Model } from "#globals";
import { Fragile } from "../../globals/window";
import { Inserter, PluginController, Replacer } from "../PluginController";
import { ErrorTriangle } from "./components/ErrorTriangle";
import { HideButton } from "./components/HideButton";
import "./hide-errors.less";

let enabled: boolean = false;
let initOnce: boolean = false;

function initPromptSlider() {
  // Reduce suggested slider count to 3
  // Avoids overflowing on narrow expression lists since we've added the "hide" button.
  // getMissingVariables is used in different ways, but we care about
  //    t.getMissingVariables().slice(0, 4)
  const proto = Fragile.PromptSliderView?.prototype;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const oldGMV = proto.getMissingVariables;
  proto.getMissingVariables = function () {
    const missing = oldGMV.call(this);
    missing.slice = function () {
      if (
        enabled &&
        arguments.length === 2 &&
        arguments[0] === 0 &&
        arguments[1] === 4
      ) {
        return Array.prototype.slice.call(missing, 0, 3);
      } else {
        return Array.prototype.slice.apply(missing, arguments as any);
      }
    };
    return missing;
  };
}

export default class HideErrors extends PluginController {
  static id = "hide-errors" as const;
  static enabledByDefault = true;
  static config = undefined;

  afterEnable() {
    if (!initOnce) {
      initOnce = true;
      initPromptSlider();
    }
    enabled = true;
  }

  afterDisable() {
    enabled = false;
  }

  hideError(id: string) {
    this.cc.dispatch({
      type: "dsm-manage-metadata-update-for-expr",
      id,
      obj: { errorHidden: true },
    });
  }

  toggleErrorHidden(id: string) {
    this.cc.dispatch({
      type: "dsm-manage-metadata-update-for-expr",
      id,
      obj: { errorHidden: !this.isErrorHidden(id) },
    });
  }

  isErrorHidden(id: string) {
    return this.dsm.metadata?.getDsmItemModel(id)?.errorHidden;
  }

  hideButton(getModel: () => Model): Inserter {
    return () => HideButton(this, getModel);
  }

  /** This is called on all error triangles, but a string ID is only passed for exprs. */
  errorTriangle(id: string | undefined): Replacer {
    if (id === undefined) return undefined;
    return (inner: any) => ErrorTriangle(this, id, inner);
  }
}
