/** Persistent English CMS copy; reruns preserve editor changes unless --replace is explicit. */
import './env'
import fs from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import type { Page } from '../../src/payload-types'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL missing')
  const hostname = new URL(databaseUrl).hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname))
    throw new Error('Local database required')
  if (process.env.PAYLOAD_DISABLE_DB_PUSH !== 'true')
    throw new Error('Disable schema push before seeding')

  const { row } = JSON.parse(
    await fs.readFile(new URL('./seed/terms-page.json', import.meta.url), 'utf8'),
  )
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'terms-and-conditions' } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (docs[0] && !process.argv.includes('--replace')) {
    console.log('English terms page: preserved existing CMS record')
    return
  }

  const data = row as Omit<Page, 'id' | 'createdAt' | 'updatedAt'>
  const saved = docs[0]
    ? await payload.update({ collection: 'pages', id: docs[0].id, data, overrideAccess: true })
    : await payload.create({ collection: 'pages', data, overrideAccess: true })
  const checked = await payload.findByID({ collection: 'pages', id: saved.id, depth: 0, overrideAccess: true })
  if (checked.slug !== 'terms-and-conditions' || checked.status !== 'published' ||
    checked.layout?.[1]?.blockType !== 'rich-text') throw new Error('Read-back failed')
  console.log('English terms page: saved and read back as published CMS content')
}

main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error('English terms page import failed; diagnostic details suppressed')
    process.exit(1)
  })
