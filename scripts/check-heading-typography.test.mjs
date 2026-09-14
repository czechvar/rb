import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const checker = resolve('scripts/check-heading-typography.mjs')
function check(jsx, css) {
  const directory = mkdtempSync(join(tmpdir(), 'rb-heading-check-'))
  try {
    mkdirSync(join(directory, 'src/components'), { recursive: true })
    mkdirSync(join(directory, 'src/app/(frontend)'), { recursive: true })
    writeFileSync(join(directory, 'src/components/Example.tsx'), `import styles from './example.module.css';\n${jsx}`)
    writeFileSync(join(directory, 'src/components/example.module.css'), css)
    const result = spawnSync(process.execPath, [checker], { cwd: directory, encoding: 'utf8' })
    return { status: result.status, stderr: result.stderr }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('rejects responsive class overrides and direct heading selectors', () => {
  const result = check('export const Example = () => <h1 className={styles.title}>Title</h1>',
    '@media (max-width: 700px) { .title { font-size: 70px } } .card h3 { font-weight: 400 }')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /font-size/)
  assert.match(result.stderr, /font-weight/)
})

test('rejects inline typography and dynamic heading class overrides', () => {
  const result = check("export function Example() { const Heading = 'h3'; return <Heading className={styles.title} style={{lineHeight: 1}}>Title</Heading> }",
    '.title { font: 20px sans-serif }')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Inline heading typography/)
  assert.match(result.stderr, /: font/)
})

test('allows semantic roles, layout, colours and child accent styling', () => {
  const result = check('export const Example = () => <h2 data-type="label" className={styles.title}>Title</h2>',
    '.title { margin: 0; color: red; max-width: 100%; } .title em { font-style: normal; }')
  assert.equal(result.status, 0)
})
