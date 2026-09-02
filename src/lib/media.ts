import type { Media } from '@/payload-types'

type Reffed = number | string | Media | null | undefined

export function mediaUrl(media: Reffed): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  return media.url ?? undefined
}

export function mediaAlt(media: Reffed): string {
  if (!media || typeof media !== 'object') return ''
  return media.alt ?? ''
}

export function mediaDimensions(media: Reffed): { width?: number; height?: number } {
  if (!media || typeof media !== 'object') return {}
  return { width: media.width ?? undefined, height: media.height ?? undefined }
}
