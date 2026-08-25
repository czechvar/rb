import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  BLOCK_DEMO_MEDIA_FILENAME,
  BLOCK_DEMO_PAGE_SLUG,
  BLOCK_DEMO_MARKER,
  LEGACY_BLOCK_DEMO_MEDIA_FILENAMES,
  LEGACY_BLOCK_DEMO_PAGE_SLUG,
} from '../src/lib/block-demo'

const PRODUCTION_NEON_HOST = 'ep-weathered-pine-alvc3sdj'

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  if (databaseUrl.includes(PRODUCTION_NEON_HOST)) {
    throw new Error('Refusing to clean block demo data against the production database.')
  }

  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'pages',
    where: { slug: { in: [BLOCK_DEMO_PAGE_SLUG, LEGACY_BLOCK_DEMO_PAGE_SLUG] } },
  })

  await payload.delete({
    collection: 'media',
    where: {
      filename: { in: [BLOCK_DEMO_MEDIA_FILENAME, ...LEGACY_BLOCK_DEMO_MEDIA_FILENAMES] },
    },
  })

  console.log(`Cleaned block demo records marked ${BLOCK_DEMO_MARKER}.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('cleanup failed:', err)
    process.exit(1)
  })
