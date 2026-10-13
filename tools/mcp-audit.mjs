import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../mcp/server.mjs');

let messageId = 1;

function runServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let tools = [];

    let buffer = '';
    proc.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.result && msg.result.tools) {
            tools = msg.result.tools;
            proc.kill();
            resolve(tools);
          }
        } catch (e) {
          // Ignore parse errors from partial lines
        }
      }
    });

    proc.stderr.on('data', (data) => {
      // Ignore stderr
    });

    proc.on('error', reject);

    // Initialize
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' }
      }
    }) + '\n');

    // Request tools
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: messageId++,
      method: 'tools/list'
    }) + '\n');
  });
}

async function audit() {
  console.log('Running MCP audit...');
  try {
    const tools = await runServer();
    if (!tools || tools.length !== 17) {
      console.error(`Expected 17 tools, found ${tools ? tools.length : 0}`);
      process.exit(1);
    }

    for (const tool of tools) {
      const ann = tool.annotations;
      if (!ann) {
        console.error(`Tool ${tool.name} is missing annotations`);
        process.exit(1);
      }

      const hints = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];
      for (const hint of hints) {
        if (typeof ann[hint] !== 'boolean') {
          console.error(`Tool ${tool.name} is missing ${hint} or it's not a boolean`);
          process.exit(1);
        }
      }
    }

    console.log('✓ All 17 tools have correctly typed readOnlyHint, destructiveHint, idempotentHint, and openWorldHint annotations');
    process.exit(0);
  } catch (error) {
    console.error('MCP audit failed:', error);
    process.exit(1);
  }
}

audit();
