import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { hasHardcodedWidthCap } from './theme-width-rules.mjs'

test('rejects direct, implicit, and fallback numeric caps', () => {
  for (const [property, value] of [
    ['max-width', '1200px'],
    ['max-inline-size', '60rem'],
    ['width', 'min(100%, 1400px)'],
    ['inline-size', 'clamp(300px, 80vw, 1200px)'],
    ['max-width', 'var(--theme-content-max, 1400px)'],
    ['width', 'min(var(--theme-content-max), 1200px)'],
  ]) assert.equal(hasHardcodedWidthCap(property, value), true, value)
})

test('allows theme caps, relative fit, and ordinary component dimensions', () => {
  for (const [property, value] of [
    ['max-width', 'var(--theme-content-max)'],
    ['width', 'min(var(--theme-content-max), calc(100% - 2 * var(--theme-content-gutter)))'],
    ['max-width', 'min(var(--theme-content-lead-max), calc(100% - 440px))'],
    ['max-width', 'calc(100% - 36px)'],
    ['max-width', '100%'],
    ['max-width', 'none'],
    ['max-width', 'max-content'],
    ['width', '32px'],
    ['padding', 'min(4vw, 40px)'],
  ]) assert.equal(hasHardcodedWidthCap(property, value), false, value)
})

test('CSS scanner excludes breakpoints and comments, but catches multiline declarations', () => {
  const root = mkdtempSync(join(tmpdir(), 'theme-width-check-'))
  try {
    mkdirSync(join(root, 'src/app/(frontend)'), { recursive: true })
    mkdirSync(join(root, 'src/components'), { recursive: true })
    const fixture = join(root, 'src/components/fixture.module.css')
    const run = () => spawnSync(process.execPath, [fileURLToPath(new URL('./check-theme-css.mjs', import.meta.url))], { cwd: root, encoding: 'utf8' })
    writeFileSync(fixture, '/* max-width: 900px; */\n@media (max-width: 900px) { .card { max-width: var(--theme-content-max); } }')
    assert.equal(run().status, 0)
    writeFileSync(fixture, '.card {\n width: min(\n 100%,\n 1400px\n );\n}')
    const result = run()
    assert.equal(result.status, 1)
    assert.match(result.stderr, /fixture.module.css:2 Design width caps/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
