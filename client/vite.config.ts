// @ts-nocheck — Vite config; relies on Node built-ins at build time.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

/** Vite dev server talks to the API only through `server.proxy` — no hardcoded API URL in app code. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '');
  const apiOrigin = env.VITE_API_ORIGIN || 'http://localhost:5216';
  const devPort = Number.parseInt(env.VITE_DEV_PORT || '5173', 10);

  return {
    server: {
      port: Number.isFinite(devPort) && devPort > 0 ? devPort : 5173,
      strictPort: false,
      headers: {
        'Cache-Control': 'no-store',
      },
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/hubs': {
          target: apiOrigin,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
