#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const DEFAULT_ADMIN_URL = 'postgres://rockbusters:rockbusters@127.0.0.1:5432/postgres'
const DEFAULT_DATABASE = 'rockbusters_import_sandbox'
const POSTGRES_IMAGE = 'postgres:16'

function argValue(name) {
  const prefix = `${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

function targetDatabaseUrl() {
  const database = argValue('--database') ?? DEFAULT_DATABASE
  if (!/^[a-z0-9_]+$/.test(database)) {
    throw new Error(`Refusing unsafe sandbox database name: ${database}`)
  }

  const adminUrl = new URL(process.env.SANDBOX_ADMIN_DATABASE_URL ?? DEFAULT_ADMIN_URL)
  if (!['127.0.0.1', 'localhost'].includes(adminUrl.hostname)) {
    throw new Error(`Refusing non-local admin database host: ${adminUrl.hostname}`)
  }

  const targetUrl = new URL(adminUrl.toString())
  targetUrl.pathname = `/${database}`

  return { adminUrl: adminUrl.toString(), database, targetUrl: targetUrl.toString() }
}

function run(command, args, options = {}) {
  console.log(`\n$ ${options.label ?? `${command} ${args.join(' ')}`}`)
  const result = spawnSync(command, args, {
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status ?? 'unknown status'}`)
  }
}

function resetDatabase(adminUrl, database) {
  run(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'host',
      POSTGRES_IMAGE,
      'psql',
      adminUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `DROP DATABASE IF EXISTS ${database} WITH (FORCE);`,
      '-c',
      `CREATE DATABASE ${database};`,
    ],
    { label: `docker run --rm --network host ${POSTGRES_IMAGE} psql [local-admin-url] -c reset ${database}` },
  )
}

function psql(targetUrl, sql) {
  run(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'host',
      POSTGRES_IMAGE,
      'psql',
      targetUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { label: `docker run --rm --network host ${POSTGRES_IMAGE} psql [sandbox-url] -c ${sql}` },
  )
}

function psqlValue(targetUrl, sql) {
  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'host',
      POSTGRES_IMAGE,
      'psql',
      targetUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-tA',
      '-c',
      sql,
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    throw new Error(`psql exited with ${result.status ?? 'unknown status'}`)
  }
  return result.stdout.trim()
}

function runPnpmScript(script, env) {
  run('pnpm', ['run', script], { env })
}

const { adminUrl, database, targetUrl } = targetDatabaseUrl()
const env = {
  DATABASE_URL: targetUrl,
  DATA_IMPORT_LOOKUP_DIR: '.scratch/data-import-sandbox-lookups',
  PAYLOAD_DISABLE_DB_PUSH: 'true',
}

console.log(`Resetting local import sandbox database: ${database}`)
resetDatabase(adminUrl, database)
rmSync(env.DATA_IMPORT_LOOKUP_DIR, { recursive: true, force: true })

run('pnpm', ['payload', 'migrate'], { env })
runPnpmScript('data-import:seed-media', env)
runPnpmScript('data-import:airports', env)
runPnpmScript('data-import:import', env)
runPnpmScript('seed', env)
runPnpmScript('data-import:legacy-support-content', env)
runPnpmScript('data-import:legacy-destinations', env)
runPnpmScript('data-import:legacy-events', env)
runPnpmScript('data-import:event-catalogue-cards', env)
runPnpmScript('data-import:homepage', env)

const beforeRerun = psqlValue(
  targetUrl,
  [
    'select',
    "(select count(*) from events) || ',' ||",
    "(select count(*) from event_dates) || ',' ||",
    "(select count(*) from partners) || ',' ||",
    "(select count(*) from reviews) || ',' ||",
    "(select count(*) from post_categories) || ',' ||",
    "(select count(*) from posts);",
  ].join(' '),
)

console.log('\nVerifying idempotent reruns')
runPnpmScript('data-import:legacy-events', env)
runPnpmScript('data-import:legacy-support-content', env)
runPnpmScript('data-import:event-catalogue-cards', env)
runPnpmScript('data-import:homepage', env)

const afterRerun = psqlValue(
  targetUrl,
  [
    'select',
    "(select count(*) from events) || ',' ||",
    "(select count(*) from event_dates) || ',' ||",
    "(select count(*) from partners) || ',' ||",
    "(select count(*) from reviews) || ',' ||",
    "(select count(*) from post_categories) || ',' ||",
    "(select count(*) from posts);",
  ].join(' '),
)
if (afterRerun !== beforeRerun) {
  throw new Error(`Idempotency check failed: before=${beforeRerun} after=${afterRerun}`)
}
console.log(`Idempotency check passed: events,event_dates,partners,reviews,post_categories,posts=${afterRerun}`)

psql(
  targetUrl,
  [
    'select',
    "(select count(*) from events) as events,",
    "(select count(*) from event_dates) as event_dates,",
    "(select count(*) from media) as media,",
    "(select count(*) from partners) as partners,",
    "(select count(*) from reviews) as reviews,",
    "(select count(*) from post_categories) as post_categories,",
    "(select count(*) from posts) as posts,",
    "(select count(*) from pages where slug = 'home') as home_pages;",
  ].join(' '),
)
