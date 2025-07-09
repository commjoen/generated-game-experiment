import { defineConfig } from 'vite';

export default defineConfig({
  base: '/platformer-game-1/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
}); 