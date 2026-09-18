import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Root-absolute: the site is served from the root of its domain behind an SPA fallback. A relative base
  // made /benchmark/ (trailing slash) request /benchmark/assets/... and receive index.html instead.
  base: '/',
  plugins: [react()],
  test: { environment: 'node', globals: true },
});
