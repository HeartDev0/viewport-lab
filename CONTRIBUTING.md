# Contributing to Viewport Lab

Thank you for your interest in contributing to **Viewport Lab**!

Viewport Lab is an open-source responsive QA tool built for speed, transparency, and developer trust. To maintain these values, we adhere to strict architectural principles.

---

## 🎯 Core Principles

Before opening a pull request or proposing changes, ensure your contribution respects these invariants:

1. **No Telemetry, No Analytics, No Tracking**: Under no circumstances will third-party analytics, error logging services, or tracking beacons be accepted.
2. **Zero Remote Dependencies**: The browser extension runs entirely offline/local. No remote CDNs, runtime scripts, or external API endpoints.
3. **Persistent Previews (Zero-Reload Invariant)**: Visual changes, resize events, rotation, and layout shifts must **never** navigate or re-mount existing `iframe` elements.
4. **Authentic CSS Viewports**: Device shells and frames must remain decorative. The webpage must experience genuine CSS media queries and viewport dimensions.
5. **Deterministic Checks First**: Automated QA audits (overflow, touch targets, alt tags) must remain deterministic and fast, without requiring external LLM or vision models.
6. **Local-Only MCP Integration**: The MCP agent bridge communicates strictly over loopback (`127.0.0.1`) and requires user opt-in (`Allow agent control`).

---

## 🛠️ Local Development & Testing

1. Clone your fork locally:
   ```bash
   git clone https://github.com/HeartDev0/viewport-lab.git
   cd viewport-lab
   ```

2. Load unpacked in Chrome or Edge via `chrome://extensions` (Developer mode enabled).

3. Run the full verification suite before committing:
   ```bash
   npm test
   ```

   This verifies:
   - Manifest V3 integrity & icon assets (`npm run check`)
   - Complete privacy & zero-telemetry guarantee (`npm run privacy-check`)
   - Syntax validation for the MCP bridge (`npm run check:mcp`)
   - Zero-reload and containment regressions (`npm run check:basic` & `npm run check:phase0`)
   - UI polish & token adherence (`npm run check:phase1`)
   - Focus mode mathematical scaling (`npm run check:focus`)

---

## 🌿 Pull Request Workflow

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Keep changes focused and well-tested.
3. Verify that `npm test` passes cleanly with zero warnings or errors.
4. Write clear, imperative commit messages (e.g., `feat: add tablet rotation shortcut` or `fix: handle landscape safe area insets`).
5. Open a Pull Request with a clear summary of your changes and why they are needed.

---

## 🐛 Reporting Bugs & Suggesting Features

- **Bug Reports**: Please include the browser version (e.g. Chrome 130), operating system, steps to reproduce, and previewed website URL (or minimal HTML reproducer).
- **Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) to report sensitive issues responsibly.
