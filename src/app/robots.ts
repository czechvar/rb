import type { MetadataRoute } from 'next'

// Opt-in, not opt-out. beta.rockbusters.net is a *production* deployment of the
// devel branch, so VERCEL_ENV can't tell it apart from the live site — and
// Vercel sends no noindex header of its own once a custom domain is attached.
// Nothing is indexable until SITE_INDEXABLE is explicitly turned on at go-live.
// Paired with the X-Robots-Tag header in next.config.ts.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXABLE !== 'true') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return { rules: { userAgent: '*', allow: '/' } }
}
