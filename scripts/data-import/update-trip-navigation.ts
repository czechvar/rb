/** Persistent CMS content correction; idempotent, local-only, no seed/test records created. */
import 'dotenv/config'
import { getPayload } from 'payload'
import type { Page } from '../../src/payload-types'

function updateLinks(value: unknown): { value: unknown; count: number } {
  if (Array.isArray(value)) {
    const items = value.map(updateLinks)
    return { value: items.map((item) => item.value), count: items.reduce((sum, item) => sum + item.count, 0) }
  }
  if (!value || typeof value !== 'object') return { value, count: 0 }
  let count = 0
  const result = Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (key === 'href' && child === '/programs') {
      count++
      return [key, '/trips']
    }
    const updated = updateLinks(child)
    count += updated.count
    return [key, updated.value]
  }))
  return { value: result, count }
}

async function main() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Local database required')
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  try {
    const pages = await payload.find({ collection: 'pages', pagination: false, depth: 0, overrideAccess: true })
    let links = 0
    const apply = process.argv.includes('--apply')
    for (const page of pages.docs) {
      const updated = updateLinks(page.layout)
      if (!updated.count) continue
      if (apply) {
        await payload.update({ collection: 'pages', id: page.id, data: { layout: updated.value as Page['layout'] }, overrideAccess: true })
        const saved = await payload.findByID({ collection: 'pages', id: page.id, depth: 0, overrideAccess: true })
        if (updateLinks(saved.layout).count) throw new Error('Read-back failed')
      }
      links += updated.count
    }
    console.log(JSON.stringify({ applied: apply, links }))
  } finally { await payload.destroy() }
}
main().then(() => process.exit(0)).catch(() => { console.log(JSON.stringify({ navigationUpdateFailed: true })); process.exit(1) })
