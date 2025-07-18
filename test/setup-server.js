import { beforeAll, afterAll } from 'vitest';
const { spawn } = require('child_process');
const fetch = require('node-fetch');

let serverProcess;

async function waitForServer(url, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Server did not start in time');
}

beforeAll(async () => {
  serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
  await waitForServer('http://localhost:3001/health');
});

afterAll(() => {
  if (serverProcess) {
    serverProcess.kill();
  }
}); 