import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = path.join(root, "assets", "screenshots");
const artifactDir = "C:\\Users\\junio\\.gemini\\antigravity\\brain\\048cf293-a34c-4e76-811b-85aabb4a624a";
const demoSitePath = path.join(root, "tools", "demo-site.html");
const demoHtml = fs.readFileSync(demoSitePath, "utf8");
const demoDataUrl = "data:text/html;base64," + Buffer.from(demoHtml).toString("base64");
const baseHtml = fs.readFileSync(path.join(root, "app.html"), "utf8");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const commonSetup = `
  state.tutorialSeen = true;
  if (refs["tutorial-dialog"].open) refs["tutorial-dialog"].close();
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
`;

const scenarios = [
  {
    name: "01-multi-device-workspace",
    title: "Multi-Device Responsive Workspace",
    setup: `
      ${commonSetup}
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "02-focus-mode",
    title: "Focus Mode (1:1 Single Device View)",
    setup: `
      ${commonSetup}
      state.layout = "focus";
      state.selectedId = state.devices[0].uid;
      renderAll();
      refs["url-input"].value = "https://pulseflow.dev";
      refs["workspace-status"].textContent = "https://pulseflow.dev · " + state.devices.length + " viewports · changes do not reload previews";
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "03-row-layout",
    title: "Row Layout Comparison",
    setup: `
      ${commonSetup}
      state.layout = "row";
      renderAll();
      refs["url-input"].value = "https://pulseflow.dev";
      refs["workspace-status"].textContent = "https://pulseflow.dev · " + state.devices.length + " viewports · changes do not reload previews";
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "04-device-presets-dialog",
    title: "Device Presets Dialog",
    setup: `
      ${commonSetup}
      refs["device-dialog"].showModal();
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "05-responsive-qa-checks",
    title: "Responsive QA Checks Panel",
    setup: `
      ${commonSetup}
      refs["issues-panel"].hidden = false;
      refs["issues-summary"].textContent = "3 responsive issues detected across 3 viewports";
      refs["issue-count"].textContent = "3";
      refs["issues-list"].innerHTML = \`
        <div class="issue-item" style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(240,239,228,0.08);border-radius:6px;margin-bottom:8px;">
          <span class="badge warning" style="background:#4a3205;color:#ffc107;border:1px solid rgba(255,193,7,0.4);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">TOUCH TARGET</span>
          <div>
            <strong style="color:#f0efe4;font-size:12px;display:block;">Touch target too small (&lt; 44×44px)</strong>
            <p style="color:#a4b1c2;font-size:11px;margin:3px 0 0;">Button <code>#login-submit</code> is 32×28px on iPhone 15</p>
          </div>
        </div>
        <div class="issue-item" style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(240,239,228,0.08);border-radius:6px;margin-bottom:8px;">
          <span class="badge danger" style="background:#4a0f16;color:#ff6b86;border:1px solid rgba(255,107,134,0.4);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">OVERFLOW</span>
          <div>
            <strong style="color:#f0efe4;font-size:12px;display:block;">Horizontal layout overflow</strong>
            <p style="color:#a4b1c2;font-size:11px;margin:3px 0 0;">Content width 412px overflows 393px viewport on iPhone 15</p>
          </div>
        </div>
        <div class="issue-item" style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(240,239,228,0.08);border-radius:6px;">
          <span class="badge info" style="background:#092a42;color:#5ee0d6;border:1px solid rgba(94,224,214,0.4);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">A11Y</span>
          <div>
            <strong style="color:#f0efe4;font-size:12px;display:block;">Image missing alt attribute</strong>
            <p style="color:#a4b1c2;font-size:11px;margin:3px 0 0;">&lt;img src="hero-banner.png"&gt; on Galaxy S24</p>
          </div>
        </div>
      \`;
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "06-onboarding-tour",
    title: "Onboarding Tour Dialog",
    setup: `
      showTutorial(0);
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "07-mcp-agent-bridge",
    title: "MCP Agent Bridge Dialog",
    setup: `
      ${commonSetup}
      refs["bridge-dialog"].showModal();
    `,
    width: 1600,
    height: 1000
  },
  {
    name: "08-responsive-sweep-sidebar",
    title: "Responsive Sweep & Controls",
    setup: `
      ${commonSetup}
      state.selectedId = state.devices[0].uid;
      renderSelectedEditor();
    `,
    width: 600,
    height: 1000
  }
];

for (const scenario of scenarios) {
  const customScript = `
    <script>
      window.addEventListener("load", () => {
        setTimeout(() => {
          try {
            ${scenario.setup}
          } catch (e) {
            console.error("Setup error:", e);
          }
        }, 500);
      });
    </script>
  `;

  const modifiedHtml = baseHtml.replace("</body>", `${customScript}</body>`);
  const tempHtmlPath = path.join(root, `temp_${scenario.name}.html`);
  fs.writeFileSync(tempHtmlPath, modifiedHtml, "utf8");

  const repoOutPath = path.join(outputDir, `${scenario.name}.png`);
  const artifactOutPath = path.join(artifactDir, `${scenario.name}.png`);

  console.log(`Capturing ${scenario.title} (${scenario.name}.png)...`);
  execFileSync(edgePath, [
    "--headless",
    `--screenshot=${repoOutPath}`,
    `--window-size=${scenario.width},${scenario.height}`,
    "--hide-scrollbars",
    "--virtual-time-budget=2000",
    `file:///${tempHtmlPath.replace(/\\/g, "/")}`
  ]);

  fs.copyFileSync(repoOutPath, artifactOutPath);
  try { fs.unlinkSync(tempHtmlPath); } catch {}
}

console.log("All showcase screenshots captured successfully.");
