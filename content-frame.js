(() => {
  const PREFIX = "viewport-lab:";
  if (window.top === window) return;
  if (!window.name || !window.name.startsWith(PREFIX)) return;

  const parts = window.name.slice(PREFIX.length).split(":");
  if (parts.length < 2) return;

  const sessionId = parts.shift();
  const deviceId = parts.join(":");
  let lastUrl = location.href;
  let isApplyingRemoteScroll = false;
  let scrollRaf = 0;
  let scrollTrailingTimer = 0;
  let suppressScrollUntil = 0;
  let lastReportedScroll = { x: -1, y: -1 };
  let remoteScrollRaf = 0;
  let pendingRemoteTarget = null;
  let highlightTimer = 0;

  function send(type, payload = {}) {
    try {
      chrome.runtime.sendMessage({
        channel: "VIEWPORT_LAB_FRAME",
        sessionId,
        deviceId,
        type,
        ...payload
      });
    } catch (_) {}
  }

  function reportUrl() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    send("URL_CHANGED", { url: location.href });
  }

  function broadcastCurrentScroll() {
    const root = document.scrollingElement || document.documentElement || document.body;
    if (!root) return;
    const maxX = Math.max(0, root.scrollWidth - window.innerWidth);
    const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
    const x = maxX > 0 ? Math.max(0, Math.min(1, window.scrollX / maxX)) : 0;
    const y = maxY > 0 ? Math.max(0, Math.min(1, window.scrollY / maxY)) : 0;

    if (Math.abs(x - lastReportedScroll.x) > 0.0001 || Math.abs(y - lastReportedScroll.y) > 0.0001) {
      lastReportedScroll = { x, y };
      send("SCROLL_CHANGED", { x, y });
    }
  }

  function reportScroll() {
    if (isApplyingRemoteScroll || Date.now() < suppressScrollUntil) return;

    if (!scrollRaf) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        broadcastCurrentScroll();
      });
    }

    clearTimeout(scrollTrailingTimer);
    scrollTrailingTimer = setTimeout(() => {
      broadcastCurrentScroll();
    }, 60);
  }

  function applyRemoteScroll(targetXFraction, targetYFraction) {
    const root = document.scrollingElement || document.documentElement || document.body;
    if (!root) return;
    const maxX = Math.max(0, root.scrollWidth - window.innerWidth);
    const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
    const targetLeft = Math.max(0, Math.min(1, targetXFraction)) * maxX;
    const targetTop = Math.max(0, Math.min(1, targetYFraction)) * maxY;

    pendingRemoteTarget = { left: targetLeft, top: targetTop };

    if (!remoteScrollRaf) {
      remoteScrollRaf = requestAnimationFrame(() => {
        remoteScrollRaf = 0;
        if (!pendingRemoteTarget) return;
        const { left, top } = pendingRemoteTarget;
        pendingRemoteTarget = null;

        isApplyingRemoteScroll = true;
        suppressScrollUntil = Date.now() + 80;
        try {
          window.scrollTo({
            left,
            top,
            behavior: "auto"
          });
        } finally {
          requestAnimationFrame(() => {
            isApplyingRemoteScroll = false;
          });
        }
      });
    }
  }

  function cssPath(el) {
    if (!(el instanceof Element)) return "";
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement && parts.length < 5) {
      let part = node.localName;
      const cls = [...node.classList].filter(Boolean).slice(0, 2);
      if (cls.length) part += `.${cls.map(v => CSS.escape(v)).join(".")}`;
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter(child => child.localName === node.localName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  }

  function compactText(value, max = 90) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function rectData(rect) {
    return {
      x: Math.round(rect.x * 10) / 10,
      y: Math.round(rect.y * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
      bottom: Math.round(rect.bottom * 10) / 10
    };
  }

  function parseRgb(value) {
    const m = String(value || "").match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const nums = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    if (nums.length < 3 || nums.slice(0, 3).some(Number.isNaN)) return null;
    return { r: nums[0], g: nums[1], b: nums[2], a: nums[3] == null ? 1 : nums[3] };
  }

  function luminance(rgb) {
    const vals = [rgb.r, rgb.g, rgb.b].map(v => {
      const n = Math.max(0, Math.min(255, v)) / 255;
      return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    return .2126 * vals[0] + .7152 * vals[1] + .0722 * vals[2];
  }

  function contrastRatio(fg, bg) {
    const a = luminance(fg);
    const b = luminance(bg);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }

  function effectiveBackground(el) {
    let node = el;
    while (node && node instanceof Element) {
      const color = parseRgb(getComputedStyle(node).backgroundColor);
      if (color && color.a > .95) return color;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  function getAccessibleBreakpoints() {
    const values = new Set();
    let rulesSeen = 0;
    function visit(rules) {
      if (!rules) return;
      for (const rule of [...rules]) {
        rulesSeen += 1;
        if (rulesSeen > 10000) return;
        if (rule.type === CSSRule.MEDIA_RULE) {
          const text = rule.conditionText || rule.media?.mediaText || "";
          for (const match of text.matchAll(/(?:min|max)-width\s*:\s*([0-9.]+)px/gi)) {
            const n = Math.round(Number(match[1]));
            if (n >= 200 && n <= 4000) values.add(n);
          }
          visit(rule.cssRules);
        } else if (rule.cssRules) {
          visit(rule.cssRules);
        }
      }
    }
    for (const sheet of [...document.styleSheets]) {
      try { visit(sheet.cssRules); } catch (_) {}
    }
    return [...values].sort((a, b) => a - b).slice(0, 80);
  }

  function collectIssues() {
    const issues = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const root = document.scrollingElement || document.documentElement;
    const seen = new Set();

    function add(severity, code, title, element, detail = "") {
      const selector = element ? cssPath(element) : "";
      const key = `${code}:${selector}:${detail}`;
      if (seen.has(key) || issues.length >= 80) return;
      seen.add(key);
      const rect = element?.getBoundingClientRect?.();
      issues.push({
        severity,
        code,
        title,
        detail,
        selector,
        tag: element?.localName || "",
        text: element ? compactText(element.textContent, 70) : "",
        rect: rect ? rectData(rect) : null
      });
    }

    if (root.scrollWidth > vw + 2) {
      add("high", "horizontal-overflow", "Page has horizontal overflow", document.documentElement, `${root.scrollWidth}px document width vs ${vw}px viewport`);
    }

    const all = [...document.querySelectorAll("body *")];
    for (const el of all.slice(0, 7000)) {
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      if (rect.right > vw + 3 && rect.left < vw && style.position !== "fixed") {
        add("high", "element-overflow-right", "Element extends past the right edge", el, `right edge ${Math.round(rect.right - vw)}px beyond viewport`);
      }
      if (rect.left < -3 && rect.right > 0 && style.position !== "fixed") {
        add("medium", "element-overflow-left", "Element extends past the left edge", el, `${Math.round(Math.abs(rect.left))}px outside viewport`);
      }
      if (style.position === "fixed" && (rect.right < 0 || rect.left > vw || rect.bottom < 0 || rect.top > vh)) {
        add("medium", "fixed-outside", "Fixed element is outside the visible viewport", el);
      }

      const hasText = el.childElementCount === 0 && compactText(el.textContent, 2).length > 0;
      if (hasText && (style.overflowX === "hidden" || style.overflow === "hidden" || style.textOverflow === "ellipsis")) {
        if (el.scrollWidth > el.clientWidth + 2) add("medium", "text-clipped", "Text is clipped horizontally", el, `${el.scrollWidth}px content in ${el.clientWidth}px box`);
      }

      const clickable = el.matches?.("a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]");
      if (clickable && rect.width > 0 && rect.height > 0 && rect.width < 36 && rect.height < 36) {
        add("low", "small-touch-target", "Small touch target", el, `${Math.round(rect.width)}×${Math.round(rect.height)}px`);
      }

      if (el instanceof HTMLImageElement) {
        if (!el.hasAttribute("alt")) add("low", "missing-alt", "Image is missing alt text", el);
        if (rect.width > vw + 2) add("medium", "oversized-image", "Image is wider than the viewport", el, `${Math.round(rect.width)}px`);
      }

      if (hasText && rect.width >= 20 && rect.height >= 10) {
        const fg = parseRgb(style.color);
        const bg = effectiveBackground(el);
        if (fg && fg.a > .8 && bg) {
          const ratio = contrastRatio(fg, bg);
          const fontSize = parseFloat(style.fontSize) || 16;
          const fontWeight = parseInt(style.fontWeight, 10) || 400;
          const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
          const threshold = large ? 3 : 4.5;
          if (ratio < threshold - .25) add("low", "low-contrast", "Text may have low contrast", el, `contrast ${ratio.toFixed(2)}:1`);
        }
      }
    }

    const labels = new Set([...document.querySelectorAll("label[for]")].map(l => l.htmlFor));
    for (const input of [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].slice(0, 300)) {
      const labelled = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby") || (input.id && labels.has(input.id)) || input.closest("label");
      if (!labelled) add("low", "unlabelled-control", "Form control may be missing a label", input);
    }

    return issues;
  }

  function pageSnapshot({ includeIssues = true } = {}) {
    const root = document.scrollingElement || document.documentElement;
    const landmarks = [...document.querySelectorAll("header, nav, main, aside, footer, [role=main], [role=navigation], h1, h2")]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .slice(0, 60)
      .map(el => ({
        selector: cssPath(el),
        tag: el.localName,
        text: compactText(el.textContent, 100),
        rect: rectData(el.getBoundingClientRect())
      }));

    const result = {
      url: location.href,
      title: document.title || "",
      viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
      document: { width: root.scrollWidth, height: root.scrollHeight },
      breakpoints: getAccessibleBreakpoints(),
      counts: {
        elements: document.querySelectorAll("*").length,
        links: document.links.length,
        images: document.images.length,
        forms: document.forms.length,
        buttons: document.querySelectorAll("button, [role=button]").length
      },
      landmarks
    };
    if (includeIssues) result.issues = collectIssues();
    return result;
  }

  function inspectElement(selector) {
    const el = document.querySelector(selector);
    if (!el) return { ok: false, error: `No element matches ${selector}` };
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      ok: true,
      selector: cssPath(el),
      tag: el.localName,
      text: compactText(el.textContent, 240),
      html: compactText(el.outerHTML, 700),
      rect: rectData(rect),
      style: {
        display: style.display,
        position: style.position,
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        height: style.height,
        overflow: style.overflow,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        margin: style.margin,
        padding: style.padding,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        zIndex: style.zIndex,
        flex: style.flex,
        gridTemplateColumns: style.gridTemplateColumns
      }
    };
  }

  function highlight(selector) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const previousOutline = el.style.outline;
    const previousOffset = el.style.outlineOffset;
    el.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    el.style.outline = "3px solid #ff5777";
    el.style.outlineOffset = "3px";
    clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => {
      el.style.outline = previousOutline;
      el.style.outlineOffset = previousOffset;
    }, 2400);
    return true;
  }

  function fill(selector, value) {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      return { ok: false, error: "Target is not a fillable form control." };
    }
    if (el instanceof HTMLInputElement && el.type === "password") return { ok: false, error: "Password fields are intentionally blocked." };
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, String(value)); else el.value = String(value);
    } else {
      el.value = String(value);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, value: el.value };
  }

  async function handleCommand(message) {
    const requestId = message.requestId;
    const respond = (result, error = "") => send("COMMAND_RESULT", { requestId, result, error });
    try {
      if (message.type === "RUN_CHECKS") return respond(pageSnapshot({ includeIssues: true }));
      if (message.type === "INSPECT_PAGE") return respond(pageSnapshot({ includeIssues: message.includeIssues !== false }));
      if (message.type === "INSPECT_ELEMENT") return respond(inspectElement(String(message.selector || "")));
      if (message.type === "HIGHLIGHT_SELECTOR") return respond({ ok: highlight(String(message.selector || "")) });
      if (message.type === "CLICK") {
        const el = document.querySelector(String(message.selector || ""));
        if (!el) return respond({ ok: false, error: "Element not found." });
        el.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
        el.click();
        return respond({ ok: true, url: location.href });
      }
      if (message.type === "FILL") return respond(fill(String(message.selector || ""), message.value ?? ""));
      if (message.type === "PRESS") {
        const el = message.selector ? document.querySelector(String(message.selector)) : document.activeElement;
        if (!el) return respond({ ok: false, error: "No target element." });
        el.focus?.();
        const key = String(message.key || "Enter");
        const opts = { key, code: key, bubbles: true, cancelable: true };
        el.dispatchEvent(new KeyboardEvent("keydown", opts));
        el.dispatchEvent(new KeyboardEvent("keyup", opts));
        if (key === "Enter" && el instanceof HTMLElement && el.matches("button, a[href], [role=button]")) el.click();
        return respond({ ok: true });
      }
      if (message.type === "PING") return respond({ ok: true, url: location.href, title: document.title || "" });
    } catch (error) {
      return respond(null, error?.message || String(error));
    }
  }

  window.addEventListener("scroll", reportScroll, { passive: true });
  window.addEventListener("hashchange", reportUrl);
  window.addEventListener("popstate", reportUrl);
  window.addEventListener("pageshow", () => send("FRAME_READY", { url: location.href, title: document.title || "" }));

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    queueMicrotask(reportUrl);
    return result;
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    queueMicrotask(reportUrl);
    return result;
  };
  setInterval(reportUrl, 700);

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.channel !== "VIEWPORT_LAB_PREVIEW") return;
    if (message.sessionId !== sessionId) return;
    if (message.sourceDeviceId === deviceId) return;
    if (message.targetDeviceId && message.targetDeviceId !== "*" && message.targetDeviceId !== deviceId) return;

    if (message.type === "SET_SCROLL") {
      applyRemoteScroll(
        Math.max(0, Math.min(1, Number(message.x) || 0)),
        Math.max(0, Math.min(1, Number(message.y) || 0))
      );
      return;
    }
    if (message.type === "NAVIGATE" && typeof message.url === "string") {
      if (location.href !== message.url && /^https?:\/\//i.test(message.url)) location.href = message.url;
      return;
    }
    if (message.type === "RELOAD") {
      location.reload();
      return;
    }
    if (message.requestId) handleCommand(message);
  });

  send("FRAME_READY", { url: location.href, title: document.title || "" });
})();
