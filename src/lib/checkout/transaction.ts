import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { sql } from 'drizzle-orm'

/** All booking locks and Payload writes must use this same database transaction. */
export async function withCheckoutTransaction<T>(
  payload: Payload,
  run: (req: PayloadRequest) => Promise<T>,
): Promise<T> {
  const id = await payload.db.beginTransaction()
  if (!id) throw new Error('Transactional booking is unavailable.')
  const req = await createLocalReq({ context: { checkoutEngine: true } }, payload)
  req.transactionID = id
  try {
    const result = await run(req)
    await payload.db.commitTransaction(id)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(id)
    throw error
  }
}
export async function checkoutDatabase(req: PayloadRequest) {
  const id = await req.transactionID
  const adapter = req.payload.db as unknown as {
    sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } }>
  }
  const db = id && adapter.sessions[String(id)]?.db
  if (!db) throw new Error('Booking requires an active database transaction.')
  return db
}
export async function lockCheckout(req: PayloadRequest, id: number) {
  const db = await checkoutDatabase(req)
  await db.execute(sql`SELECT pg_advisory_xact_lock(42001, ${id})`)
}
export async function lockEventDates(req: PayloadRequest, ids: number[]) {
  const db = await checkoutDatabase(req)
  for (const id of [...new Set(ids)].sort((a, b) => a - b))
    await db.execute(sql`SELECT pg_advisory_xact_lock(${id})`)
}
export async function lockSubmission(req: PayloadRequest, key: string) {
  const db = await checkoutDatabase(req)
  await db.execute(sql`SELECT pg_advisory_xact_lock(42002, hashtext(${key}))`)
}
