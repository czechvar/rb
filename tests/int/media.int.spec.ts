import { afterEach, describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// 1×1 transparent PNG
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=',
  'base64',
)

describe('media collection', () => {
  const createdMediaIds: string[] = []

  afterEach(async () => {
    const payload = await getTestPayload()
    await Promise.all(
      createdMediaIds.splice(0).map((id) =>
        payload.delete({
          collection: 'media',
          id,
        }),
      ),
    )
  })

  it('stores an uploaded image', async () => {
    const payload = await getTestPayload()
    const id = `test-media-${Date.now()}`
    const media = await payload.create({
      collection: 'media',
      data: { id, alt: 'test image' },
      file: {
        data: tinyPng,
        mimetype: 'image/png',
        name: `t-${Date.now()}.png`,
        size: tinyPng.length,
      },
    })
    createdMediaIds.push(media.id)
    expect(media.id).toBe(id)
    expect(media.alt).toBe('test image')
    expect(media.filename).toMatch(/^t-\d+\.png$/)
    expect(media.url).toBeDefined()
  })
})
