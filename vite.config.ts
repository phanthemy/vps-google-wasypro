import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
            output: {
        entryFileNames: 'assets/[name]-[hash]-wk.js',
        chunkFileNames: 'assets/[name]-[hash]-wk.js',
        assetFileNames: 'assets/[name]-[hash]-wk.[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor';
            return 'vendor-libs';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 5175,
    open: false,
  },
});
