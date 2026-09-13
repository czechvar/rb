/** Creates a new disposable localhost database; child runtime output is deliberately allowlisted. */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const { Client } = createRequire(require.resolve('@payloadcms/db-postgres'))('pg')
dotenv.config({ path: path.join(root, '.env') })
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('guard')
  url.pathname = '/postgres'
  const admin = new Client({ connectionString: url.href })
  const database = `rb_seed_verify_${randomBytes(12).toString('hex')}`
  url.pathname = `/${database}`
  const directory = await mkdtemp(path.join(tmpdir(), 'rb-contact-verify-'))
  let created = false
  let activeChild
  let interrupted = false
  const interrupt = () => {
    interrupted = true
    activeChild?.kill('SIGTERM')
  }
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  const report = {
    migratePassed: false,
    checks: [],
    integrationPassed: false,
    temporaryDatabaseCleaned: false,
  }
  try {
    await admin.connect()
    await admin.query(`CREATE DATABASE "${database}"`)
    created = true
    for (const [label, script] of [
      ['migrate', 'scripts/canonical-seed/migrate-sandbox.ts'],
      ['intake', 'scripts/contact/verify-intake-sandbox.ts'],
    ]) {
      if (interrupted) throw new Error('interrupted')
      console.log(`contact intake sandbox: ${label}`)
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ['--import', require.resolve('tsx/esm'), path.join(root, script)],
          {
            cwd: directory,
            env: {
              ...process.env,
              DATABASE_URL: url.href,
              PAYLOAD_DISABLE_DB_PUSH: 'true',
              DOTENV_CONFIG_PATH: path.join(directory, '.env'),
              TSX_TSCONFIG_PATH: path.join(root, 'tsconfig.json'),
              NODE_ENV: 'test',
              RESEND_API_KEY: '',
              CONTACT_ENQUIRY_EMAIL: '',
              R2_ACCESS_KEY_ID: '',
              R2_SECRET_ACCESS_KEY: '',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        )
        activeChild = child
        let output = ''
        child.stdout.on('data', (chunk) => {
          output = (output + chunk.toString()).slice(-65536)
        })
        child.stderr.on('data', () => {})
        child.on('error', () => reject(new Error('child')))
        child.on('close', (code) => {
          activeChild = undefined
          for (const line of output.split('\n')) {
            try {
              const d = JSON.parse(line)
              if (typeof d.checkPassed === 'string' && /^[a-z-]+$/.test(d.checkPassed)) {
                report.checks.push(d.checkPassed)
                console.log(JSON.stringify({ checkPassed: d.checkPassed }))
              }
              if (d.intakeVerificationPassed === true) report.integrationPassed = true
            } catch {}
          }
          if (code !== 0) reject(new Error('child'))
          else {
            if (label === 'migrate') report.migratePassed = true
            resolve()
          }
        })
      })
    }
  } catch {
    console.error('contact intake sandbox failed; details suppressed')
    process.exitCode = 1
  } finally {
    if (created) {
      try {
        await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`)
        report.temporaryDatabaseCleaned = true
      } catch {
        console.error('contact intake sandbox: temporary database cleanup failed')
        process.exitCode = 1
      }
    }
    await admin.end().catch(() => {})
    await rm(directory, { recursive: true, force: true })
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
    await mkdir(path.join(root, '.scratch/contact-delivery'), { recursive: true })
    await writeFile(
      path.join(root, '.scratch/contact-delivery/intake-verification.json'),
      JSON.stringify(report, null, 2) + '\n',
    )
    console.log(
      JSON.stringify({
        integrationPassed: report.integrationPassed,
        temporaryDatabaseCleaned: report.temporaryDatabaseCleaned,
      }),
    )
  }
}
main().catch(() => {
  console.error('contact intake sandbox guard failed')
  process.exitCode = 1
})
