import VideoCreator from "..";
import { scaleBoundsAboutCenter } from "./utils";
import { ManagedNumberInputModel } from "../components/ManagedNumberInput";
import { noSpeed } from "../orientation";
import { CalcController, Scale, Viewport } from "../../../globals";

export type CaptureMethod = "once" | "ntimes" | "action" | "slider" | "ticks";

export const CANCELLED = Symbol("cancelled");

async function captureAndApplyFrame(vc: VideoCreator) {
  const frame = await captureFrame(vc);
  if (frame === CANCELLED) return CANCELLED;
  vc.pushFrame(frame);
}

interface MosaicDims {
  x: number;
  y: number;
}

function mosaicDimensions(vc: VideoCreator): MosaicDims | undefined {
  if (!vc.useMosaicRatio()) return undefined;
  const x = vc.getMosaicRatioX();
  const y = vc.getMosaicRatioY();
  if (!x || !y) return undefined;
  if (x === 1 && y === 1) return undefined;
  return { x, y };
}

type ImageCapturePromise = Promise<string | typeof CANCELLED>;

/**
 * Segment [lo, hi] into count intervals.
 * Guarantees the first interval matches lo, and the last interval matches hi,
 * and [lo, hi] of the intervals in between
 */
function segmentInterval(
  lo: number,
  hi: number,
  count: number,
  scale: Scale
): readonly (readonly [number, number])[] {
  let range;
  switch (scale) {
    case "logarithmic":
      range = logspace(lo, hi, count);
      break;
    case "linear":
    default:
      range = linspace(lo, hi, count);
      break;
  }
  const out: [number, number][] = [];
  let left = range.next().value!;
  for (const right of range) {
    out.push([left, right]);
    left = right;
  }
  return out;
}

/**
 * Assumes count is an integer at least 1.
 * Yields count+1 numbers, logarithmically spaced,
 * where the middle count-1 are fresh,
 * the first is lo, and the last is hi.
 */
function* logspace(lo: number, hi: number, count: number) {
  yield lo;
  for (let i = 1; i < count; i++) {
    yield lo ** ((count - i) / count) * hi ** (i / count);
  }
  yield hi;
}

/**
 * Assumes count is an integer at least 1.
 * Yields count+1 numbers, linearly spaced,
 * where the middle count-1 are fresh,
 * the first is lo, and the last is hi.
 */
function* linspace(lo: number, hi: number, count: number) {
  yield lo;
  for (let i = 1; i < count; i++) {
    yield lo * ((count - i) / count) + hi * (i / count);
  }
  yield hi;
}

async function imageOnload(img: HTMLImageElement) {
  await new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve());
  });
}

function setViewport(cc: CalcController, vp: Viewport) {
  const Viewport = cc.getDefaultViewport().constructor;
  const grapher = cc.getGrapher();
  grapher.viewportController.setViewport(Viewport.fromObject(vp));
  cc.dispatch({
    type: "commit-user-requested-viewport",
    viewport: vp,
  });
}

async function captureMosaic(
  vc: VideoCreator,
  /** The width and height of each tile of the mosaic */
  { width, height }: { width: number; height: number },
  captureOpts: ScreenshotOpts,
  dims: MosaicDims
): ImageCapturePromise {
  const canvas = document.createElement("canvas");
  canvas.width = width * dims.x;
  canvas.height = height * dims.y;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get context");
  }
  const viewState = vc.cc.getViewState();
  const vp = { ...viewState.viewport };
  const { xAxisScale, yAxisScale } = viewState;
  let imgy = 0;
  const yIntervals = segmentInterval(vp.ymax, vp.ymin, dims.y, yAxisScale);
  const xIntervals = segmentInterval(vp.xmin, vp.xmax, dims.x, xAxisScale);
  for (const [ymax, ymin] of yIntervals) {
    let imgx = 0;
    for (const [xmin, xmax] of xIntervals) {
      setViewport(vc.cc, { xmin, xmax, ymin, ymax });

      const pngURI = await screenshotOrCancel(vc, captureOpts);
      if (pngURI === CANCELLED) return CANCELLED;

      const img = new Image();
      img.src = pngURI;
      await imageOnload(img);

      ctx.drawImage(img, imgx, imgy, width, height);
      imgx += width;
    }
    imgy += height;
  }
  setViewport(vc.cc, vp);
  return canvas.toDataURL("image/png");
}

async function screenshotOrCancel(
  vc: VideoCreator,
  captureOpts: ScreenshotOpts
): ImageCapturePromise {
  const screenshot = vc.cc.is3dProduct() ? screenshot3d : screenshot2d;
  return await Promise.race([screenshot(vc, captureOpts), vc.awaitCancel()]);
}

// resolves the screenshot as a data URI
async function captureFrame(vc: VideoCreator): ImageCapturePromise {
  const width = vc.getCaptureWidthNumber();
  const height = vc.getCaptureHeightNumber();
  const targetPixelRatio = vc.getTargetPixelRatio();
  const captureOpts = {
    width: width / targetPixelRatio,
    targetPixelRatio,
    height: height / targetPixelRatio,
    preserveAxisNumbers: true,
  };
  const mosaic = mosaicDimensions(vc);
  if (mosaic) {
    return await captureMosaic(vc, { width, height }, captureOpts, mosaic);
  } else {
    return await screenshotOrCancel(vc, captureOpts);
  }
}

interface ScreenshotOpts {
  width: number;
  height: number;
  targetPixelRatio: number;
  preserveAxisNumbers: boolean;
}

async function screenshot3d(vc: VideoCreator, size: ScreenshotOpts) {
  return await new Promise<string>((resolve) => {
    vc.cc.evaluator.notifyWhenSynced(() => resolve(vc.calc.screenshot(size)));
  });
}

async function screenshot2d(vc: VideoCreator, size: ScreenshotOpts) {
  // make the captured region entirely visible
  const { width, height } = size;
  const pixelBounds = vc.calc.graphpaperBounds.pixelCoordinates;
  const ratio = height / width / (pixelBounds.height / pixelBounds.width);
  const mathBounds = vc.calc.graphpaperBounds.mathCoordinates;
  const clampedMathBounds = scaleBoundsAboutCenter(
    mathBounds,
    Math.min(ratio, 1 / ratio)
  );
  const opts = {
    ...size,
    showLabels: true,
    mathBounds: clampedMathBounds,
    mode: "contain" as const,
  };
  if (vc.fastScreenshots) {
    return await new Promise<string>((resolve) => {
      vc.cc.evaluator.notifyWhenSynced(() =>
        vc.cc.getGrapher().asyncScreenshot(opts, resolve)
      );
    });
  }
  return await new Promise<string>((resolve) => {
    vc.calc.asyncScreenshot(opts, resolve);
  });
}

export interface SliderSettings {
  readonly min: ManagedNumberInputModel;
  readonly max: ManagedNumberInputModel;
  readonly step: ManagedNumberInputModel;
}

export async function captureSlider(vc: VideoCreator) {
  const { sliderSettings } = vc;
  const variable = vc.sliderVariable;
  const min = sliderSettings.min.getValue();
  const max = sliderSettings.max.getValue();
  const step = sliderSettings.step.getValue();
  const slider = vc.getMatchingSlider();
  if (slider === undefined) {
    return;
  }
  const maybeNegativeNumSteps = (max - min) / step;
  const m = maybeNegativeNumSteps > 0 ? 1 : -1;
  const numSteps = m * maybeNegativeNumSteps;
  const correctDirectionStep = m * step;
  // `<= numSteps` to include the endpoints for stuff like 0 to 10, step 1
  // rarely hurts to have an extra frame
  for (let i = 0; i <= numSteps; i++) {
    const value = min + correctDirectionStep * i;
    vc.calc.setExpression({
      id: slider.id,
      latex: `${variable}=${value}`,
    });

    const ret = await captureAndApplyFrame(vc);
    if (ret === CANCELLED) break;

    if (i < numSteps) {
      updateOrientationAfterCapture(vc, numSteps - i);
    }
  }
}

function slidersLatexJoined(vc: VideoCreator) {
  return vc.cc
    .getPlayingSliders()
    .map((x) => x.latex)
    .join(";");
}

async function captureActionOrSliderTicks(vc: VideoCreator, step: () => void) {
  vc.registerUpdateListener();

  let tickCountRemaining;
  while ((tickCountRemaining = vc.getTickCountNumber()) > 0) {
    const ret = await captureAndApplyFrame(vc);
    if (ret === CANCELLED) break;
    const nextTickCount = tickCountRemaining - 1;
    vc.tickCount.setLatexWithCallbacks(nextTickCount.toFixed(0));
    if (nextTickCount <= 0) break;

    vc.updateSeen = false;
    const slidersBefore = slidersLatexJoined(vc);
    step();
    updateOrientationAfterCapture(vc, nextTickCount);

    if (
      vc.captureMethod === "ticks" &&
      slidersLatexJoined(vc) === slidersBefore
    ) {
      // Due to rounding, this slider tick does not actually change the state,
      // so don't expect an event update. Just move to the next frame now.
      continue;
    } else {
      // Wait for an on-evaluator-changes update
      const ret = await Promise.race([vc.awaitCancel(), vc.awaitUpdate()]);
      if (ret === CANCELLED) break;
    }
  }

  vc.unregisterUpdateListener();
}

async function captureNTimes(vc: VideoCreator) {
  const tickCountRemaining = vc.getTickCountNumber();
  if (vc.captureCancelled || tickCountRemaining <= 0) return;
  const ret = await captureAndApplyFrame(vc);
  if (ret === CANCELLED) return;
  vc.tickCount.setLatexWithCallbacks((tickCountRemaining - 1).toFixed(0));
  if (tickCountRemaining - 1 > 0) {
    updateOrientationAfterCapture(vc, tickCountRemaining - 1);
    await captureNTimes(vc);
  }
}

function updateOrientationAfterCapture(
  vc: VideoCreator,
  numStepsRemaining: number
) {
  const { or } = vc;
  switch (or.orientationMode) {
    case "none":
      return;
    case "current-delta": {
      let { xyRot, zTip } = or.getEulerOrientation();
      xyRot += or.xyRotStep.getValue();
      zTip += or.zTipStep.getValue();
      or.setOrientationFromCapture(xyRot, zTip);
      return;
    }
    case "from-to": {
      if (numStepsRemaining <= 0) return;
      const s = 1 / numStepsRemaining;
      // Need to go from LaTeX since we need to tell the difference between
      // 0 radians and tau radians when animating from 0 to 2*tau radians.
      let { xyRot, zTip } = or.getOrientationFromLatex();
      xyRot = or.xyRotTo.getValue() * s + xyRot * (1 - s);
      zTip = or.zTipTo.getValue() * s + zTip * (1 - s);
      or.setOrientationFromCapture(xyRot, zTip);
      return;
    }
    case "current-speed": {
      if (vc.captureMethod !== "ticks") return;
      const dt = vc.getTickTimeStepNumber() / 1000;
      const sd = or.sdBeforeCapture;
      let { xyRot, zTip } = or.getEulerOrientation();
      if (sd.dir === "xyRot") xyRot += sd.speed * dt;
      else zTip += sd.speed * dt;
      or.setOrientationFromCapture(xyRot, zTip);
      return;
    }
    default:
      or.orientationMode satisfies never;
      throw new Error("Programming Error: Invalid orientation mode");
  }
}

export async function capture(vc: VideoCreator) {
  const { or } = vc;
  vc.captureCancelled = false;
  vc.isCapturing = true;
  vc.updateView();
  const tickSliders = vc.cc._tickSliders.bind(vc.cc);
  if (vc.captureMethod !== "once") {
    if (vc.cc.getTickerPlaying?.()) {
      vc.cc.dispatch({ type: "toggle-ticker" });
    }
    if (vc.captureMethod === "ticks") {
      // prevent the current slider ticking since we will manually tick the sliders.
      vc.cc._tickSliders = () => {};
    } else if (vc.cc.getPlayingSliders().length > 0) {
      vc.cc.stopAllSliders();
      vc.updateView();
    }
    if (vc.captureMethod !== "ticks") {
      or.setSpeed(0);
    }
    or.sdBeforeCapture = or.getSpinningSpeedAndDirection() ?? noSpeed;
    or.setSpinningSpeedAndDirection(noSpeed);
    if (or.orientationMode === "from-to") {
      or.xyRotFrom.setLatexWithoutCallbacks(
        or.xyRotFrom.getLatexPopulatingDefault()
      );
      or.zTipFrom.setLatexWithoutCallbacks(
        or.zTipFrom.getLatexPopulatingDefault()
      );
      or.setOrientationFromCapture(
        or.xyRotFrom.getValue(),
        or.zTipFrom.getValue()
      );
    }
  }
  switch (vc.captureMethod) {
    case "action": {
      const step = () => {
        if (vc.currentActionID === null) return;
        vc.cc.dispatch({
          type: "action-single-step",
          id: vc.currentActionID,
        });
      };
      await captureActionOrSliderTicks(vc, step);
      break;
    }
    case "ticks": {
      let currTime = performance.now();
      const step = () => {
        const dt = vc.getTickTimeStepNumber();
        currTime += dt;
        tickSliders(currTime);
      };
      await captureActionOrSliderTicks(vc, step);
      break;
    }
    case "ntimes": {
      await captureNTimes(vc);
      break;
    }
    case "once": {
      const ret = await captureAndApplyFrame(vc);
      if (ret === CANCELLED) break;
      updateOrientationAfterCapture(vc, 0);
      break;
    }
    case "slider":
      await captureSlider(vc);
      break;
    default:
      vc.captureMethod satisfies never;
      throw new Error("Programming Error: Invalid capture method");
  }
  if (vc.captureMethod !== "once") {
    // restore the typical handling of slider ticking
    or.cc._tickSliders = tickSliders;
    // restore previous speed
    or.setSpinningSpeedAndDirection(or.sdBeforeCapture);
  }
  vc.captureCancelled = false;
  vc.isCapturing = false;
  vc.actionCaptureState = "none";
  vc.updateView();
  // no need to retain a pending cancellation, if any; capture is already finished
  vc.captureCancelled = false;
}
