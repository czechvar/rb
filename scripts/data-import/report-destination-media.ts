/** Read-only editorial review report for current Location media relationships. */
import fs from 'node:fs/promises'
import path from 'node:path'

const relationsFile = path.resolve('.artifacts/location-media-relations.json')
const auditFile = path.resolve('.artifacts/media-quality-audit-2026-09-05/media-quality-audit.json')
const outputFile = path.resolve('.artifacts/destination-media-editorial-review.json')

type Media = { id: string; alt?: string | null; filename?: string | null; url?: string | null }
type Location = { id: number; slug: string; name: string; mainPicture?: Media | null; gallery?: Media[] | null }
type Audit = { id: string; focusScore: number | null; heroSuitable: boolean; gallerySuitable: boolean; exactHash: string | null; perceptualHash: string | null; flags: string[] }

function normalized(value: string | null | undefined) {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function textFor(media: Media) {
  return normalized(`${media.filename ?? ''} ${media.alt ?? ''}`)
}

function distance(first: string, second: string) {
  let total = 0
  for (let index = 0; index < first.length; index += 2) {
    let bits = (Number.parseInt(first.slice(index, index + 2), 16) ^ Number.parseInt(second.slice(index, index + 2), 16)) >>> 0
    while (bits) {
      total += 1
      bits = (bits & (bits - 1)) >>> 0
    }
  }
  return total
}

async function main() {
  const [{ docs: locations }, { rows: auditRows }] = await Promise.all([
    fs.readFile(relationsFile, 'utf8').then((text) => JSON.parse(text) as { docs: Location[] }),
    fs.readFile(auditFile, 'utf8').then((text) => JSON.parse(text) as { rows: Audit[] }),
  ])
  const audit = new Map(auditRows.map((row) => [row.id, row]))
  const locationTerms = locations
    .map((location) => ({ slug: location.slug, name: location.name, term: normalized(location.name) }))
    .filter((location) => location.term.length >= 5)

  const report = locations.map((location) => {
    const currentTerm = normalized(location.name)
    const seenExact = new Set<string>()
    const selected: Array<{ media: Media; audit: Audit; relation: 'main' | 'gallery'; reasons: string[]; relevance: 'matching' | 'foreign' | 'unlabelled' }> = []
    for (const [index, media] of [location.mainPicture, ...(location.gallery ?? [])].entries()) {
      if (!media?.id) continue
      const row = audit.get(media.id)
      if (!row) continue
      const label = textFor(media)
      const foreign = locationTerms.filter((term) => term.slug !== location.slug && label.includes(term.term)).map((term) => term.slug)
      const relevance = label.includes(currentTerm) ? 'matching' : foreign.length ? 'foreign' : 'unlabelled'
      const reasons: string[] = []
      if (foreign.length) reasons.push(`labelled-for:${foreign.join('|')}`)
      if (!row.gallerySuitable && index > 0) reasons.push('gallery-resolution-or-focus-fail')
      if (!row.heroSuitable && index === 0) reasons.push('hero-resolution-or-focus-fail')
      if (row.exactHash && seenExact.has(row.exactHash)) reasons.push('exact-duplicate-in-destination')
      if (row.exactHash) seenExact.add(row.exactHash)
      selected.push({ media, audit: row, relation: index === 0 ? 'main' : 'gallery', reasons, relevance })
    }

    const duplicateIds = new Set<string>()
    for (let first = 0; first < selected.length; first += 1) {
      for (let second = 0; second < first; second += 1) {
        const a = selected[first].audit.perceptualHash
        const b = selected[second].audit.perceptualHash
        if (a && b && a !== b && distance(a, b) <= 8) duplicateIds.add(selected[first].media.id)
      }
    }
    for (const item of selected) if (duplicateIds.has(item.media.id)) item.reasons.push('near-duplicate-in-destination')

    const candidates = selected.filter((item) => item.relevance === 'matching' && item.reasons.length === 0)
    const describe = (item: (typeof selected)[number]) => ({
      id: item.media.id,
      alt: item.media.alt ?? item.media.filename ?? item.media.id,
      focusScore: item.audit.focusScore,
      url: item.media.url ?? null,
    })
    return {
      destination: { id: location.id, slug: location.slug, name: location.name },
      counts: {
        mainAndGallery: selected.length,
        proposedRemoval: selected.filter((item) => item.reasons.length).length,
        needsEditorialRelevanceReview: selected.filter((item) => item.relevance === 'unlabelled' && !item.reasons.length).length,
      },
      promoteToPrimary: candidates.filter((item) => item.audit.heroSuitable).sort((a, b) => (b.audit.focusScore ?? 0) - (a.audit.focusScore ?? 0)).slice(0, 3).map(describe),
      promoteToSecondary: candidates.filter((item) => item.audit.gallerySuitable).sort((a, b) => (b.audit.focusScore ?? 0) - (a.audit.focusScore ?? 0)).slice(0, 8).map(describe),
      proposedRemoval: selected.filter((item) => item.reasons.length).map((item) => ({ id: item.media.id, alt: item.media.alt ?? item.media.filename ?? item.media.id, reasons: item.reasons })),
      needsEditorialRelevanceReview: selected.filter((item) => item.relevance === 'unlabelled' && !item.reasons.length).map(describe),
    }
  })
  await fs.writeFile(outputFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), destinations: report }, null, 2)}\n`)
  console.log(`wrote ${report.length} destination reviews to ${path.relative(process.cwd(), outputFile)}`)
}

main().catch((error) => { console.error(error); process.exit(1) })
