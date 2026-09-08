import sharp from 'sharp'

const images = [
  'http://localhost:3333/api/media/file/000310-0dfbd9cc23f43f19acde5ace8b16a391a5b625dc.jpeg',
  'http://localhost:3333/api/media/file/000311-32a2039159c1aee3a9b0b6ea25b5925fd29519d9.jpeg',
  'http://localhost:3333/api/media/file/000312-ac53dd4f6110ac6e75e2ccf4cc0eb960deb7568f.jpeg',
  'http://localhost:3333/api/media/file/000313-5e2b54fe04c79f56c5a0f32f08b8f0dd3dbeb858.jpeg',
]

const tileWidth = 400
const tileHeight = 600

async function main() {
  const tiles = await Promise.all(images.map(async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
    return sharp(Buffer.from(await response.arrayBuffer()))
      .resize(tileWidth, tileHeight, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 92 })
      .toBuffer()
  }))

  await sharp({
    create: { width: tileWidth * tiles.length + tiles.length - 1, height: tileHeight, channels: 3, background: '#090909' },
  })
    .composite(tiles.map((input, index) => ({ input, left: index * (tileWidth + 1), top: 0 })))
    .jpeg({ quality: 92 })
    .toFile('.artifacts/albarracin-gallery-review.png')

}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
