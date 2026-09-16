import { expect, it } from 'vitest'
import { rockbustersTheme } from '@/lib/theme/themePresets'

it('uses the dark Rockbusters surface as the website default', () => {
  expect(rockbustersTheme['--theme-color-page-bg']).toBe('var(--theme-color-ink)')
  expect(rockbustersTheme['--theme-color-page-text']).toBe('var(--theme-color-paper)')
  expect(rockbustersTheme['--theme-color-breadcrumb-bg']).toBe(
    'var(--theme-color-page-bg)',
  )
})
