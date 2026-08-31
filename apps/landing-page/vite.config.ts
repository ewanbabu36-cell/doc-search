import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    emptyOutDir: false
  },
  server: {
    port: 5175,
    open: true
  }
});
