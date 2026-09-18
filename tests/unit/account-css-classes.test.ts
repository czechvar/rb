import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

// In unit tests a CSS-module import is a Proxy that answers every key, so a misspelt class passes
// every rendering test and only shows up as an unstyled element in the browser. This reads the
// real stylesheets instead.
const ACCOUNT = 'src/app/(frontend)/account'
const SHEETS: Record<string, string> = {
  checkout: 'src/components/checkout/checkout.module.css',
  styles: `${ACCOUNT}/account.module.css`,
}

const definedIn = (file: string) =>
  new Set([...readFileSync(file, 'utf8').matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]))

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    // The reservation pages alias the checkout stylesheet as `styles`; they are not part of this guard.
    if (entry.isDirectory()) return entry.name === 'checkouts' ? [] : sources(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

it('every CSS-module class used by the account pages exists in its stylesheet', () => {
  const missing: string[] = []
  let checked = 0
  for (const file of sources(ACCOUNT)) {
    // Import lines spell the stylesheet path (`checkout.module.css`), which is not a class.
    const raw = readFileSync(file, 'utf8')
    const code = raw.replace(/^import .*$/gm, (line) =>
      line.replace(/'[^']*'/, "''"),
    )
    for (const [alias, sheet] of Object.entries(SHEETS)) {
      // `o.checkout.id` is the order's relation, hence the lookbehind below. Only when the alias really is that stylesheet in this file.
      if (!new RegExp(`import ${alias} from '[^']*${sheet.split('/').pop()}'`).test(raw)) continue
      const defined = definedIn(sheet)
      for (const [, name] of code.matchAll(new RegExp(`(?<![.\\w])${alias}\\.([A-Za-z_]\\w*)`, 'g'))) {
        checked += 1
        if (!defined.has(name)) missing.push(`${file}: ${alias}.${name} is not in ${sheet}`)
      }
    }
  }
  expect(missing).toEqual([])
  // Guard the guard: if the scan stops finding usages it would pass vacuously.
  expect(checked).toBeGreaterThan(100)
})
