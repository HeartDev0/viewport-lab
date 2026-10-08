const MAX_DEVICES = 5;
const SESSION_ID = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const BRIDGE_BASE = "http://127.0.0.1:43117";
const PREVIEW_HEALTH_TIMEOUT = 7000;

const PRESETS = [
  { group: "Apple", id: "iphone-se", name: "iPhone SE", width: 375, height: 667, dpr: 2, shell: "clean", color: "silver" },
  { group: "Apple", id: "iphone-13-mini", name: "iPhone 13 mini", width: 375, height: 812, dpr: 3, shell: "notch", color: "graphite" },
  { group: "Apple", id: "iphone-15", name: "iPhone 15", width: 393, height: 852, dpr: 3, shell: "pill", color: "graphite" },
  { group: "Apple", id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", width: 430, height: 932, dpr: 3, shell: "pill", color: "warm" },
  { group: "Apple", id: "iphone-16-pro", name: "iPhone 16 Pro", width: 402, height: 874, dpr: 3, shell: "pill", color: "silver" },
  { group: "Google", id: "pixel-8", name: "Pixel 8", width: 412, height: 915, dpr: 2.625, shell: "punch", color: "graphite" },
  { group: "Google", id: "pixel-9", name: "Pixel 9", width: 412, height: 915, dpr: 2.625, shell: "punch", color: "blue" },
  { group: "Samsung", id: "galaxy-s24", name: "Galaxy S24", width: 360, height: 780, dpr: 3, shell: "punch", color: "graphite" },
  { group: "Samsung", id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra", width: 412, height: 915, dpr: 3, shell: "punch", color: "silver" },
  { group: "Samsung", id: "galaxy-z-flip", name: "Galaxy Z Flip", width: 360, height: 748, dpr: 3, shell: "punch", color: "warm" },
  { group: "Tablets", id: "ipad-mini", name: "iPad mini", width: 744, height: 1133, dpr: 2, shell: "tablet", color: "silver" },
  { group: "Tablets", id: "ipad-air", name: "iPad Air", width: 820, height: 1180, dpr: 2, shell: "tablet", color: "graphite" },
  { group: "Tablets", id: "galaxy-tab", name: "Galaxy Tab", width: 800, height: 1280, dpr: 2, shell: "tablet", color: "blue" },
  { group: "Desktop", id: "macbook-air", name: "MacBook Air", width: 1280, height: 800, dpr: 2, shell: "clean", color: "silver" },
  { group: "Desktop", id: "laptop-hd", name: "Laptop 1366", width: 1366, height: 768, dpr: 1, shell: "clean", color: "graphite" },
  { group: "Desktop", id: "desktop-fhd", name: "Desktop 1080p", width: 1536, height: 864, dpr: 1.25, shell: "clean", color: "graphite" },
  { group: "Generic", id: "small-phone", name: "Small phone", width: 320, height: 700, dpr: 2, shell: "clean", color: "graphite" },
  { group: "Generic", id: "standard-phone", name: "Standard phone", width: 390, height: 844, dpr: 2, shell: "clean", color: "graphite" },
  { group: "Generic", id: "large-phone", name: "Large phone", width: 430, height: 932, dpr: 2, shell: "clean", color: "graphite" },
  { group: "Generic", id: "small-tablet", name: "Small tablet", width: 768, height: 1024, dpr: 2, shell: "tablet", color: "graphite" }
];

const WORKSPACES = {
  auto: null,
  "1080": { width: 1920, height: 1080, label: "1080p · 1920×1080" },
  "1440": { width: 2560, height: 1440, label: "1440p · 2560×1440" },
  "4k": { width: 3840, height: 2160, label: "4K · 3840×2160" }
};

const COMMON_WIDTHS = [320, 360, 375, 390, 393, 412, 430, 480, 600, 768, 820, 1024, 1280, 1440];

const ICONS = {
  select: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M417.059 497.692H272.891L49.574 250.448a24 24 0 0 1 2.007-34.148 90.41 90.41 0 0 1 129.507 10.789l18.494 22.6H224v-180a52 52 0 0 1 104 0v111.842l126.423 35.118A24.07 24.07 0 0 1 472 239.773v159.7a24 24 0 0 1-3.421 12.349Zm-129.95-32h111.832L440 397.26V245.854l-144-40V69.692a20 20 0 0 0-40 0v212h-71.582l-28.1-34.34a58.437 58.437 0 0 0-77.18-11.91Zm158.718-218.22.033.009Z"/></svg>`,
  focus: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M208 48V16H16v192h32V70.627l160.687 160.686 22.626-22.626L70.627 48zm256 256v137.373L299.313 276.687l-22.626 22.626L441.373 464H304v32h192V304z"/></svg>`,
  unfocus: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M204 181.372 38.628 16H16v22.628L181.372 204H44v32h192V44h-32zM326.628 304H464v-32H272v192h32V326.628L473.372 496H496v-22.628z"/></svg>`,
  camera: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M471.993 112h-89.2l-16.242-46.75a32.02 32.02 0 0 0-30.229-21.5H175.241a31.99 31.99 0 0 0-30.294 21.691L129.1 112H40a24.027 24.027 0 0 0-24 24v312a24.027 24.027 0 0 0 24 24h431.993a24.027 24.027 0 0 0 24-24V136a24.027 24.027 0 0 0-24-24m-8 328H48.007V144h104.01l23.224-68.25h161.081l23.71 68.25h103.961Z"/><path d="M256 168a114 114 0 1 0 114 114 114.13 114.13 0 0 0-114-114m0 196a82 82 0 1 1 82-82 82.093 82.093 0 0 1-82 82"/></svg>`,
  rotate: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="m410.168 133.046-28.958-28.958 82.807-.088-.034-32L328 72.144V208h32v-79.868l27.541 27.541A152.5 152.5 0 0 1 279.972 416l.056 32a184.5 184.5 0 0 0 130.14-314.954M232.028 104l-.056-32a184.5 184.5 0 0 0-130.14 314.954L130.878 416H48v32h136V312h-32v79.868l-27.541-27.541A152.5 152.5 0 0 1 232.028 104"/></svg>`,
  reload: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M265.614 206.387H456V16h-32v133.887l-26.137-26.137c-79.539-79.539-208.96-79.54-288.5 0s-79.539 208.96 0 288.5a204.23 204.23 0 0 0 288.5 0l-22.627-22.627c-67.063 67.063-176.182 67.063-243.244 0s-67.063-176.183 0-243.246 176.182-67.063 243.245 0l28.01 28.01H265.614Z"/></svg>`,
  close: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="m427.314 107.313-22.628-22.626L256 233.373 107.314 84.687l-22.628 22.626L233.373 256 84.686 404.687l22.628 22.626L256 278.627l148.686 148.686 22.628-22.626L278.627 256z"/></svg>`,
  duplicate: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M408 432h-32v32H112V136h32v-32H80v392h328z"/><path d="M176 16v384h320V153.373L358.627 16Zm288 352H208V48h104v152h152Zm0-200H344V48h1.372L464 166.627Z"/></svg>`,
  device: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M380 16H132a32.036 32.036 0 0 0-32 32v416a32.036 32.036 0 0 0 32 32h248a32.036 32.036 0 0 0 32-32V48a32.036 32.036 0 0 0-32-32m0 32v32H132V48Zm0 64 .011 224H132V112Zm0 352H132v-96h248.016v96Z"/><path d="M240 400h32v32h-32z"/></svg>`,
  plus: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M440 240H272V72h-32v168H72v32h168v168h32V272h168z"/></svg>`,
  check: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="m199.066 456-7.379-7.514-3.94-3.9-86.2-86.2.053-.055-83.664-83.666 97.614-97.613 83.565 83.565L398.388 61.344 496 158.958 296.729 358.229l-11.26 11.371ZM146.6 358.183l52.459 52.46.1-.1.054.054 52.311-52.311 11.259-11.368 187.963-187.96-52.358-52.358-199.273 199.271-83.565-83.565-52.359 52.359 83.464 83.463Z"/></svg>`,
  trash: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M96 472a23.82 23.82 0 0 0 23.579 24h272.842A23.82 23.82 0 0 0 416 472V152H96Zm32-288h256v280H128Z"/><path d="M168 216h32v200h-32zm72 0h32v200h-32zm72 0h32v200h-32zm16-128V40c0-13.458-9.488-24-21.6-24H205.6C193.488 16 184 26.542 184 40v48H64v32h384V88ZM216 48h80v40h-80Z"/></svg>`,
  info: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M256 95.998h34.924v34.924H256z"/><path d="M16 496h480V16H16ZM48 48h416v416H48Z"/><path d="M285.313 359.032a18.12 18.12 0 0 1-15.6 8.966 18.06 18.06 0 0 1-17.327-23.157l35.67-121.277a49.577 49.577 0 0 0-93.356-32.992l-11.718 28.234 29.557 12.266 11.718-28.235a17.577 17.577 0 0 1 33.1 11.7l-35.67 121.277A50.06 50.06 0 0 0 269.709 400a50.23 50.23 0 0 0 43.25-24.853l15.1-25.913-27.646-16.115Z"/></svg>`,
  settings: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M245.151 168a88 88 0 1 0 88 88 88.1 88.1 0 0 0-88-88m0 144a56 56 0 1 1 56-56 56.063 56.063 0 0 1-56 56"/><path d="m464.7 322.319-31.77-26.153a193.1 193.1 0 0 0 0-80.332l31.77-26.153a19.94 19.94 0 0 0 4.606-25.439l-32.612-56.483a19.936 19.936 0 0 0-24.337-8.73l-38.561 14.447a192 192 0 0 0-69.54-40.192l-6.766-40.571A19.936 19.936 0 0 0 277.762 16H212.54a19.94 19.94 0 0 0-19.728 16.712l-6.762 40.572a192 192 0 0 0-69.54 40.192L77.945 99.027a19.94 19.94 0 0 0-24.334 8.731L21 164.245a19.94 19.94 0 0 0 4.61 25.438l31.767 26.151a193.1 193.1 0 0 0 0 80.332l-31.77 26.153A19.94 19.94 0 0 0 21 347.758l32.612 56.483a19.94 19.94 0 0 0 24.337 8.73l38.562-14.447a192 192 0 0 0 69.54 40.192l6.762 40.571A19.94 19.94 0 0 0 212.54 496h65.222a19.936 19.936 0 0 0 19.728-16.712l6.763-40.572a192 192 0 0 0 69.54-40.192l38.564 14.449a19.94 19.94 0 0 0 24.334-8.731l32.609-56.487a19.94 19.94 0 0 0-4.6-25.436m-50.636 57.12-48.109-18.024-7.285 7.334a159.96 159.96 0 0 1-72.625 41.973l-10 2.636L267.6 464h-44.89l-8.442-50.642-10-2.636a159.96 159.96 0 0 1-72.625-41.973l-7.285-7.334-48.117 18.024L53.8 340.562l39.629-32.624-2.7-9.973a160.9 160.9 0 0 1 0-83.93l2.7-9.972L53.8 171.439l22.446-38.878 48.109 18.024 7.285-7.334a159.96 159.96 0 0 1 72.625-41.973l10-2.636L222.706 48H267.6l8.442 50.642 10 2.636a159.96 159.96 0 0 1 72.625 41.973l7.285 7.334 48.109-18.024 22.447 38.877-39.629 32.625 2.7 9.972a160.9 160.9 0 0 1 0 83.93l-2.7 9.973 39.629 32.623Z"/></svg>`,
  volumeHigh: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M264 416.74V95.26a16 16 0 0 0-25.9-12.51L128 168.39H48a16 16 0 0 0-16 16v143.22a16 16 0 0 0 16 16h80l110.1 85.64A16 16 0 0 0 264 416.74ZM352 176a16 16 0 0 0-16 16 96 96 0 0 1 0 128 16 16 0 1 0 22.63 22.63 128 128 0 0 0 0-173.26A16 16 0 0 0 352 176Zm45.25-45.25a16 16 0 0 0-22.63 22.63 192 192 0 0 1 0 273.24 16 16 0 0 0 22.63 22.63 224 224 0 0 0 0-318.5Z"/></svg>`,
  volumeOff: `<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M264 416.74V95.26a16 16 0 0 0-25.9-12.51L128 168.39H48a16 16 0 0 0-16 16v143.22a16 16 0 0 0 16 16h80l110.1 85.64A16 16 0 0 0 264 416.74Z"/><polygon points="440.485 232.899 417.858 210.272 361.343 266.787 304.828 210.272 282.201 232.899 338.716 289.414 282.201 345.929 304.828 368.556 361.343 312.041 417.858 368.556 440.485 345.929 383.971 289.414 440.485 232.899"/></svg>`
};

const SOUNDS = {
  click: "assets/audio/click1.ogg",
  clickAlt: "assets/audio/click3.ogg",
  select: "assets/audio/click2.ogg",
  toggleOn: "assets/audio/switch1.ogg",
  toggleOff: "assets/audio/switch2.ogg",
  layout: "assets/audio/switch10.ogg",
  rotate: "assets/audio/switch33.ogg",
  dialogOpen: "assets/audio/switch4.ogg",
  dialogClose: "assets/audio/switch5.ogg",
  qa: "assets/audio/click5.ogg",
  delete: "assets/audio/mouserelease1.ogg",
  sweep: "assets/audio/rollover2.ogg"
};

class SoundManager {
  constructor() {
    this.lastSweepTime = 0;
  }

  play(key) {
    if (!state.soundEnabled) return;
    const path = SOUNDS[key];
    if (!path) return;
    try {
      const audio = new Audio(path);
      audio.volume = 0.22;
      audio.play().catch(() => {});
    } catch {}
  }

  playSweep() {
    const now = Date.now();
    if (now - this.lastSweepTime < 90) return;
    this.lastSweepTime = now;
    this.play("sweep");
  }
}

const soundFX = new SoundManager();

const TUTORIAL = [
  { icon: "⌜⌟", title: "Open a real website", copy: "Enter a URL or localhost address. Viewport Lab keeps each preview alive while you resize, rotate, change shells or rearrange the workspace." },
  { icon: "1:1", title: "Review at the right scale", copy: "Crisp prioritizes visual clarity. Fit prioritizes seeing the complete device set. Neither mode changes the CSS viewport reported to the website." },
  { icon: "▣", title: "Choose the work area", copy: "Auto, 1080p, 1440p and 4K describe the virtual review canvas. The canvas is always contained inside the space available beside the sidebar." },
  { icon: "↔", title: "Resize without reloading", copy: "Use Responsive Sweep or edit width and height. Media queries react immediately while the website keeps its current state." },
  { icon: "✓", title: "Check responsive behavior", copy: "Run checks for overflow, clipping, small touch targets and other common responsive problems, then jump directly to the affected viewport." },
  { icon: "⧉", title: "Save your workspace", copy: "Store device sets, layout, canvas size and view options locally so recurring projects reopen with the same review setup." },
  { icon: "KEY", title: "Use keyboard shortcuts", copy: "R rotates the selected device, Ctrl/Cmd+D duplicates it, Delete removes it, C/F switches Crisp and Fit, 1–4 changes layout, and Alt+C runs responsive checks." }
];

const state = {
  devices: [],
  selectedId: null,
  url: "",
  recentUrls: [],
  layout: "grid",
  previousLayout: "grid",
  viewMode: "crisp",
  workspaceZoom: 1,
  workspaceResolution: "auto",
  workspaceWidth: 2560,
  workspaceHeight: 1440,
  showFrames: true,
  showSafeArea: false,
  syncScroll: false,
  syncNavigation: false,
  compatibilityMode: true,
  agentControl: false,
  soundEnabled: true,
  kofiDismissed: false,
  freePositions: {},
  sessions: [],
  detectedBreakpoints: [],
  issues: [],
  sweepResults: [],
  tutorialSeen: false
};

const refs = {};
const views = new Map();
const pendingFrameRequests = new Map();
let lastNavigationBroadcast = { url: "", source: "", at: 0 };
let fitScale = .5;
let canvasFitScale = 1;
let tutorialIndex = 0;
let bridgeConnected = false;
let bridgePollBusy = false;
let bridgeTimer = 0;
let persistTimer = 0;
let geometryFrame = 0;
let workspaceResizeObserver = null;

function uid() {
  return crypto.randomUUID().slice(0, 8);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?(\/|$)/i.test(raw)) return `http://${raw}`;
  if (/\.(local|test|internal|localhost|nip\.io|sslip\.io|lvh\.me)(:\d+)?(\/|$)/i.test(raw)) return `http://${raw}`;
  return `https://${raw}`;
}

function persistCurrentUrl(url) {
  chrome.storage.local.set({ viewportLabLastUrl: url || "" }).catch(() => {});
}

function createDeviceFromPreset(preset, overrides = {}) {
  return {
    uid: uid(),
    presetId: preset.id,
    name: preset.name,
    width: preset.width,
    height: preset.height,
    dpr: preset.dpr,
    shell: preset.shell,
    color: preset.color,
    ...overrides
  };
}

function defaultDevices() {
  return [
    createDeviceFromPreset(PRESETS.find(p => p.id === "iphone-15")),
    createDeviceFromPreset(PRESETS.find(p => p.id === "galaxy-s24")),
    createDeviceFromPreset(PRESETS.find(p => p.id === "ipad-air"))
  ];
}

function selectedDevice() {
  return state.devices.find(d => d.uid === state.selectedId) || null;
}

function findDevice(target) {
  if (!target) return selectedDevice();
  if (typeof target === "number") return state.devices[target] || null;
  const needle = String(target).toLowerCase();
  return state.devices.find(d => d.uid === target || d.name.toLowerCase() === needle || d.presetId === needle) || null;
}

async function loadState() {
  let saved = {};
  try {
    if (globalThis.chrome?.storage?.local?.get) {
      saved = await chrome.storage.local.get({
        viewportLabDevices: null,
        viewportLabFreePositions: {},
        viewportLabSessions: [],
        viewportLabLastUrl: "",
        viewportLabRecentUrls: [],
        layout: "grid",
        viewMode: "crisp",
        workspaceZoom: 1,
        workspaceResolution: "auto",
        workspaceWidth: 2560,
        workspaceHeight: 1440,
        showFrames: true,
        showSafeArea: false,
        syncScroll: false,
        syncNavigation: false,
        compatibilityMode: true,
        agentControl: false,
        soundEnabled: true,
        kofiDismissed: false,
        viewportLabTutorialSeen: false
      });
    }
  } catch {}

  state.devices = Array.isArray(saved.viewportLabDevices) && saved.viewportLabDevices.length
    ? saved.viewportLabDevices.slice(0, MAX_DEVICES)
    : defaultDevices();
  state.freePositions = saved.viewportLabFreePositions || {};
  state.sessions = Array.isArray(saved.viewportLabSessions) ? saved.viewportLabSessions : [];
  state.layout = ["grid", "row", "focus", "free"].includes(saved.layout) ? saved.layout : "grid";
  state.viewMode = ["crisp", "fit"].includes(saved.viewMode) ? saved.viewMode : "crisp";
  state.workspaceZoom = clamp(Number(saved.workspaceZoom) || 1, .5, 1.5);
  state.workspaceResolution = ["auto", "1080", "1440", "4k", "custom"].includes(saved.workspaceResolution) ? saved.workspaceResolution : "auto";
  state.workspaceWidth = clamp(Number(saved.workspaceWidth) || 2560, 900, 7680);
  state.workspaceHeight = clamp(Number(saved.workspaceHeight) || 1440, 600, 4320);
  state.showFrames = saved.showFrames !== false;
  state.showSafeArea = Boolean(saved.showSafeArea);
  state.syncScroll = Boolean(saved.syncScroll);
  state.syncNavigation = Boolean(saved.syncNavigation);
  state.compatibilityMode = saved.compatibilityMode !== false;
  state.agentControl = Boolean(saved.agentControl);
  state.soundEnabled = saved.soundEnabled !== false;
  state.kofiDismissed = Boolean(saved.kofiDismissed);
  state.tutorialSeen = Boolean(saved.viewportLabTutorialSeen);
  state.selectedId = state.devices[0]?.uid || null;

  const queryUrl = new URL(location.href).searchParams.get("url");
  let initialUrl = normalizeUrl(queryUrl || saved.viewportLabLastUrl || "");

  // Patch v0.2.1: if the app was opened without ?url= (for example after
  // reloading the unpacked extension), recover a useful source tab instead
  // of falling back to the empty "Live website canvas" state.
  if (!initialUrl) {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      if (Number.isInteger(currentTab?.openerTabId)) {
        const opener = await chrome.tabs.get(currentTab.openerTabId);
        if (/^https?:\/\//i.test(opener?.url || "")) initialUrl = normalizeUrl(opener.url);
      }
      if (!initialUrl && Number.isInteger(currentTab?.windowId)) {
        const tabs = await chrome.tabs.query({ windowId: currentTab.windowId });
        const candidate = tabs
          .filter(tab => tab.id !== currentTab.id && /^https?:\/\//i.test(tab.url || ""))
          .sort((a, b) => Number(b.lastAccessed || 0) - Number(a.lastAccessed || 0))[0];
        if (candidate?.url) initialUrl = normalizeUrl(candidate.url);
      }
    } catch {
      // Tab recovery is only a fallback. Saved/query URLs remain authoritative.
    }
  }

  state.url = initialUrl;
  state.recentUrls = Array.isArray(saved.viewportLabRecentUrls) ? saved.viewportLabRecentUrls : [];
  if (initialUrl && !state.recentUrls.includes(initialUrl)) state.recentUrls.unshift(initialUrl);
  if (state.url) chrome.storage.local.set({ viewportLabLastUrl: state.url }).catch(() => {});
}

function addRecentUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  state.recentUrls = [url, ...state.recentUrls.filter(u => u !== url)].slice(0, 12);
  chrome.storage.local.set({ viewportLabRecentUrls: state.recentUrls }).catch(() => {});
  renderRecentUrls();
}

function renderRecentUrls() {
  const datalist = refs["url-history-list"] || document.getElementById("url-history-list");
  if (!datalist) return;
  datalist.replaceChildren();
  for (const url of state.recentUrls) {
    const opt = document.createElement("option");
    opt.value = url;
    datalist.append(opt);
  }
}

function persistDevices() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    chrome?.storage?.local?.set?.({
      viewportLabDevices: state.devices,
      viewportLabFreePositions: state.freePositions
    });
  }, 80);
}

function persistSetting(key, value) {
  chrome?.storage?.local?.set?.({ [key]: value });
}

function persistWorkspaceSettings() {
  chrome?.storage?.local?.set?.({
    layout: state.layout,
    viewMode: state.viewMode,
    workspaceZoom: state.workspaceZoom,
    workspaceResolution: state.workspaceResolution,
    workspaceWidth: state.workspaceWidth,
    workspaceHeight: state.workspaceHeight,
    showFrames: state.showFrames,
    showSafeArea: state.showSafeArea,
    syncScroll: state.syncScroll,
    syncNavigation: state.syncNavigation,
    compatibilityMode: state.compatibilityMode,
    agentControl: state.agentControl,
    soundEnabled: state.soundEnabled
  });
}

function cacheRefs() {
  [
    "url-form", "url-input", "reload-all", "run-checks-top", "top-view-switcher", "fit-button", "add-device-top", "sound-toggle-btn", "help-button",
    "add-device-side", "device-count", "device-list", "view-switcher", "workspace-resolution", "custom-workspace-fields",
    "workspace-width", "workspace-height", "zoom-range", "zoom-output", "layout-switcher", "frames-toggle", "safe-area-toggle",
    "scroll-toggle", "navigation-toggle", "compatibility-toggle", "selected-editor", "selected-preset-label", "selected-preset",
    "selected-width", "selected-height", "selected-shell", "selected-color", "rotate-selected", "duplicate-selected", "remove-selected",
    "sweep-range", "sweep-output", "sweep-common", "run-checks-side", "session-select", "save-session", "delete-session",
    "bridge-status", "agent-control-toggle", "bridge-help", "workspace-title", "workspace-status", "resolution-badge", "clarity-badge",
    "issues-toggle", "issue-count", "breakpoint-ruler", "workspace-scroller", "device-board", "issues-panel", "issues-summary",
    "issues-list", "inspect-output", "inspect-page", "rerun-checks", "close-issues", "device-dialog", "close-dialog", "preset-grid",
    "custom-width", "custom-height", "add-custom", "tutorial-dialog", "tutorial-progress-text", "tutorial-progress-bar", "tutorial-icon",
    "tutorial-title", "tutorial-copy", "tutorial-skip", "tutorial-next", "bridge-dialog", "close-bridge-dialog", "empty-template",
    "url-history-list", "capture-selected", "capture-workspace", "toast-container",
    "kofi-top-btn", "kofi-banner", "close-kofi-banner", "kofi-banner-donate-btn"
  ].forEach(id => refs[id] = document.getElementById(id));
}

function showToast(message, type = "info", duration = 2800) {
  const container = refs["toast-container"] || document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 240);
  }, duration);
}

function buildPresetControls() {
  refs["selected-preset"].replaceChildren();
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Custom / keep dimensions";
  refs["selected-preset"].append(custom);
  for (const group of [...new Set(PRESETS.map(p => p.group))]) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group;
    for (const preset of PRESETS.filter(p => p.group === group)) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.name} · ${preset.width}×${preset.height}`;
      optgroup.append(option);
    }
    refs["selected-preset"].append(optgroup);
  }

  refs["preset-grid"].replaceChildren();
  for (const group of [...new Set(PRESETS.map(p => p.group))]) {
    const heading = document.createElement("div");
    heading.className = "preset-group-title";
    heading.textContent = group;
    refs["preset-grid"].append(heading);
    for (const preset of PRESETS.filter(p => p.group === group)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-card";
      const preview = document.createElement("span");
      preview.className = `preset-preview${preset.shell === "tablet" ? " tablet" : preset.group === "Desktop" ? " desktop" : ""}`;
      const copy = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = preset.name;
      const dims = document.createElement("span");
      dims.textContent = `${preset.width} × ${preset.height}`;
      copy.append(strong, dims);
      button.append(preview, copy);
      button.addEventListener("click", () => addPresetDevice(preset));
      refs["preset-grid"].append(button);
    }
  }
}

function syncControls() {
  refs["url-input"].value = state.url;
  refs["device-count"].textContent = `${state.devices.length} / ${MAX_DEVICES}`;
  refs["workspace-resolution"].value = state.workspaceResolution;
  refs["custom-workspace-fields"].hidden = state.workspaceResolution !== "custom";
  refs["workspace-width"].value = state.workspaceWidth;
  refs["workspace-height"].value = state.workspaceHeight;
  refs["zoom-range"].value = Math.round(state.workspaceZoom * 100);
  refs["zoom-output"].value = `${Math.round(state.workspaceZoom * 100)}%`;
  refs["frames-toggle"].checked = state.showFrames;
  refs["safe-area-toggle"].checked = state.showSafeArea;
  refs["scroll-toggle"].checked = state.syncScroll;
  refs["navigation-toggle"].checked = state.syncNavigation;
  refs["compatibility-toggle"].checked = state.compatibilityMode;
  refs["agent-control-toggle"].checked = state.agentControl;
  refs["view-switcher"].querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.view === state.viewMode));
  refs["top-view-switcher"]?.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.view === state.viewMode));
  refs["layout-switcher"].querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.layout === state.layout));
  if (refs["fit-button"]) {
    refs["fit-button"].textContent = state.viewMode === "fit" ? "Crisp" : "Fit";
    refs["fit-button"].title = state.viewMode === "fit" ? "Switch to 1:1 Crisp view" : "Scale devices to fit";
  }
  if (refs["sound-toggle-btn"]) {
    refs["sound-toggle-btn"].innerHTML = state.soundEnabled ? ICONS.volumeHigh : ICONS.volumeOff;
    refs["sound-toggle-btn"].title = state.soundEnabled ? "Mute UI sounds" : "Unmute UI sounds";
    refs["sound-toggle-btn"].setAttribute("aria-label", state.soundEnabled ? "Mute UI sounds" : "Unmute UI sounds");
  }
  if (refs["kofi-banner"]) {
    refs["kofi-banner"].hidden = Boolean(state.kofiDismissed);
  }
  updateBridgeStatus();
}

function renderDeviceList() {
  refs["device-list"].replaceChildren();
  state.devices.forEach(device => {
    const row = document.createElement("div");
    row.className = `device-list-item-v2${device.uid === state.selectedId ? " selected" : ""}`;
    row.dataset.deviceId = device.uid;
    row.title = `Select ${device.name}`;

    const icon = document.createElement("span");
    icon.className = `mini-device-icon${device.shell === "tablet" ? " tablet" : (device.width >= 1024 && device.width > device.height) ? " desktop" : ""}`;

    const copy = document.createElement("div");
    copy.className = "device-list-main";
    const strong = document.createElement("strong");
    strong.textContent = device.name;
    const dims = document.createElement("span");
    dims.textContent = `${device.width} × ${device.height} · DPR ${device.dpr}`;
    copy.append(strong, dims);

    const actions = document.createElement("div");
    actions.className = "device-quick-actions";
    const defs = [
      ["rotate", ICONS.rotate, "Rotate orientation · R"],
      ["duplicate", ICONS.duplicate, "Duplicate · Ctrl/Cmd+D"],
      ["remove", ICONS.close, "Remove device"]
    ];
    for (const [action, svg, title] of defs) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = action;
      button.innerHTML = svg;
      button.title = title;
      if (action === "duplicate" && state.devices.length >= MAX_DEVICES) button.disabled = true;
      button.addEventListener("click", event => {
        event.stopPropagation();
        if (action === "rotate") rotateDevice(device.uid);
        if (action === "duplicate") duplicateDevice(device.uid);
        if (action === "remove") removeDevice(device.uid);
      });
      actions.append(button);
    }

    row.append(icon, copy, actions);
    row.addEventListener("click", () => selectDevice(device.uid));
    refs["device-list"].append(row);
  });
}

function renderSelectedEditor() {
  const device = selectedDevice();
  refs["selected-editor"].hidden = !device;
  if (!device) return;
  refs["selected-preset-label"].textContent = `${device.name} · DPR ${device.dpr}`;
  refs["selected-preset"].value = PRESETS.some(p => p.id === device.presetId) ? device.presetId : "custom";
  refs["selected-width"].value = device.width;
  refs["selected-height"].value = device.height;
  refs["selected-shell"].value = device.shell;
  refs["selected-color"].value = device.color;
  refs["duplicate-selected"].disabled = state.devices.length >= MAX_DEVICES;
  refs["sweep-range"].value = clamp(device.width, 240, 1440);
  refs["sweep-output"].value = `${device.width} px`;
}

function renderSessions() {
  const previous = refs["session-select"].value;
  refs["session-select"].replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "Saved workspace…";
  refs["session-select"].append(first);
  for (const session of state.sessions) {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = session.name;
    refs["session-select"].append(option);
  }
  if (state.sessions.some(s => s.id === previous)) refs["session-select"].value = previous;
}

function shellMetrics(device) {
  if (!state.showFrames) return { left: 0, right: 0, top: 0, bottom: 0, radius: Math.max(8, Math.min(34, device.width * .07)) };
  if (device.shell === "tablet") return { left: 22, right: 22, top: 22, bottom: 22, radius: 30 };
  if (device.shell === "clean") return { left: 10, right: 10, top: 10, bottom: 10, radius: 34 };
  const isLandscape = device.width > device.height;
  if (isLandscape) return { left: 16, right: 12, top: 12, bottom: 12, radius: 42 };
  return { left: 12, right: 12, top: 12, bottom: 16, radius: 42 };
}

function currentWorkspaceSize() {
  if (state.workspaceResolution === "custom") return { width: state.workspaceWidth, height: state.workspaceHeight, label: `Custom · ${state.workspaceWidth}×${state.workspaceHeight}` };
  const preset = WORKSPACES[state.workspaceResolution];
  if (preset) return preset;
  const scroller = refs["workspace-scroller"];
  return {
    width: Math.max(520, (scroller?.clientWidth || 1200) - 2),
    height: Math.max(420, (scroller?.clientHeight || 800) - 2),
    label: "Auto · visible workspace"
  };
}

function packingScaleForColumns(sizes, columns, availableW, availableH, gap = 32) {
  if (!sizes.length || columns < 1) return 1;
  const rows = [];
  for (let i = 0; i < sizes.length; i += columns) rows.push(sizes.slice(i, i + columns));
  const maxRowWidth = Math.max(...rows.map(row => row.reduce((sum, item) => sum + item.w, 0)));
  const totalRowHeight = rows.reduce((sum, row) => sum + Math.max(...row.map(item => item.h)), 0);
  const horizontalGaps = Math.max(0, columns - 1) * gap;
  const verticalGaps = Math.max(0, rows.length - 1) * gap;
  return Math.min(
    1,
    Math.max(.01, (availableW - horizontalGaps) / Math.max(1, maxRowWidth)),
    Math.max(.01, (availableH - verticalGaps) / Math.max(1, totalRowHeight))
  );
}

function computeFitScale() {
  if (!state.devices.length) return 1;
  const workspace = currentWorkspaceSize();
  const availableW = Math.max(320, workspace.width - 68);
  const availableH = Math.max(300, workspace.height - 68);
  const visibleDevices = state.layout === "focus"
    ? state.devices.filter(device => device.uid === state.selectedId)
    : state.devices;
  const sizes = visibleDevices.map(device => {
    const m = shellMetrics(device);
    return { w: device.width + m.left + m.right, h: device.height + m.top + m.bottom + 58 };
  });
  if (!sizes.length) return 1;

  if (state.layout === "focus") {
    // Focus mode is a presentation/inspection view: the selected viewport
    // should use the available workspace even when its native CSS viewport is
    // physically smaller than the canvas (especially phones in landscape).
    // The iframe keeps its real CSS viewport dimensions; only the outer
    // device representation is scaled. This preserves responsive breakpoints.
    const focusFill = Math.min(
      availableW / Math.max(1, sizes[0].w),
      availableH / Math.max(1, sizes[0].h)
    );
    if (state.viewMode === "crisp") {
      // In Crisp mode, keep 1:1 true resolution for razor-sharp text unless device exceeds canvas
      return focusFill < 1 ? clamp(focusFill, .12, 1) : 1;
    }
    return clamp(focusFill, .12, 2.5);
  }
  if (state.layout === "row") {
    const rowWidth = sizes.reduce((sum, item) => sum + item.w, 0);
    const maxH = Math.max(...sizes.map(item => item.h));
    const gap = Math.max(0, sizes.length - 1) * 28;
    return clamp(Math.min(1, (availableW - gap) / Math.max(1, rowWidth), availableH / maxH), .12, 1);
  }
  if (state.layout === "free") {
    const maxW = Math.max(...sizes.map(item => item.w));
    const maxH = Math.max(...sizes.map(item => item.h));
    return clamp(Math.min(1, availableW / Math.max(maxW * 2.1, 900), availableH / Math.max(maxH * 1.35, 700)), .12, 1);
  }

  let best = .12;
  for (let columns = 1; columns <= sizes.length; columns += 1) {
    best = Math.max(best, packingScaleForColumns(sizes, columns, availableW, availableH, 32));
  }
  return clamp(best, .12, 1);
}

function effectiveScale() {
  fitScale = computeFitScale();
  // Snap very close fits to 1.0 to prevent fractional bilinear downsampling/upsampling blur
  if (Math.abs(fitScale - 1) < 0.04) fitScale = 1;
  // The workspace itself never scrolls. In Focus, 100% means "fill the
  // available inspection area" rather than "show one CSS pixel as one
  // workspace pixel". This is important for small/landscape phones: their
  // responsive viewport remains unchanged while the visual shell can enlarge.
  const requested = clamp(state.workspaceZoom, .5, 1.5);
  if (state.layout === "focus") return Math.min(fitScale, fitScale * requested);
  if (state.viewMode === "crisp") {
    // Crisp mode is intended as a true 1:1 viewport view; when requested zoom is 100%
    // and devices comfortably fit within available canvas padding (fitScale >= 0.88), preserve 1:1.
    if (Math.abs(requested - 1) < 0.01 && fitScale >= 0.88) return 1;
    return Math.min(requested, fitScale);
  }
  return state.viewMode === "fit" ? fitScale : Math.min(requested, fitScale);
}

function computeCanvasFit(workspace) {
  const scroller = refs["workspace-scroller"];
  const availableW = Math.max(1, scroller?.clientWidth || workspace.width);
  const availableH = Math.max(1, scroller?.clientHeight || workspace.height);
  if (state.workspaceResolution === "auto") return { scale: 1, left: 0, top: 0, availableW, availableH };
  const gutter = 14;
  const scale = Math.min(
    1,
    Math.max(.05, (availableW - gutter * 2) / workspace.width),
    Math.max(.05, (availableH - gutter * 2) / workspace.height)
  );
  const renderedW = workspace.width * scale;
  const renderedH = workspace.height * scale;
  return {
    scale,
    left: Math.max(0, Math.round((availableW - renderedW) / 2)),
    top: Math.max(0, Math.round((availableH - renderedH) / 2)),
    availableW,
    availableH
  };
}

function createView(device) {
  const stage = document.createElement("section");
  stage.className = "device-stage";
  stage.dataset.deviceId = device.uid;

  const assembly = document.createElement("div");
  assembly.className = "device-assembly";
  const cardbar = document.createElement("div");
  cardbar.className = "device-cardbar";
  const title = document.createElement("button");
  title.type = "button";
  title.className = "device-cardbar-btn device-select-button device-title";
  title.innerHTML = `${ICONS.select}<strong class="sr-only"></strong><span class="sr-only"></span>`;
  title.title = `Select ${device.name} (${device.width}×${device.height}) · Click to select, drag to move`;
  title.addEventListener("click", () => selectDevice(device.uid));

  const focusBtn = document.createElement("button");
  focusBtn.type = "button";
  focusBtn.className = "device-cardbar-btn device-focus-button";
  focusBtn.title = "Focus this device · 3";
  focusBtn.innerHTML = ICONS.focus;
  focusBtn.addEventListener("click", event => { event.stopPropagation(); toggleDeviceFocus(device.uid); });

  const rotate = document.createElement("button");
  rotate.type = "button";
  rotate.className = "device-cardbar-btn device-rotate-button";
  rotate.title = "Rotate orientation (Portrait / Landscape) · R";
  rotate.innerHTML = ICONS.rotate;
  rotate.addEventListener("click", event => { event.stopPropagation(); rotateDevice(device.uid); });

  const snap = document.createElement("button");
  snap.type = "button";
  snap.className = "device-cardbar-btn device-snap-button";
  snap.title = "Screenshot this device (PNG)";
  snap.innerHTML = ICONS.camera;
  snap.addEventListener("click", event => { event.stopPropagation(); soundFX.play("click"); captureAndDownload("device", device.uid); });

  const reload = document.createElement("button");
  reload.type = "button";
  reload.className = "device-cardbar-btn device-reload-button";
  reload.title = "Reload this preview";
  reload.innerHTML = ICONS.reload;
  reload.addEventListener("click", event => { event.stopPropagation(); soundFX.play("click"); reloadDevice(device.uid); });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "device-cardbar-btn device-remove-button";
  remove.title = "Remove this device";
  remove.innerHTML = ICONS.close;
  remove.addEventListener("click", event => { event.stopPropagation(); removeDevice(device.uid); });

  cardbar.append(title, focusBtn, rotate, snap, reload, remove);

  const shell = document.createElement("div");
  shell.className = "device-shell";
  const screen = document.createElement("div");
  screen.className = "device-screen";
  const placeholder = document.createElement("div");
  placeholder.className = "screen-placeholder";
  placeholder.innerHTML = '<div class="screen-placeholder-inner"><div class="screen-placeholder-icon"></div><span>Live website canvas</span></div>';
  screen.append(placeholder);
  const previewStatus = document.createElement("div");
  previewStatus.className = "preview-status";
  previewStatus.innerHTML = `
    <div class="preview-status-card">
      <strong>Preview unavailable</strong>
      <span>This site did not answer inside the device frame. Compatibility mode can fix most frame-blocking headers.</span>
      <div class="preview-status-actions">
        <button type="button" data-preview-action="retry">Retry compatibility</button>
        <button type="button" data-preview-action="open">Open in tab</button>
      </div>
    </div>`;
  previewStatus.addEventListener("click", event => {
    const button = event.target.closest("button[data-preview-action]");
    if (!button) return;
    if (button.dataset.previewAction === "retry") retryPreview(device.uid);
    if (button.dataset.previewAction === "open" && state.url) chrome.tabs.create({ url: state.url });
  });
  screen.append(previewStatus);

  const decorations = document.createElement("div");
  decorations.className = "device-decorations";
  shell.append(screen, decorations);
  assembly.append(cardbar, shell);
  stage.append(assembly);

  stage.addEventListener("pointerdown", event => {
    if (event.target.closest("button, iframe, input, select")) return;
    selectDevice(device.uid);
  });
  attachFreeDrag(stage, title, device.uid);

  const view = {
    stage, assembly, cardbar, title, focusBtn, rotate, snap, reload, remove, shell, screen, placeholder, previewStatus, decorations,
    iframe: null, currentRequestedUrl: "", ready: false, readyUrl: "", healthTimer: 0
  };
  views.set(device.uid, view);
  return view;
}

function clearPreviewHealth(view) {
  clearTimeout(view.healthTimer);
  view.healthTimer = 0;
}

function setPreviewStatus(view, visible, message = "") {
  if (!view?.previewStatus) return;
  const copy = view.previewStatus.querySelector(".preview-status-card span");
  if (message && copy) copy.textContent = message;
  view.previewStatus.classList.toggle("visible", Boolean(visible));
}

function schedulePreviewHealthCheck(view, device) {
  clearPreviewHealth(view);
  if (!state.url || !view.iframe) return;
  view.healthTimer = setTimeout(() => {
    if (view.ready || !view.iframe || view.currentRequestedUrl !== state.url) return;
    setPreviewStatus(view, true,
      `“${device.name}” could not confirm a live preview. The site may block embedding or still be loading. Retry compatibility without changing the other devices.`);
  }, PREVIEW_HEALTH_TIMEOUT);
}

async function retryPreview(deviceId) {
  const device = findDevice(deviceId);
  const view = views.get(deviceId);
  if (!device || !view?.iframe || !state.url) return false;
  state.compatibilityMode = true;
  refs["compatibility-toggle"].checked = true;
  persistSetting("compatibilityMode", true);
  await chrome.runtime.sendMessage({ channel: "VIEWPORT_LAB_APP", type: "SET_COMPATIBILITY_FOR_APP_TAB", enabled: true }).catch(() => null);
  view.ready = false;
  view.readyUrl = "";
  setPreviewStatus(view, false);
  // This is an explicit recovery action, so a reload is warranted here.
  view.iframe.src = state.url;
  view.currentRequestedUrl = state.url;
  schedulePreviewHealthCheck(view, device);
  return true;
}

function ensureIframe(view, device) {
  if (!state.url) {
    clearPreviewHealth(view);
    setPreviewStatus(view, false);
    if (view.iframe) {
      view.iframe.remove();
      view.iframe = null;
      view.currentRequestedUrl = "";
      view.ready = false;
      view.readyUrl = "";
    }
    view.stage.classList.remove("loaded");
    if (!view.placeholder.isConnected) view.screen.prepend(view.placeholder);
    return;
  }

  if (view.placeholder.isConnected) view.placeholder.remove();

  if (!view.iframe) {
    const iframe = document.createElement("iframe");
    iframe.name = `viewport-lab:${SESSION_ID}:${device.uid}`;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "clipboard-read; clipboard-write; fullscreen; geolocation 'none'; camera 'none'; microphone 'none'";
    iframe.addEventListener("load", () => {
      view.stage.classList.add("loaded");
      schedulePreviewHealthCheck(view, device);
    });
    // Keep the status overlay above the iframe without recreating either node.
    view.screen.insertBefore(iframe, view.previewStatus);
    view.iframe = iframe;
    view.ready = false;
    view.readyUrl = "";
    iframe.src = state.url;
    view.currentRequestedUrl = state.url;
    schedulePreviewHealthCheck(view, device);
  }
}

function updateDecorations(view, device, metrics, shellWidth, shellHeight) {
  view.decorations.replaceChildren();
  if (!state.showFrames && !state.showSafeArea) return;

  const isLandscape = device.width > device.height;

  if (state.showFrames) {
    const cutout = document.createElement("div");
    cutout.className = "device-cutout";

    if (isLandscape && device.shell !== "tablet") {
      // In landscape, phone front camera/notch is on the left edge (rotated 90deg)
      if (device.shell === "pill") {
        Object.assign(cutout.style, {
          width: "30px",
          height: "112px",
          borderRadius: "18px",
          left: `${Math.round(Math.max(4, metrics.left - 4))}px`,
          top: `${Math.round((shellHeight - 112) / 2)}px`
        });
      } else if (device.shell === "notch") {
        Object.assign(cutout.style, {
          width: "27px",
          height: "132px",
          borderRadius: "0 16px 16px 0",
          left: `${Math.round(metrics.left)}px`,
          top: `${Math.round((shellHeight - 132) / 2)}px`
        });
      } else if (device.shell === "punch") {
        Object.assign(cutout.style, {
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          left: `${Math.round(metrics.left + 8)}px`,
          top: `${Math.round((shellHeight - 14) / 2)}px`
        });
      } else {
        Object.assign(cutout.style, {
          width: "4px",
          height: "44px",
          borderRadius: "4px",
          left: "5px",
          top: `${Math.round((shellHeight - 44) / 2)}px`,
          background: "rgba(3,4,7,.86)"
        });
      }

      // Hardware side buttons rotate to top and bottom edges in landscape
      const sideA = document.createElement("i");
      sideA.className = "device-side-button";
      Object.assign(sideA.style, {
        height: "3px",
        width: "54px",
        top: "-3px",
        left: `${Math.round(Math.max(90, shellWidth * .2))}px`
      });
      const sideB = document.createElement("i");
      sideB.className = "device-side-button";
      Object.assign(sideB.style, {
        height: "3px",
        width: "36px",
        bottom: "-3px",
        left: `${Math.round(Math.max(74, shellWidth * .16))}px`
      });
      view.decorations.append(cutout, sideA, sideB);
    } else {
      // Portrait orientation or tablet
      if (device.shell === "pill") Object.assign(cutout.style, { width: "112px", height: "30px", borderRadius: "18px", left: `${Math.round((shellWidth - 112) / 2)}px`, top: `${Math.round(Math.max(4, metrics.top - 4))}px` });
      else if (device.shell === "notch") Object.assign(cutout.style, { width: "132px", height: "27px", borderRadius: "0 0 16px 16px", left: `${Math.round((shellWidth - 132) / 2)}px`, top: `${Math.round(metrics.top)}px` });
      else if (device.shell === "punch") Object.assign(cutout.style, { width: "14px", height: "14px", borderRadius: "50%", left: `${Math.round((shellWidth - 14) / 2)}px`, top: `${Math.round(metrics.top + 8)}px` });
      else if (device.shell === "tablet") Object.assign(cutout.style, { width: "8px", height: "8px", borderRadius: "50%", left: `${Math.round((shellWidth - 8) / 2)}px`, top: "7px", background: "#0b0d13" });
      else Object.assign(cutout.style, { width: "44px", height: "4px", borderRadius: "4px", left: `${Math.round((shellWidth - 44) / 2)}px`, top: "5px", background: "rgba(3,4,7,.86)" });

      const sideA = document.createElement("i");
      sideA.className = "device-side-button";
      Object.assign(sideA.style, { width: "3px", height: "54px", right: "-3px", top: `${Math.round(Math.max(90, shellHeight * .2))}px` });
      const sideB = document.createElement("i");
      sideB.className = "device-side-button";
      Object.assign(sideB.style, { width: "3px", height: "36px", left: "-3px", top: `${Math.round(Math.max(74, shellHeight * .16))}px` });
      view.decorations.append(cutout, sideA, sideB);
    }

    if (device.shell !== "tablet" && device.shell !== "clean") {
      const home = document.createElement("div");
      home.className = "device-home-indicator";
      view.decorations.append(home);
    }
  }

  if (state.showSafeArea) {
    const safe = document.createElement("div");
    safe.className = "safe-area";
    if (isLandscape && device.shell !== "tablet") {
      const insetLeft = device.shell === "pill" || device.shell === "notch" || device.shell === "punch" ? 44 : 16;
      const insetRight = 16;
      const insetBottom = 21;
      Object.assign(safe.style, {
        left: `${metrics.left + insetLeft}px`,
        top: `${metrics.top}px`,
        width: `${Math.max(20, device.width - insetLeft - insetRight)}px`,
        height: `${Math.max(20, device.height - insetBottom)}px`
      });
    } else {
      const insetTop = device.shell === "pill" || device.shell === "notch" || device.shell === "punch" ? 44 : 16;
      const insetBottom = device.shell === "tablet" ? 16 : 28;
      Object.assign(safe.style, {
        left: `${metrics.left + 12}px`,
        top: `${metrics.top + insetTop}px`,
        width: `${Math.max(20, device.width - 24)}px`,
        height: `${Math.max(20, device.height - insetTop - insetBottom)}px`
      });
    }
    view.decorations.append(safe);
  }
}

function patchView(device, index) {
  const view = views.get(device.uid) || createView(device);
  const metrics = shellMetrics(device);
  const shellWidth = device.width + metrics.left + metrics.right;
  const shellHeight = device.height + metrics.top + metrics.bottom;
  const scale = effectiveScale();
  // Quantize scale cleanly to prevent fractional subpixel blur on text and borders
  let cleanScale = Math.round(scale * 100) / 100;
  if (Math.abs(cleanScale - 1) < 0.035) {
    cleanScale = 1;
  } else if (cleanScale > 1) {
    // Snap upscale to nearest 0.05 step so glyph rasterization aligns to simple pixel ratios
    cleanScale = Math.round(cleanScale * 20) / 20;
  }

  const cardbarHeadroom = 58;
  view.stage.classList.toggle("selected", device.uid === state.selectedId);
  view.stage.classList.toggle("focus-hidden", state.layout === "focus" && device.uid !== state.selectedId);
  view.stage.style.width = `${Math.round(shellWidth * cleanScale)}px`;
  view.stage.style.height = `${Math.round((shellHeight + cardbarHeadroom) * cleanScale)}px`;

  if (state.layout === "free") {
    const pos = state.freePositions[device.uid] || { x: 72 + (index % 3) * 460, y: 84 + Math.floor(index / 3) * 580 };
    state.freePositions[device.uid] = pos;
    view.stage.style.left = `${Math.round(pos.x)}px`;
    view.stage.style.top = `${Math.round(pos.y)}px`;
  } else {
    view.stage.style.left = "";
    view.stage.style.top = "";
  }

  view.assembly.style.width = `${shellWidth}px`;
  view.assembly.style.height = `${shellHeight}px`;
  view.assembly.style.transform = cleanScale === 1 ? "none" : `scale(${cleanScale})`;
  view.assembly.style.top = `${Math.round(cardbarHeadroom * cleanScale)}px`;
  const strongEl = view.title.querySelector("strong");
  if (strongEl) strongEl.textContent = device.name;
  const spanEl = view.title.querySelector("span");
  if (spanEl) spanEl.textContent = `${device.width}×${device.height}`;
  view.title.title = `Select ${device.name} (${device.width}×${device.height}) · Click to select, drag to move`;
  const isSelected = device.uid === state.selectedId;
  view.title.classList.toggle("active", isSelected);
  const isFocused = state.layout === "focus" && isSelected;
  if (view.focusBtn) {
    view.focusBtn.classList.toggle("active", isFocused);
    view.focusBtn.title = isFocused ? "Exit focus mode · 1" : "Focus this device · 3";
    view.focusBtn.innerHTML = isFocused ? ICONS.unfocus : ICONS.focus;
  }

  const cardbarBoost = cleanScale < 0.88 ? Math.min(1.35, 1 / Math.sqrt(cleanScale)) : 1;
  if (view.cardbar) {
    view.cardbar.style.transform = cardbarBoost === 1 ? "none" : `scale(${Math.round(cardbarBoost * 100) / 100})`;
    view.cardbar.style.transformOrigin = "left bottom";
  }

  view.shell.className = `device-shell ${device.color}${state.showFrames ? "" : " no-frame"}`;
  view.shell.style.width = `${shellWidth}px`;
  view.shell.style.height = `${shellHeight}px`;
  view.shell.style.borderRadius = `${Math.max(metrics.radius + 5, 12)}px`;

  // Align screen coordinates under scale so the iframe lands on exact physical integer pixels
  const screenLeft = cleanScale > 0 && metrics.left ? Math.round(metrics.left * cleanScale) / cleanScale : metrics.left;
  const screenTop = cleanScale > 0 && metrics.top ? Math.round(metrics.top * cleanScale) / cleanScale : metrics.top;
  view.screen.style.left = `${screenLeft}px`;
  view.screen.style.top = `${screenTop}px`;
  view.screen.style.width = `${device.width}px`;
  view.screen.style.height = `${device.height}px`;
  view.screen.style.borderRadius = `${metrics.radius}px`;
  updateDecorations(view, device, metrics, shellWidth, shellHeight);
  ensureIframe(view, device);
  return view;
}

function scheduleGeometrySync() {
  cancelAnimationFrame(geometryFrame);
  geometryFrame = requestAnimationFrame(() => {
    geometryFrame = 0;
    syncBoard();
    updateWorkspaceStatus();
  });
}

function syncBoard() {
  const board = refs["device-board"];
  board.className = `device-board ${state.layout}`;
  const workspace = currentWorkspaceSize();
  const canvas = computeCanvasFit(workspace);
  canvasFitScale = canvas.scale;
  board.classList.toggle("resolution-canvas", state.workspaceResolution !== "auto");
  board.style.width = `${workspace.width}px`;
  board.style.minWidth = "0px";
  board.style.height = `${workspace.height}px`;
  board.style.minHeight = "0px";
  board.style.left = `${canvas.left}px`;
  board.style.top = `${canvas.top}px`;
  board.style.transform = `scale(${canvas.scale})`;
  board.dataset.canvasLabel = workspace.label;
  // The workspace is a contained viewport. It never scrolls, so geometry changes
  // only alter CSS around persistent preview frames.

  for (const [deviceId, view] of [...views]) {
    if (!state.devices.some(d => d.uid === deviceId)) {
      view.stage.remove();
      views.delete(deviceId);
    }
  }

  const oldEmpty = board.querySelector(".empty-state");
  if (oldEmpty) oldEmpty.remove();
  if (!state.devices.length) {
    board.append(refs["empty-template"].content.cloneNode(true));
    return;
  }

  state.devices.forEach((device, index) => {
    const existed = views.has(device.uid);
    const view = patchView(device, index);
    view.stage.style.order = String(index);
    // Moving an iframe's ancestor in the DOM can reload its browsing context.
    // Only attach brand-new device stages; existing stages stay exactly where
    // they are while CSS changes resize/rotate/rearrange them.
    if (!existed || view.stage.parentElement !== board) board.append(view.stage);
  });
  updateClarityBadge();
}

function updateWorkspaceStatus() {
  const workspace = currentWorkspaceSize();
  refs["workspace-title"].textContent = state.url ? "Live responsive canvas" : "Responsive workspace";
  refs["workspace-status"].textContent = state.url
    ? `${state.url} · ${state.devices.length} viewport${state.devices.length === 1 ? "" : "s"} · changes do not reload previews`
    : "Open a website to start previewing.";
  refs["resolution-badge"].textContent = workspace.label;
  updateClarityBadge();
}

function updateClarityBadge() {
  const deviceVisual = Math.round(effectiveScale() * 100);
  const canvasVisual = Math.round(canvasFitScale * 100);
  refs["clarity-badge"].textContent = state.viewMode === "crisp"
    ? `Crisp ${deviceVisual}% · Canvas ${canvasVisual}%`
    : `Fit ${deviceVisual}% · Canvas ${canvasVisual}%`;
}

function renderBreakpointRuler() {
  const min = 240;
  const max = 1440;
  const detected = new Set(state.detectedBreakpoints);
  const values = [...new Set([...COMMON_WIDTHS, ...state.detectedBreakpoints])].filter(v => v >= min && v <= max).sort((a, b) => a - b);
  refs["breakpoint-ruler"].replaceChildren();
  const track = document.createElement("div");
  track.className = "ruler-track";
  for (const value of values) {
    const mark = document.createElement("span");
    mark.className = `ruler-mark${detected.has(value) ? " detected" : ""}`;
    mark.style.left = `${((value - min) / (max - min)) * 100}%`;
    mark.textContent = value;
    mark.title = detected.has(value) ? `CSS breakpoint at ${value}px · Click to apply` : `${value}px reference · Click to apply`;
    mark.addEventListener("click", () => {
      const device = selectedDevice();
      if (!device) return;
      device.width = value;
      device.presetId = "custom";
      if (refs["sweep-range"]) refs["sweep-range"].value = clamp(value, 240, 1440);
      if (refs["sweep-output"]) refs["sweep-output"].value = `${value} px`;
      if (refs["selected-width"]) refs["selected-width"].value = value;
      persistDevices();
      renderDeviceList();
      renderSelectedEditor();
      syncBoard();
      showToast(`Viewport set to ${value}px`);
    });
    track.append(mark);
  }
  refs["breakpoint-ruler"].append(track);
}

function renderIssues() {
  const issues = state.issues;
  refs["issue-count"].textContent = issues.length;
  const highs = issues.filter(i => i.severity === "high").length;
  const mediums = issues.filter(i => i.severity === "medium").length;
  refs["issues-summary"].textContent = issues.length ? `${issues.length} findings · ${highs} high · ${mediums} medium` : "No responsive problems found in the last check.";
  refs["issues-list"].replaceChildren();
  refs["inspect-output"].hidden = true;
  if (!issues.length) {
    const empty = document.createElement("div");
    empty.className = "issues-empty";
    empty.textContent = "Run checks to inspect the active viewports.";
    refs["issues-list"].append(empty);
    return;
  }
  for (const issue of issues) {
    const item = document.createElement("div");
    item.className = "issue-item";
    const severity = document.createElement("span");
    severity.className = `issue-severity ${issue.severity || "low"}`;
    severity.textContent = issue.severity || "info";
    const copy = document.createElement("div");
    copy.className = "issue-copy";
    const strong = document.createElement("strong");
    strong.textContent = issue.title || issue.code || "Issue";
    const detail = document.createElement("span");
    detail.textContent = [issue.detail, issue.selector].filter(Boolean).join(" · ");
    copy.append(strong, detail);
    const meta = document.createElement("span");
    meta.className = "issue-meta";
    const device = findDevice(issue.deviceId);
    meta.textContent = issue.scanWidth ? `${issue.scanWidth}px` : device ? `${device.width}px` : "";
    item.append(severity, copy, meta);
    item.addEventListener("click", () => focusIssue(issue));
    refs["issues-list"].append(item);
  }
}

function renderAll() {
  syncControls();
  renderDeviceList();
  renderSelectedEditor();
  renderSessions();
  syncBoard();
  renderBreakpointRuler();
  renderIssues();
  updateWorkspaceStatus();
}

function selectDevice(deviceId) {
  if (!state.devices.some(d => d.uid === deviceId)) return;
  if (state.selectedId !== deviceId) {
    soundFX.play("select");
  }
  state.selectedId = deviceId;
  renderDeviceList();
  renderSelectedEditor();
  for (const [id, view] of views) {
    const isSelected = id === deviceId;
    view.stage.classList.toggle("selected", isSelected);
    if (view.title) view.title.classList.toggle("active", isSelected);
    view.stage.classList.toggle("focus-hidden", state.layout === "focus" && id !== deviceId);
  }
}

function toggleDeviceFocus(deviceId) {
  const device = findDevice(deviceId);
  if (!device) return;
  soundFX.play("layout");
  if (state.layout === "focus" && state.selectedId === deviceId) {
    state.layout = state.previousLayout || "grid";
    persistSetting("layout", state.layout);
    syncControls();
    syncBoard();
    showToast("Restored multi-device view");
  } else {
    state.previousLayout = state.layout === "focus" ? "grid" : state.layout;
    state.selectedId = deviceId;
    state.layout = "focus";
    persistSetting("layout", "focus");
    renderDeviceList();
    renderSelectedEditor();
    syncControls();
    syncBoard();
    showToast(`Focused on ${device.name}`);
  }
}

function addPresetDevice(preset) {
  if (!preset) return null;
  if (state.devices.length >= MAX_DEVICES) {
    showToast("⚠️ Maximum 5 simultaneous devices reached", "warning");
    return null;
  }
  soundFX.play("click");
  const device = createDeviceFromPreset(preset);
  state.devices.push(device);
  state.selectedId = device.uid;
  persistDevices();
  refs["device-dialog"].close();
  renderAll();
  showToast(`Added ${device.name}`);
  return device;
}

function addCustomDevice(width = null, height = null, name = "Custom viewport") {
  if (state.devices.length >= MAX_DEVICES) {
    showToast("⚠️ Maximum 5 simultaneous devices reached", "warning");
    return null;
  }
  soundFX.play("click");
  const w = clamp(Number(width ?? refs["custom-width"].value) || 390, 240, 1800);
  const h = clamp(Number(height ?? refs["custom-height"].value) || 844, 320, 2200);
  const device = { uid: uid(), presetId: "custom", name, width: w, height: h, dpr: 1, shell: w > 650 ? "tablet" : "clean", color: "graphite" };
  state.devices.push(device);
  state.selectedId = device.uid;
  persistDevices();
  if (refs["device-dialog"].open) refs["device-dialog"].close();
  renderAll();
  showToast(`Added ${device.name}`);
  return device;
}

function removeDevice(deviceId) {
  const index = state.devices.findIndex(d => d.uid === deviceId);
  if (index < 0) return false;
  soundFX.play("delete");
  const removed = state.devices[index];
  state.devices.splice(index, 1);
  delete state.freePositions[deviceId];
  const view = views.get(deviceId);
  if (view) view.stage.remove();
  views.delete(deviceId);
  if (state.selectedId === deviceId) state.selectedId = state.devices[Math.min(index, state.devices.length - 1)]?.uid || null;
  persistDevices();
  renderAll();
  showToast(`Removed ${removed?.name || "device"}`);
  return true;
}

function duplicateDevice(deviceId) {
  const device = findDevice(deviceId);
  if (!device) return null;
  if (state.devices.length >= MAX_DEVICES) {
    showToast("⚠️ Maximum 5 simultaneous devices reached", "warning");
    return null;
  }
  soundFX.play("click");
  const duplicate = { ...device, uid: uid(), name: `${device.name} copy` };
  state.devices.push(duplicate);
  state.selectedId = duplicate.uid;
  persistDevices();
  renderAll();
  showToast(`Duplicated ${device.name}`);
  return duplicate;
}

function rotateDevice(deviceId) {
  const device = findDevice(deviceId);
  if (!device) return false;
  soundFX.play("rotate");
  [device.width, device.height] = [device.height, device.width];
  device.presetId = "custom";
  persistDevices();
  renderDeviceList();
  renderSelectedEditor();
  syncBoard();
  return true;
}

function applyPresetToSelected(presetId) {
  if (presetId === "custom") return;
  const device = selectedDevice();
  const preset = PRESETS.find(p => p.id === presetId);
  if (!device || !preset) return;
  Object.assign(device, { presetId: preset.id, name: preset.name, width: preset.width, height: preset.height, dpr: preset.dpr, shell: preset.shell, color: preset.color });
  persistDevices();
  renderDeviceList();
  renderSelectedEditor();
  syncBoard();
}

function applySelectedEditor() {
  const device = selectedDevice();
  if (!device) return;
  device.width = clamp(parseInt(refs["selected-width"].value, 10) || device.width, 240, 1800);
  device.height = clamp(parseInt(refs["selected-height"].value, 10) || device.height, 320, 2200);
  device.shell = refs["selected-shell"].value;
  device.color = refs["selected-color"].value;
  device.presetId = "custom";
  if (!device.name || PRESETS.some(p => p.name === device.name)) device.name = "Custom viewport";
  persistDevices();
  renderDeviceList();
  renderSelectedEditor();
  syncBoard();
}

function navigateAll(url) {
  state.url = url;
  persistCurrentUrl(url);
  addRecentUrl(url);
  refs["url-input"].value = url;
  for (const device of state.devices) {
    const view = views.get(device.uid) || patchView(device, state.devices.indexOf(device));
    ensureIframe(view, device);
    // Newly created frames are already pointed at state.url by ensureIframe.
    // Only navigate existing frames when the requested URL actually changed.
    if (view.iframe && view.currentRequestedUrl !== url) {
      view.stage.classList.remove("loaded");
      view.ready = false;
      view.readyUrl = "";
      setPreviewStatus(view, false);
      view.iframe.src = url;
      view.currentRequestedUrl = url;
      schedulePreviewHealthCheck(view, device);
    }
  }
  updateWorkspaceStatus();
}

function loadUrl(raw) {
  const normalized = normalizeUrl(raw);
  if (!normalized) {
    state.url = "";
    persistCurrentUrl("");
    for (const device of state.devices) patchView(device, state.devices.indexOf(device));
    updateWorkspaceStatus();
    return { ok: true, url: "" };
  }
  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("Unsupported protocol");
  } catch {
    refs["workspace-status"].textContent = "Enter a valid HTTP or HTTPS address.";
    refs["url-input"].focus();
    return { ok: false, error: "Invalid HTTP/HTTPS URL." };
  }
  navigateAll(normalized);
  return { ok: true, url: normalized };
}

function broadcast(payload) {
  return chrome.runtime.sendMessage({ channel: "VIEWPORT_LAB_APP", type: "BROADCAST_TO_PREVIEWS", payload: { sessionId: SESSION_ID, ...payload } }).catch(() => {});
}

function requestFrame(deviceId, type, payload = {}, timeout = 7000) {
  const device = findDevice(deviceId);
  if (!device) return Promise.reject(new Error("Device not found."));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingFrameRequests.delete(requestId);
      reject(new Error(`Preview did not answer ${type}. The page may still be loading.`));
    }, timeout);
    pendingFrameRequests.set(requestId, { resolve, reject, timer });
    broadcast({ type, requestId, targetDeviceId: device.uid, sourceDeviceId: "app", ...payload });
  });
}

function handleFrameMessage(message) {
  if (!message || message.channel !== "VIEWPORT_LAB_FRAME" || message.sessionId !== SESSION_ID) return;
  if (message.type === "COMMAND_RESULT" && message.requestId) {
    const pending = pendingFrameRequests.get(message.requestId);
    if (pending) {
      clearTimeout(pending.timer);
      pendingFrameRequests.delete(message.requestId);
      if (message.error) pending.reject(new Error(message.error)); else pending.resolve(message.result);
    }
    return;
  }
  if (!state.devices.some(d => d.uid === message.deviceId)) return;
  if (message.type === "FRAME_READY") {
    const view = views.get(message.deviceId);
    if (view) {
      view.ready = true;
      view.readyUrl = message.url || "";
      clearPreviewHealth(view);
      setPreviewStatus(view, false);
      view.stage.classList.add("loaded");
    }
    return;
  }
  if (message.type === "SCROLL_CHANGED" && state.syncScroll) {
    broadcast({ type: "SET_SCROLL", sourceDeviceId: message.deviceId, targetDeviceId: "*", x: message.x, y: message.y });
  }
  if (message.type === "URL_CHANGED" && state.syncNavigation && /^https?:\/\//i.test(message.url || "")) {
    const now = Date.now();
    const duplicate = lastNavigationBroadcast.url === message.url && now - lastNavigationBroadcast.at < 900;
    if (!duplicate) {
      lastNavigationBroadcast = { url: message.url, source: message.deviceId, at: now };
      state.url = message.url;
      persistCurrentUrl(message.url);
      refs["url-input"].value = message.url;
      updateWorkspaceStatus();
      broadcast({ type: "NAVIGATE", sourceDeviceId: message.deviceId, targetDeviceId: "*", url: message.url });
    }
  }
}

function reloadDevice(deviceId) {
  broadcast({ type: "RELOAD", targetDeviceId: deviceId, sourceDeviceId: "app" });
}

function reloadAll() {
  broadcast({ type: "RELOAD", sourceDeviceId: "app", targetDeviceId: "*" });
}

async function runChecks({ all = true, deviceId = null, openPanel = true } = {}) {
  soundFX.play("qa");
  const targets = all ? [...state.devices] : [findDevice(deviceId)].filter(Boolean);
  if (!targets.length || !state.url) return { ok: false, error: "Open a website and add at least one device first." };
  const collected = [];
  const breakpoints = new Set(state.detectedBreakpoints);
  for (const device of targets) {
    try {
      const snapshot = await requestFrame(device.uid, "RUN_CHECKS", {}, 9000);
      for (const bp of snapshot.breakpoints || []) breakpoints.add(bp);
      for (const issue of snapshot.issues || []) collected.push({ ...issue, deviceId: device.uid });
    } catch (error) {
      collected.push({ severity: "low", code: "frame-unavailable", title: `${device.name} could not be inspected`, detail: error.message, deviceId: device.uid });
    }
  }
  state.detectedBreakpoints = [...breakpoints].sort((a, b) => a - b);
  state.issues = collected;
  renderBreakpointRuler();
  renderIssues();
  if (openPanel) refs["issues-panel"].hidden = false;
  return { ok: true, issues: collected, breakpoints: state.detectedBreakpoints };
}

async function inspectPage(deviceId = null, { showOutput = true } = {}) {
  const device = findDevice(deviceId);
  if (!device) return { ok: false, error: "Device not found." };
  try {
    const snapshot = await requestFrame(device.uid, "INSPECT_PAGE", { includeIssues: true }, 9000);
    state.detectedBreakpoints = [...new Set([...(state.detectedBreakpoints || []), ...(snapshot.breakpoints || [])])].sort((a, b) => a - b);
    renderBreakpointRuler();
    if (showOutput) {
      refs["issues-panel"].hidden = false;
      refs["issues-list"].replaceChildren();
      refs["inspect-output"].hidden = false;
      refs["inspect-output"].textContent = JSON.stringify(snapshot, null, 2);
      refs["issues-summary"].textContent = `${device.name} page snapshot`;
    }
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function inspectElement(deviceId, selector) {
  const device = findDevice(deviceId);
  if (!device) return { ok: false, error: "Device not found." };
  try {
    const result = await requestFrame(device.uid, "INSPECT_ELEMENT", { selector }, 7000);
    return result;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function focusIssue(issue) {
  const device = findDevice(issue.deviceId);
  if (!device) return;
  selectDevice(device.uid);
  const view = views.get(device.uid);
  if (view) {
    view.stage.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    const pulse = document.createElement("div");
    pulse.className = "issue-highlight";
    view.screen.append(pulse);
    setTimeout(() => pulse.remove(), 2200);
  }
  if (issue.selector) broadcast({ type: "HIGHLIGHT_SELECTOR", requestId: crypto.randomUUID(), selector: issue.selector, targetDeviceId: device.uid, sourceDeviceId: "app" });
}

async function runCommonSweep(deviceId = null) {
  const device = findDevice(deviceId);
  if (!device || !state.url) return { ok: false, error: "Select a device and open a website first." };
  const originalWidth = device.width;
  const results = [];
  const breakpoints = new Set(state.detectedBreakpoints);
  refs["workspace-status"].textContent = `Scanning ${device.name} across common responsive widths…`;
  for (const width of COMMON_WIDTHS) {
    device.width = width;
    patchView(device, state.devices.indexOf(device));
    refs["sweep-range"].value = clamp(width, 240, 1440);
    refs["sweep-output"].value = `${width} px`;
    await sleep(180);
    try {
      const snapshot = await requestFrame(device.uid, "RUN_CHECKS", {}, 5500);
      for (const bp of snapshot.breakpoints || []) breakpoints.add(bp);
      const relevant = (snapshot.issues || []).filter(i => ["high", "medium"].includes(i.severity));
      results.push({ width, issueCount: relevant.length, high: relevant.filter(i => i.severity === "high").length, sample: relevant.slice(0, 4) });
    } catch (error) {
      results.push({ width, issueCount: -1, high: 0, error: error.message, sample: [] });
    }
  }
  device.width = originalWidth;
  patchView(device, state.devices.indexOf(device));
  renderSelectedEditor();
  state.detectedBreakpoints = [...breakpoints].sort((a, b) => a - b);
  state.sweepResults = results;
  state.issues = results.filter(r => r.issueCount !== 0).map(r => ({
    severity: r.issueCount < 0 ? "low" : r.high ? "high" : "medium",
    code: "sweep-result",
    title: r.issueCount < 0 ? `Could not inspect ${r.width}px` : `${r.issueCount} responsive issue${r.issueCount === 1 ? "" : "s"} at ${r.width}px`,
    detail: r.error || r.sample.map(i => i.title).join(" · "),
    deviceId: device.uid,
    scanWidth: r.width
  }));
  renderBreakpointRuler();
  renderIssues();
  refs["issues-panel"].hidden = false;
  updateWorkspaceStatus();
  return { ok: true, device: { id: device.uid, name: device.name }, results, breakpoints: state.detectedBreakpoints };
}

function attachFreeDrag(stage, handle, deviceId) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  handle.addEventListener("pointerdown", event => {
    if (state.layout !== "free" || event.button !== 0) return;
    dragging = true;
    handle.setPointerCapture(event.pointerId);
    const current = state.freePositions[deviceId] || { x: 0, y: 0 };
    startX = event.clientX;
    startY = event.clientY;
    originX = current.x;
    originY = current.y;
    stage.classList.add("dragging");
  });
  handle.addEventListener("pointermove", event => {
    if (!dragging) return;
    const pointerScale = Math.max(.05, canvasFitScale);
    const x = Math.max(0, originX + (event.clientX - startX) / pointerScale);
    const y = Math.max(0, originY + (event.clientY - startY) / pointerScale);
    state.freePositions[deviceId] = { x, y };
    stage.style.left = `${x}px`;
    stage.style.top = `${y}px`;
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    persistDevices();
  };
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);
}

function saveWorkspace() {
  const name = prompt("Workspace name", `Workspace ${state.sessions.length + 1}`)?.trim();
  if (!name) return;
  const session = {
    id: uid(),
    name,
    savedAt: new Date().toISOString(),
    url: state.url,
    devices: structuredClone(state.devices),
    freePositions: structuredClone(state.freePositions),
    layout: state.layout,
    viewMode: state.viewMode,
    workspaceZoom: state.workspaceZoom,
    workspaceResolution: state.workspaceResolution,
    workspaceWidth: state.workspaceWidth,
    workspaceHeight: state.workspaceHeight,
    showFrames: state.showFrames,
    showSafeArea: state.showSafeArea
  };
  state.sessions.push(session);
  chrome.storage.local.set({ viewportLabSessions: state.sessions });
  renderSessions();
  refs["session-select"].value = session.id;
  showToast(`💾 Workspace "${name}" saved!`);
}

function loadWorkspace(sessionId) {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;
  state.devices = structuredClone(session.devices || []).slice(0, MAX_DEVICES);
  state.freePositions = structuredClone(session.freePositions || {});
  state.selectedId = state.devices[0]?.uid || null;
  state.layout = session.layout || "grid";
  state.viewMode = session.viewMode || "crisp";
  state.workspaceZoom = session.workspaceZoom || 1;
  state.workspaceResolution = session.workspaceResolution || "auto";
  state.workspaceWidth = session.workspaceWidth || 2560;
  state.workspaceHeight = session.workspaceHeight || 1440;
  state.showFrames = session.showFrames !== false;
  state.showSafeArea = Boolean(session.showSafeArea);
  persistDevices();
  persistWorkspaceSettings();
  renderAll();
  if (session.url && session.url !== state.url) loadUrl(session.url);
  showToast(`Loaded workspace "${session.name}"`);
}

function deleteWorkspace() {
  const id = refs["session-select"].value;
  if (!id) return;
  const found = state.sessions.find(s => s.id === id);
  state.sessions = state.sessions.filter(s => s.id !== id);
  chrome.storage.local.set({ viewportLabSessions: state.sessions });
  renderSessions();
  showToast(`Removed workspace "${found?.name || "session"}"`);
}

function openDeviceDialog() {
  if (state.devices.length >= MAX_DEVICES) {
    refs["workspace-status"].textContent = "Viewport Lab supports up to 5 simultaneous devices.";
    showToast("⚠️ Maximum 5 simultaneous devices reached", "warning");
    return;
  }
  soundFX.play("dialogOpen");
  refs["device-dialog"].showModal();
}

function showTutorial(index = 0) {
  tutorialIndex = clamp(index, 0, TUTORIAL.length - 1);
  updateTutorial();
  soundFX.play("dialogOpen");
  if (!refs["tutorial-dialog"].open) refs["tutorial-dialog"].showModal();
}

function updateTutorial() {
  const step = TUTORIAL[tutorialIndex];
  refs["tutorial-progress-text"].textContent = `${tutorialIndex + 1} / ${TUTORIAL.length}`;
  refs["tutorial-progress-bar"].style.width = `${((tutorialIndex + 1) / TUTORIAL.length) * 100}%`;
  refs["tutorial-icon"].textContent = step.icon;
  refs["tutorial-title"].textContent = step.title;
  refs["tutorial-copy"].textContent = step.copy;
  refs["tutorial-next"].textContent = tutorialIndex === TUTORIAL.length - 1 ? "Start" : "Next";
}

function finishTutorial() {
  state.tutorialSeen = true;
  chrome.storage.local.set({ viewportLabTutorialSeen: true });
  soundFX.play("dialogClose");
  refs["tutorial-dialog"].close();
}

function handleWorkspacePan() {
  // v0.2.4: the canvas always fits inside the visible workspace, so there is
  // deliberately no workspace panning or scrolling. Ctrl/Cmd + wheel remains
  // a fast way to change the requested device zoom.
  refs["workspace-scroller"].addEventListener("wheel", event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    state.workspaceZoom = clamp(state.workspaceZoom + (event.deltaY > 0 ? -.05 : .05), .5, 1.5);
    persistSetting("workspaceZoom", state.workspaceZoom);
    syncControls();
    syncBoard();
  }, { passive: false });
}

function isTyping(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

function basicAgentState() {
  return {
    sessionId: SESSION_ID,
    url: state.agentControl ? state.url : "",
    selectedDeviceId: state.selectedId,
    agentControl: state.agentControl,
    deviceCount: state.devices.length,
    devices: state.agentControl ? state.devices.map((d, index) => ({ index, id: d.uid, name: d.name, presetId: d.presetId, width: d.width, height: d.height, dpr: d.dpr, shell: d.shell })) : [],
    workspace: { layout: state.layout, viewMode: state.viewMode, zoom: state.workspaceZoom, resolution: state.workspaceResolution }
  };
}

function updateBridgeStatus(status = null) {
  const el = refs["bridge-status"];
  if (!el) return;
  el.className = "status-pill";
  if (bridgeConnected) {
    el.classList.add("connected");
    el.textContent = state.agentControl ? "Connected" : "Ready";
  } else if (status === "waiting") {
    el.classList.add("waiting");
    el.textContent = "Waiting";
  } else {
    el.classList.add("offline");
    el.textContent = "Offline";
  }
}

async function bridgeFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 1300);
  try {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const { timeout: _timeout, ...fetchOptions } = options;
    const response = await fetch(`${BRIDGE_BASE}${path}`, { ...fetchOptions, signal: controller.signal, headers });
    if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function pollBridge() {
  if (bridgePollBusy) return;
  bridgePollBusy = true;
  try {
    await bridgeFetch("/bridge/heartbeat", { method: "POST", body: JSON.stringify({ sessionId: SESSION_ID, state: basicAgentState() }) });
    bridgeConnected = true;
    updateBridgeStatus();
    const next = await bridgeFetch(`/bridge/next?sessionId=${encodeURIComponent(SESSION_ID)}`, { method: "GET" });
    if (next?.command) {
      const { id, method, params } = next.command;
      let result;
      let error = "";
      try {
        if (!state.agentControl && !["get_state", "list_presets"].includes(method)) throw new Error("Agent control is disabled in Viewport Lab.");
        result = await handleAgentCommand(method, params || {});
      } catch (err) {
        error = err?.message || String(err);
      }
      await bridgeFetch("/bridge/result", { method: "POST", timeout: 5000, body: JSON.stringify({ sessionId: SESSION_ID, id, result, error }) });
    }
  } catch (_) {
    bridgeConnected = false;
    updateBridgeStatus();
  } finally {
    bridgePollBusy = false;
  }
}

function startBridgePolling() {
  clearInterval(bridgeTimer);
  pollBridge();
  bridgeTimer = setInterval(pollBridge, 650);
}

async function captureScope(scope = "workspace", deviceTarget = null) {
  let rect = null;
  if (scope === "device" || scope === "selected") {
    const device = scope === "selected" ? selectedDevice() : findDevice(deviceTarget);
    if (!device) return { ok: false, error: "Device not found." };
    const view = views.get(device.uid);
    if (!view) return { ok: false, error: "Device view not available." };
    // The workspace is fully contained and non-scrollable; capture geometry can
    // be read directly without moving the UI or disturbing sidebar position.
    await sleep(80);
    rect = view.stage.getBoundingClientRect();
  } else {
    rect = refs["workspace-scroller"].getBoundingClientRect();
  }
  const capture = await chrome.runtime.sendMessage({ channel: "VIEWPORT_LAB_APP", type: "CAPTURE_VISIBLE_TAB" });
  if (!capture?.ok) return { ok: false, error: capture?.error || "Capture failed." };
  return cropCapture(capture.dataUrl, rect);
}

async function cropCapture(dataUrl, rect) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scaleX = image.width / window.innerWidth;
  const scaleY = image.height / window.innerHeight;
  const x = clamp(Math.floor(rect.left * scaleX), 0, image.width - 1);
  const y = clamp(Math.floor(rect.top * scaleY), 0, image.height - 1);
  const w = clamp(Math.floor(rect.width * scaleX), 1, image.width - x);
  const h = clamp(Math.floor(rect.height * scaleY), 1, image.height - y);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  const out = canvas.toDataURL("image/png");
  return { ok: true, mimeType: "image/png", width: w, height: h, base64: out.split(",")[1] };
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

async function captureAndDownload(scope = "workspace", deviceTarget = null) {
  try {
    soundFX.play("click");
    refs["workspace-status"].textContent = "Capturing screenshot…";
    const res = await captureScope(scope, deviceTarget);
    if (!res?.ok || !res.base64) throw new Error(res?.error || "Capture failed");
    const dataUrl = `data:image/png;base64,${res.base64}`;
    const targetDevice = scope !== "workspace" ? (findDevice(deviceTarget) || selectedDevice()) : null;
    const cleanName = targetDevice
      ? `${targetDevice.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${targetDevice.width}x${targetDevice.height}`
      : "workspace";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `viewport-lab-${cleanName}-${timestamp}.png`;
    downloadDataUrl(dataUrl, filename);
    refs["workspace-status"].textContent = `Screenshot saved: ${filename}`;
    showToast(`📷 Screenshot saved: ${filename}`);
    setTimeout(() => {
      if (refs["workspace-status"].textContent.startsWith("Screenshot saved")) {
        updateWorkspaceStatus();
      }
    }, 2800);
  } catch (err) {
    refs["workspace-status"].textContent = `Screenshot failed: ${err.message || String(err)}`;
    showToast(`Screenshot failed: ${err.message || String(err)}`, "warning");
    setTimeout(updateWorkspaceStatus, 3200);
  }
}

async function handleAgentCommand(method, params) {
  if (method === "get_state") return { ok: true, ...basicAgentState(), url: state.url, devices: state.devices.map((d, index) => ({ index, id: d.uid, name: d.name, presetId: d.presetId, width: d.width, height: d.height, dpr: d.dpr, shell: d.shell, color: d.color })) };
  if (method === "list_presets") return { ok: true, presets: PRESETS };
  if (method === "open_url") return loadUrl(params.url);
  if (method === "select_device") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    selectDevice(device.uid);
    return { ok: true, device };
  }
  if (method === "add_device") {
    const preset = PRESETS.find(p => p.id === params.presetId || p.name.toLowerCase() === String(params.name || "").toLowerCase());
    const device = preset ? addPresetDevice(preset) : addCustomDevice(params.width, params.height, params.name || "Agent viewport");
    if (!device) throw new Error("Could not add device. The 5-device limit may have been reached.");
    return { ok: true, device };
  }
  if (method === "remove_device") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    return { ok: removeDevice(device.uid) };
  }
  if (method === "set_device") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    if (params.presetId) {
      const preset = PRESETS.find(p => p.id === params.presetId);
      if (!preset) throw new Error("Preset not found.");
      Object.assign(device, { presetId: preset.id, name: preset.name, width: preset.width, height: preset.height, dpr: preset.dpr, shell: preset.shell, color: preset.color });
    }
    if (params.width != null) device.width = clamp(Number(params.width), 240, 1800);
    if (params.height != null) device.height = clamp(Number(params.height), 320, 2200);
    if (params.shell) device.shell = params.shell;
    if (params.color) device.color = params.color;
    if (params.name) device.name = String(params.name);
    if (params.rotate) [device.width, device.height] = [device.height, device.width];
    persistDevices();
    renderDeviceList();
    renderSelectedEditor();
    syncBoard();
    return { ok: true, device };
  }
  if (method === "set_workspace") {
    if (params.layout && ["grid", "row", "focus", "free"].includes(params.layout)) state.layout = params.layout;
    if (params.viewMode && ["crisp", "fit"].includes(params.viewMode)) state.viewMode = params.viewMode;
    if (params.zoom != null) state.workspaceZoom = clamp(Number(params.zoom), .5, 1.5);
    if (params.resolution && ["auto", "1080", "1440", "4k", "custom"].includes(params.resolution)) state.workspaceResolution = params.resolution;
    if (params.workspaceWidth) state.workspaceWidth = clamp(Number(params.workspaceWidth), 900, 7680);
    if (params.workspaceHeight) state.workspaceHeight = clamp(Number(params.workspaceHeight), 600, 4320);
    persistWorkspaceSettings();
    renderAll();
    return { ok: true, workspace: basicAgentState().workspace };
  }
  if (method === "run_checks") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    return runChecks({ all: params.all !== false && !device, deviceId: device?.uid, openPanel: false });
  }
  if (method === "inspect_page") return inspectPage(findDevice(params.device ?? params.deviceId ?? params.index)?.uid, { showOutput: false });
  if (method === "inspect_element") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    return inspectElement(device?.uid, params.selector);
  }
  if (method === "click") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    return requestFrame(device.uid, "CLICK", { selector: params.selector }, 7000);
  }
  if (method === "fill") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    return requestFrame(device.uid, "FILL", { selector: params.selector, value: params.value }, 7000);
  }
  if (method === "press") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (!device) throw new Error("Device not found.");
    return requestFrame(device.uid, "PRESS", { selector: params.selector, key: params.key }, 7000);
  }
  if (method === "sweep") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    return runCommonSweep(device?.uid);
  }
  if (method === "reload") {
    const device = findDevice(params.device ?? params.deviceId ?? params.index);
    if (device) reloadDevice(device.uid); else reloadAll();
    return { ok: true };
  }
  if (method === "capture") return captureScope(params.scope || "workspace", params.device ?? params.deviceId ?? params.index);
  throw new Error(`Unknown Viewport Lab command: ${method}`);
}

function bindEvents() {
  refs["url-form"].addEventListener("submit", event => { event.preventDefault(); loadUrl(refs["url-input"].value); });
  refs["reload-all"].addEventListener("click", () => {
    soundFX.play("click");
    reloadAll();
  });
  refs["run-checks-top"].addEventListener("click", () => runChecks({ all: true }));
  refs["sound-toggle-btn"]?.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    persistSetting("soundEnabled", state.soundEnabled);
    syncControls();
    if (state.soundEnabled) soundFX.play("toggleOn");
    showToast(state.soundEnabled ? "UI sounds enabled" : "UI sounds muted");
  });
  refs["close-kofi-banner"]?.addEventListener("click", () => {
    soundFX.play("dialogClose");
    state.kofiDismissed = true;
    persistSetting("kofiDismissed", true);
    if (refs["kofi-banner"]) refs["kofi-banner"].hidden = true;
    scheduleGeometrySync();
    showToast("Anuncio cerrado. ¡Muchas gracias por tu apoyo!");
  });
  refs["kofi-banner-donate-btn"]?.addEventListener("click", () => {
    soundFX.play("click");
  });
  refs["kofi-top-btn"]?.addEventListener("click", () => {
    soundFX.play("click");
  });
  function setViewMode(mode) {
    if (!["crisp", "fit"].includes(mode)) return;
    soundFX.play("clickAlt");
    state.viewMode = mode;
    state.workspaceZoom = 1;
    persistWorkspaceSettings();
    syncControls();
    syncBoard();
    showToast(mode === "crisp" ? "View mode: Crisp (1:1)" : "View mode: Fit (scaled)");
  }

  refs["fit-button"]?.addEventListener("click", () => {
    setViewMode(state.viewMode === "fit" ? "crisp" : "fit");
  });
  refs["top-view-switcher"]?.addEventListener("click", event => {
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    setViewMode(button.dataset.view);
  });
  refs["view-switcher"].addEventListener("click", event => {
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    setViewMode(button.dataset.view);
  });
  refs["add-device-top"].addEventListener("click", openDeviceDialog);
  refs["add-device-side"].addEventListener("click", openDeviceDialog);
  refs["help-button"].addEventListener("click", () => showTutorial(0));
  refs["close-dialog"].addEventListener("click", () => {
    soundFX.play("dialogClose");
    refs["device-dialog"].close();
  });
  refs["add-custom"].addEventListener("click", () => addCustomDevice());
  refs["workspace-resolution"].addEventListener("change", () => {
    state.workspaceResolution = refs["workspace-resolution"].value;
    persistWorkspaceSettings();
    syncControls();
    syncBoard();
    updateWorkspaceStatus();
  });
  ["workspace-width", "workspace-height"].forEach(id => refs[id].addEventListener("change", () => {
    state.workspaceWidth = clamp(parseInt(refs["workspace-width"].value, 10) || state.workspaceWidth, 900, 7680);
    state.workspaceHeight = clamp(parseInt(refs["workspace-height"].value, 10) || state.workspaceHeight, 600, 4320);
    persistWorkspaceSettings();
    syncBoard();
    updateWorkspaceStatus();
  }));
  refs["zoom-range"].addEventListener("input", () => {
    state.workspaceZoom = Number(refs["zoom-range"].value) / 100;
    refs["zoom-output"].value = `${refs["zoom-range"].value}%`;
    persistSetting("workspaceZoom", state.workspaceZoom);
    soundFX.playSweep();
    syncBoard();
  });
  refs["layout-switcher"].addEventListener("click", event => {
    const button = event.target.closest("button[data-layout]");
    if (!button) return;
    soundFX.play("layout");
    state.previousLayout = state.layout === "focus" ? (state.previousLayout || "grid") : state.layout;
    state.layout = button.dataset.layout;
    persistSetting("layout", state.layout);
    syncControls();
    syncBoard();
    showToast(`Layout: ${state.layout.charAt(0).toUpperCase() + state.layout.slice(1)}`);
  });
  refs["frames-toggle"].addEventListener("change", () => { state.showFrames = refs["frames-toggle"].checked; persistSetting("showFrames", state.showFrames); soundFX.play(state.showFrames ? "toggleOn" : "toggleOff"); syncBoard(); });
  refs["safe-area-toggle"].addEventListener("change", () => { state.showSafeArea = refs["safe-area-toggle"].checked; persistSetting("showSafeArea", state.showSafeArea); soundFX.play(state.showSafeArea ? "toggleOn" : "toggleOff"); syncBoard(); });
  refs["scroll-toggle"].addEventListener("change", () => { state.syncScroll = refs["scroll-toggle"].checked; persistSetting("syncScroll", state.syncScroll); soundFX.play(state.syncScroll ? "toggleOn" : "toggleOff"); });
  refs["navigation-toggle"].addEventListener("change", () => { state.syncNavigation = refs["navigation-toggle"].checked; persistSetting("syncNavigation", state.syncNavigation); soundFX.play(state.syncNavigation ? "toggleOn" : "toggleOff"); });
  refs["compatibility-toggle"].addEventListener("change", async () => {
    state.compatibilityMode = refs["compatibility-toggle"].checked;
    persistSetting("compatibilityMode", state.compatibilityMode);
    soundFX.play(state.compatibilityMode ? "toggleOn" : "toggleOff");
    await chrome.runtime.sendMessage({
      channel: "VIEWPORT_LAB_APP", type: "SET_COMPATIBILITY_FOR_APP_TAB", enabled: state.compatibilityMode
    }).catch(() => null);
    refs["workspace-status"].textContent = state.compatibilityMode
      ? "Compatibility mode is active. Existing previews keep their state; use Retry only on a blocked preview."
      : "Compatibility mode is off. Existing previews keep their state.";
  });

  refs["selected-preset"].addEventListener("change", () => applyPresetToSelected(refs["selected-preset"].value));
  ["selected-width", "selected-height"].forEach(id => refs[id].addEventListener("change", applySelectedEditor));
  refs["selected-shell"].addEventListener("change", applySelectedEditor);
  refs["selected-color"].addEventListener("change", applySelectedEditor);
  refs["rotate-selected"].addEventListener("click", () => selectedDevice() && rotateDevice(state.selectedId));
  refs["duplicate-selected"].addEventListener("click", () => selectedDevice() && duplicateDevice(state.selectedId));
  refs["capture-selected"]?.addEventListener("click", () => selectedDevice() && captureAndDownload("selected"));
  refs["remove-selected"].addEventListener("click", () => selectedDevice() && removeDevice(state.selectedId));

  refs["sweep-range"].addEventListener("input", () => {
    const device = selectedDevice();
    if (!device) return;
    device.width = clamp(Number(refs["sweep-range"].value), 240, 1440);
    device.presetId = "custom";
    refs["sweep-output"].value = `${device.width} px`;
    refs["selected-width"].value = device.width;
    soundFX.playSweep();
    patchView(device, state.devices.indexOf(device));
    renderDeviceList();
    persistDevices();
  });
  refs["sweep-common"].addEventListener("click", () => runCommonSweep());
  refs["run-checks-side"].addEventListener("click", () => runChecks({ all: false, deviceId: state.selectedId }));

  refs["save-session"].addEventListener("click", () => {
    soundFX.play("click");
    saveWorkspace();
  });
  refs["session-select"].addEventListener("change", () => refs["session-select"].value && loadWorkspace(refs["session-select"].value));
  refs["delete-session"].addEventListener("click", () => {
    soundFX.play("delete");
    deleteWorkspace();
  });

  refs["capture-workspace"]?.addEventListener("click", () => captureAndDownload("workspace"));
  refs["issues-toggle"].addEventListener("click", () => { refs["issues-panel"].hidden = !refs["issues-panel"].hidden; });
  refs["close-issues"].addEventListener("click", () => refs["issues-panel"].hidden = true);
  refs["rerun-checks"].addEventListener("click", () => runChecks({ all: true }));
  refs["inspect-page"].addEventListener("click", () => inspectPage());

  refs["agent-control-toggle"].addEventListener("change", () => {
    state.agentControl = refs["agent-control-toggle"].checked;
    persistSetting("agentControl", state.agentControl);
    soundFX.play(state.agentControl ? "toggleOn" : "toggleOff");
    updateBridgeStatus();
  });
  refs["bridge-help"].addEventListener("click", () => {
    soundFX.play("dialogOpen");
    refs["bridge-dialog"].showModal();
  });
  refs["close-bridge-dialog"].addEventListener("click", () => {
    soundFX.play("dialogClose");
    refs["bridge-dialog"].close();
  });

  refs["tutorial-skip"].addEventListener("click", finishTutorial);
  refs["tutorial-next"].addEventListener("click", () => {
    soundFX.play("click");
    if (tutorialIndex >= TUTORIAL.length - 1) finishTutorial();
    else { tutorialIndex += 1; updateTutorial(); }
  });

  chrome?.runtime?.onMessage?.addListener?.(handleFrameMessage);
  // Observe the actual workspace column rather than only the browser window.
  // Sidebar/topbar changes can alter the available canvas without firing a
  // meaningful window resize. Re-layout never recreates or navigates iframes.
  workspaceResizeObserver?.disconnect();
  workspaceResizeObserver = new ResizeObserver(() => scheduleGeometrySync());
  workspaceResizeObserver.observe(refs["workspace-scroller"]);
  window.addEventListener("resize", scheduleGeometrySync);
  window.addEventListener("keydown", event => {
    if (isTyping(event.target) || document.querySelector("dialog[open]")) return;
    const key = event.key.toLowerCase();
    if (event.key === "+" || event.key === "=") { event.preventDefault(); openDeviceDialog(); return; }
    if (key === "r" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); reloadAll(); return; }
    if (key === "c" && event.altKey) { event.preventDefault(); runChecks({ all: true }); return; }
    if ((event.ctrlKey || event.metaKey) && key === "d") { event.preventDefault(); if (state.selectedId) duplicateDevice(state.selectedId); return; }
    if (event.key === "Delete" && state.selectedId) { event.preventDefault(); removeDevice(state.selectedId); return; }
    if (key === "r" && !event.ctrlKey && !event.metaKey && state.selectedId) { event.preventDefault(); rotateDevice(state.selectedId); return; }
    if (key === "f") { event.preventDefault(); setViewMode("fit"); return; }
    if (key === "c") { event.preventDefault(); setViewMode("crisp"); return; }
    const layouts = { "1": "grid", "2": "row", "3": "focus", "4": "free" };
    if (layouts[event.key]) {
      event.preventDefault();
      soundFX.play("layout");
      state.previousLayout = state.layout === "focus" ? (state.previousLayout || "grid") : state.layout;
      state.layout = layouts[event.key];
      persistSetting("layout", state.layout);
      syncControls();
      syncBoard();
      showToast(`Layout: ${state.layout.charAt(0).toUpperCase() + state.layout.slice(1)}`);
    }
  });
  handleWorkspacePan();
}

async function init() {
  cacheRefs();
  buildPresetControls();
  if (globalThis.chrome?.runtime?.sendMessage) {
    await chrome.runtime.sendMessage({ channel: "VIEWPORT_LAB_APP", type: "REGISTER_APP_TAB" }).catch(() => null);
  }
  await loadState();
  bindEvents();
  renderAll();
  renderRecentUrls();
  requestAnimationFrame(scheduleGeometrySync);
  startBridgePolling();
  if (!state.tutorialSeen) setTimeout(() => showTutorial(0), 350);
}

init();
