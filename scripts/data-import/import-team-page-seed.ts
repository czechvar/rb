/** Persistent local CMS content; reruns preserve editorial changes unless --replace is explicit. */
import './env'
import fs from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import type { Page } from '../../src/payload-types'

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Local database required')
  if (process.env.PAYLOAD_DISABLE_DB_PUSH !== 'true')
    throw new Error('Disable schema push before seeding')
  const { row } = JSON.parse(
    await fs.readFile(new URL('./seed/team-page.json', import.meta.url), 'utf8'),
  )
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'team' } },
    depth: 0,
    limit: 1,
  })
  if (existing.docs[0] && !process.argv.includes('--replace')) {
    console.log('team page: preserved existing record')
    return
  }
  const data = row as Omit<Page, 'id' | 'createdAt' | 'updatedAt'>
  const page = existing.docs[0]
    ? await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
    : await payload.create({ collection: 'pages', data })
  const saved = await payload.findByID({ collection: 'pages', id: page.id, depth: 0 })
  if (saved.slug !== 'team' || !saved.layout?.some(block => block.blockType === 'guideGrid'))
    throw new Error('Read-back failed')
  console.log(`team page: saved and verified id=${saved.id}`)
}

main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error('team page seed failed; diagnostic details suppressed')
    process.exit(1)
  })
