import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // Authoritative manifest at public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigationPreload: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-media-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60
              }
            }
          },
          {
            // Offline clinical lookups: tests, drug catalog, ICD-10, specialties
            urlPattern: /\/api\/v1\/(?:partner\/(?:catalog|profile|medicines|tests|specialties|icd10)|catalog)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'docsearch-offline-catalogs',
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          },
          {
            // Hospital Doctor Roster & Bed Inventory Layout
            urlPattern: /\/api\/v1\/(?:partner\/(?:roster|beds|facilities|departments))/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'docsearch-hospital-metadata',
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 3
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@docsearch/ui-kit/styles/themes.css': path.resolve(__dirname, '../../packages/ui-kit/src/styles/themes.css'),
      '@docsearch/ui-kit/styles/base.css': path.resolve(__dirname, '../../packages/ui-kit/src/styles/base.css'),
      '@docsearch/ui-kit': path.resolve(__dirname, '../../packages/ui-kit/src/index.ts'),
      '@docsearch/api-contracts': path.resolve(__dirname, '../../packages/api-contracts/src/index.ts'),
      '@docsearch/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@docsearch/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@docsearch/shared-core': path.resolve(__dirname, '../../packages/shared-core/src/index.ts')
    }
  },
  build: {
    target: 'es2022',
    outDir: 'dist/bundle',
    emptyOutDir: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2500,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. React Runtime Core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // 2. Lucide Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // 3. Workbox PWA Engine
          if (id.includes('node_modules/workbox') || id.includes('workbox-window')) {
            return 'vendor-workbox';
          }
          // 4. UI Kit Framework & Themes
          if (id.includes('/packages/ui-kit/')) {
            return 'vendor-ui-kit';
          }
          // 5. Core Contracts & Schemas
          if (id.includes('/packages/shared-core/') || id.includes('/packages/api-contracts/')) {
            return 'vendor-core-contracts';
          }
          // 6. Common Shell Overlays, Command Palettes & Docks
          if (id.includes('/apps/partner-platform/src/components/common/') || id.includes('/apps/partner-platform/src/components/security/')) {
            return 'chunk-shell-widgets';
          }
          // 7. Clinical Client Services & Local Event Hubs (unified to avoid circular chunking)
          if (id.includes('/apps/partner-platform/src/services/') || id.includes('/apps/partner-platform/src/utils/')) {
            return 'chunk-partner-core-services';
          }
          // 8. Generic Third-Party Vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**']
    },
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  }
});
