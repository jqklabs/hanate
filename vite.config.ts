import { defineConfig, type Plugin } from 'vite';

/** 로컬에서만. `HWATRO_GEO=JP npm run dev` 로 첫 방문 자동 언어를 흉내낸다. */
function geoDevPlugin(): Plugin {
  return {
    name: 'hwatro-geo-dev',
    configureServer(server) {
      server.middlewares.use('/api/geo', (_req, res, next) => {
        const country = process.env.HWATRO_GEO;
        if (!country) return next();
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ country: String(country).toUpperCase() }));
      });
    },
  };
}

export default defineConfig({
  plugins: [geoDevPlugin()],
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
