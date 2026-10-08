import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempUserData = path.join(os.tmpdir(), `edge-cdp-test-${Date.now()}`);

console.log("Starting Edge with remote debugging...");
const edgeProcess = spawn(edgePath, [
  "--headless",
  "--remote-debugging-port=9222",
  `--user-data-dir=${tempUserData}`,
  "--disable-gpu",
  "--hide-scrollbars",
  "--window-size=1600,1000",
  "about:blank"
], { stdio: "ignore" });

try {
  // Wait for debug port to be ready
  let targets = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/list");
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }

  console.log("Edge targets:", targets?.length);
  if (!targets || targets.length === 0) throw new Error("Could not find targets");

  const wsUrl = targets[0].webSocketDebuggerUrl;
  console.log("Connecting WebSocket:", wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  console.log("WebSocket connected!");

  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Navigate to app.html
  const appPath = path.join(root, "app.html").replace(/\\/g, "/");
  console.log("Navigating to file:///" + appPath);
  await send("Page.navigate", { url: `file:///${appPath}` });
  await new Promise(r => setTimeout(r, 1000));

  // Capture screenshot
  const shot = await send("Page.captureScreenshot", { format: "png" });
  console.log("Screenshot base64 length:", shot.data.length);
  ws.close();
} finally {
  edgeProcess.kill();
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch {}
}
console.log("Test finished successfully!");
