import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pure rendering only. Do not load the integration setup or any environment file.
export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['tests/unit/checkout*.test.ts', 'tests/unit/checkout*.test.tsx', 'tests/unit/contact*.test.ts', 'tests/unit/contact*.test.tsx', 'tests/int/sitemap.int.spec.ts', 'tests/unit/guide-grid.test.ts', 'tests/unit/route-progress.test.tsx', 'tests/unit/blog-page.test.tsx', 'tests/unit/blog-index.test.ts', 'tests/unit/trip-booking.test.tsx', 'tests/unit/trip-dates-query.test.ts', 'tests/unit/trip-content.test.tsx', 'tests/unit/trip-page.test.tsx', 'tests/unit/trip-gallery.test.tsx', 'tests/unit/editorial-heading.test.tsx', 'tests/unit/trip-editorial-blocks.test.tsx', 'tests/unit/trip-editorial.test.ts', 'tests/unit/trip-editorial-render.test.tsx', 'tests/unit/trip-editorial-commercial.test.tsx'], setupFiles: [] },
})
