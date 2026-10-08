import fs from "node:fs";

const js = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const failures = [];
if (!js.includes("return clamp(focusFill, .12, 2.5)")) failures.push("Focus mode must be allowed to upscale small devices.");
if (!js.includes('if (state.layout === "focus") return Math.min(fitScale, fitScale * requested);')) failures.push("Focus effectiveScale must treat 100% as fill scale.");
if (!js.includes("const focusFill = Math.min(")) failures.push("Focus fill must be derived from available width and height.");
if (/state\.layout === "focus"[\s\S]{0,500}iframe\.src\s*=/.test(js)) failures.push("Focus geometry must not navigate the iframe.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Focus layout audit passed.");
