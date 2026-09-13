/** Isolated source copy + disposable DB + actual Next/Chromium. Never emits runtime or credential objects. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const { Client } = createRequire(require.resolve('@payloadcms/db-postgres'))('pg')
const { chromium } = require('@playwright/test')
const visualOnly = process.argv.includes('--visual-only') || process.argv.includes('--visual-build')
const report = {
  checks: [],
  pageErrors: 0,
  consoleErrors: 0,
  expectedNotFoundConsoleErrors: 0,
  migratePassed: false,
  fixturePassed: false,
  browserPassed: false,
  flagOffPassed: false,
  buildPassed: false,
  databaseCleaned: false,
  sourceCopyCleaned: false,
  nextStopped: false,
}
const output = path.join(root, '.scratch/checkout-browser')
let stage = 'start',
  server,
  browser,
  admin,
  inspection,
  copy,
  database,
  interrupted = false,
  expectedNotFound = false
const children = new Set()
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const passed = (check) => {
  report.checks.push(check)
  console.log(JSON.stringify({ checkPassed: check }))
}
const announce = (value) => {
  stage = value
  console.log(JSON.stringify({ browserStage: value }))
}

function child(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
    children.add(process)
    let safeData
    const inspectBuild = (chunk) => {
      if (stage !== 'production-build') return
      const text = chunk.toString()
      const patterns = {
        compiled: /Compiled successfully/,
        typecheck: /Checking validity|Running TypeScript/,
        collecting: /Collecting page data/,
        generating: /Generating static pages/,
        typeError: /Type error:/,
        moduleMissing: /Module not found|Cannot find module/,
        prerenderError: /Error occurred prerendering/,
        configError: /Invalid next.config/,
        networkError: /ENOTFOUND|ECONNREFUSED|ETIMEDOUT/,
        fontError: /Failed to fetch.*font|next.font/,
        buildWorker: /build worker exited/,
      }
      report.buildDiagnostics ||= {}
      for (const [name, pattern] of Object.entries(patterns))
        if (pattern.test(text)) report.buildDiagnostics[name] = true
      const source = text.match(
        /(?:\.\/)?(src\/[A-Za-z0-9_./()\[\]-]+\.(?:tsx?|css))(?::(\d+)(?::(\d+))?)?/,
      )
      if (source) report.buildSource = { file: source[1], line: Number(source[2] || 0) }
    }
    process.stdout.on('data', (chunk) => {
      inspectBuild(chunk)
      for (const line of chunk.toString().split('\n'))
        try {
          const parsed = JSON.parse(line)
          if (
            parsed.fixtureFailed === true &&
            [
              'initialization',
              'event',
              'event-date',
              'user',
              'legacy-order',
              'reservation',
              'quote',
              'unverified',
            ].includes(parsed.fixtureStage)
          ) {
            report.fixtureFailureStage = parsed.fixtureStage
            if (
              ['duplicate', 'revalidation', 'validation', 'query', 'connection', 'other'].includes(
                parsed.category,
              )
            )
              report.fixtureFailureCategory = parsed.category
            if (typeof parsed.code === 'string' && /^[A-Z0-9]{5}$/.test(parsed.code))
              report.fixtureFailureCode = parsed.code
          }
          if (
            parsed.fixtureReady === true &&
            ['eventDateId', 'checkoutId', 'unverifiedId', 'userId'].every((key) =>
              Number.isSafeInteger(parsed[key]),
            )
          )
            safeData = {
              eventDateId: parsed.eventDateId,
              checkoutId: parsed.checkoutId,
              unverifiedId: parsed.unverifiedId,
              userId: parsed.userId,
            }
        } catch {
          /* All runtime output is discarded. */
        }
    })
    process.stderr.on('data', inspectBuild)
    process.on('error', () => {
      children.delete(process)
      reject(new Error('child-failed'))
    })
    process.on('exit', (code) => {
      if (stage === 'production-build') report.buildExitCode = code
      children.delete(process)
      if (code === 0) resolve(safeData)
      else reject(new Error('child-failed'))
    })
  })
}
async function stopServer() {
  if (!server) return
  const target = server
  server = undefined
  if (target.exitCode === null) {
    target.kill('SIGTERM')
    await Promise.race([new Promise((resolve) => target.once('exit', resolve)), pause(5000)])
    if (target.exitCode === null) target.kill('SIGKILL')
  }
  children.delete(target)
  report.nextStopped = true
}
async function startServer(env, port) {
  server = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/next/dist/bin/next'),
      'dev',
      '--webpack',
      '--port',
      String(port),
    ],
    { cwd: copy, env, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  children.add(server)
  server.stdout.on('data', () => {})
  server.stderr.on('data', () => {})
  for (let i = 0; i < 150; i++) {
    if (interrupted || server.exitCode !== null) throw new Error('next-start-failed')
    try {
      const response = await fetch(`http://localhost:${port}/cart`, {
        signal: AbortSignal.timeout(2000),
      })
      if (response.status < 500) return
    } catch {}
    await pause(1000)
  }
  throw new Error('next-timeout')
}
async function freePort() {
  const candidate = net.createServer()
  await new Promise((resolve) => candidate.listen(0, '127.0.0.1', resolve))
  const port = candidate.address().port
  await new Promise((resolve) => candidate.close(resolve))
  return port
}

async function main() {
  await mkdir(output, { recursive: true, mode: 0o700 })
  const content = await readFile(path.join(root, '.env'), 'utf8')
  const specific = (name) => {
    const line = content
      .split('\n')
      .find((value) => new RegExp(`^(?:export\\s+)?${name}\\s*=`).test(value))
    return line ? dotenv.parse(line)[name] : undefined
  }
  const source = new URL(specific('DATABASE_URL') || '')
  assert(['localhost', '127.0.0.1', '[::1]'].includes(source.hostname))
  database = `rb_seed_verify_${randomBytes(12).toString('hex')}`
  source.pathname = '/postgres'
  admin = new Client({ connectionString: source.href })
  await admin.connect()
  await admin.query(`CREATE DATABASE "${database}"`)
  source.pathname = `/${database}`
  inspection = new Client({ connectionString: source.href })
  await inspection.connect()
  copy = await mkdtemp(path.join(tmpdir(), 'rb-checkout-browser-'))
  announce('copy-source')
  await child('rsync', [
    '-a',
    '--exclude=.env*',
    '--exclude=.git',
    '--exclude=.next',
    '--exclude=.scratch',
    '--exclude=node_modules',
    '--exclude=*.log',
    '--exclude=playwright-report',
    '--exclude=test-results',
    `${root}/`,
    `${copy}/`,
  ])
  await symlink(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir')
  const password = randomBytes(24).toString('base64url'),
    token = randomBytes(32).toString('base64url'),
    port = await freePort(),
    base = `http://localhost:${port}`
  const env = {
    ...process.env,
    DATABASE_URL: source.href,
    PAYLOAD_SECRET: specific('PAYLOAD_SECRET') || randomBytes(32).toString('hex'),
    CHECKOUT_BROWSER_PASSWORD: password,
    CHECKOUT_BROWSER_TOKEN: token,
    NEXT_PUBLIC_SITE_URL: base,
    PAYLOAD_DISABLE_DB_PUSH: 'true',
    CHECKOUT_ENABLED: 'true',
    NODE_ENV: 'development',
    DOTENV_CONFIG_PATH: path.join(copy, '.env'),
    TSX_TSCONFIG_PATH: path.join(copy, 'tsconfig.json'),
    RESEND_API_KEY: '',
    CONTACT_ENQUIRY_EMAIL: '',
    COMGATE_MERCHANT: '',
    COMGATE_SECRET: '',
    MUZAPAY_BASE_URL: '',
    MUZAPAY_ESHOP_ID: '',
    MUZAPAY_ESHOP_PASSWORD: '',
    MUZAPAY_PRIVATE_KEY: '',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
    R2_ENDPOINT: '',
    R2_BUCKET: '',
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: '',
    SITE_INDEXABLE: 'false',
    VERCEL: '',
    NEXT_TELEMETRY_DISABLED: '1',
  }
  announce('migrate')
  await child(
    process.execPath,
    [
      '--import',
      require.resolve('tsx/esm'),
      path.join(copy, 'scripts/canonical-seed/migrate-sandbox.ts'),
    ],
    { cwd: copy, env: { ...env, NODE_ENV: 'test' } },
  )
  report.migratePassed = true
  announce('fixtures')
  const fixture = await child(
    process.execPath,
    [
      '--import',
      require.resolve('tsx/esm'),
      path.join(copy, 'scripts/checkout/browser-fixture.ts'),
    ],
    { cwd: copy, env: { ...env, NODE_ENV: 'test' } },
  )
  assert(fixture)
  report.fixturePassed = true
  announce('next-enabled')
  await startServer(env, port)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/*', (route) =>
    new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort(),
  )
  const page = await context.newPage()
  page.on('pageerror', () => report.pageErrors++)
  page.on('console', (message) => {
    if (message.type() === 'error') {
      if (expectedNotFound) report.expectedNotFoundConsoleErrors++
      else report.consoleErrors++
    }
  })
  const navigate = async (url) =>
    page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded', timeout: 180000 })
  announce('cart-desktop')
  await navigate(`/cart?add=${fixture.eventDateId}`)
  await page
    .getByRole('heading', { name: 'Browser climbing trip', exact: true })
    .waitFor({ timeout: 180000 })
  assert((await page.getByLabel('Participants').inputValue()) === '1')
  await page.getByLabel('Participants').fill('2')
  await page.waitForTimeout(500)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  await page.screenshot({ path: path.join(output, 'cart-1440.png'), fullPage: true })
  passed('desktop-cart-add-quantity-no-overflow')
  if (visualOnly) {
    const readableHeadings = async () =>
      page.locator('main h1, main h2').evaluateAll((headings) => {
        const luminance = (color) => {
          const rgb =
            color
              .match(/[\d.]+/g)
              ?.slice(0, 3)
              .map(Number) || []
          if (rgb.length !== 3) return 0
          const linear = rgb.map((value) =>
            value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4,
          )
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
        }
        return (
          headings.length > 0 &&
          headings.every((heading) => {
            let node = heading
            let background = 'rgb(0, 0, 0)'
            while (node) {
              const current = getComputedStyle(node).backgroundColor
              if (current !== 'rgba(0, 0, 0, 0)' && current !== 'transparent') {
                background = current
                break
              }
              node = node.parentElement
            }
            const foreground = luminance(getComputedStyle(heading).color)
            const backdrop = luminance(background)
            return (
              (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05) >=
              4.5
            )
          })
        )
      })
    assert(await readableHeadings())
    passed('desktop-headings-contrast-at-least-4.5')
    await page.setViewportSize({ width: 390, height: 844 })
    assert(await readableHeadings())
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    await page.screenshot({ path: path.join(output, 'cart-390.png'), fullPage: true })
    passed('mobile-headings-contrast-at-least-4.5-no-overflow')
    report.browserPassed = true
    await writeFile(
      path.join(output, 'visual-success.json'),
      JSON.stringify(
        {
          checks: report.checks,
          pageErrors: report.pageErrors,
          consoleErrors: report.consoleErrors,
          browserPassed: true,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    )
    if (process.argv.includes('--visual-build')) {
      await context.close()
      await browser.close()
      browser = undefined
      await stopServer()
      await rm(path.join(copy, 'node_modules'))
      await child('cp', ['-al', path.join(root, 'node_modules'), path.join(copy, 'node_modules')])
      announce('production-build')
      await child('pnpm', ['build'], { cwd: copy, env: { ...env, NODE_ENV: 'production' } })
      report.buildPassed = true
      passed('isolated-production-build')
    }
    return
  }
  announce('checkout-email-first')
  await navigate('/checkout')
  await page.getByLabel('Email', { exact: true }).waitFor({ timeout: 180000 })
  assert((await page.getByLabel('Full name', { exact: true }).count()) === 0)
  await page.getByLabel('Email', { exact: true }).fill('checkout-browser@example.invalid')
  await page.getByRole('button', { name: /continue/i }).click()
  await page
    .getByRole('link', { name: 'Log in with your password to continue', exact: true })
    .first()
    .waitFor({ timeout: 30000 })
  passed('email-first-recognizes-returning-purchaser')
  await page.getByLabel('Email', { exact: true }).fill('checkout-browser-new@example.invalid')
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByLabel('Full name', { exact: true }).waitFor({ timeout: 30000 })
  await page.getByLabel('Full name', { exact: true }).fill('Browser guest')
  await page.getByLabel('Phone including country code', { exact: true }).fill('+420123456789')
  await page.getByRole('button', { name: /verify|email/i }).click()
  await page
    .getByRole('alert')
    .filter({ hasText: /could not|couldn.t|not configured/i })
    .waitFor({ timeout: 30000 })
  assert(
    (
      await inspection.query(
        'SELECT count(*)::int AS count FROM checkouts WHERE contact_email=$1',
        ['checkout-browser-new@example.invalid'],
      )
    ).rows[0].count === 0,
  )
  passed('new-email-collects-three-fields-and-unconfigured-mail-fails-honestly')
  announce('cart-mobile')
  await page.setViewportSize({ width: 390, height: 844 })
  await navigate('/cart')
  await page
    .getByRole('heading', { name: 'Browser climbing trip', exact: true })
    .waitFor({ timeout: 60000 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  await page.screenshot({ path: path.join(output, 'cart-390.png'), fullPage: true })
  passed('mobile-cart-no-overflow')
  announce('token-get')
  await navigate(`/checkout/verify?checkout=${fixture.unverifiedId}#token=${token}`)
  await page
    .getByRole('button', { name: 'Confirm email and reserve for review' })
    .waitFor({ timeout: 60000 })
  announce('token-fragment-removal')
  await page.waitForFunction(() => !window.location.hash, { timeout: 30000 })
  assert(!page.url().includes('#'))
  announce('token-get-database-unchanged')
  assert(
    (await inspection.query('SELECT state FROM checkouts WHERE id=$1', [fixture.unverifiedId]))
      .rows[0].state === 'unverified',
  )
  assert(
    (
      await inspection.query('SELECT count(*)::int AS count FROM orders WHERE checkout_id=$1', [
        fixture.unverifiedId,
      ])
    ).rows[0].count === 0,
  )
  passed('verification-get-strips-fragment-without-reserving-seats')
  announce('login-and-owner')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await navigate(`/account/checkouts/${fixture.checkoutId}`)
  await page.getByLabel('Email', { exact: true }).waitFor({ timeout: 60000 })
  await page.getByLabel('Email', { exact: true }).fill('checkout-browser@example.invalid')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await page.waitForURL((url) => url.pathname.startsWith('/account'), { timeout: 60000 })
  await navigate(`/account/checkouts/${fixture.checkoutId}`)
  await page
    .getByRole('heading', { name: 'Browser climbing trip', exact: true })
    .waitFor({ timeout: 60000 })
  await page.getByText('Places reserved — payment pending', { exact: true }).waitFor()
  passed('returning-owner-account-checkout-renders')
  expectedNotFound = true
  const denied = await navigate(`/account/checkouts/${fixture.unverifiedId}`)
  assert(denied?.status() === 404)
  passed('other-checkout-owner-access-denied')
  const staffDenied = await navigate('/checkout/operations')
  assert(staffDenied?.status() === 404)
  passed('customer-staff-operations-access-denied')
  report.browserPassed = true
  await context.close()
  await browser.close()
  browser = undefined
  announce('next-disabled')
  await stopServer()
  await startServer({ ...env, CHECKOUT_ENABLED: 'false' }, port)
  for (const url of [
    '/cart',
    '/checkout',
    '/checkout/verify?checkout=1',
    '/checkout/invite?checkout=1',
  ])
    assert((await fetch(`${base}${url}`)).status === 404)
  report.flagOffPassed = true
  passed('feature-disabled-public-routes-return-not-found')
  announce('awaiting-final-source')
  await stopServer()
  while (process.argv.includes('--wait-for-source')) {
    if (interrupted) throw new Error('interrupted')
    try {
      await readFile(path.join(output, 'final-source-ready'))
      break
    } catch {}
    await pause(1000)
  }
  await child('rsync', ['-a', '--delete', path.join(root, 'src/'), path.join(copy, 'src/')])
  await writeFile(path.join(copy, 'package.json'), await readFile(path.join(root, 'package.json')))
  await rm(path.join(copy, 'node_modules'))
  await child('cp', ['-al', path.join(root, 'node_modules'), path.join(copy, 'node_modules')])
  announce('production-build')
  await child('pnpm', ['build'], {
    cwd: copy,
    env: { ...env, NODE_ENV: 'production' },
  })
  report.buildPassed = true
  passed('isolated-production-build')
}
process.on('SIGINT', () => {
  interrupted = true
  for (const item of children) item.kill('SIGTERM')
})
process.on('SIGTERM', () => {
  interrupted = true
  for (const item of children) item.kill('SIGTERM')
})
try {
  await main()
} catch {
  report.failedStage = stage
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } catch {}
  await stopServer()
  for (const item of children) item.kill('SIGKILL')
  try {
    await inspection?.end()
  } catch {}
  if (admin) {
    try {
      if (database) {
        await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`)
        report.databaseCleaned = true
      }
    } catch {}
    try {
      await admin.end()
    } catch {}
  }
  if (copy) {
    try {
      await rm(copy, { recursive: true, force: true })
      report.sourceCopyCleaned = true
    } catch {}
  }
  await mkdir(output, { recursive: true, mode: 0o700 })
  await writeFile(
    path.join(output, visualOnly ? 'visual-report.json' : 'report.json'),
    JSON.stringify(report, null, 2),
    {
      mode: 0o600,
    },
  )
  console.log(JSON.stringify(report))
}
