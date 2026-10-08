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
const baseHtml = fs.readFileSync(path.join(root, "app.html"), "utf8");

const framesDir = path.join(root, "tools", "temp_frames");
if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const WIDTH = 1440;
const HEIGHT = 900;
const FPS = 24;
const TOTAL_FRAMES = 380; // ~15.8 seconds

const tempUserData = path.join(os.tmpdir(), `edge-video-${Date.now()}`);
const DEBUG_PORT = 9444;

console.log(`Starting headless Edge for video recording (${WIDTH}x${HEIGHT} @ ${FPS}fps)...`);
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
  // 1. Wait for debug port
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

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // 2. Prepare app.html with demo controller
  const controllerScript = `
    <style>
      #demo-cursor {
        position: fixed;
        width: 26px;
        height: 26px;
        z-index: 9999999;
        pointer-events: none;
        transition: transform 0.04s linear;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));
      }
      #demo-click-ring {
        position: absolute;
        left: -12px;
        top: -12px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid #5ee0d6;
        opacity: 0;
        transform: scale(0.4);
        pointer-events: none;
      }
      #demo-click-ring.active {
        animation: demoRipple 0.3s ease-out forwards;
      }
      @keyframes demoRipple {
        0% { opacity: 1; transform: scale(0.5); }
        100% { opacity: 0; transform: scale(1.6); }
      }
    </style>
    <div id="demo-cursor" style="left:700px;top:450px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 2L18 13L11 14L8 21L4 2Z" fill="#ff6b86" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <div id="demo-click-ring"></div>
    </div>
    <script>
      window.isRecordingDemo = true;
      state.tutorialSeen = true;
      window.showTutorial = function() {};
      if (refs["tutorial-dialog"]) {
        try { refs["tutorial-dialog"].close(); } catch(e) {}
        refs["tutorial-dialog"].remove();
      }

      try {
        Object.defineProperty(refs["workspace-status"], "textContent", {
          get() { return this._val || ("https://pulseflow.dev · " + (state.devices ? state.devices.length : 3) + " viewports · changes do not reload previews"); },
          set(v) {
            this._val = "https://pulseflow.dev · " + (state.devices ? state.devices.length : 3) + " viewports · changes do not reload previews";
            this.innerText = this._val;
          },
          configurable: true
        });
      } catch(e) {}

      state.url = "${demoDataUrl}";
      renderAll();
      refs["url-input"].value = "https://pulseflow.dev";
      refs["workspace-status"].textContent = "";

      const cursorEl = document.getElementById("demo-cursor");
      const ringEl = document.getElementById("demo-click-ring");

      function setCursorPos(x, y, click = false) {
        cursorEl.style.left = x + "px";
        cursorEl.style.top = y + "px";
        if (click) {
          ringEl.classList.remove("active");
          void ringEl.offsetWidth;
          ringEl.classList.add("active");
        }
      }

      function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      }

      window.advanceDemoTimeline = function(frame) {
        // Frame 0-35: Setup & Cursor Move into Canvas (0s - 1.5s)
        if (frame <= 35) {
          const t = Math.min(1, frame / 35);
          const x = 700 + easeInOutQuad(t) * (-150);
          const y = 200 + easeInOutQuad(t) * 150;
          setCursorPos(x, y);
        }

        // Frame 36-115: Synchronized Scroll Demonstration (1.5s - 4.8s)
        else if (frame <= 115) {
          const f = frame - 36;
          let scrollRatio = 0;
          if (f < 40) {
            // Scroll down
            scrollRatio = easeInOutQuad(f / 40) * 0.72;
          } else if (f < 50) {
            // Hold at bottom
            scrollRatio = 0.72;
          } else {
            // Scroll back up
            scrollRatio = 0.72 * (1 - easeInOutQuad((f - 50) / 29));
          }
          scrollRatio = Math.max(0, Math.min(0.72, scrollRatio));
          
          // Broadcast scroll to all devices in lockstep
          for (const [id, view] of views) {
            if (view.iframe && view.iframe.contentWindow) {
              view.iframe.contentWindow.postMessage({ type: "SET_SCROLL", yRatio: scrollRatio }, "*");
            }
          }
          setCursorPos(540 + Math.sin(frame * 0.1) * 15, 420);
        }

        // Frame 116-160: Layout Switch -> Row Mode (4.8s - 6.6s)
        else if (frame <= 160) {
          const f = frame - 116;
          // Move cursor to ROW button in sidebar (x ~80, y ~490)
          const t = Math.min(1, f / 20);
          const x = 540 + (80 - 540) * easeInOutQuad(t);
          const y = 420 + (490 - 420) * easeInOutQuad(t);
          const isClick = (f === 22);
          setCursorPos(x, y, isClick);
          if (f === 22) {
            state.layout = "row";
            syncControls();
            syncBoard();
          }
        }

        // Frame 161-210: Layout Switch -> Focus Mode & Rotate (6.6s - 8.7s)
        else if (frame <= 210) {
          const f = frame - 161;
          if (f < 20) {
            // Move to FOCUS button (x ~110, y ~490)
            const t = f / 20;
            const x = 80 + (110 - 80) * easeInOutQuad(t);
            setCursorPos(x, 490, f === 18);
            if (f === 18) {
              state.layout = "focus";
              state.selectedId = state.devices[0].uid;
              syncControls();
              syncBoard();
            }
          } else {
            // Move cursor to Rotate button on Phone cardbar (x ~745, y ~155)
            const t = Math.min(1, (f - 20) / 15);
            const x = 110 + (745 - 110) * easeInOutQuad(t);
            const y = 490 + (155 - 490) * easeInOutQuad(t);
            const isClickRotate = (f === 35);
            setCursorPos(x, y, isClickRotate);
            if (f === 35) {
              const dev = state.devices[0];
              const w = dev.width;
              dev.width = dev.height;
              dev.height = w;
              syncBoard();
            }
          }
        }

        // Frame 211-255: Rotate back & Return to Grid (8.7s - 10.6s)
        else if (frame <= 255) {
          const f = frame - 211;
          if (f === 10) {
            // Rotate back to portrait
            const dev = state.devices[0];
            const w = dev.width;
            dev.width = dev.height;
            dev.height = w;
            syncBoard();
            setCursorPos(745, 155, true);
          } else if (f > 15) {
            // Move cursor back to GRID button in sidebar
            const t = Math.min(1, (f - 15) / 18);
            const x = 745 + (45 - 745) * easeInOutQuad(t);
            const y = 155 + (490 - 155) * easeInOutQuad(t);
            setCursorPos(x, y, f === 33);
            if (f === 33) {
              state.layout = "grid";
              syncControls();
              syncBoard();
            }
          }
        }

        // Frame 256-310: Open Presets Modal (+ Device) (10.6s - 12.9s)
        else if (frame <= 310) {
          const f = frame - 256;
          // Move cursor to + DEVICE button (x ~1380, y ~40)
          if (f < 20) {
            const t = f / 20;
            const x = 45 + (1380 - 45) * easeInOutQuad(t);
            const y = 490 + (40 - 490) * easeInOutQuad(t);
            setCursorPos(x, y, f === 18);
            if (f === 18) {
              refs["device-dialog"].showModal();
            }
          } else if (f < 40) {
            // Hover over devices inside modal (x ~700, y ~450)
            const t = (f - 20) / 20;
            const x = 1380 + (700 - 1380) * easeInOutQuad(t);
            const y = 40 + (450 - 40) * easeInOutQuad(t);
            setCursorPos(x, y);
          } else {
            // Move to close button (x ~960, y ~235) and close modal
            const t = Math.min(1, (f - 40) / 10);
            const x = 700 + (960 - 700) * easeInOutQuad(t);
            const y = 450 + (235 - 450) * easeInOutQuad(t);
            setCursorPos(x, y, f === 50);
            if (f === 50) {
              refs["device-dialog"].close();
            }
          }
        }

        // Frame 311-355: Open Responsive QA Checks Drawer (12.9s - 14.8s)
        else if (frame <= 355) {
          const f = frame - 311;
          if (f < 18) {
            // Move to Checks button in top bar (x ~1180, y ~40)
            const t = f / 18;
            const x = 960 + (1180 - 960) * easeInOutQuad(t);
            const y = 235 + (40 - 235) * easeInOutQuad(t);
            setCursorPos(x, y, f === 16);
            if (f === 16) {
              refs["issues-panel"].hidden = false;
              refs["issues-summary"].textContent = "3 responsive issues detected across 3 viewports";
              refs["issue-count"].textContent = "3";
              refs["issues-list"].innerHTML = \`
                <div class="issue-item" style="display:flex;align-items:flex-start;gap:10px;padding:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(240,239,228,0.08);border-radius:6px;margin-bottom:6px;">
                  <span class="badge warning" style="background:#4a3205;color:#ffc107;border:1px solid rgba(255,193,7,0.4);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">TOUCH TARGET</span>
                  <div>
                    <strong style="color:#f0efe4;font-size:11px;display:block;">Touch target too small (&lt; 44×44px)</strong>
                    <p style="color:#a4b1c2;font-size:10px;margin:2px 0 0;">Button <code>#login-submit</code> is 32×28px on iPhone 15</p>
                  </div>
                </div>
                <div class="issue-item" style="display:flex;align-items:flex-start;gap:10px;padding:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(240,239,228,0.08);border-radius:6px;">
                  <span class="badge danger" style="background:#4a0f16;color:#ff6b86;border:1px solid rgba(255,107,134,0.4);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">OVERFLOW</span>
                  <div>
                    <strong style="color:#f0efe4;font-size:11px;display:block;">Horizontal layout overflow</strong>
                    <p style="color:#a4b1c2;font-size:10px;margin:2px 0 0;">Content width 412px overflows 393px viewport on iPhone 15</p>
                  </div>
                </div>
              \`;
            }
          } else {
            // Hover over drawer and close at frame 40
            const t = Math.min(1, (f - 18) / 15);
            const x = 1180 + (800 - 1180) * easeInOutQuad(t);
            const y = 40 + (750 - 40) * easeInOutQuad(t);
            setCursorPos(x, y, f === 40);
            if (f === 40) {
              refs["issues-panel"].hidden = true;
            }
          }
        }

        // Frame 356-380: Final Overview & Outro (14.8s - 15.8s)
        else {
          const f = frame - 356;
          const t = Math.min(1, f / 24);
          const x = 800 + (1250 - 800) * easeInOutQuad(t);
          const y = 750 + (820 - 750) * easeInOutQuad(t);
          setCursorPos(x, y);
        }
      };
    </script>
  `;

  const modifiedHtml = baseHtml.replace("</body>", `${controllerScript}</body>`);
  const tempHtmlPath = path.join(root, "temp_demo_recorder.html");
  fs.writeFileSync(tempHtmlPath, modifiedHtml, "utf8");

  // Navigate to recorded app
  console.log("Navigating to recording page...");
  await send("Page.navigate", { url: `file:///${tempHtmlPath.replace(/\\/g, "/")}` });
  await new Promise(r => setTimeout(r, 1200));

  console.log(`Starting frame-by-frame capture of ${TOTAL_FRAMES} frames...`);
  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // Advance timeline
    await send("Runtime.evaluate", {
      expression: `window.advanceDemoTimeline(${frame});`
    });

    // Capture frame
    const shot = await send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 85
    });

    const frameFile = path.join(framesDir, `frame_${String(frame).padStart(4, "0")}.jpg`);
    fs.writeFileSync(frameFile, Buffer.from(shot.data, "base64"));

    if (frame % 40 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = Math.round((frame / TOTAL_FRAMES) * 100);
      console.log(`Frame ${frame}/${TOTAL_FRAMES} (${percent}%) - ${elapsed}s elapsed`);
    }
  }

  const captureDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`All ${TOTAL_FRAMES} frames captured in ${captureDuration}s.`);

  ws.close();
  edgeProc.kill();
  try { fs.unlinkSync(tempHtmlPath); } catch {}
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch {}

  // 3. Encode with ffmpeg
  const mp4Out = path.join(outputDir, "viewport-lab-demo.mp4");
  const gifOut = path.join(outputDir, "viewport-lab-demo.gif");
  const artifactMp4 = path.join(artifactDir, "viewport-lab-demo.mp4");
  const artifactGif = path.join(artifactDir, "viewport-lab-demo.gif");

  console.log("Encoding MP4 video with ffmpeg (H.264 high quality)...");
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
  console.log(`MP4 generated: ${mp4Out} (${fs.statSync(mp4Out).size} bytes)`);
  fs.copyFileSync(mp4Out, artifactMp4);

  console.log("Encoding optimized GIF with ffmpeg palettegen...");
  execFileSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(framesDir, "frame_%04d.jpg"),
    "-vf", "fps=16,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    gifOut
  ]);
  console.log(`GIF generated: ${gifOut} (${fs.statSync(gifOut).size} bytes)`);
  fs.copyFileSync(gifOut, artifactGif);

  // Clean up frames directory
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log("Video and GIF creation completed successfully!");

} finally {
  try { edgeProc.kill(); } catch {}
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch {}
}
