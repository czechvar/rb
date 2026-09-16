import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'
import { buildSitemap } from '@/lib/sitemap'

// Metadata routes are cached by default. Refresh this one hourly so crawlers do
// not rebuild the full Payload-backed sitemap on every request while published
// CMS changes still become discoverable without a new deployment.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  return buildSitemap(payload)
}
