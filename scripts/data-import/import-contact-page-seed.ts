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
    await fs.readFile(new URL('./seed/contact-page.json', import.meta.url), 'utf8'),
  )
  const resolvedConfig = await config
  resolvedConfig.logger = { options: { level: 'silent' } } as typeof resolvedConfig.logger
  const payload = await getPayload({ config: resolvedConfig })
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    depth: 0,
    limit: 1,
  })
  if (existing.docs[0] && !process.argv.includes('--replace')) {
    console.log('contact page: preserved existing record')
    return
  }
  const data = row as Omit<Page, 'id' | 'createdAt' | 'updatedAt'>
  const page = existing.docs[0]
    ? await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
    : await payload.create({ collection: 'pages', data })
  const saved = await payload.findByID({ collection: 'pages', id: page.id, depth: 0 })
  if (
    saved.slug !== 'contact' ||
    saved.status !== 'published' ||
    saved.structuredData?.schemaType !== 'ContactPage' ||
    saved.layout?.map((block) => block.blockType).join(',') !==
      row.layout.map((block: { blockType: string }) => block.blockType).join(',')
  )
    throw new Error('Read-back failed')
  console.log(`contact page: saved and verified id=${saved.id}`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const details = error as { data?: { errors?: Array<{ path?: unknown }> } } | null
    const fields =
      details?.data?.errors
        ?.map((item) => item.path)
        .filter(
          (path): path is string => typeof path === 'string' && /^[a-zA-Z0-9_.-]+$/.test(path),
        ) ?? []
    console.error(JSON.stringify({ contactPageSeedFailed: true, fields }))
    process.exit(1)
  })
