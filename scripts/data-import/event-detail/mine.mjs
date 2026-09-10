import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const kinds = ['overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes']
export const text = (node) => {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(text).join('')
  if (node.type === 'linebreak') return '\n'
  return node.text ?? text(node.children ?? node.root)
}
const normalize = (value) => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim()
const patterns = {
  notes: ['need to know'],
  overview: ['course overview', 'trip overview', 'overview', 'about this course', 'about this trip'],
  learning: ['what you ll learn', 'what you will learn', 'what you learn', 'learning outcomes'],
  itinerary: ['itinerary', 'daily schedule', 'daily structure', 'programme', 'program', 'schedule'],
  requirements: ['requirements', 'prerequisites', 'physical technical requirements', 'physical and technical requirements'],
  equipment: ['what to bring', 'equipment', 'gear', 'essential equipment', 'kit list'],
  audience: ['who is it for', 'who this course is for', 'who this trip is for'],
  highlights: ['highlights', 'trip highlights', 'course highlights'],
}
function kindFor(heading) {
  const match = normalize(heading)
  return Object.entries(patterns).find(([, choices]) => choices.includes(match))?.[0]
}
export function digest(value) {
  const stable = (v) => v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}
export function sourceDigest(source) { const { target: _target, ...rest } = source; return digest(rest) }
const existingArrays = {
  learning: ['events_what_you_learn_box1_bullets', 'events_what_you_learn_box2_bullets'],
  itinerary: ['events_itinerary_days'], requirements: ['events_prerequisites'],
  equipment: ['events_essential_equipment'], audience: ['events_audience_cards'], highlights: ['events_highlights'],
}
function hasExisting(source, event, kind) {
  return (existingArrays[kind] ?? []).some(t => source.children[t]?.some(r => r._parent_id === event.id)) ||
    (kind === 'learning' && (event.what_you_learn_box1_heading || event.what_you_learn_box2_heading || event.what_you_learn_intro)) ||
    (kind === 'itinerary' && event.itinerary_intro) || (kind === 'equipment' && event.equipment_intro)
}
const documentOf = (original, children) => ({ ...structuredClone(original), root: { ...structuredClone(original.root), children: structuredClone(children) } })
export function extract(source, event) {
  const candidates = [], unmapped = []
  function add(kind, heading, body, path, reason) {
    if (!text(body).trim()) { unmapped.push({ path, reason: 'Empty source body' }); return }
    const value = { kind, heading, body }
    const content = text(body)
    const knownConflict = event.slug === 'knots-stone-czech-climbing-tradition' && ['itinerary', 'requirements'].includes(kind)
    const commercial = /[€£$]|\b(?:EUR|CZK)\b|\b(?:maximum|max\.?|limited to)\s+\d|\b\d+\s*(?:participants|people|spots|persons)\b|\ball.inclusive\b/i.test(content)
    const outcome = hasExisting(source, event, kind) ? 'already-populated' : knownConflict || commercial ? 'editor-review' : 'copy-exact'
    candidates.push({ id: digest({ slug: event.slug, path }).slice(0, 24), sourcePath: path, outcome,
      reason: outcome === 'already-populated' ? 'Existing structured field preserved' : knownConflict ? 'Known duration or equipment conflict; preserved for editor' : commercial ? 'Commercial/group/inclusion claim in prose; needs editorial reconciliation' : reason,
      value })
  }
  const root = event.content?.root
  if (root?.children) {
    let start = 0
    const boundaries = root.children.map((node, index) => ({ node, index }))
      .filter(({ node }) => (node.type === 'heading' || (node.type === 'paragraph' && kindFor(text(node)))) && text(node).trim())
    if (boundaries.length) {
      for (let i = 0; i < boundaries.length; i++) {
        const { node, index } = boundaries[i]
        if (index > start) unmapped.push({ path: `content.root.children[${start}:${index}]`, reason: 'Unclassified introductory source; retained unchanged' })
        const end = boundaries[i + 1]?.index ?? root.children.length
        const kind = kindFor(text(node))
        const path = `content.root.children[${index}:${end}]`
        // Keep all original body nodes, including blank headings and separators, in the exact slice.
        if (kind) add(kind, text(node), documentOf(event.content, root.children.slice(index + 1, end)), path, 'Explicit source heading; body copied exactly')
        else unmapped.push({ path, reason: 'Heading is outside proven semantic mappings; source retained unchanged' })
        start = end
      }
    } else unmapped.push({ path: 'content', reason: 'No explicit supported section boundaries; source retained unchanged' })
  }
  for (const row of source.children.events_additional_info.filter(r => r._parent_id === event.id)) {
    const kind = kindFor(row.heading), path = `additionalInfo[id=${row.id}].body`
    if (kind) add(kind, row.heading, structuredClone(row.body), path, 'Existing additionalInfo heading and rich text copied exactly')
    else unmapped.push({ path, reason: 'Existing additionalInfo retained; no compatible empty target mapped' })
  }
  // Multiple sources for one topic are alternatives, not permission to concatenate or choose one.
  for (const c of candidates) {
    if (c.outcome === 'copy-exact' && candidates.filter(d => d.value.kind === c.value.kind).length > 1) {
      c.outcome = 'editor-review'; c.reason = 'Multiple source sections for this topic; editor chooses ownership'
    }
  }
  const stored = source.target.filter(r => r._parent_id === event.id)
  if (stored.length) {
    for (const c of candidates) {
      c.outcome = 'already-populated'; c.reason = 'tripDetail.sections already populated; preserve editor content'
    }
  }
  const dateIds = source.dates.filter(d => d.event_id === event.id).map(d => d.id)
  return { slug: event.slug, eventId: event.id, candidates, unmapped,
    occurrenceContent: dateIds.map(id => ({ id, outcome: 'preserved-in-place', reason: 'Date facts, extra_content and overrides remain occurrence-scoped' })),
    conflicts: event.slug === 'knots-stone-czech-climbing-tradition' ? [
      'Event EUR 895/max 6 versus upcoming Event Date EUR 1150/capacity 4',
      'Five-day prose versus Day 6 schedule and September 12–19 date span',
      'Event guide Benjamin Brochard versus date guide Pavel Ryva',
      'All-inclusive prose versus structured exclusions for transport and food',
      'Traditional rack advice versus textile-only protection description',
      'Broader venues in prose versus existing Labské Údolí relationship',
    ] : [],
  }
}
export function buildManifest(source) {
  return { version: 1, target: 'events.tripDetail.sections', sourceDigest: sourceDigest(source), events: source.events.map(e => extract(source, e)) }
}
export async function writeManifest(directory) {
  const source = JSON.parse(await fs.readFile(`${directory}/source.json`, 'utf8'))
  const manifest = buildManifest(source)
  await fs.writeFile(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
  const counts = {}
  for (const e of manifest.events) for (const c of e.candidates) counts[c.outcome] = (counts[c.outcome] ?? 0) + 1
  const report = ['# Exact-source extraction manifest', '', 'Original source: source.json. Complete mappings: manifest.json. No editorial correction or internet enrichment.', '',
    '| Event | Copy exact | Editor review | Existing target | Unmapped ranges |', '|---|---:|---:|---:|---:|',
    ...manifest.events.map(e => `| ${e.slug} | ${e.candidates.filter(c => c.outcome === 'copy-exact').length} | ${e.candidates.filter(c => c.outcome === 'editor-review').length} | ${e.candidates.filter(c => c.outcome === 'already-populated').length} | ${e.unmapped.length} |`)]
  await fs.writeFile(`${directory}/README.md`, report.join('\n') + '\n')
  return { events: manifest.events.length, ...counts, eventsToFill: manifest.events.filter(e => e.candidates.some(c => c.outcome === 'copy-exact')).length }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await writeManifest(process.argv[2] ?? '.scratch/event-detail-migration'))) }
  catch { console.error('Manifest generation failed'); process.exitCode = 1 }
}
