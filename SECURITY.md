# Security

Viewport Lab intentionally has broad host access because responsive previewing and inspection are its core purpose. The project therefore keeps its runtime architecture deliberately small and auditable.

## Browser isolation

Compatibility mode removes frame-blocking headers only for sub-frame responses inside the specific Viewport Lab tab through temporary Manifest V3 session rules.

## MCP bridge

The optional MCP bridge binds to `127.0.0.1` only. It does not listen on LAN/WAN interfaces. Agent interaction commands are rejected unless **Allow agent control** is enabled in the extension.

The bridge can intentionally click/fill controls in preview pages for QA automation. Do not enable agent control while viewing a sensitive authenticated site unless you trust the local MCP host/agent you configured.

Password fields are blocked from the fill tool.

## Reporting

Please report security issues privately to the project maintainer before publishing exploit details.
