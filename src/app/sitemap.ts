import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'
import { buildSitemap } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  return buildSitemap(payload)
}
