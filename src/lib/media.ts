import type { Media } from '@/payload-types'

type Reffed = number | Media | null | undefined

export function mediaUrl(media: Reffed): string | undefined {
  if (!media || typeof media === 'number') return undefined
  return media.url ?? undefined
}

export function mediaAlt(media: Reffed): string {
  if (!media || typeof media === 'number') return ''
  return media.alt ?? ''
}

export function mediaDimensions(media: Reffed): { width?: number; height?: number } {
  if (!media || typeof media === 'number') return {}
  return { width: media.width ?? undefined, height: media.height ?? undefined }
}
