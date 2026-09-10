import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { extract, buildManifest, digest } from './mine.mjs'
import { validateManifest, validateSource, proposedRows } from './backfill.mjs'
const paragraph = (s) => ({ type: 'paragraph', version: 1, children: [{ type: 'text', text: s, format: 1, version: 1 }] })
const heading = (s) => ({ ...paragraph(s), type: 'heading', tag: 'h2' })
const doc = (children) => ({ root: { type: 'root', version: 1, children, direction: null, format: '', indent: 0 } })
const event = { id: 1, slug: 'test-source', content: doc([heading('What you’ll learn'), paragraph('Exact spelling & wording.')]) }
const source = (e = event) => ({ events: [e], children: { events_additional_info: [] }, dates: [], target: [] })

test('copies rich-text nodes and headings without rewriting formatting', () => {
  const s = source(), before = structuredClone(s), r = extract(s, event)
  assert.equal(r.candidates[0].outcome, 'copy-exact')
  assert.equal(r.candidates[0].value.heading, 'What you’ll learn')
  assert.deepEqual(r.candidates[0].value.body.root.children, event.content.root.children.slice(1))
  assert.deepEqual(s, before)
})
test('retains unstructured prose as unmapped', () => {
  const e = { ...event, content: doc([paragraph('Some useful but unclassified prose.')]) }
  assert.equal(extract(source(e), e).candidates.length, 0)
  assert.equal(extract(source(e), e).unmapped.length, 1)
})
test('blank headings do not lose or rewrite nodes', () => {
  const e = { ...event, content: doc([heading('What you’ll learn'), paragraph('A'), heading('\u00a0'), paragraph('B')]) }
  assert.deepEqual(extract(source(e), e).candidates[0].value.body.root.children, e.content.root.children.slice(1))
})
test('existing structured data is preserved', () => {
  const s = source(); s.children.events_what_you_learn_box1_bullets = [{ _parent_id: 1, text: 'Editor value' }]
  assert.equal(extract(s, event).candidates[0].outcome, 'already-populated')
})
test('existing target array is preserved even if miner has a candidate', () => {
  const s = source(); s.target = [{ _parent_id: 1, heading: 'Editor title' }]
  assert.equal(extract(s, event).candidates[0].outcome, 'already-populated')
})
test('commercial claims stay outside executable rows', () => {
  const e = { ...event, content: doc([heading('Overview'), paragraph('€895. Maximum 6 participants.')]) }
  assert.equal(extract(source(e), e).candidates[0].outcome, 'editor-review')
  assert.equal(proposedRows(buildManifest(source(e))).length, 0)
})
test('multiple sources for a topic are not chosen or merged', () => {
  const s = source(); s.children.events_additional_info = [{ _parent_id: 1, id: 'a', heading: 'What you’ll learn', body: doc([paragraph('Alternative')]) }]
  assert.ok(extract(s, event).candidates.every(c => c.outcome === 'editor-review'))
})
test('date text stays scoped and is not promoted to Event', () => {
  const s = source(); s.dates = [{ id: 22, event_id: 1, extra_content: doc([heading('Overview'), paragraph('Date-only')]) }]
  const r = extract(s, event)
  assert.equal(r.candidates.length, 1)
  assert.equal(r.occurrenceContent[0].outcome, 'preserved-in-place')
})
test('manifest rejects manual changes and stale catalogue source', () => {
  const s = source(), manifest = buildManifest(s)
  validateManifest(s, manifest)
  manifest.events[0].candidates[0].value.heading = 'Invented'
  assert.throws(() => validateManifest(s, manifest))
  const changed = structuredClone(s); changed.events[0].slug = 'changed'
  assert.throws(() => validateSource(s, changed))
})
test('timestamps hash consistently before and after JSON serialization', () => {
  const s = { a: new Date('2026-09-10T00:00:00Z') }
  assert.equal(digest(s), digest(JSON.parse(JSON.stringify(s))))
})
test('same source produces identical candidates and stable row ids', () => {
  assert.deepEqual(buildManifest(source()), buildManifest(source()))
  assert.deepEqual(proposedRows(buildManifest(source())), proposedRows(buildManifest(source())))
})
test('actual catalogue manifest has exact source bodies and complete accounting', { skip: !fs.existsSync('.scratch/event-detail-migration/source.json') }, () => {
  const s = JSON.parse(fs.readFileSync('.scratch/event-detail-migration/source.json'))
  const m = buildManifest(s)
  assert.equal(m.events.length, s.events.length)
  for (const e of m.events) {
    const original = s.events.find(r => r.id === e.eventId)
    for (const c of e.candidates) {
      const indices = c.sourcePath.match(/^content.root.children\[(\d+):(\d+)\]$/)
      if (indices) assert.deepEqual(c.value.body.root.children, original.content.root.children.slice(Number(indices[1]) + 1, Number(indices[2])))
      else assert.deepEqual(c.value.body, s.children.events_additional_info.find(r => r._parent_id === e.eventId && c.sourcePath.includes(`[id=${r.id}]`)).body)
    }
  }
  const pilot = m.events.find(e => e.slug === 'knots-stone-czech-climbing-tradition')
  assert.deepEqual(pilot.candidates.filter(c => c.outcome === 'copy-exact').map(c => c.value.kind), ['overview', 'learning', 'equipment'])
})
