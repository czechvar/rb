import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

/** Pure editorial/render fixtures: no database initialization or environment loading. */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/trip-*.test.{ts,tsx}', 'tests/unit/editorial-heading.test.tsx'],
    exclude: ['tests/unit/trip-detail.test.ts', 'tests/unit/trip-layout.test.ts'],
  },
})
