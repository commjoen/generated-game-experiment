import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';
import net from 'net';
import { execSync } from 'child_process';

let serverProcess: ChildProcess | undefined;
let startedByManager = false;
let isReady = false;
let testPort: number | undefined;

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function killProcessOnPort(port: number) {
  try {
    // macOS and Linux
    const pid = execSync(`lsof -ti tcp:${port}`).toString().trim();
    if (pid) {
      execSync(`kill -9 ${pid}`);
    }
  } catch (e) {
    // Ignore if nothing to kill
  }
}

async function waitForServer(url: string, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

export async function setupServer() {
  if (isReady) return;
  if (!testPort) {
    testPort = await getFreePort();
  }
  await killProcessOnPort(testPort);
  const isRunning = await waitForServer(`http://localhost:${testPort}/health`, 1000);
  if (!isRunning) {
    serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test', PORT: String(testPort) },
    });
    startedByManager = true;
    const started = await waitForServer(`http://localhost:${testPort}/health`, 5000);
    if (!started) throw new Error(`Server did not start in time on port ${testPort}`);
  }
  isReady = true;
}

export async function teardownServer() {
  if (serverProcess && startedByManager) {
    serverProcess.kill();
    serverProcess = undefined;
    isReady = false;
    startedByManager = false;
  }
}

export function getTestPort() {
  if (!testPort) throw new Error('Test port not set. Call setupServer() first.');
  return testPort;
} 