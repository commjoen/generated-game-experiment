import { defineConfig } from 'vite';
import viteSRI from 'vite-plugin-sri';

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
}); 