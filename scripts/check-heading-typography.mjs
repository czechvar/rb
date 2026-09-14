#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Reuse the CSS parser already used by the installed Next build pipeline.
const require = createRequire(import.meta.url)
const postcss = createRequire(require.resolve('next/package.json'))('postcss')
const typography = /^(font(?:-.+)?|line-height|letter-spacing|text-transform)$/
const heading = /^h[1-4]$/
const files = ['src/components', 'src/app/(frontend)'].flatMap(collect)
const classesByModule = new Map()
const failures = []
let headingCount = 0

for (const file of files.filter(file => file.endsWith('.tsx'))) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = new Map()
  const dynamicHeadings = new Set()
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text.endsWith('.module.css')) {
      const specifier = statement.moduleSpecifier.text
      imports.set(statement.importClause?.name?.text, normalize(specifier.startsWith('@/')
        ? join('src', specifier.slice(2)) : join(dirname(file), specifier)))
    }
  }
  // Covers <Heading> selected from literal h3/h4 values and <Tag> with an h2 default.
  visit(source, node => {
    if (ts.isVariableDeclaration(node) || ts.isBindingElement(node)) {
      const values = []
      if (node.initializer) visit(node.initializer, child => {
        if (ts.isStringLiteral(child)) values.push(child.text)
      })
      if (values.some(value => heading.test(value))) dynamicHeadings.add(node.name.getText(source))
    }
  })
  visit(source, node => {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return
    if (!heading.test(node.tagName.getText(source)) && !dynamicHeadings.has(node.tagName.getText(source))) return
    headingCount++
    for (const attribute of node.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue
      if (attribute.name.text === 'className' && attribute.initializer) {
        visit(attribute.initializer, child => {
          if (!ts.isPropertyAccessExpression(child)) return
          const cssModule = imports.get(child.expression.getText(source))
          if (!cssModule) return
          if (!classesByModule.has(cssModule)) classesByModule.set(cssModule, new Set())
          classesByModule.get(cssModule).add(child.name.text)
        })
      }
      if (attribute.name.text === 'style' && attribute.initializer) {
        visit(attribute.initializer, child => {
          if (!ts.isPropertyAssignment(child)) return
          const property = child.name.getText(source).replace(/['"]/g, '').replace(/[A-Z]/g, value => `-${value.toLowerCase()}`)
          if (typography.test(property)) failures.push(`${file}:${source.getLineAndCharacterOfPosition(child.pos).line + 1} Inline heading typography: ${property}`)
        })
      }
    }
  })
}

for (const file of files.filter(file => file.endsWith('.module.css'))) {
  const classes = classesByModule.get(file) ?? new Set()
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules(rule => {
    const targetsHeading = rule.selectors.some(selector => {
      // Only the final compound selects the heading itself; .title em is an accent.
      const leaf = selector.split(/\s+(?![^()]*\))/).at(-1)
      return /\bh[1-4]\b/.test(leaf) || [...classes].some(name => new RegExp(`\\.${name}(?![\\w-])`).test(leaf))
    })
    if (!targetsHeading) return
    for (const declaration of rule.nodes.filter(node => node.type === 'decl')) {
      if (typography.test(declaration.prop)) failures.push(`${file}:${declaration.source.start.line} ${rule.selector}: ${declaration.prop}`)
    }
  })
}

if (failures.length) {
  console.error('Heading typography must live in styles.css and theme.css. Use an explicit data-type role for exceptions.\n' + failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Heading typography check passed (${headingCount} heading uses).`)
}

function visit(node, callback) {
  callback(node)
  ts.forEachChild(node, child => visit(child, callback))
}
function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = normalize(join(directory, entry.name))
    return entry.isDirectory() ? collect(file) : [file]
  })
}
