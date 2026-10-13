import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    emptyOutDir: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2500,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('/packages/ui-kit/')) {
            return 'vendor-ui-kit';
          }
          if (id.includes('/packages/shared-core/') || id.includes('/packages/api-contracts/')) {
            return 'vendor-core-contracts';
          }
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
    port: 5177,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  }
});
