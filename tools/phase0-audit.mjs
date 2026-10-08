import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "app.css"), "utf8");
const bg = fs.readFileSync(path.join(root, "background.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const failures = [];

function between(start, end) {
  const a = app.indexOf(start);
  const b = app.indexOf(end, a + start.length);
  return a >= 0 && b > a ? app.slice(a, b) : "";
}

const patchView = between("function patchView", "function scheduleGeometrySync");
const syncBoard = between("function syncBoard", "function updateWorkspaceStatus");
const rotate = between("function rotateDevice", "function applyPresetToSelected");
const selectedEditor = between("function applySelectedEditor", "function navigateAll");

if (manifest.version !== "0.3.3") failures.push("manifest is not v0.3.3");
if (/\.src\s*=|location\.href|location\.reload/.test(patchView)) failures.push("patchView can navigate a preview");
if (/\.src\s*=|location\.href|location\.reload/.test(syncBoard)) failures.push("syncBoard can navigate a preview");
if (/\.src\s*=/.test(rotate)) failures.push("rotateDevice changes iframe src");
if (/\.src\s*=/.test(selectedEditor)) failures.push("selected-device edits change iframe src");
if (!syncBoard.includes("if (!existed || view.stage.parentElement !== board) board.append(view.stage);")) failures.push("persistent stages are not protected from re-append");
if (!css.includes("overflow: hidden !important")) failures.push("workspace overflow is not force-hidden");
if (!css.includes(".sidebar") || !css.includes("overflow-y: auto")) failures.push("sidebar independent scroll is missing");
if (!app.includes("new ResizeObserver(() => scheduleGeometrySync())")) failures.push("workspace resize observer missing");
if (!app.includes('window.addEventListener("resize", scheduleGeometrySync)')) failures.push("window resize fallback missing");
if (!bg.includes('workspaceResolution: "auto"')) failures.push("fresh installs do not default to Auto workspace");
if (!bg.includes("await setCompatibilityForTab(sender.tab.id, settings.compatibilityMode);")) failures.push("compatibility install is not awaited");
if (!bg.includes('resourceTypes: ["sub_frame"]')) failures.push("compatibility rule is not scoped to subframes");
if (!app.includes("PREVIEW_HEALTH_TIMEOUT = 7000")) failures.push("blocked-preview health window missing");
if (!app.includes("view.currentRequestedUrl !== state.url")) failures.push("URL identity guard missing");
if (app.includes('refs["workspace-scroller"].scrollLeft = 0') || app.includes('refs["workspace-scroller"].scrollTop = 0')) failures.push("obsolete workspace scrolling code remains");

if (failures.length) {
  console.error("Phase 0 audit failed:\n" + failures.map(v => `- ${v}`).join("\n"));
  process.exit(1);
}
console.log("Phase 0 audit passed: geometry-only actions are non-navigating, canvas is contained, sidebar scroll is independent, and compatibility setup is ordered before preview navigation.");
