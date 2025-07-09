import { defineConfig } from 'vite';

// Use VITE_BASE_PATH env variable for base path, default to '/'
// Example: VITE_BASE_PATH=/platformer-game-1/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
}); 