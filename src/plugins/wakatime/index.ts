import { Calc } from "../../globals/window";
import { desModderController } from "../../script";
import { Config, configList } from "./config";
import { listenToMessageDown, postMessageUp } from "utils/messages";
import { OptionalProperties } from "utils/utils";

let splitProjects = false;

const heartbeatInterval = 120 * 1000;
let lastUpdate = performance.now() - heartbeatInterval;

let handler: string;

async function maybeSendHeartbeat(isWrite: boolean) {
  if (!(performance.now() - lastUpdate > heartbeatInterval || isWrite)) return;
  const graphName =
    desModderController.topLevelComponents.graphsController.getCurrentGraphTitle() ??
    "Untitled Graph";
  const graphURL = window.location.href;
  const lineCount = Calc.getExpressions().length;

  console.debug("[WakaTime] Sending heartbeat at:", new Date());
  postMessageUp({
    type: "send-heartbeat",
    options: { graphName, graphURL, lineCount, splitProjects, isWrite },
  });
  lastUpdate = performance.now();
}

async function onEnable() {
  handler = Calc.controller.dispatcher.register((e) => {
    if (
      e.type === "on-evaluator-changes" ||
      e.type === "clear-unsaved-changes"
    ) {
      void maybeSendHeartbeat(e.type === "clear-unsaved-changes");
    }
  });
}

function onDisable() {
  Calc.controller.dispatcher.unregister(handler);
}

listenToMessageDown((msg) => {
  if (msg.type === "heartbeat-error") {
    console.error("Wakatime heartbeat error:", msg.message);
  }
  return false;
});

export default {
  id: "wakatime",
  onEnable,
  onDisable,
  config: configList,
  onConfigChange(changes: OptionalProperties<Config>) {
    if (changes.splitProjects !== undefined) {
      splitProjects = changes.splitProjects;
    }
  },
  enabledByDefault: false,
} as const;
