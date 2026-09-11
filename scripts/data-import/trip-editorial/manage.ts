/** Guarded, reversible occurrence-only content rollout. Never log runtime objects. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { sql } from 'drizzle-orm'
import { replacement } from './replacement'

const directory = path.dirname(fileURLToPath(import.meta.url))
const receiptDirectory = path.resolve('.scratch/trip-editorial-rollout/receipts')
const modes = ['dry-run', 'apply', 'check', 'rollback', 'refresh-dry-run', 'refresh']
const batches = ['standalone', 'espana', 'rockroad']
type Value = any
const read = async (file: string): Promise<Value> => JSON.parse(await fs.readFile(file, 'utf8'))
const exists = async (file: string) =>
  fs.access(file).then(
    () => true,
    () => false,
  )
const canonical = (value: Value): Value =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value
const equal = (left: Value, right: Value) =>
  JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
const hasContent = (value: Value): boolean =>
  Array.isArray(value)
    ? value.some(hasContent)
    : value && typeof value === 'object'
      ? Object.entries(value).some(([key, child]) => key !== 'id' && hasContent(child))
      : value !== null && value !== undefined && value !== '' && value !== false
const protectedFields = (document: Value) =>
  Object.fromEntries(
    Object.entries(document).filter(([key]) => !['editorial', 'updatedAt'].includes(key)),
  )
// Payload adds defaults and IDs. Verify every authored key and exact authored array length.
const desiredPresent = (actual: Value, desired: Value): boolean => {
  if (Array.isArray(desired))
    return (
      Array.isArray(actual) &&
      actual.length === desired.length &&
      desired.every((child, index) => desiredPresent(actual[index], child))
    )
  if (desired && typeof desired === 'object')
    return (
      actual &&
      typeof actual === 'object' &&
      Object.entries(desired).every(([key, child]) => desiredPresent(actual[key], child))
    )
  return equal(actual, desired)
}
let payload: Value
let transactionID: Value
let stage = 'arguments'
let currentDateId: number | undefined
let completed = 0
try {
  const args = process.argv.slice(2)
  const mode = args.shift() ?? 'dry-run'
  if (!modes.includes(mode)) throw new Error('invalid mode')
  let batch: string | undefined, selectedDate: number | undefined
  while (args.length) {
    const argument = args.shift()
    if (argument === '--batch') batch = args.shift()
    else if (argument === '--date') selectedDate = Number(args.shift())
    else if (argument && batches.includes(argument) && !batch) batch = argument
    else throw new Error('invalid argument')
  }
  if (
    (batch && !batches.includes(batch)) ||
    (selectedDate !== undefined && (!Number.isInteger(selectedDate) || selectedDate < 1))
  )
    throw new Error('invalid selector')
  stage = 'manifests'
  const all = (
    await Promise.all(
      batches.map((name) =>
        read(path.join(directory, 'manifests', `${name}.json`)).then((rows) =>
          rows.map((row: Value) => ({ ...row, batch: name })),
        ),
      ),
    )
  ).flat()
  if (
    all.length !== 25 ||
    new Set(all.map((row) => row.target.eventDateId)).size !== 25 ||
    all.some((row) => row.target.eventDateId === 745)
  )
    throw new Error('manifest target inventory')
  const manifests = all.filter(
    (row) =>
      (!batch || row.batch === batch) && (!selectedDate || row.target.eventDateId === selectedDate),
  )
  if (!manifests.length) throw new Error('no targets')
  stage = 'local-database-guard'
  // Read only required configuration values; none enter output or artifacts.
  const configuration = dotenv.parse(await fs.readFile('.env'))
  const database = configuration.DATABASE_URL
  if (!database) throw new Error('missing database')
  const target = new URL(database)
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
    target.hostname.includes('ep-weathered-pine-alvc3sdj')
  )
    throw new Error('unsafe target')
  process.env.DATABASE_URL = database
  if (configuration.PAYLOAD_SECRET) process.env.PAYLOAD_SECRET = configuration.PAYLOAD_SECRET
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  stage = 'payload-initialization'
  const config = await (await import('../../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  payload = await (await import('payload')).getPayload({ config })
  const find = (collection: string, id: number) =>
    payload.findByID({
      collection,
      id,
      depth: 0,
      overrideAccess: true,
      req: transactionID ? { transactionID } : undefined,
    })
  const validateTarget = (event: Value, date: Value, target: Value) => {
    if (
      event.id !== target.eventId ||
      event.slug !== target.eventSlug ||
      date.id !== target.eventDateId ||
      date.event !== target.eventId ||
      new Date(date.dateFrom).toISOString().slice(0, 10) !== target.dateFrom ||
      new Date(date.dateTo).toISOString().slice(0, 10) !== target.dateTo
    )
      throw new Error('target mismatch')
    if (!('editorial' in date)) throw new Error('editorial schema unavailable')
  }
  await fs.mkdir(receiptDirectory, { recursive: true })
  for (const manifest of manifests) {
    currentDateId = manifest.target.eventDateId
    const receiptFile = path.join(receiptDirectory, `${currentDateId}.json`)
    const pendingFile = path.join(receiptDirectory, `${currentDateId}.pending.json`)
    stage = 'receipt-preconditions'
    if (await exists(pendingFile)) throw new Error('pending receipt requires recovery')
    const receipt = (await exists(receiptFile)) ? await read(receiptFile) : null
    const event = await find('events', manifest.target.eventId)
    const date = await find('event-dates', currentDateId!)
    validateTarget(event, date, manifest.target)
    if (
      receipt &&
      (!equal(receipt.target, manifest.target) ||
        !equal(date.editorial ?? null, receipt.after.editorial) ||
        !equal(protectedFields(date), receipt.after.protectedDate))
    )
      throw new Error('receipt conflict')
    if (!receipt && hasContent(date.editorial)) throw new Error('existing editorial')
    const refresh = mode === 'refresh' || mode === 'refresh-dry-run'
    if ((mode === 'check' || mode === 'rollback' || refresh) && !receipt)
      throw new Error('missing receipt')
    if (receipt && (mode === 'check' || mode === 'apply' || mode === 'dry-run')) {
      if (
        !equal(receipt.desired, manifest.editorial) ||
        !desiredPresent(date.editorial, manifest.editorial)
      )
        throw new Error('manifest changed use refresh')
      console.log(
        JSON.stringify({ stage: 'checked', eventDateId: currentDateId, alreadyApplied: true }),
      )
      completed++
      continue
    }
    if (mode === 'dry-run' || mode === 'refresh-dry-run') {
      console.log(
        JSON.stringify({
          stage: mode,
          eventDateId: currentDateId,
          sectionCount: manifest.editorial.sections?.length ?? 0,
          editorialOnly: true,
        }),
      )
      completed++
      continue
    }
    stage = 'transaction-start'
    transactionID = await payload.db.beginTransaction()
    if (!transactionID) throw new Error('transaction unavailable')
    // Use the registered transaction connection, never the adapter's pooled default.
    // SQL row locks also serialize ordinary CMS writers that do not share advisory locks.
    stage = 'transaction-lock'
    const transactionDatabase = payload.db.sessions?.[transactionID]?.db
    if (!transactionDatabase) throw new Error('transaction connection unavailable')
    await transactionDatabase.execute(sql`SET LOCAL lock_timeout = '5s'`)
    await transactionDatabase.execute(sql`SET LOCAL statement_timeout = '30s'`)
    await transactionDatabase.execute(
      sql`SELECT id FROM events WHERE id = ${manifest.target.eventId} FOR SHARE`,
    )
    await transactionDatabase.execute(
      sql`SELECT id FROM event_dates WHERE id = ${currentDateId} FOR UPDATE`,
    )
    const before = await find('event-dates', currentDateId!)
    const parentBefore = await find('events', manifest.target.eventId)
    validateTarget(parentBefore, before, manifest.target)
    if (!equal(before, date) || !equal(parentBefore, event))
      throw new Error('record changed during planning')
    const desired = mode === 'rollback' ? receipt.before.editorial : manifest.editorial
    stage = 'editorial-update'
    await payload.update({
      collection: 'event-dates',
      id: currentDateId,
      data: { editorial: replacement(before.editorial, desired) },
      depth: 0,
      overrideAccess: true,
      req: { transactionID },
      context: { disableRevalidate: true },
    })
    const after = await find('event-dates', currentDateId!)
    const parentAfter = await find('events', manifest.target.eventId)
    stage = 'readback'
    if (
      !equal(protectedFields(before), protectedFields(after)) ||
      !equal(parentBefore, parentAfter)
    )
      throw new Error('protected fields changed')
    if (
      mode === 'rollback'
        ? hasContent(desired)
          ? !desiredPresent(after.editorial, desired)
          : hasContent(after.editorial)
        : !desiredPresent(after.editorial, desired)
    )
      throw new Error('editorial readback mismatch')
    const next = {
      version: 1,
      classification: 'temporary local design comparison content',
      marker: `trip-editorial-${currentDateId}`,
      target: manifest.target,
      before: receipt?.before ?? {
        editorial: before.editorial ?? null,
        protectedDate: protectedFields(before),
      },
      after: { editorial: after.editorial ?? null, protectedDate: protectedFields(after) },
      desired,
      sourceFile: manifest.sourceFile,
      provenance: manifest.provenance,
      refreshHistory: [
        ...(receipt?.refreshHistory ?? []),
        ...(refresh
          ? [{ editorial: receipt.after.editorial, provenance: receipt.provenance }]
          : []),
      ],
      ...(mode === 'rollback' ? { rolledBack: true } : {}),
    }
    stage = 'pending-receipt'
    await fs.writeFile(pendingFile, JSON.stringify(next, null, 2) + '\n', { flag: 'wx' })
    stage = 'commit'
    await payload.db.commitTransaction(transactionID)
    transactionID = null
    stage = 'committed-readback'
    // The adapter can resolve a transaction after internal rollback. Verify durable state.
    const committedDate = await find('event-dates', currentDateId!)
    const committedParent = await find('events', manifest.target.eventId)
    if (!equal(committedDate, after) || !equal(committedParent, parentAfter))
      throw new Error('commit readback mismatch')
    stage = 'finalize-receipt'
    if (mode === 'rollback') {
      await fs.rename(
        receiptFile,
        path.join(receiptDirectory, `${currentDateId}.before-rollback-${Date.now()}.json`),
      )
      await fs.rename(
        pendingFile,
        path.join(receiptDirectory, `${currentDateId}.rolled-back-${Date.now()}.json`),
      )
    } else await fs.rename(pendingFile, receiptFile)
    console.log(
      JSON.stringify({
        stage: mode === 'rollback' ? 'rolled-back' : refresh ? 'refreshed' : 'applied',
        eventDateId: currentDateId,
        protectedFieldsUnchanged: true,
      }),
    )
    completed++
  }
  console.log(JSON.stringify({ stage: 'complete', completed, targetCount: manifests.length }))
} catch (error) {
  if (transactionID) await payload?.db.rollbackTransaction(transactionID).catch(() => {})
  // Emit only validation field paths and scalar codes, never messages or runtime objects.
  const failure = error as {
    name?: unknown
    code?: unknown
    message?: unknown
    data?: { errors?: { path?: unknown }[] }
    cause?: { code?: unknown }
  }
  const validationPaths = Array.isArray(failure.data?.errors)
    ? failure.data.errors
        .map((item) => item.path)
        .filter(
          (item): item is string => typeof item === 'string' && /^[a-zA-Z0-9_.-]+$/.test(item),
        )
    : []
  const rawCode = failure.cause?.code ?? failure.code
  const code = typeof rawCode === 'string' && /^[A-Z0-9]{5}$/.test(rawCode) ? rawCode : undefined
  const kind = ['ValidationError', 'TypeError', 'Error', 'APIError'].includes(String(failure.name))
    ? String(failure.name)
    : 'Other'
  const category =
    typeof failure.message === 'string'
      ? ['Cannot read properties', 'Invalid', 'not a function', 'transaction', 'constraint'].find(
          (fragment) => failure.message!.toString().includes(fragment),
        )
      : undefined
  const stack =
    error instanceof Error
      ? (error.stack ?? '')
          .split('\n')
          .slice(1)
          .map((line) => line.match(/\/(?:src|node_modules)\/[a-zA-Z0-9_./@+()-]+:\d+:\d+/)?.[0])
          .filter(Boolean)
          .slice(0, 5)
      : []
  console.error(
    JSON.stringify({
      stoppedSafely: true,
      stage,
      ...(currentDateId ? { eventDateId: currentDateId } : {}),
      completed,
      validationPaths,
      code,
      kind,
      category,
      stack,
    }),
  )
  process.exitCode = 1
} finally {
  if (payload)
    await payload.db.destroy().catch(() => {
      process.exitCode = 1
    })
  // Payload development watchers can outlive a completed standalone import.
  process.exit(process.exitCode ?? 0)
}
