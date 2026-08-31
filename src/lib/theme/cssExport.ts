import type { ThemeName } from './tokenRegistry'

export function formatThemeOverrides(theme: ThemeName, overrides: Record<string, string>) {
  const entries = Object.entries(overrides).filter(([, value]) => value.trim().length > 0)

  if (entries.length === 0) {
    return ''
  }

  const selector = `.theme-${theme}`
  const body = entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')

  return `${selector} {\n${body}\n}`
}
