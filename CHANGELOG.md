# Changelog

All notable changes to **Viewport Lab** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.3] - 2026-10-07

### Added
- **HeartDev Pixel Polish**: Retro-futuristic, clean pixel accents on sliders and HUD corners.
- **Direct Screenshot Capture**: In-app camera buttons on device cardbars, selected device sidebar, and workspace toolbar to download cropped PNGs without needing external tools or agents.
- **Desktop & Laptop Presets**: Added MacBook Air (1280×800), Laptop (1366×768), and Desktop 1080p (1536×864) presets to cover the full responsive spectrum.
- **Enhanced Local Dev URL Normalizer**: Automatic `http://` detection for local LAN IP addresses (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) and dev domains (`.local`, `.test`, `.internal`, `.localhost`, `*.nip.io`, `*.sslip.io`, `*.lvh.me`).
- **Recent URLs History**: Auto-saved recent URLs history with native `<datalist>` auto-completion in the URL bar.
- Official HeartDev logo image in brand header.
- Subtle workspace watermark.
- Pixel range styling (`::-webkit-slider-thumb` / `::-moz-range-thumb`).

### Changed
- Refined manifest description for Chrome Web Store compliance (under 132 characters).
- Synchronized McpServer version with extension package release.
- Added graceful `EADDRINUSE` port collision handling on the local MCP bridge.

### Fixed
- **Fit Mode Crisp Rendering & Layer Clarity**: Eliminated blurriness when scaling devices to fit the workspace. Removed GPU layer-freezing properties (`transform: translateZ(0)`, `backface-visibility: hidden`, `image-rendering: -webkit-optimize-contrast`) and transform transitions that caused Chromium to freeze iframes into 1x bitmaps and bilinearly stretch them. Quantized scale factors in Fit mode to clean increments (snapping near 1.0 to native 1.0 with `transform: none`, and upscales to clean 0.05 rational steps) so text stems and borders land cleanly on physical display pixels.
- **Dynamic Landscape Frame Rotation**: Hardware cutouts (Dynamic Island pill, notch, punch hole cameras) and physical side buttons now dynamically rotate when phones enter landscape orientation (`width > height`). Front cameras and cutouts reposition to the physical left bezel (centered vertically) and side buttons move to the top/bottom edges, keeping website headers and search bars completely unblocked.
- **Focus Mode Crisp Fidelity**: In Focus layout with `Crisp` view mode, the selected device preserves native 1:1 pixel rendering (`scale: 1.0`), eliminating the artificial upscaling magnification blur while still supporting `Fit` mode to fill the canvas on demand.

---

## [0.3.1] - 2026-10-01

### Added
- **Focus Sizing Patch**: Focus mode now scales the selected device to fill available workspace, including small phones and landscape orientations.
- Derives fill scale from available width/height up to 2.5x while keeping the underlying iframe's real CSS viewport intact (no reloading or navigation triggered).

---

## [0.3.0] - 2026-09-20

### Added
- Restrained desktop-tool visual theme: neutral surfaces, compact controls, single muted accent.
- Functional measurement grids and pixel-accurate device shells.

### Changed
- Optional MCP bridge moved into a collapsible "Integrations" section in the sidebar.
- First-run onboarding tour simplified to focus strictly on core responsive QA features.

---

## [0.2.5] - 2026-09-08

### Added
- **Phase 0 Stability Baseline**: Complete containment of the canvas to the right of the sidebar.
- Dynamic tracking via `ResizeObserver` on the workspace container with window resize fallback.

### Fixed
- Guaranteed zero-reload invariant: changing viewport dimensions, rotating devices, changing shell/frame colors, switching layouts, or changing zoom never navigates or recreates active iframes.
- Independent sidebar scrolling with `scrollbar-gutter: stable`, eliminating shared scroll with the canvas.
- DeclarativeNetRequest compatibility rules are strictly installed and awaited prior to first iframe navigation.

---

## [0.2.4] - 2026-08-25

### Added
- **Canvas Containment**: Removed all canvas scrollbars; Auto, 1080p, 1440p, 4K and custom workspaces scale to fit visible bounds.
- Virtual reference canvas overlay with crisp containment.

---

## [0.2.3] - 2026-08-15

### Added
- Window-fitting shell removing artificial minimum width constraints.
- Explicit "Retry compatibility" action on blocked previews.

### Fixed
- Fixed issue where hidden sidebar controls could be overridden by author display styles.
- Device stages are persistent and protected from re-append DOM cycles.

---

## [0.2.2] - 2026-08-05

### Fixed
- Restored mutually-exclusive preview placeholder: empty canvas placeholder cleanly unmounts when a live URL loads.
- Eliminated duplicate initial iframe navigation race condition.

---

## [0.2.1] - 2026-07-28

### Added
- State restoration: remembers last inspected URL across restarts in `chrome.storage.local`.
- Smart fallback: recovers opener tab or recently focused HTTP(S) tab when opened directly from `chrome://extensions`.

---

## [0.2.0] - 2026-07-15

### Added
- Multi-device responsive QA workspace supporting up to 5 concurrent devices.
- **Crisp** (1:1 visual clarity) and **Fit** (complete overview) scaling modes.
- Named device presets for Apple, Google, Samsung, tablets, and generic form factors.
- Responsive Sweep slider: test breakpoints continuously from 240px to 1440px without page reloads.
- Deterministic QA inspection suite: horizontal overflow, clipped text, touch target minimum sizes, missing image alt text, and form label validation.
- Breakpoint discovery ruler highlighting CSS `@media` rules extracted directly from live preview pages.
- Safe-area overlay for device notches, dynamic islands, and home indicators.
- Grid, Row, Focus, and Free-drag workspace layouts.
- Synchronized relative scrolling and multi-tab link navigation.
- Local workspace saving and restoration via `chrome.storage.local`.
- Optional local-only MCP bridge (`127.0.0.1:43117`) for AI coding agents (Claude, Antigravity, Cursor).
- Zero remote scripts, CDN dependencies, or telemetry.
