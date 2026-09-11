/** Install/remove an owned development-only fixture route for historical content QA. */
import fs from 'node:fs/promises'
import path from 'node:path'

const target = 'src/app/(frontend)/editorial-qa/[id]/page.tsx'
const template = await fs.readFile(new URL('./fixtures/page.tsx.template', import.meta.url), 'utf8')
const mode = process.argv[2]
const current = await fs.readFile(target, 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return null
  throw error
})
if (!['install', 'remove'].includes(mode)) throw new Error('Use install or remove')
if (current !== null && current !== template)
  throw new Error('Fixture changed; preserve and review it')
if (mode === 'install' && current === null) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, template, { flag: 'wx' })
}
if (mode === 'remove' && current !== null) await fs.unlink(target)
console.log(JSON.stringify({ mode, fixtureOnly: true }))
