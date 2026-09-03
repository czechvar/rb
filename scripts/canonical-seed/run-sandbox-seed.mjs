#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const DEFAULT_ADMIN_URL = 'postgres://rockbusters:rockbusters@127.0.0.1:5432/postgres'
const DEFAULT_DATABASE = 'rockbusters_seed_sandbox'
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

const { adminUrl, database, targetUrl } = targetDatabaseUrl()
const env = {
  DATABASE_URL: targetUrl,
  PAYLOAD_DISABLE_DB_PUSH: 'true',
}

console.log(`Resetting local seed sandbox database: ${database}`)
resetDatabase(adminUrl, database)
run('pnpm', ['payload', 'migrate'], { env })
run('pnpm', ['run', 'seed'], { env })
