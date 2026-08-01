import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'ExamEdge AI',
        short_name: 'ExamEdge',
        description: 'AI-powered APPSC & TGPSC Exam Preparation Platform',
        theme_color: '#131826',
        background_color: '#131826',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell (HTML, CSS, JS)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for API responses (notes, history)
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:5001\/api\/history/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'examedge-history-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^http:\/\/localhost:5001\/api\/ai\/notes/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'examedge-notes-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 2 }, // 2h
            },
          },
        ],
        // Offline fallback page
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false, // disable SW in dev to avoid cache confusion
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Code-split large chunks to fix the >500kB warning
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'react-markdown', 'remark-gfm'],
          pdf: ['jspdf'],
          sentry: ['@sentry/react'],
        },
      },
    },
  },
})

