import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// 1×1 transparent PNG
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=',
  'base64',
)

describe('media collection', () => {
  it('stores an uploaded image', async () => {
    const payload = await getTestPayload()
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'test image' },
      file: {
        data: tinyPng,
        mimetype: 'image/png',
        name: `t-${Date.now()}.png`,
        size: tinyPng.length,
      },
    })
    expect(media.id).toBeDefined()
    expect(media.alt).toBe('test image')
  })
})
