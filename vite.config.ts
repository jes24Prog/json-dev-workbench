import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'JSON Developer Workbench',
        short_name: 'JSON Workbench',
        description:
          'A comprehensive, privacy-first JSON developer toolkit that runs entirely in your browser.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          codemirror: [
            '@uiw/react-codemirror',
            '@codemirror/autocomplete',
            '@codemirror/lang-json',
            '@codemirror/lang-markdown',
            '@codemirror/lang-sql',
            '@codemirror/lang-xml',
            '@codemirror/lang-yaml',
            '@codemirror/search',
            '@codemirror/view',
          ],
          parsers: ['ajv', 'ajv-formats', 'fast-xml-parser', 'js-yaml', 'papaparse', 'jsonpath-plus'],
          dexie: ['dexie'],
        },
      },
    },
  },
});
