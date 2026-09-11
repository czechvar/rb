#!/usr/bin/env node
/** Disposable verification: never reset an existing DB, and never log connection strings. */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const require = createRequire(import.meta.url)
const { Client } = createRequire(require.resolve('@payloadcms/db-postgres'))('pg')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const fileArg = process.argv.slice(2).find((arg) => arg.startsWith('--file='))
const seedFile = fileArg
  ? path.resolve(fileArg.slice(7))
  : path.join(root, 'scripts/data-import/seed/canonical-payload-seed.json')
// Only read configuration internally; children execute outside the repository's .env search path.
dotenv.config({ path: path.join(root, '.env') })

async function main() {
  const source = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(source.hostname)) throw new Error('guard')
  const admin = new URL(process.env.SANDBOX_ADMIN_DATABASE_URL ?? source.href)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(admin.hostname)) throw new Error('guard')
  admin.pathname = '/postgres'
  const database = `rb_seed_verify_${randomBytes(12).toString('hex')}`
  const target = new URL(admin.href)
  target.pathname = `/${database}`
  if (source.pathname === target.pathname) throw new Error('guard')
  const directory = await mkdtemp(path.join(tmpdir(), 'rb-seed-verify-'))
  const client = new Client({ connectionString: admin.href })
  let created = false
  let connected = false
  let stage = 'connect'
  let activeChild
  let interrupted = false
  const interrupt = () => {
    interrupted = true
    activeChild?.kill('SIGTERM')
  }
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  const childEnv = {
    ...process.env,
    DATABASE_URL: target.href,
    PAYLOAD_DISABLE_DB_PUSH: 'true',
    DOTENV_CONFIG_PATH: path.join(directory, '.env'),
    TSX_TSCONFIG_PATH: path.join(root, 'tsconfig.json'),
    NODE_ENV: 'test',
    RESEND_API_KEY: '',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
  }
  const run = async (label, script, args = []) => {
    if (interrupted) throw new Error('interrupted')
    stage = label
    console.log(`canonical seed sandbox: ${label}`)
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ['--import', require.resolve('tsx/esm'), path.join(root, script), ...args],
        {
          cwd: directory,
          env: childEnv,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
      activeChild = child
      // Child libraries can log runtime objects. Consume their output without exposing it.
      // Pass only the verifier's deliberately allowlisted JSON summary to the caller.
      let tail = ''
      child.stdout.on('data', (chunk) => {
        tail = (tail + chunk.toString()).slice(-65536)
      })
      let errors = ''
      child.stderr.on('data', (chunk) => {
        errors = (errors + chunk.toString()).slice(-65536)
      })
      child.on('error', () => reject(new Error('child')))
      child.on('close', (code) => {
        activeChild = undefined
        if (code !== 0) {
          const collectionPattern = /canonical seed: ([a-z-]+) created=\d+ updated=\d+ skipped=\d+/g
          const completed = [...tail.matchAll(collectionPattern)].at(-1)?.[1]
          console.log(JSON.stringify({ lastCompletedCollection: completed ?? 'unknown' }))
          for (const line of errors.split('\n')) {
            try {
              const diagnostic = JSON.parse(line)
              if (
                diagnostic.seedRowFailed === true &&
                /^[a-z-]+$/.test(diagnostic.collection) &&
                (typeof diagnostic.id === 'number' || /^[a-zA-Z0-9_-]{1,100}$/.test(diagnostic.id))
              ) {
                console.log(
                  JSON.stringify({
                    seedRowFailed: true,
                    collection: diagnostic.collection,
                    id: diagnostic.id,
                    constraint:
                      typeof diagnostic.constraint === 'string' &&
                      /^[a-zA-Z0-9_]+$/.test(diagnostic.constraint)
                        ? diagnostic.constraint
                        : undefined,
                    category: /^[A-Za-z-]+$/.test(diagnostic.category)
                      ? diagnostic.category
                      : 'unknown',
                    databaseCode: /^[A-Z0-9_]{1,20}$/.test(diagnostic.databaseCode)
                      ? diagnostic.databaseCode
                      : undefined,
                    fields: Array.isArray(diagnostic.fields)
                      ? diagnostic.fields.filter(
                          (value) => typeof value === 'string' && /^[a-zA-Z0-9_.-]+$/.test(value),
                        )
                      : undefined,
                  }),
                )
              }
            } catch {
              /* Untrusted runtime diagnostics are deliberately suppressed. */
            }
          }
          return reject(new Error('child'))
        }
        if (label.startsWith('verify')) {
          for (const line of tail.split('\n')) {
            try {
              const result = JSON.parse(line)
              if (
                result.verificationPassed === true &&
                ['collections', 'rows', 'enrichedOccurrences'].every((key) =>
                  Number.isInteger(result[key]),
                )
              ) {
                console.log(
                  JSON.stringify({
                    verificationPassed: true,
                    collections: result.collections,
                    rows: result.rows,
                    enrichedOccurrences: result.enrichedOccurrences,
                  }),
                )
              }
            } catch {
              /* Ignore every other child message. */
            }
          }
        }
        resolve()
      })
    })
  }
  try {
    await client.connect()
    connected = true
    await client.query(`CREATE DATABASE "${database}"`)
    created = true
    const receipt = path.join(directory, 'ids.json')
    const actual = path.join(directory, 'readback.json')
    await run('migrate', 'scripts/canonical-seed/migrate-sandbox.ts')
    for (let pass = 1; pass <= 2; pass += 1) {
      await run(`seed-${pass}`, 'scripts/seed.ts', [`--file=${seedFile}`, `--receipt=${receipt}`])
      await run(`export-${pass}`, 'scripts/canonical-seed/export.ts', [`--file=${actual}`])
      await run(`verify-${pass}`, 'scripts/canonical-seed/verify.ts', [seedFile, actual, receipt])
    }
  } catch {
    console.error(`canonical seed sandbox failed: stage=${stage}`)
    process.exitCode = 1
  } finally {
    if (created) {
      try {
        await client.query(`DROP DATABASE "${database}" WITH (FORCE)`)
        console.log('canonical seed sandbox: temporary database cleaned')
      } catch {
        console.error('canonical seed sandbox: temporary database cleanup failed')
        process.exitCode = 1
      }
    }
    if (connected) await client.end().catch(() => {})
    await rm(directory, { recursive: true, force: true })
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
  }
}
main().catch(() => {
  console.error('canonical seed sandbox: local database configuration guard failed')
  process.exitCode = 1
})
