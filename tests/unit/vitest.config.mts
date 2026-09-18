import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pure rendering only. Do not load the integration setup or any environment file.
export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['tests/unit/trip-variant-schema.test.ts', 'tests/unit/home-page.test.tsx', 'tests/unit/theme-defaults.test.ts', 'tests/unit/trip-category-seed.test.ts', 'tests/unit/catalogue-category-links.test.ts', 'tests/unit/legacy-redirect-decisions.test.ts', 'tests/unit/checkout*.test.ts', 'tests/unit/checkout*.test.tsx', 'tests/unit/cms-page-canonical.test.ts', 'tests/unit/hub-page-canonical.test.ts', 'tests/unit/contact*.test.ts', 'tests/unit/contact*.test.tsx', 'tests/int/sitemap.int.spec.ts', 'tests/unit/guide-grid.test.ts', 'tests/unit/location-country-tiles.test.tsx', 'tests/unit/route-progress.test.tsx', 'tests/unit/blog-page.test.tsx', 'tests/unit/blog-index.test.ts', 'tests/unit/trip-booking.test.tsx', 'tests/unit/trip-dates-query.test.ts', 'tests/unit/trip-content.test.tsx', 'tests/unit/trip-page.test.tsx', 'tests/unit/trip-gallery.test.tsx', 'tests/unit/editorial-heading.test.tsx', 'tests/unit/trip-editorial-blocks.test.ts', 'tests/unit/trip-editorial.test.ts', 'tests/unit/trip-editorial-render.test.tsx', 'tests/unit/trip-editorial-commercial.test.tsx', 'tests/unit/media-upload-config.test.ts'], setupFiles: [] },
})
