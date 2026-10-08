# Chrome Web Store Listing & Submission Guide

This document is the single source of truth for publishing **Viewport Lab** to the Chrome Web Store and Microsoft Edge Add-ons catalog.

---

## 1. Store Listing Metadata

| Field | Content |
|:---|:---|
| **Extension Name** | Viewport Lab |
| **Current Version** | 0.3.3 |
| **Short Description** (Max 132 chars) | Open-source multi-device responsive review workspace with persistent previews, responsive QA checks, and local-first workflows. |
| **Category** | Developer Tools |
| **Language** | English (United States) |
| **Pricing** | Free / Open Source (MIT) |
| **Website / Repo** | https://github.com/<your-username>/viewport-lab-extension |

---

## 2. Detailed Store Description

```markdown
Preview and test responsive websites across multiple live devices simultaneously with zero page reloads, deterministic QA checks, and a clean, local-first workspace.

Viewport Lab keeps your target website alive inside authentic phone, tablet, and custom viewports. When you resize, rotate, or switch layout modes, your website's CSS reacts instantly while maintaining its current browsing state and input data.

KEY FEATURES:

📱 Multi-Device Previews
- Compare up to 5 devices side-by-side in real time.
- Accurate device pixel ratios and authentic CSS viewport dimensions.
- Curated presets for popular Apple, Google, Samsung, and tablet form factors, plus fully custom viewports.

⚡ Zero-Reload Geometry
- Rotate devices, resize dimensions, and switch between Grid, Row, Focus, and Free layouts without reloading the page or losing form state.
- Focus mode automatically magnifies the selected viewport to fill your workspace while preserving exact responsive breakpoints.

🔍 Deterministic Responsive QA Checks
- One-click inspection catches common layout defects: horizontal overflow, clipped text, touch targets smaller than 44×44px, missing image alt text, and unlabelled inputs.
- No AI guesswork or external cloud calls — fast, deterministic DOM evaluation.

📐 Breakpoint Discovery Ruler
- Automatically scans page stylesheets and places interactive indicators at every detected @media breakpoint.
- Interactive width slider allows scrubbing from 240px to 1440px to observe layout transitions.

🛡️ Compatibility Mode
- Easily preview sites that send X-Frame-Options or restrictive Content-Security-Policy headers.
- Uses secure, session-scoped declarative rules that apply exclusively to subframes within the Viewport Lab tab.

🔒 100% Local & Private
- Zero telemetry, zero analytics, zero external network requests.
- All workspace data and presets are stored locally in your browser.
```

---

## 3. Permissions Justifications (For Review Team)

When submitting to the Chrome Developer Dashboard, the review team requires explicit justifications for every requested permission. Copy-paste these exact justifications:

### `storage`
> **Justification:** Needed to store user configuration, custom device viewports, zoom preferences, and saved review sessions locally using `chrome.storage.local`. No data is ever transmitted to external servers.

### `tabs`
> **Justification:** Needed to open the Viewport Lab workspace in a dedicated browser tab and to detect the URL of the tab the user was inspecting when clicking the extension icon, providing a seamless preview launch.

### `activeTab`
> **Justification:** Needed to securely identify the current active webpage when the user invokes the extension action button.

### `declarativeNetRequestWithHostAccess`
> **Justification:** Needed for Compatibility Mode. It applies temporary, tab-scoped session rules that remove restrictive `X-Frame-Options` and `frame-ancestors` headers on sub-frame network requests inside the Viewport Lab tab only. This allows developers to test sites that normally block iframe embedding during local development.

### `host_permissions` (`<all_urls>`)
> **Justification:** Viewport Lab is a developer tool designed to test and preview any user-specified website, web application, or localhost server across responsive device frames. Access to URLs is required to load preview subframes and apply session-scoped compatibility header modifications on the user's requested testing target.

---

## 4. Privacy & Data Use Disclosures

When completing the Chrome Web Store Privacy tab:

1. **Single Purpose:**
   > A responsive multi-device review and QA workspace that renders live websites across mobile, tablet, and custom viewports for web developers.
2. **Data Usage:**
   - **Do you collect personal data?** **No.** Select "No" for all categories (PII, location, web history, credentials, etc.).
   - **Do you use remote code?** **No.** All code is packaged statically within the extension.
   - **Does the extension comply with the Limited Use Policy?** **Yes.**

---

## 5. Visual Assets & Packaging Checklist

### Required Images:
- [x] **Store Icon:** 128×128 PNG (available in `icons/icon128.png`)
- [ ] **Screenshots:** At least 1 (recommended 3–5) at 1280×800 or 640×400 PNG/JPEG.
  1. *Screenshot 1:* Multi-device grid view with 3 phones and a tablet.
  2. *Screenshot 2:* Responsive QA issues panel showing detected overflow and touch targets.
  3. *Screenshot 3:* Breakpoint ruler and responsive width sweep.
  4. *Screenshot 4:* Focus mode with phone in landscape view.
- [ ] **Small Promo Tile (Optional):** 440×280 PNG.
- [ ] **Marquee Tile (Optional):** 1400×560 PNG.

### Packaging Command:

To generate the clean submission ZIP file (excluding git files, documentation, and development artifacts):

```bash
# In PowerShell / terminal:
npm test
tar -a -c -f viewport-lab-v0.3.3.zip manifest.json background.js content-frame.js app.html app.js app.css icons assets LICENSE PRIVACY.md
```
*(Or on Linux/macOS)*:
```bash
zip -r viewport-lab-v0.3.3.zip . -x "*.git*" "mcp/*" "tools/*" ".*" "*.zip" "CHROMEWEBSTORE.md"
```
