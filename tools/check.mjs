import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.manifest_version !== 3) throw new Error("Manifest V3 is required.");
if (!manifest.host_permissions?.includes("<all_urls>")) throw new Error("Expected <all_urls> host permission.");
if (manifest.version !== "0.3.3") throw new Error("Expected extension version 0.3.3.");

for (const file of ["background.js", "content-frame.js", "app.js", "mcp/server.mjs"]) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
}

for (const file of ["app.html", "app.css", "README.md", "PRIVACY.md", "SECURITY.md", "mcp/README.md", "mcp/package.json"]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}

for (const size of [16, 32, 48, 128]) {
  const icon = path.join(root, "icons", `icon${size}.png`);
  if (!fs.existsSync(icon)) throw new Error(`Missing ${icon}`);
}

console.log("Viewport Lab v0.3.3 checks passed.");
