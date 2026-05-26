/**
 * Returns the path if it is a safe, same-origin path (starts with a single
 * `/`, no protocol, no protocol-relative `//`, no backslashes). Else null.
 * Use in any flow that takes a post-action redirect from a query param.
 */
export function sanitizeRedirect(from: string | null | undefined): string | null {
  if (!from) return null
  if (typeof from !== 'string') return null
  if (!from.startsWith('/')) return null
  if (from.startsWith('//')) return null
  if (from.includes('\\')) return null
  if (from.includes(':')) return null
  return from
}
