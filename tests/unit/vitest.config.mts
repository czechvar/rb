import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pure rendering only. Do not load the integration setup or any environment file.
export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['tests/unit/trip-booking.test.tsx', 'tests/unit/trip-dates-query.test.ts', 'tests/unit/trip-content.test.tsx', 'tests/unit/trip-page.test.tsx', 'tests/unit/trip-gallery.test.tsx'], setupFiles: [] },
})
