import { defineConfig } from 'vite';
import viteSRI from 'vite-plugin-sri';
import { execSync } from 'child_process';

function safeGit(cmd: string, fallback: string) {
  try {
    return execSync(cmd).toString().trim();
  } catch (e) {
    console.warn(`[vite.config.ts] Failed to run '${cmd}': ${e}`);
    return fallback;
  }
}

const version = require('./package.json').version || 'unknown';
const commit = safeGit('git rev-parse --short HEAD', 'unknown');
const branch = safeGit('git rev-parse --abbrev-ref HEAD', 'unknown');
const tag = safeGit('git describe --tags --abbrev=0', 'none');

// Use VITE_BASE_PATH env variable for base path, default to '/'
// Example: VITE_BASE_PATH=/generated-game-experiment/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    viteSRI({
      algorithms: ['sha384'],
    }),
  ],
  server: {
    open: true,
  },
  define: {
    __VERSION__: JSON.stringify(version),
    __COMMITHASH__: JSON.stringify(commit),
    __BRANCH__: JSON.stringify(branch),
    __GITTAG__: JSON.stringify(tag),
  },
}); 