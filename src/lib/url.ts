export function siteUrl(pathname = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  if (!base) throw new Error('NEXT_PUBLIC_SITE_URL is not set')
  const trimmed = base.replace(/\/+$/, '')
  if (!pathname) return trimmed
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${trimmed}${path}`
}
