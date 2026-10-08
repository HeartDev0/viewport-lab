import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const PORT = 43117;
const HOST = '127.0.0.1';
const SESSION_TTL_MS = 10_000;
const sessions = new Map();
const pending = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function readJson(req, maxBytes = 18 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function touchSession(sessionId, state = null) {
  const existing = sessions.get(sessionId) || { sessionId, queue: [], state: null, lastSeen: 0 };
  existing.lastSeen = Date.now();
  if (state) existing.state = state;
  sessions.set(sessionId, existing);
  return existing;
}

function activeSessions() {
  const now = Date.now();
  return [...sessions.values()]
    .filter(session => now - session.lastSeen <= SESSION_TTL_MS)
    .sort((a, b) => b.lastSeen - a.lastSeen);
}

function resolveSession(sessionId) {
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session || Date.now() - session.lastSeen > SESSION_TTL_MS) throw new Error(`Viewport Lab session ${sessionId} is not connected.`);
    return session;
  }
  const session = activeSessions()[0];
  if (!session) throw new Error('No active Viewport Lab window is connected. Open the extension first.');
  return session;
}

function dispatch(method, params = {}, sessionId = undefined, timeoutMs = 45_000) {
  const session = resolveSession(sessionId);
  const id = randomUUID();
  session.queue.push({ id, method, params });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Viewport Lab command timed out: ${method}`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer, sessionId: session.sessionId });
  });
}

const httpServer = createHttpServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

    if (req.method === 'POST' && url.pathname === '/bridge/heartbeat') {
      const body = await readJson(req, 512 * 1024);
      if (!body.sessionId) return json(res, 400, { error: 'sessionId is required' });
      const session = touchSession(String(body.sessionId), body.state || null);
      return json(res, 200, { ok: true, queued: session.queue.length });
    }

    if (req.method === 'GET' && url.pathname === '/bridge/next') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) return json(res, 400, { error: 'sessionId is required' });
      const session = touchSession(sessionId);
      return json(res, 200, { command: session.queue.shift() || null });
    }

    if (req.method === 'POST' && url.pathname === '/bridge/result') {
      const body = await readJson(req);
      const item = pending.get(body.id);
      if (!item) return json(res, 200, { ok: true, ignored: true });
      pending.delete(body.id);
      clearTimeout(item.timer);
      if (body.error) item.reject(new Error(String(body.error)));
      else item.resolve(body.result);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/bridge/status') {
      return json(res, 200, {
        ok: true,
        sessions: activeSessions().map(session => ({ sessionId: session.sessionId, lastSeen: session.lastSeen, state: session.state }))
      });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, 500, { error: error?.message || String(error) });
  }
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Viewport Lab bridge port ${PORT} is already in use. Please ensure no other Viewport Lab server is running.`);
  } else {
    console.error('Viewport Lab bridge server error:', err.message || err);
  }
  process.exit(1);
});

httpServer.listen(PORT, HOST, () => {
  console.error(`Viewport Lab local bridge listening on http://${HOST}:${PORT}`);
});

const deviceRef = z.union([z.string(), z.number()]).optional();
const sessionField = { sessionId: z.string().optional().describe('Viewport Lab session id. Omit to use the most recently active window.') };

function textResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function buildServer() {
  const server = new McpServer({ name: 'viewport-lab', version: '0.3.3' });

  server.registerTool('viewport_status', {
    description: 'Get the current Viewport Lab URL, devices, selection, workspace mode and agent-control state.',
    inputSchema: z.object(sessionField)
  }, async ({ sessionId }) => textResult(await dispatch('get_state', {}, sessionId)));

  server.registerTool('viewport_list_presets', {
    description: 'List device presets available in Viewport Lab.',
    inputSchema: z.object(sessionField)
  }, async ({ sessionId }) => textResult(await dispatch('list_presets', {}, sessionId)));

  server.registerTool('viewport_open_url', {
    description: 'Open an HTTP/HTTPS URL in all current responsive previews without recreating device shells.',
    inputSchema: z.object({ ...sessionField, url: z.string().min(1) })
  }, async ({ sessionId, url }) => textResult(await dispatch('open_url', { url }, sessionId)));

  server.registerTool('viewport_select_device', {
    description: 'Select a device by id, exact name, preset id or zero-based index.',
    inputSchema: z.object({ ...sessionField, device: deviceRef })
  }, async ({ sessionId, device }) => textResult(await dispatch('select_device', { device }, sessionId)));

  server.registerTool('viewport_add_device', {
    description: 'Add a preset or custom device. Maximum five simultaneous devices.',
    inputSchema: z.object({
      ...sessionField,
      presetId: z.string().optional(),
      name: z.string().optional(),
      width: z.number().int().min(240).max(1800).optional(),
      height: z.number().int().min(320).max(2200).optional()
    })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('add_device', params, sessionId)));

  server.registerTool('viewport_remove_device', {
    description: 'Remove a responsive preview device.',
    inputSchema: z.object({ ...sessionField, device: deviceRef })
  }, async ({ sessionId, device }) => textResult(await dispatch('remove_device', { device }, sessionId)));

  server.registerTool('viewport_set_device', {
    description: 'Resize, rotate or restyle a device without reloading the website.',
    inputSchema: z.object({
      ...sessionField,
      device: deviceRef,
      presetId: z.string().optional(),
      width: z.number().int().min(240).max(1800).optional(),
      height: z.number().int().min(320).max(2200).optional(),
      shell: z.enum(['pill', 'notch', 'punch', 'clean', 'tablet']).optional(),
      color: z.enum(['graphite', 'silver', 'blue', 'warm']).optional(),
      name: z.string().optional(),
      rotate: z.boolean().optional()
    })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('set_device', params, sessionId)));

  server.registerTool('viewport_set_workspace', {
    description: 'Change Viewport Lab workspace layout, Crisp/Fit mode, zoom or virtual 1080p/1440p/4K canvas.',
    inputSchema: z.object({
      ...sessionField,
      layout: z.enum(['grid', 'row', 'focus', 'free']).optional(),
      viewMode: z.enum(['crisp', 'fit']).optional(),
      zoom: z.number().min(.5).max(1.5).optional(),
      resolution: z.enum(['auto', '1080', '1440', '4k', 'custom']).optional(),
      workspaceWidth: z.number().int().min(900).max(7680).optional(),
      workspaceHeight: z.number().int().min(600).max(4320).optional()
    })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('set_workspace', params, sessionId)));

  server.registerTool('viewport_run_checks', {
    description: 'Run deterministic responsive QA checks such as overflow, clipped text, touch targets, missing alt text and form labels. No AI model is used.',
    inputSchema: z.object({ ...sessionField, device: deviceRef, all: z.boolean().optional() })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('run_checks', params, sessionId, 60_000)));

  server.registerTool('viewport_inspect_page', {
    description: 'Inspect page metadata, viewport/document dimensions, accessible CSS breakpoints, landmarks and responsive issues for one device.',
    inputSchema: z.object({ ...sessionField, device: deviceRef })
  }, async ({ sessionId, device }) => textResult(await dispatch('inspect_page', { device }, sessionId)));

  server.registerTool('viewport_inspect_element', {
    description: 'Inspect one element by CSS selector, returning bounds, text and relevant computed styles.',
    inputSchema: z.object({ ...sessionField, device: deviceRef, selector: z.string().min(1) })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('inspect_element', params, sessionId)));

  server.registerTool('viewport_click', {
    description: 'Click an element inside a preview by CSS selector. Intended for local development/QA automation.',
    inputSchema: z.object({ ...sessionField, device: deviceRef, selector: z.string().min(1) })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('click', params, sessionId)));

  server.registerTool('viewport_fill', {
    description: 'Fill a text/select control by CSS selector and fire input/change events. Password fields are blocked.',
    inputSchema: z.object({ ...sessionField, device: deviceRef, selector: z.string().min(1), value: z.union([z.string(), z.number(), z.boolean()]) })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('fill', params, sessionId)));

  server.registerTool('viewport_press', {
    description: 'Dispatch a keyboard key to the active element or a CSS-selected element in a preview.',
    inputSchema: z.object({ ...sessionField, device: deviceRef, selector: z.string().optional(), key: z.string().min(1) })
  }, async ({ sessionId, ...params }) => textResult(await dispatch('press', params, sessionId)));

  server.registerTool('viewport_sweep', {
    description: 'Resize one live preview through common responsive widths and run checks at every width without reloading the page.',
    inputSchema: z.object({ ...sessionField, device: deviceRef })
  }, async ({ sessionId, device }) => textResult(await dispatch('sweep', { device }, sessionId, 120_000)));

  server.registerTool('viewport_reload', {
    description: 'Reload one device or all devices. This is an explicit reload action.',
    inputSchema: z.object({ ...sessionField, device: deviceRef })
  }, async ({ sessionId, device }) => textResult(await dispatch('reload', { device }, sessionId)));

  server.registerTool('viewport_screenshot', {
    description: 'Capture the visible Viewport Lab workspace or one device as a PNG so an agent can visually inspect the result.',
    inputSchema: z.object({
      ...sessionField,
      scope: z.enum(['workspace', 'selected', 'device']).default('selected'),
      device: deviceRef
    })
  }, async ({ sessionId, ...params }) => {
    const result = await dispatch('capture', params, sessionId, 60_000);
    if (!result?.ok || !result.base64) return textResult(result);
    return {
      content: [
        { type: 'image', data: result.base64, mimeType: result.mimeType || 'image/png' },
        { type: 'text', text: JSON.stringify({ width: result.width, height: result.height, scope: params.scope }, null, 2) }
      ]
    };
  });

  return server;
}

void serveStdio(buildServer);
console.error('Viewport Lab MCP server ready on stdio.');

process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
