import { defineConfig } from 'vite';

export default defineConfig({
  root: 'wasypro-ctv',
  build: {
    outDir: 'dist',
  },
  preview: {
    port: 5999,
    host: '0.0.0.0',
  },
});
