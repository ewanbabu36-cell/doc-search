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
      '@docsearch/shared-core': path.resolve(__dirname, '../../packages/shared-core/src/index.ts')
    }
  },
  build: {
    outDir: 'dist/bundle',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        }
      }
    }
  },
  server: {
    port: 5175,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  }
});
