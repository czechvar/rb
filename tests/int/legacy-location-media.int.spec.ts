import { describe, expect, it } from 'vitest'
import { findLegacyUploadUrl } from '../../scripts/data-import/legacy-location-media'

describe('legacy location media helpers', () => {
  it('finds the exact legacy upload URL for a provider reference in page HTML', () => {
    const html = `
      <style>
        .hero { background-image: url('/uploads/media/default/0001/02/297783ff6edf827af12460f305cd392964bfed64.jpeg'); }
      </style>
      <img src="/uploads/media/default/0001/01/other.jpeg">
    `

    expect(findLegacyUploadUrl(html, '297783ff6edf827af12460f305cd392964bfed64.jpeg')).toBe(
      '/uploads/media/default/0001/02/297783ff6edf827af12460f305cd392964bfed64.jpeg',
    )
  })
})
