import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const codeFiles = ["background.js", "content-frame.js", "app.js", "app.html", "app.css"];
const banned = [
  [/\bXMLHttpRequest\b/g, "XMLHttpRequest"],
  [/\bWebSocket\b/g, "WebSocket"],
  [/\bsendBeacon\b/g, "sendBeacon"],
  [/google-analytics|googletagmanager|segment\.com|sentry\.io|mixpanel|amplitude/gi, "analytics/telemetry endpoint"]
];

const failures = [];
for (const file of codeFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const [pattern, label] of banned) {
    if (pattern.test(text)) failures.push(`${file}: ${label}`);
    pattern.lastIndex = 0;
  }

  if (file === "app.js") {
    const bridge = text.match(/const\s+BRIDGE_BASE\s*=\s*["']([^"']+)["']/)?.[1] || "";
    if (bridge && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(bridge)) {
      failures.push(`${file}: non-loopback bridge endpoint ${bridge}`);
    }
  }

  if (file.endsWith(".html")) {
    const remoteAsset = /<(script|link)[^>]+(?:src|href)=["']https?:\/\//i;
    if (remoteAsset.test(text)) failures.push(`${file}: remote runtime asset`);
  }
}

if (failures.length) {
  console.error("Privacy check failed:\n" + failures.map(x => `- ${x}`).join("\n"));
  process.exit(1);
}

console.log("Privacy check passed: no telemetry SDKs, remote runtime assets, or non-loopback extension endpoints detected.");
