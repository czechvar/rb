#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const root = process.cwd()
const themeFile = 'src/app/(frontend)/theme.css'
const scanRoots = ['src/app/(frontend)', 'src/components']
const cssFiles = scanRoots.flatMap((dir) => collectCssFiles(resolve(root, dir)))
const strictWarnings =
  process.argv.includes('--strict') ||
  process.env.THEME_CSS_STRICT === '1' ||
  process.env.THEME_CSS_STRICT === 'true'

const hardErrors = []
const migrationWarnings = []

for (const absFile of cssFiles) {
  const file = relative(root, absFile)
  const lines = readFileSync(absFile, 'utf8').split(/\r?\n/)
  const isThemeFile = file === themeFile
  const isCssModule = file.endsWith('.module.css')

  lines.forEach((line, index) => {
    const lineNo = index + 1

    if (!isThemeFile && /^\s*--(?:theme|rb)-[a-zA-Z0-9-]+\s*:/.test(line)) {
      hardErrors.push({
        file,
        lineNo,
        line,
        reason: 'Theme and legacy brand tokens may only be defined in theme.css.',
      })
    }

    if (!isThemeFile && /^\s*--col(?:Info|Ok|Warning|Error)\s*:/.test(line)) {
      hardErrors.push({
        file,
        lineNo,
        line,
        reason: 'Status tokens may only be defined in theme.css.',
      })
    }

    if (isCssModule && /^\s*(?::root|html\b|body\b|\*)\s*(?:,|\{)/.test(line) && !line.includes(':global(')) {
      hardErrors.push({
        file,
        lineNo,
        line,
        reason: 'CSS Modules must not redefine document/global element styles.',
      })
    }

    if (isCssModule && /var\(--rb-|#[0-9a-fA-F]{3,8}\b|\brgba?\(|font-family:\s*['"][^'"]+['"]/.test(line)) {
      migrationWarnings.push({
        file,
        lineNo,
        line,
      })
    }
  })
}

if (hardErrors.length > 0) {
  console.error('Theme CSS check failed:\n')
  for (const error of hardErrors) {
    console.error(`${error.file}:${error.lineNo} ${error.reason}`)
    console.error(`  ${error.line.trim()}`)
  }
  process.exit(1)
}

const filesWithWarnings = new Set(migrationWarnings.map((warning) => warning.file))
console.log('Theme CSS check passed.')
console.log(`Scanned ${cssFiles.length} CSS files.`)
console.log(
  `Migration backlog: ${migrationWarnings.length} primitive styling lines across ${filesWithWarnings.size} CSS module files.`,
)
console.log('Backlog patterns: legacy --rb-* usage, hardcoded colors, rgba(), and hardcoded font families.')

if (strictWarnings && migrationWarnings.length > 0) {
  console.error('\nTheme CSS strict mode failed:')
  console.error('Migration warnings are treated as errors in strict mode.\n')
  for (const warning of migrationWarnings) {
    console.error(`${warning.file}:${warning.lineNo}`)
    console.error(`  ${warning.line.trim()}`)
  }
  process.exit(1)
}

function collectCssFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const abs = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectCssFiles(abs))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(abs)
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}
