import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // lib / Assets / vendor 는 페이지에서 루트 경로로 참조한다
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks(id) {
          if (id.includes('/src/engine/')) return 'engine';
          if (id.includes('/src/platform/spine')) return 'spine';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
