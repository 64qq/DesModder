import { PluginController } from "../PluginController";
import View from "./View";
import { refactor } from "./backend";
import { Console } from "#globals";

export default class FindReplace extends PluginController {
  static id = "find-and-replace" as const;
  static enabledByDefault = true;
  static config = undefined;
  dispatchListenerID: string | undefined;
  replaceLatex = "";
  view = new View();

  afterEnable() {
    if (this.cc.getExpressionSearchOpen()) {
      this.tryInitView();
    }
    this.dispatchListenerID = this.cc.dispatcher.register(({ type }) => {
      if (type === "open-expression-search") {
        this.tryInitView();
      } else if (type === "close-expression-search") {
        this.view.destroyView();
      } else if (type === "update-expression-search-str") {
        this.view.updateReplaceView();
      }
    });
  }

  afterDisable() {
    if (this.dispatchListenerID !== undefined)
      this.cc.dispatcher.unregister(this.dispatchListenerID);
    this.view.destroyView();
  }

  tryInitView() {
    try {
      this.view.initView(this);
    } catch {
      Console.warn("Failed to initialize find-replace view");
    }
  }

  init(view: View) {
    this.view = view;
  }

  getReplaceLatex() {
    return this.replaceLatex;
  }

  setReplaceLatex(latex: string) {
    this.replaceLatex = latex;
  }

  isReplaceValid() {
    return this.cc.getExpressionSearchStr().length > 0;
  }

  refactorAll() {
    if (!this.isReplaceValid()) return;
    refactor(this.calc, this.cc.getExpressionSearchStr(), this.replaceLatex);
  }

  focusSearch() {
    this.cc.dispatch({
      type: "set-focus-location",
      location: { type: "search-expressions" },
    });
  }
}
