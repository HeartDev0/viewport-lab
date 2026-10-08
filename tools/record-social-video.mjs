import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = path.join(root, "assets");
const artifactDir = "C:\\Users\\junio\\.gemini\\antigravity\\brain\\048cf293-a34c-4e76-811b-85aabb4a624a";
const demoSitePath = path.join(root, "tools", "demo-site.html");
const demoHtml = fs.readFileSync(demoSitePath, "utf8");
const demoDataUrl = "data:text/html;base64," + Buffer.from(demoHtml).toString("base64");
const promoHtml = fs.readFileSync(path.join(root, "tools", "social-promo.html"), "utf8");

const framesDir = path.join(root, "tools", "temp_social_frames");
if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 24;
const TOTAL_FRAMES = 336; // 14.0 seconds

const tempUserData = path.join(os.tmpdir(), `edge-social-video-${Date.now()}`);
const DEBUG_PORT = 9777;

console.log(`Starting headless Edge for social promo recording (${WIDTH}x${HEIGHT} @ ${FPS}fps)...`);
const edgeProc = spawn(edgePath, [
  "--headless",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempUserData}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  "--disable-gpu",
  "--hide-scrollbars",
  "about:blank"
], { stdio: "ignore" });

try {
  // Wait for debug port
  let targets = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 150));
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      targets = await res.json();
      if (targets && targets.some(t => t.type === "page" && !t.url.startsWith("edge://"))) break;
    } catch {}
  }

  const pageTarget = targets?.find(t => t.type === "page" && !t.url.startsWith("edge://"));
  if (!pageTarget) throw new Error("Could not find Edge page target");

  console.log("Connected to page target:", pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

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

  function send(method, params = {}, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP ${method} timed out`));
      }, timeoutMs);
      pending.set(id, {
        resolve: (res) => { clearTimeout(timer); resolve(res); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Inject iframe demo data URL into social-promo.html
  const modifiedHtml = promoHtml
    .replace('src="about:blank"', `src="${demoDataUrl}"`)
    .replace('src="about:blank"', `src="${demoDataUrl}"`);

  const tempHtmlPath = path.join(root, "temp_social_promo_recorder.html");
  fs.writeFileSync(tempHtmlPath, modifiedHtml, "utf8");

  console.log("Navigating to social promo page...");
  await send("Page.navigate", { url: `file:///${tempHtmlPath.replace(/\\/g, "/")}` });
  await new Promise(r => setTimeout(r, 1200));

  console.log(`Capturing ${TOTAL_FRAMES} social promo frames (${WIDTH}x${HEIGHT})...`);
  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    await send("Runtime.evaluate", {
      expression: `window.advanceSocialPromo(${frame}, ${TOTAL_FRAMES});`
    });

    let shot = null;
    try {
      shot = await send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 80
      }, 10000);
    } catch (err) {
      console.warn(`Retrying frame ${frame}: ${err.message}`);
      await new Promise(r => setTimeout(r, 60));
      shot = await send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 80
      }, 10000);
    }

    const frameFile = path.join(framesDir, `frame_${String(frame).padStart(4, "0")}.jpg`);
    fs.writeFileSync(frameFile, Buffer.from(shot.data, "base64"));

    if (frame % 40 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = Math.round((frame / TOTAL_FRAMES) * 100);
      console.log(`Frame ${frame}/${TOTAL_FRAMES} (${percent}%) - ${elapsed}s elapsed`);
    }

    // Yield slightly to prevent event-loop congestion
    await new Promise(r => setTimeout(r, 15));
  }

  const captureDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`All ${TOTAL_FRAMES} frames captured in ${captureDuration}s.`);

  ws.close();
  edgeProc.kill();
  try { fs.unlinkSync(tempHtmlPath); } catch {}
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch {}

  // Encode with ffmpeg
  const mp4Out = path.join(outputDir, "viewport-lab-social-promo.mp4");
  const gifOut = path.join(outputDir, "viewport-lab-social-promo.gif");
  const artifactMp4 = path.join(artifactDir, "viewport-lab-social-promo.mp4");
  const artifactGif = path.join(artifactDir, "viewport-lab-social-promo.gif");

  console.log("Encoding 720x1280 vertical MP4 video with ffmpeg (H.264)...");
  execFileSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(framesDir, "frame_%04d.jpg"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "20",
    "-preset", "medium",
    "-movflags", "+faststart",
    mp4Out
  ]);
  console.log(`Social MP4 generated: ${mp4Out} (${fs.statSync(mp4Out).size} bytes)`);
  fs.copyFileSync(mp4Out, artifactMp4);

  console.log("Encoding 480x854 social GIF with ffmpeg palettegen...");
  execFileSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(framesDir, "frame_%04d.jpg"),
    "-vf", "fps=16,scale=480:854:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    gifOut
  ]);
  console.log(`Social GIF generated: ${gifOut} (${fs.statSync(gifOut).size} bytes)`);
  fs.copyFileSync(gifOut, artifactGif);

  // Clean up frames
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log("Social video and GIF generation finished successfully!");

} finally {
  try { edgeProc.kill(); } catch {}
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch {}
}
