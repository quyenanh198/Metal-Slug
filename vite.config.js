import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5174,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
