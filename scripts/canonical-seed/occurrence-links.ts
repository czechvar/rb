/** Only internal trip selection URLs carry portable Event Date IDs. */
export function remapOccurrenceHref(value: string, ids: Map<string, string | number>): string {
  if (!/^\/trips\/[^?#]+\?/.test(value)) return value
  return value.replace(/([?&]date=)(\d+)(?=&|#|$)/g, (match, prefix, id) => {
    const mapped = ids.get(id)
    return mapped === undefined ? match : `${prefix}${mapped}`
  })
}

export function hasOccurrenceHref(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasOccurrenceHref)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) =>
    key === 'href' && typeof child === 'string'
      ? /^\/trips\/[^?#]+\?/.test(child) && /[?&]date=\d+(?=&|#|$)/.test(child)
      : hasOccurrenceHref(child),
  )
}
