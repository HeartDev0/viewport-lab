# Viewport Lab MCP bridge

This folder exposes the open Viewport Lab extension window to MCP-capable coding agents. The extension itself contains no model and no cloud AI integration.

## Install

Requirements: Node.js 20+.

```bash
cd mcp
npm install
```

## Start through an MCP host

Configure the host to launch:

```text
node /absolute/path/to/viewport-lab-extension/mcp/server.mjs
```

The process uses **stdio for MCP** and also binds a private bridge on **127.0.0.1:43117**. Viewport Lab polls that loopback address while it is open.

In the extension, enable **Allow agent control**. Without that switch, only basic state/preset discovery is allowed.

## Exposed tools

- `viewport_status`
- `viewport_list_presets`
- `viewport_open_url`
- `viewport_select_device`
- `viewport_add_device`
- `viewport_remove_device`
- `viewport_set_device`
- `viewport_set_workspace`
- `viewport_run_checks`
- `viewport_inspect_page`
- `viewport_inspect_element`
- `viewport_click`
- `viewport_fill`
- `viewport_press`
- `viewport_sweep`
- `viewport_reload`
- `viewport_screenshot`

`viewport_screenshot` lets multimodal agents actually see the workspace/device. The deterministic check tools do not require vision or an AI model.

## Privacy and security

The HTTP bridge binds to `127.0.0.1` only. It is not reachable from another computer on the network. No Viewport Lab server exists on the internet.

Agents can interact with pages only when **Allow agent control** is enabled. Password fields are intentionally blocked by the fill tool.
