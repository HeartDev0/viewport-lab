const APP_PAGE = "app.html";

function isPreviewableUrl(url = "") {
  return /^https?:\/\//i.test(url);
}

async function getSettings() {
  return chrome.storage.local.get({
    compatibilityMode: true,
    showFrames: true,
    showSafeArea: false,
    syncScroll: false,
    syncNavigation: false,
    layout: "grid",
    viewMode: "crisp",
    workspaceZoom: 1,
    workspaceResolution: "auto",
    agentControl: false
  });
}

function ruleIdForTab(tabId) {
  return tabId + 1;
}

function compatibilityRuleForTab(tabId) {
  return {
    id: ruleIdForTab(tabId),
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        { header: "x-frame-options", operation: "remove" },
        { header: "content-security-policy", operation: "remove" },
        { header: "content-security-policy-report-only", operation: "remove" }
      ]
    },
    condition: {
      regexFilter: "^https?://",
      tabIds: [tabId],
      resourceTypes: ["sub_frame"]
    }
  };
}

async function setCompatibilityForTab(tabId, enabled) {
  if (!Number.isInteger(tabId) || tabId < 0) return;
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleIdForTab(tabId)],
      addRules: enabled ? [compatibilityRuleForTab(tabId)] : []
    });
  } catch (error) {
    console.error("Viewport Lab: failed to update compatibility rule", error);
  }
}

async function refreshCompatibilityRules(enabled) {
  try {
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = existing.map(rule => rule.id);
    if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    if (!enabled) return;

    const appBase = chrome.runtime.getURL(APP_PAGE);
    const tabs = await chrome.tabs.query({});
    const appTabs = tabs.filter(tab => Number.isInteger(tab.id) && tab.url?.startsWith(appBase));
    if (!appTabs.length) return;
    await chrome.declarativeNetRequest.updateSessionRules({ addRules: appTabs.map(tab => compatibilityRuleForTab(tab.id)) });
  } catch (error) {
    console.error("Viewport Lab: failed to refresh compatibility rules", error);
  }
}

async function initialize() {
  const current = await chrome.storage.local.get([
    "compatibilityMode", "showFrames", "showSafeArea", "syncScroll", "syncNavigation",
    "layout", "viewMode", "workspaceZoom", "workspaceResolution", "agentControl"
  ]);
  const defaults = {};
  if (typeof current.compatibilityMode !== "boolean") defaults.compatibilityMode = true;
  if (typeof current.showFrames !== "boolean") defaults.showFrames = true;
  if (typeof current.showSafeArea !== "boolean") defaults.showSafeArea = false;
  if (typeof current.syncScroll !== "boolean") defaults.syncScroll = false;
  if (typeof current.syncNavigation !== "boolean") defaults.syncNavigation = false;
  if (!current.layout) defaults.layout = "grid";
  if (!current.viewMode) defaults.viewMode = "crisp";
  if (typeof current.workspaceZoom !== "number") defaults.workspaceZoom = 1;
  if (!current.workspaceResolution) defaults.workspaceResolution = "auto";
  if (typeof current.agentControl !== "boolean") defaults.agentControl = false;
  if (Object.keys(defaults).length) await chrome.storage.local.set(defaults);
  const settings = await getSettings();
  await refreshCompatibilityRules(settings.compatibilityMode);
}

chrome.runtime.onInstalled.addListener(() => initialize());
chrome.runtime.onStartup.addListener(() => initialize());

chrome.action.onClicked.addListener(async tab => {
  const source = isPreviewableUrl(tab?.url) ? tab.url : "";
  const target = new URL(chrome.runtime.getURL(APP_PAGE));
  if (source) {
    target.searchParams.set("url", source);
    await chrome.storage.local.set({ viewportLabLastUrl: source });
  }

  const createProperties = { url: target.toString() };
  if (Number.isInteger(tab?.id)) createProperties.openerTabId = tab.id;

  let created;
  try {
    created = await chrome.tabs.create(createProperties);
  } catch {
    // Some browser contexts reject openerTabId. Opening the app still works
    // because the source URL is also present in the query string/storage.
    created = await chrome.tabs.create({ url: target.toString() });
  }

  const settings = await getSettings();
  if (created.id != null && settings.compatibilityMode) await setCompatibilityForTab(created.id, true);
});

chrome.tabs.onRemoved.addListener(tabId => setCompatibilityForTab(tabId, false));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.compatibilityMode) refreshCompatibilityRules(Boolean(changes.compatibilityMode.newValue));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  if (message.channel === "VIEWPORT_LAB_APP" && message.type === "REGISTER_APP_TAB") {
    if (!sender.tab?.id) {
      sendResponse({ ok: false, error: "Viewport Lab tab was not found." });
      return;
    }
    (async () => {
      try {
        const settings = await getSettings();
        // Important: do not acknowledge registration until the compatibility
        // rule is actually installed. Otherwise the first iframe navigation can
        // race ahead and Chrome renders "refused to connect".
        await setCompatibilityForTab(sender.tab.id, settings.compatibilityMode);
        sendResponse({ ok: true, tabId: sender.tab.id, windowId: sender.tab.windowId, compatibilityMode: settings.compatibilityMode });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || String(error) });
      }
    })();
    return true;
  }

  if (message.channel === "VIEWPORT_LAB_APP" && message.type === "SET_COMPATIBILITY_FOR_APP_TAB") {
    if (!sender.tab?.id) {
      sendResponse({ ok: false, error: "Viewport Lab tab was not found." });
      return;
    }
    (async () => {
      try {
        await setCompatibilityForTab(sender.tab.id, Boolean(message.enabled));
        sendResponse({ ok: true, enabled: Boolean(message.enabled) });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || String(error) });
      }
    })();
    return true;
  }

  if (message.channel === "VIEWPORT_LAB_APP" && message.type === "CAPTURE_VISIBLE_TAB") {
    if (!sender.tab?.windowId) {
      sendResponse({ ok: false, error: "Viewport Lab tab was not found." });
      return;
    }
    (async () => {
      try {
        const activeTabs = await chrome.tabs.query({ active: true, windowId: sender.tab.windowId });
        const previous = activeTabs[0];
        const needsActivation = previous?.id !== sender.tab.id;
        if (needsActivation) {
          await chrome.tabs.update(sender.tab.id, { active: true });
          await new Promise(resolve => setTimeout(resolve, 90));
        }
        const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" });
        if (needsActivation && previous?.id != null) await chrome.tabs.update(previous.id, { active: true }).catch(() => {});
        sendResponse({ ok: true, dataUrl });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || String(error) });
      }
    })();
    return true;
  }

  if (message.channel !== "VIEWPORT_LAB_APP" || message.type !== "BROADCAST_TO_PREVIEWS" || !sender.tab?.id) return;
  chrome.tabs.sendMessage(sender.tab.id, { channel: "VIEWPORT_LAB_PREVIEW", ...message.payload }).catch(() => {});
});

initialize();
