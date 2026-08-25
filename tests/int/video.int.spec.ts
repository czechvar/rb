import { describe, expect, it } from 'vitest'
import { safeVideoUrl } from '@/lib/video'

describe('safeVideoUrl', () => {
  it('normalizes supported Vimeo and YouTube URLs to iframe embed URLs', () => {
    expect(safeVideoUrl('https://vimeo.com/123456')).toBe(
      'https://player.vimeo.com/video/123456',
    )
    expect(safeVideoUrl('https://player.vimeo.com/video/123456')).toBe(
      'https://player.vimeo.com/video/123456',
    )
    expect(safeVideoUrl('https://www.youtube.com/watch?v=abc123XYZ_-')).toBe(
      'https://www.youtube.com/embed/abc123XYZ_-',
    )
    expect(safeVideoUrl('https://youtu.be/abc123XYZ_-')).toBe(
      'https://www.youtube.com/embed/abc123XYZ_-',
    )
  })

  it('rejects unsafe protocols, unknown hosts, and lookalike domains', () => {
    expect(safeVideoUrl('http://vimeo.com/123456')).toBeNull()
    expect(safeVideoUrl('https://example.com/123456')).toBeNull()
    expect(safeVideoUrl('https://fakevimeo.com/123456')).toBeNull()
    expect(safeVideoUrl('https://notyoutube.com/watch?v=abc123XYZ_-')).toBeNull()
  })
})
