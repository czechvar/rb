/**
 * Pure URL → (cleanUrl, code or null) helper. Keeps src/proxy.ts thin
 * and lets us int-test the capture logic without Next request machinery.
 *
 * - Returns null when the URL has no `?ref` param (no work to do).
 * - Returns { code, cleanUrl } when `?ref` was present and resolved to an
 *   active referral (proxy should set the cookie + redirect to cleanUrl).
 * - Returns { code: null, cleanUrl } when `?ref` was present but unknown
 *   or inactive (proxy should NOT set a cookie but should still redirect
 *   to strip the bad code from the URL).
 */
export async function resolveReferralFromQuery(
  url: URL,
  lookupByCode: (code: string) => Promise<{ code: string } | null>,
): Promise<
  | null
  | { code: string; cleanUrl: string }
  | { code: null; cleanUrl: string }
> {
  const raw = url.searchParams.get('ref')
  if (raw === null) return null

  const code = raw.trim().toUpperCase()
  const cleaned = new URL(url.toString())
  cleaned.searchParams.delete('ref')
  const cleanUrl = cleaned.toString().replace(/\?$/, '')

  if (!code) return { code: null, cleanUrl }

  const found = await lookupByCode(code)
  if (!found) return { code: null, cleanUrl }
  return { code: found.code, cleanUrl }
}

export const REFERRAL_COOKIE_NAME = 'rb_ref'
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
