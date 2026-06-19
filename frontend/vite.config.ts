import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Same-origin topology: the front calls relative /api/... paths.
// In dev, Vite proxies them to the NestJS API (which now uses setGlobalPrefix('api')).
// Target is overridable so the same config works on the host (localhost) and
// inside Docker (service name, e.g. http://api:3005).
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3005';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
