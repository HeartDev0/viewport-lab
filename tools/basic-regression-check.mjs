import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "app.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const bg = fs.readFileSync(path.join(root, "background.js"), "utf8");

const failures = [];
if (/html, body\s*\{[^}]*min-width:\s*1080px/s.test(css)) failures.push("hard 1080px document minimum width returned");
if (!css.includes("height: 100dvh")) failures.push("app shell is not constrained to the visible viewport height");
if (!css.includes("overflow-y: auto") || !css.includes("scrollbar-gutter: stable")) failures.push("sidebar does not have a stable vertical scroll region");
if (!css.includes("[hidden] { display: none !important; }")) failures.push("hidden controls can be overridden by author display rules");
if (!app.includes("if (!existed || view.stage.parentElement !== board) board.append(view.stage);")) failures.push("existing device stages may be re-appended and reload iframes");
if (/state\.devices\.forEach\([\s\S]{0,400}board\.append\(view\.stage\);/m.test(app) && !app.includes("if (!existed || view.stage.parentElement !== board) board.append(view.stage);")) failures.push("syncBoard still unconditionally re-appends device stages");
if (!app.includes('message.type === "FRAME_READY"')) failures.push("preview readiness handshake missing");
if (!app.includes("retryPreview(deviceId)")) failures.push("blocked-preview recovery action missing");
if (!bg.includes("do not acknowledge registration until the compatibility")) failures.push("compatibility rule installation is not awaited before first preview navigation");

if (!css.includes("v0.2.4 canvas containment patch")) failures.push("canvas containment override missing");
if (!css.includes("overflow: hidden !important")) failures.push("workspace canvas can still expose scrollbars");
if (!app.includes("function computeCanvasFit(workspace)")) failures.push("resolution canvas is not fitted to the visible workspace");
if (!app.includes('board.style.transform = `scale(${canvas.scale})`')) failures.push("virtual canvas is not visually contained");
if (app.includes('refs["workspace-scroller"].scrollLeft = 0') || app.includes('refs["workspace-scroller"].scrollTop = 0')) failures.push("workspace code still manipulates obsolete scroll offsets");
if (!app.includes("new ResizeObserver(() => scheduleGeometrySync())")) failures.push("workspace does not observe its actual available geometry");
if (!app.includes("window.addEventListener(\"resize\", scheduleGeometrySync)")) failures.push("window resize fallback is missing");
if (!app.includes("PREVIEW_HEALTH_TIMEOUT = 7000")) failures.push("preview health timeout is too aggressive or missing");
if (!bg.includes('workspaceResolution: "auto"')) failures.push("new installs do not default to Auto workspace");

if (failures.length) {
  console.error("Basic regression check failed:\n" + failures.map(x => `- ${x}`).join("\n"));
  process.exit(1);
}
console.log("Basic regression check passed: responsive shell, sidebar scroll access, contained no-scroll canvas, persistent frames, resize observation, and compatibility handshake are present.");
