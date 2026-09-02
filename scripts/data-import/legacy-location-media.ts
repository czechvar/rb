export type LegacyLocationMediaRecord = {
  slug: string
  title: string
  legacyLocationId: number
  legacyMediaId: number | null
  originalName: string | null
  providerReference: string | null
  contentType: string | null
  width: number | null
  height: number | null
  sourceUrl: string | null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findLegacyUploadUrl(
  html: string,
  providerReference: string | null | undefined,
): string | null {
  const uploadUrls = Array.from(
    new Set(
      html
        .replaceAll('&amp;', '&')
        .match(/\/uploads\/media\/default\/[^"'()\s<>]+/g)
        ?.map((url) => url.trim()) ?? [],
    ),
  )

  if (!providerReference) return uploadUrls[0] ?? null

  const exactReference = new RegExp(`(?:^|/)${escapeRegExp(providerReference)}(?:$|[?#])`)
  const exact = uploadUrls.find((url) => exactReference.test(url))
  if (exact) return exact

  const looseReference = providerReference.replace(/\.[a-z0-9]+$/i, '')
  return uploadUrls.find((url) => url.includes(looseReference)) ?? null
}
