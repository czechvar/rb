export function normalizeActionHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const href = value.trim()
  if (!href) return ''
  // Contact actions accept only a plain recipient/number, never injected headers.
  if (/^mailto:[A-Za-z0-9.!#$&'*+\/=_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(href)) return href
  if (/^tel:\+[0-9]{7,15}$/.test(href)) return href
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
