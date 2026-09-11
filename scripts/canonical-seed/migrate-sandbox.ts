/** Invoked only by the guarded disposable database runner. */
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import path from 'node:path'

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !/^\/rb_seed_verify_[a-f0-9]+$/.test(url.pathname)
  ) {
    throw new Error('Unsafe sandbox target')
  }
  const { default: configPromise } = await import('../../src/payload.config')
  const config = await configPromise
  if (process.env.DATABASE_URL !== url.href) throw new Error('Sandbox target changed')
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  try {
    if (process.env.DATABASE_URL !== url.href) throw new Error('Sandbox target changed')
    payload.db.migrationDir = path.resolve(import.meta.dirname, '../../src/migrations')
    await payload.db.migrate()
    // Prove occurrence links and relationships remain portable when IDs differ.
    await payload.db.drizzle.execute(sql`ALTER SEQUENCE event_dates_id_seq RESTART WITH 10001`)
    await payload.db.drizzle.execute(sql`ALTER SEQUENCE events_id_seq RESTART WITH 1001`)
    await payload.db.drizzle.execute(sql`ALTER SEQUENCE locations_id_seq RESTART WITH 2001`)
    await payload.db.drizzle.execute(sql`ALTER SEQUENCE guides_id_seq RESTART WITH 3001`)
  } finally {
    await payload.destroy()
  }
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error('Sandbox migration failed')
    process.exit(1)
  })
