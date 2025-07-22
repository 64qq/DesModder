import { Inserter, PluginController } from "../PluginController";
import { ConfirmLines } from "./components/ConfirmLines";
import { GLesmosToggle, ToggleView } from "./components/GLesmosToggle";
import "./glesmos.less";

export default class GLesmos extends PluginController {
  static id = "GLesmos" as const;
  static enabledByDefault = false;
  static config = undefined;

  afterEnable() {
    this.checkGLesmos();
  }

  afterDisable() {
    this.checkGLesmos();
    // Don't delete the canvas
  }

  checkGLesmos() {
    const glesmosIDs = this.dsm.metadata
      ?.getDsmItemModels()
      .filter((v) => v.glesmos)
      .map((v) => v.id);
    if (glesmosIDs && glesmosIDs.length > 0) {
      glesmosIDs.map((id) => this.toggleExpr(id));
      this.killWorker();
    }
  }

  canBeGLesmos(id: string) {
    let model;
    return !!(
      (model = this.cc.getItemModel(id)) &&
      model.type === "expression" &&
      model.formula &&
      (model.formula.expression_type === "IMPLICIT" ||
        model.formula.expression_type === "IMPLICIT_EQUATION" ||
        model.formula.expression_type === "IMPLICIT_INEQUALITY")
    );
  }

  isGlesmosMode(id: string) {
    return this.dsm.metadata?.getDsmItemModel(id)?.glesmos ?? false;
  }

  toggleGlesmos(id: string) {
    this.cc.dispatch({
      type: "dsm-manage-metadata-update-for-expr",
      id,
      obj: { glesmos: !this.isGlesmosMode(id) },
    });
    this.forceWorkerUpdate(id);
  }

  forceWorkerUpdate(id: string) {
    // force the worker to revisit the expression
    this.toggleExpr(id);
    this.killWorker();
  }

  /** Returns boolean or undefined (representing "worker has not told me yet") */
  isInequality(id: string) {
    const model = this.cc.getItemModel(id);
    if (model?.type !== "expression") return false;
    return !!model.formula?.is_inequality;
  }

  isGLesmosLinesConfirmed(id: string) {
    return (
      this.dsm.metadata?.getDsmItemModel(id)?.glesmosLinesConfirmed ?? false
    );
  }

  toggleGLesmosLinesConfirmed(id: string) {
    this.cc.dispatch({
      type: "dsm-manage-metadata-update-for-expr",
      id,
      obj: { glesmosLinesConfirmed: !this.isGLesmosLinesConfirmed(id) },
    });
    this.forceWorkerUpdate(id);
  }

  /**
   * Force the worker to revisit this expression by toggling it hidden then
   * un-hidden
   */
  toggleExpr(id: string) {
    const model = this.cc.getItemModel(id);
    if (!model || model.type !== "expression" || !model.shouldGraph) return;
    this.cc.dispatch({
      type: "toggle-item-hidden",
      id,
    });
    this.cc.dispatch({
      type: "toggle-item-hidden",
      id,
    });
  }

  confirmLines(id: string, ToggleView: ToggleView): Inserter {
    return () => ConfirmLines(this, id, ToggleView);
  }

  glesmosToggle(
    id: string,
    ToggleView: ToggleView,
    allowInequality: boolean
  ): Inserter {
    return () => GLesmosToggle(this, id, ToggleView, allowInequality);
  }

  killWorker() {
    this.cc.evaluator.workerPoolConnection.killWorker();
  }
}
