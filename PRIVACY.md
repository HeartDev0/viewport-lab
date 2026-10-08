# Viewport Lab Privacy

Viewport Lab is designed around local processing.

## The extension does not operate a backend

The extension source contains no analytics SDK, advertising SDK, telemetry service, remote JavaScript, CDN dependency or Viewport Lab cloud API.

Website requests still go to the website you choose to test. They are not proxied through a Viewport Lab server.

## Local storage

Device presets, workspace preferences, tutorial state and saved workspaces are stored with `chrome.storage.local`.

## Website access

Viewport Lab requests `<all_urls>` because its purpose is to render and inspect websites inside responsive development viewports. Compatibility mode can remove frame-blocking response headers inside the Viewport Lab tab.

## Optional local MCP bridge

Viewport Lab can connect to `http://127.0.0.1:43117` when the separate MCP helper is running. This is a loopback connection on the same computer, not an internet service.

The extension sends a lightweight heartbeat so the local MCP process can discover the open Viewport Lab window. Detailed page information is returned only when a connected agent explicitly calls an inspection/testing tool and **Allow agent control** is enabled.

The MCP fill command refuses password inputs.

If the MCP helper is not running, the extension continues to work normally.
