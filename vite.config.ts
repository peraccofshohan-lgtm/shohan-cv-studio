import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Vite is used for two targets:
 *  - Electron desktop build (relative base, so it loads from file://)
 *  - Browser/test preview build (absolute root) used by CI and the sandbox live preview.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // The Arena live-preview proxy forwards requests from a *.e2b.app origin.
    // Allowing all hosts keeps the preview working without weakening the
    // offline product (the desktop build never opens a listener).
    allowedHosts: true,
    cors: true,
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: {
    outDir: 'dist',
    target: 'es2019', // inside Electron 22 (Chromium 108) — never newer than the runtime
    sourcemap: true,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          docx: ['docx'],
          sqlite: ['sql.js'],
          vendor: ['react', 'react-dom', 'zustand', 'zod'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    testTimeout: 30000,
  },
} as any);
