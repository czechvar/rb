import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { themePresets } from '../src/lib/theme/themePresets'
import { themeTokens } from '../src/lib/theme/tokenRegistry'

const root = process.cwd()
const themeCss = readFileSync(resolve(root, 'src/app/(frontend)/theme.css'), 'utf8')

const rockbustersCss = readDeclarations(
  themeCss,
  /:root,\s*\n\[data-theme='rockbusters'\],\s*\n\.theme-rockbusters\s*\{/,
)
const snowbustersOverrides = readDeclarations(
  themeCss,
  /\[data-theme='snowbusters'\],\s*\n\.theme-snowbusters\s*\{/,
)
const snowbustersCss = { ...rockbustersCss, ...snowbustersOverrides }
const cssTokenNames = [
  ...new Set([...themeCss.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((match) => match[1])),
]
const registryTokenNames = themeTokens.map((token) => token.name)
const failures: string[] = []

compareSets('registry tokens', registryTokenNames, cssTokenNames)
comparePreset('rockbusters', themePresets.rockbusters, rockbustersCss)
comparePreset('snowbusters', themePresets.snowbusters, snowbustersCss)

if (failures.length > 0) {
  console.error('Theme registry check failed:\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Theme registry check passed.')
console.log(`Checked ${registryTokenNames.length} tokens against theme.css.`)

function compareSets(label: string, actual: string[], expected: string[]) {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  const missing = expected.filter((name) => !actualSet.has(name))
  const extra = actual.filter((name) => !expectedSet.has(name))

  if (missing.length > 0) {
    failures.push(`${label} missing: ${missing.join(', ')}`)
  }

  if (extra.length > 0) {
    failures.push(`${label} extra: ${extra.join(', ')}`)
  }
}

function comparePreset(
  name: keyof typeof themePresets,
  preset: Record<string, string>,
  cssValues: Record<string, string>,
) {
  for (const token of themeTokens) {
    const expected = cssValues[token.name]
    const actual = preset[token.name]

    if (expected === undefined) {
      failures.push(`${name} missing CSS value for ${token.name}`)
      continue
    }

    if (actual === undefined) {
      failures.push(`${name} preset missing ${token.name}`)
      continue
    }

    if (normalizeCssValue(actual) !== normalizeCssValue(expected)) {
      failures.push(
        `${name} ${token.name}: preset "${actual}" does not match theme.css "${expected}"`,
      )
    }
  }
}

function readDeclarations(css: string, selectorPattern: RegExp) {
  const selectorMatch = selectorPattern.exec(css)

  if (!selectorMatch) {
    throw new Error(`Could not find selector block: ${selectorPattern}`)
  }

  const start = selectorMatch.index + selectorMatch[0].length
  const end = findClosingBrace(css, start)
  const body = css.slice(start, end)
  const declarations: Record<string, string> = {}

  for (const line of body.split(/\r?\n/)) {
    const match = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*(.+?)\s*;\s*$/.exec(line)

    if (match) {
      declarations[match[1]] = match[2]
    }
  }

  return declarations
}

function findClosingBrace(source: string, start: number) {
  let depth = 1

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (char === '{') {
      depth += 1
    }

    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  throw new Error('Could not find closing brace for theme block.')
}

function normalizeCssValue(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}
