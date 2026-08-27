export function normalizeActionHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const href = value.trim()
  if (!href) return ''
  if (href.startsWith('/') && !href.startsWith('//')) return href

  try {
    return new URL(href).protocol === 'https:' ? href : null
  } catch {
    return null
  }
}

export function isSafeActionHref(value: unknown): value is string {
  return normalizeActionHref(value) !== null
}
