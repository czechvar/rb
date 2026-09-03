#!/usr/bin/env node

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const PACKETS_DIR = path.resolve(ROOT, '.scratch/location-structured-extraction/packets')
const OUTPUT_DIR = path.resolve(ROOT, '.scratch/location-structured-extraction/output')
const ALBARRACIN_BASELINE = path.resolve(ROOT, '.scratch/albarracin-derived-structured-content.json')

const MONTHS = [
  ['Jan', 'winter'],
  ['Feb', 'winter'],
  ['Mar', 'spring'],
  ['Apr', 'spring'],
  ['May', 'spring'],
  ['Jun', 'summer'],
  ['Jul', 'summer'],
  ['Aug', 'summer'],
  ['Sep', 'autumn'],
  ['Oct', 'autumn'],
  ['Nov', 'autumn'],
  ['Dec', 'winter'],
]

const SECTION_ALIASES = {
  costs: ['costs', 'budget'],
  gear: ['gear', 'equipment'],
  grades: ['grades', 'grades-and-scale', 'grades-and-sectors'],
  history: ['history'],
  intro: ['intro', 'introduction'],
  restdays: ['restdays', 'rest-days'],
  rock: ['rock', 'rock-and-style'],
  safety: ['safety'],
  season: ['season', 'best-season'],
  stay: ['stay', 'stay-and-eat', 'accommodation'],
  tips: ['tips', 'tips-and-ethics', 'ethics', 'access'],
  transport: ['transport', 'getting-there'],
  who: ['who', 'who-is-it-for'],
  faq: ['faq', 'faqs'],
}

const ACCOMMODATION_LABELS = {
  apartment: ['Apartment stays', 'Self-catered apartments suit longer climbing weeks and groups that want easy food prep.'],
  campsite: ['Camping base', 'Campsites keep the trip simple, social and budget-aware when the season fits.'],
  'guesthouse-b-and-b': ['Guesthouses and B&Bs', 'Guesthouses give a practical local base with fewer logistics than camping.'],
  hotel: ['Hotel base', 'Hotels make sense for shorter trips, cold seasons or groups that want predictable recovery.'],
  'refuge-hut': ['Refuge-style lodging', 'Refuges and simple mountain lodging can work well where approaches and terrain are the priority.'],
  hostel: ['Hostel base', 'Hostels are a useful budget option where they are available close to the climbing.'],
  'rural-cottage': ['Rural cottages', 'Rural houses work well for groups that want shared space and self-catering.'],
  villa: ['Villas and houses', 'Private houses are useful for larger groups that want space, cooking and quiet recovery.'],
  luxury: ['Comfort stay', 'Higher-comfort stays can be worth it on longer trips or special weeks.'],
}

const STYLE_LABELS = {
  bouldering: 'Bouldering',
  sport: 'Sport climbing',
  trad: 'Trad climbing',
  alpine: 'Alpine climbing',
  'multi-pitch': 'Multi-pitch climbing',
  'deep-water-solo': 'Deep-water soloing',
  ice: 'Ice climbing',
  mixed: 'Mixed climbing',
}

const args = parseArgs(process.argv.slice(2))
const packetsDir = path.resolve(args.packets ?? PACKETS_DIR)
const outputDir = path.resolve(args.output ?? OUTPUT_DIR)

await rm(outputDir, { recursive: true, force: true })
await mkdir(outputDir, { recursive: true })

const packetFiles = (await readdir(packetsDir))
  .filter((entry) => entry.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b))

const packetCache = []
for (const packetFile of packetFiles) {
  const packet = await readJson(path.join(packetsDir, packetFile))
  const source = preferredCurated(packet)
  packetCache.push({
    file: packetFile,
    packet,
    source,
    slug: cleanText(source?.slug ?? packet.destination?.slug ?? path.basename(packetFile, '.json')),
    name: cleanText(source?.title ?? packet.destination?.name ?? packet.destination?.title ?? path.basename(packetFile, '.json')),
    country: cleanText(packet.destination?.country ?? source?.facts?.country),
  })
}

const byCountry = new Map()
for (const entry of packetCache) {
  const country = entry.country ?? 'unknown'
  byCountry.set(country, [...(byCountry.get(country) ?? []), entry])
}

const results = []
for (const entry of packetCache) {
  let structured
  if (entry.slug === 'albarracin' && await fileExists(ALBARRACIN_BASELINE)) {
    structured = await readJson(ALBARRACIN_BASELINE)
  } else {
    structured = buildStructured(entry, byCountry.get(entry.country ?? 'unknown') ?? [])
  }

  structured = normalizePayloadEnums(structured)
  const outputFile = path.join(outputDir, `${entry.slug}.json`)
  await writeFile(outputFile, `${JSON.stringify(structured, null, 2)}\n`)
  results.push({
    slug: structured.slug,
    sections: structured.sections?.length ?? 0,
    months: structured.seasonMonths?.length ?? 0,
    relatedDestinations: structured.relatedDestinations?.length ?? 0,
    file: path.relative(ROOT, outputFile),
  })
}

const manifest = {
  generatedAt: new Date().toISOString(),
  packetsDir: path.relative(ROOT, packetsDir),
  outputDir: path.relative(ROOT, outputDir),
  count: results.length,
  destinations: results.map((result) => ({
    slug: result.slug,
    output: path.relative(outputDir, path.resolve(ROOT, result.file)),
  })),
}

await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ generated: results.length, outputDir: path.relative(ROOT, outputDir), results }, null, 2))

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--packets') parsed.packets = argv[++index]
    else if (arg === '--output') parsed.output = argv[++index]
    else if (arg === '--help') {
      console.log('Usage: node scripts/data-import/legacy/build-location-structured-content.mjs [--packets DIR] [--output DIR]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function fileExists(file) {
  try {
    await readFile(file, 'utf8')
    return true
  } catch {
    return false
  }
}

function preferredCurated(packet) {
  return packet.latestV3CuratedDestination ?? packet.currentCuratedDestination ?? packet.curatedDestination ?? {}
}

function buildStructured(entry, countryPeers) {
  const { packet, source, slug, name } = entry
  const facts = source?.facts ?? {}
  const sectionsByKey = sectionMap(source?.sections)
  const styles = toStringArray(facts.climbingStyles)
  const primaryStyle = styles[0] ?? 'climbing'
  const styleLabel = STYLE_LABELS[primaryStyle] ?? titleCase(primaryStyle)
  const intro = sectionBody(sectionsByKey, 'intro') ?? sectionBody(sectionsByKey, 'hero')
  const heroBody = sectionBody(sectionsByKey, 'hero') ?? intro ?? `${name} is a Rockbusters destination for climbers planning a focused trip.`
  const gradeRange = cleanText(facts.gradeRange)
  const bestSeasonLabel = bestSeasonText(toStringArray(facts.bestSeasons))
  const relatedDestinations = relatedFor(entry, countryPeers)

  return {
    schemaDraft: 'destination-detail-v1',
    slug,
    name,
    displayName: name,
    country: cleanText(packet.destination?.country),
    region: cleanText(packet.destination?.region),
    status: source?.status ?? 'draft-derived',
    sources: source?.sources ?? [],
    facts: {
      locationKind: cleanText(facts.locationKind),
      destinationScope: cleanText(facts.destinationScope),
      climbingStyles: styles,
      rockTypes: toStringArray(facts.rockTypes),
      rockFeatures: toStringArray(facts.rockFeatures),
      settingTags: toStringArray(facts.settingTags),
      bestSeasons: toStringArray(facts.bestSeasons),
      avoidSeasons: toStringArray(facts.avoidSeasons),
      nearestAirports: toStringArray(facts.nearestAirports),
      accommodationTags: toStringArray(facts.accommodationTags),
      transportTags: toStringArray(facts.transportTags),
      gradeRange,
      routeCount: numberOrNull(facts.routeCount),
      problemCount: numberOrNull(facts.problemCount),
      sectorCount: numberOrNull(facts.sectorCount),
    },
    hero: {
      eyebrow: destinationEyebrow(styles, facts),
      heading: `${name} ${styleLabel.toLowerCase()} guide`,
      accentWord: firstWord(name),
      body: firstParagraph(heroBody),
      primaryAction: { label: 'See trips', href: '/trips' },
      heroStats: heroStats(facts, styles, gradeRange, bestSeasonLabel),
    },
    sections: rendererSections(sectionsByKey, name, facts),
    audience: audienceCards(sectionsByKey, facts, styles),
    sectors: sectorCards(sectionsByKey, facts),
    seasonMonths: seasonMonths(facts, sectionsByKey),
    gearGroups: gearGroups(sectionsByKey, styles),
    transportOptions: transportOptions(sectionsByKey, facts),
    accommodationOptions: accommodationOptions(sectionsByKey, facts),
    restDayIdeas: restDayIdeas(sectionsByKey, name),
    accessRules: accessRules(sectionsByKey),
    safetyItems: safetyItems(sectionsByKey),
    costItems: costItems(sectionsByKey),
    destinationFaqs: destinationFaqs(sectionsByKey, facts, name, styleLabel),
    tripPromos: tripPromos(name, styleLabel),
    relatedDestinations,
    cta: {
      eyebrow: 'Plan the trip',
      heading: `Climb ${name} with Rockbusters`,
      body: `${name} works best when the climbing, conditions and logistics are planned as one trip.`,
      primaryAction: { label: 'See trips', href: '/trips' },
      secondaryAction: { label: 'Contact us', href: '/contact' },
      sourceStatus: 'draft-derived',
    },
    editorialNotes: [
      'Generated from prepared location extraction packets as an import baseline.',
      'Exact prices, closures, opening times and named operator links still need editorial review before publication.',
    ],
  }
}

function sectionMap(sections) {
  const map = new Map()
  for (const section of Array.isArray(sections) ? sections : []) {
    const key = cleanText(section.key)
    if (!key) continue
    map.set(key, { ...section, body: normalizeBody(section.body), status: cleanText(section.status) ?? 'draft-derived' })
  }
  return map
}

function rendererSections(sectionsByKey, name, facts) {
  return [
    sectionFromSource(sectionsByKey, 'intro', 'Introduction', `${name} is a destination-scale climbing venue with enough variety to anchor a focused trip.`),
    sectionFromSource(sectionsByKey, 'history', 'History', `${name} has a climbing identity shaped by local terrain, access and travelling climbers.`),
    sectionFromSource(sectionsByKey, 'rock', 'Rock and Style', rockFallback(facts)),
    sectionFromSource(sectionsByKey, 'grades', 'Grades and Sectors', gradesFallback(facts)),
    sectionFromSource(sectionsByKey, 'gear', 'Gear', gearFallback(facts)),
    sectionFromSource(sectionsByKey, 'restdays', 'Rest Days', `Use rest days around ${name} for recovery, local food and low-impact exploration.`),
    sectionFromSource(sectionsByKey, 'safety', 'Safety', 'Check local conditions, use current route information and choose objectives that fit the group.'),
    sectionFromSource(sectionsByKey, 'costs', 'Costs and Budget', 'Budget depends on season, transport, accommodation style, food choices and current local prices.'),
    sectionFromSource(sectionsByKey, 'season', 'Best Season', seasonFallback(facts)),
    sectionFromSource(sectionsByKey, 'transport', 'Getting There', transportFallback(facts)),
    sectionFromSource(sectionsByKey, 'stay', 'Stay and Eat', stayFallback(facts)),
    sectionFromSource(sectionsByKey, 'tips', 'Tips and Ethics', 'Use current local access information, respect closures and keep the visit low-impact.'),
  ]
}

function sectionFromSource(sectionsByKey, key, heading, fallbackBody) {
  const source = findSection(sectionsByKey, key)
  return {
    key,
    navLabel: heading,
    heading: cleanText(source?.heading) ?? heading,
    body: normalizeBody(source?.body) ?? fallbackBody,
    keyCharacteristics: [],
    sourceStatus: cleanText(source?.status) ?? 'draft-derived',
  }
}

function findSection(sectionsByKey, targetKey) {
  for (const key of SECTION_ALIASES[targetKey] ?? [targetKey]) {
    if (sectionsByKey.has(key)) return sectionsByKey.get(key)
  }
  return null
}

function sectionBody(sectionsByKey, key) {
  return normalizeBody(findSection(sectionsByKey, key)?.body)
}

function heroStats(facts, styles, gradeRange, bestSeasonLabel) {
  const stats = []
  const problemCount = numberOrNull(facts.problemCount)
  const routeCount = numberOrNull(facts.routeCount)
  const sectorCount = numberOrNull(facts.sectorCount)
  const count = problemCount ?? routeCount
  if (count) {
    stats.push({
      value: `${roundDisplayCount(count)}+`,
      label: problemCount ? 'Problems' : 'Routes',
      derivedFrom: problemCount ? 'problemCount' : 'routeCount',
      sourceStatus: 'mixed',
    })
  }
  if (sectorCount) {
    stats.push({
      value: `${sectorCount}`,
      label: 'Sectors',
      derivedFrom: 'sectorCount',
      sourceStatus: 'mixed',
    })
  }
  if (gradeRange) {
    stats.push({
      value: compactGradeRange(gradeRange),
      label: 'Grades',
      derivedFrom: 'gradeRange',
      sourceStatus: 'mixed',
    })
  }
  if (bestSeasonLabel) {
    stats.push({
      value: bestSeasonLabel,
      label: 'Best season',
      derivedFrom: 'bestSeasons',
      sourceStatus: 'mixed',
    })
  }

  if (stats.length >= 3) return stats.slice(0, 3)
  return [
    ...stats,
    {
      value: styles.map((style) => STYLE_LABELS[style] ?? titleCase(style)).join(', ') || 'Climbing',
      label: 'Style',
      sourceStatus: 'draft-derived',
    },
  ].slice(0, 3)
}

function audienceCards(sectionsByKey, facts, styles) {
  const whoBody = sectionBody(sectionsByKey, 'who')
  const gradeRange = cleanText(facts.gradeRange)
  const isBouldering = styles.includes('bouldering')
  return [
    {
      label: 'Beginners',
      gradeRange: gradeRange ?? null,
      body: whoBody ? firstParagraph(whoBody) : beginnerFallback(facts),
      badge: isBouldering ? 'Check landings' : 'Choose sectors carefully',
      tone: 'neutral',
      sourceStatus: sourceStatusFor(sectionsByKey, 'who'),
    },
    {
      label: 'Intermediate',
      gradeRange: gradeRange ?? null,
      body: secondParagraph(whoBody) ?? 'Intermediate climbers usually get the widest choice when conditions and sector choice line up.',
      badge: 'Strong fit',
      tone: 'positive',
      sourceStatus: sourceStatusFor(sectionsByKey, 'who'),
    },
    {
      label: 'Advanced',
      gradeRange: gradeRange ?? null,
      body: thirdParagraph(whoBody) ?? 'Advanced climbers should plan around the best conditions and the sectors with the right style.',
      badge: 'Conditions matter',
      tone: 'neutral',
      sourceStatus: sourceStatusFor(sectionsByKey, 'who'),
    },
  ]
}

function sectorCards(sectionsByKey, facts) {
  const gradesBody = sectionBody(sectionsByKey, 'grades')
  const sectorCount = numberOrNull(facts.sectorCount)
  return [
    {
      name: sectorCount ? `${sectorCount} sector spread` : 'Main climbing areas',
      badges: sectorCount ? [`${sectorCount} sectors`] : [],
      gradeRange: cleanText(facts.gradeRange),
      body: gradesBody ?? gradesFallback(facts),
      sourceStatus: sourceStatusFor(sectionsByKey, 'grades'),
    },
    {
      name: 'Best sector choice',
      badges: toStringArray(facts.climbingStyles).map((style) => STYLE_LABELS[style] ?? titleCase(style)),
      gradeRange: cleanText(facts.gradeRange),
      body: 'Choose the day by conditions, grade mix, shade, approach and current access information.',
      sourceStatus: 'draft-derived',
      needsVerification: true,
    },
  ]
}

function seasonMonths(facts, sectionsByKey) {
  const best = new Set(toStringArray(facts.bestSeasons))
  const avoid = new Set(toStringArray(facts.avoidSeasons))
  const allYear = best.has('year-round') || best.has('all-year') || best.has('all year')
  const seasonBody = sectionBody(sectionsByKey, 'season')
  return MONTHS.map(([label, season], index) => {
    let score = allYear ? 4 : 3
    if (best.has(season)) score = 4
    if (avoid.has(season)) score = season === 'summer' || season === 'winter' ? 1 : 2
    const tone = score >= 4 ? 'prime' : score <= 2 ? 'avoid' : 'okay'
    return {
      month: index + 1,
      label,
      score,
      conditions: tone === 'prime' ? 'Prime window' : tone === 'avoid' ? 'Less reliable' : 'Usable with planning',
      tone,
      notes: seasonBody ? firstSentence(seasonBody) : seasonFallback(facts),
      sourceStatus: sourceStatusFor(sectionsByKey, 'season'),
    }
  })
}

function gearGroups(sectionsByKey, styles) {
  const body = sectionBody(sectionsByKey, 'gear')
  const items = new Set(['Current topo', 'Helmet where appropriate', 'Water and layers'])
  if (styles.includes('bouldering')) {
    items.add('Crash pads')
    items.add('Brushes')
    items.add('Tape')
  }
  if (styles.includes('sport')) {
    items.add('Quickdraws')
    items.add('Rope matched to current topo')
    items.add('Belay glasses')
  }
  if (styles.includes('trad')) {
    items.add('Trad rack matched to route choice')
    items.add('Slings')
  }
  return [
    {
      heading: 'Climbing kit',
      items: [...items],
      body: body ?? gearFallback({ climbingStyles: styles }),
      sourceStatus: sourceStatusFor(sectionsByKey, 'gear'),
    },
  ]
}

function transportOptions(sectionsByKey, facts) {
  const airports = toStringArray(facts.nearestAirports)
  const options = airports.slice(0, 3).map((airport) => ({
    label: `${airport} airport`,
    type: 'flight-access',
    body: transportFallback(facts),
    recommended: airports[0] === airport,
    sourceStatus: sourceStatusFor(sectionsByKey, 'transport'),
  }))
  if (toStringArray(facts.transportTags).includes('car-recommended') || !options.length) {
    options.unshift({
      label: 'Rental car',
      type: 'car',
      body: 'A car gives the simplest movement between accommodation, food, parking and climbing sectors.',
      recommended: true,
      sourceStatus: 'draft-derived',
    })
  }
  return uniqueByLabel(options)
}

function accommodationOptions(sectionsByKey, facts) {
  const stayBody = sectionBody(sectionsByKey, 'stay')
  const tags = toStringArray(facts.accommodationTags)
  const options = tags.map((tag) => {
    const [name, body] = ACCOMMODATION_LABELS[tag] ?? [titleCase(tag), 'Use current local listings before committing the group.']
    return {
      type: tag,
      name,
      body: stayBody ? firstParagraph(stayBody) : body,
      priceHint: null,
      sourceStatus: sourceStatusFor(sectionsByKey, 'stay'),
    }
  })
  return options.length ? options : [
    {
      type: 'local-base',
      name: 'Local accommodation',
      body: stayBody ?? 'Choose accommodation that keeps approaches, food and recovery simple.',
      sourceStatus: sourceStatusFor(sectionsByKey, 'stay'),
      needsVerification: true,
    },
  ]
}

function restDayIdeas(sectionsByKey, name) {
  const body = sectionBody(sectionsByKey, 'restdays')
  return [
    {
      title: `${name} rest day`,
      body: body ?? `Use a rest day around ${name} for recovery, local food and low-impact exploring.`,
      sourceStatus: sourceStatusFor(sectionsByKey, 'restdays'),
    },
  ]
}

function accessRules(sectionsByKey) {
  const body = sectionBody(sectionsByKey, 'tips')
  return [
    {
      title: 'Local access',
      body: body ?? 'Check current access guidance before climbing and respect closures, signs and local residents.',
      tone: 'caution',
      sourceStatus: sourceStatusFor(sectionsByKey, 'tips'),
      needsVerification: !body,
    },
  ]
}

function safetyItems(sectionsByKey) {
  const body = sectionBody(sectionsByKey, 'safety')
  return [
    {
      label: 'Main safety focus',
      value: 'Conditions and judgement',
      body: body ?? 'Match objectives to the group, current conditions and local route information.',
      sourceStatus: sourceStatusFor(sectionsByKey, 'safety'),
      needsVerification: !body,
    },
  ]
}

function costItems(sectionsByKey) {
  const body = sectionBody(sectionsByKey, 'costs')
  return [
    {
      label: 'Local budget',
      unit: 'Per trip',
      budget: body ? firstSentence(body) : 'Check current local prices',
      midRange: null,
      sourceStatus: sourceStatusFor(sectionsByKey, 'costs'),
      needsVerification: true,
    },
  ]
}

function destinationFaqs(sectionsByKey, facts, name, styleLabel) {
  const parsed = parseFaqs(sectionBody(sectionsByKey, 'faq'))
  if (parsed.length) return parsed
  const bestSeason = bestSeasonText(toStringArray(facts.bestSeasons)) ?? 'the cooler or locally recommended season'
  const gradeRange = cleanText(facts.gradeRange)
  return [
    {
      question: `What is ${name} known for?`,
      answer: `${name} is known as a ${styleLabel.toLowerCase()} destination with ${featureText(facts)}.`,
      sourceStatus: 'draft-derived',
    },
    {
      question: `When should I go to ${name}?`,
      answer: `${bestSeason} is the main planning window. Check the current forecast and local access notes before committing dates.`,
      sourceStatus: 'draft-derived',
    },
    {
      question: `What grades work best at ${name}?`,
      answer: gradeRange ? `The working grade picture is ${gradeRange}.` : 'Use a current topo to match the trip to the group.',
      sourceStatus: 'draft-derived',
      needsVerification: !gradeRange,
    },
    {
      question: `Do I need a car for ${name}?`,
      answer: toStringArray(facts.transportTags).includes('car-recommended')
        ? 'A car is the simplest option for moving between airports, accommodation, food and climbing.'
        : 'Transport depends on where you stay and the sectors you choose, so check local options before booking.',
      sourceStatus: 'draft-derived',
    },
  ]
}

function tripPromos(name, styleLabel) {
  return [
    {
      type: 'destination-trip',
      title: `${name} ${styleLabel.toLowerCase()} trip`,
      body: `Build the week around the right sectors, conditions and group level for ${name}.`,
      action: { label: 'See trips', href: '/trips' },
      sourceStatus: 'draft-derived',
    },
  ]
}

function relatedFor(entry, peers) {
  return peers
    .filter((peer) => peer.slug !== entry.slug)
    .slice(0, 3)
    .map((peer) => {
      const facts = peer.source?.facts ?? {}
      const intro = firstParagraph(sectionBody(sectionMap(peer.source?.sections), 'intro') ?? sectionBody(sectionMap(peer.source?.sections), 'hero') ?? '')
      return {
        slug: peer.slug,
        name: peer.name,
        country: peer.country,
        region: cleanText(peer.packet.destination?.region),
        summary: intro || `${peer.name} is another Rockbusters destination in ${peer.country ?? 'the same region'}.`,
        sourceStatus: cleanText(peer.source?.status) ?? 'draft-derived',
        needsVerification: !intro,
        style: toStringArray(facts.climbingStyles),
      }
    })
}

function parseFaqs(body) {
  if (!body) return []
  const paragraphs = body.split(/\n{2,}/).map((entry) => entry.trim()).filter(Boolean)
  const faqs = []
  for (const paragraph of paragraphs) {
    const match = paragraph.match(/^(.+\?)\s+(.+)$/s)
    if (match) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim(),
        sourceStatus: 'mixed',
      })
    }
  }
  return faqs
}

function sourceStatusFor(sectionsByKey, key) {
  return structuredSourceStatus(cleanText(findSection(sectionsByKey, key)?.status) ?? 'draft-derived')
}

function normalizePayloadEnums(value) {
  if (Array.isArray(value)) return value.map(normalizePayloadEnums)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (key === 'sourceStatus') return [key, structuredSourceStatus(entry)]
      if (key === 'tone') return [key, destinationTone(entry)]
      return [key, normalizePayloadEnums(entry)]
    }),
  )
}

function structuredSourceStatus(value) {
  const cleaned = cleanText(value)
  if (cleaned === 'curated' || cleaned === 'curated-derived' || cleaned === 'design-derived' || cleaned === 'mixed') {
    return cleaned
  }
  if (cleaned === 'enriched' || cleaned === 'legacy' || cleaned === 'missing') return 'curated-derived'
  if (cleaned === 'not-applicable' || cleaned === 'draft-derived') return 'design-derived'
  return 'design-derived'
}

function destinationTone(value) {
  const cleaned = cleanText(value)
  if (
    cleaned === 'neutral' ||
    cleaned === 'positive' ||
    cleaned === 'strong' ||
    cleaned === 'limited' ||
    cleaned === 'warning' ||
    cleaned === 'critical' ||
    cleaned === 'peak' ||
    cleaned === 'good' ||
    cleaned === 'avoid'
  ) {
    return cleaned
  }
  if (cleaned === 'prime') return 'peak'
  if (cleaned === 'okay') return 'good'
  if (cleaned === 'caution') return 'warning'
  return 'neutral'
}

function destinationEyebrow(styles, facts) {
  const style = styles.map((entry) => STYLE_LABELS[entry] ?? titleCase(entry)).join(' / ')
  const rock = toStringArray(facts.rockTypes).map(titleCase).join(' / ')
  return [style, rock].filter(Boolean).join(' / ') || 'Destination'
}

function rockFallback(facts) {
  return `Expect ${featureText(facts)}. Use current local information to choose sectors that match the group and the conditions.`
}

function gradesFallback(facts) {
  const gradeRange = cleanText(facts.gradeRange)
  return gradeRange
    ? `The working grade picture is ${gradeRange}. Use a current topo to match sectors to the group.`
    : 'Use a current topo to match sectors, grades and approaches to the group.'
}

function gearFallback(facts) {
  const styles = toStringArray(facts.climbingStyles)
  if (styles.includes('bouldering')) return 'Bring pads, brushes, tape, a current topo and enough water for the day.'
  if (styles.includes('sport')) return 'Bring a sport rack, a rope matched to current topo information, helmet, layers and enough water.'
  return 'Bring equipment matched to the local style, a current topo, layers and enough water.'
}

function seasonFallback(facts) {
  const best = bestSeasonText(toStringArray(facts.bestSeasons))
  return best ? `${best} is the main planning window. Check current weather and local conditions before booking.` : 'Choose dates around current local conditions and the style of climbing.'
}

function transportFallback(facts) {
  const airports = toStringArray(facts.nearestAirports)
  if (airports.length) return `Useful airport options include ${joinList(airports.slice(0, 3))}. Final logistics depend on flights, road access and where the group is staying.`
  return 'Plan transport around the chosen base, climbing sectors and current local road or public transport options.'
}

function stayFallback(facts) {
  const tags = toStringArray(facts.accommodationTags).map((tag) => ACCOMMODATION_LABELS[tag]?.[0] ?? titleCase(tag))
  return tags.length ? `${joinList(tags)} can all fit the trip depending on season, budget and group size.` : 'Choose a local base that keeps food, recovery and approaches simple.'
}

function featureText(facts) {
  const rock = toStringArray(facts.rockTypes).map(titleCase)
  const features = toStringArray(facts.rockFeatures).map((entry) => entry.replaceAll('-', ' '))
  return [...rock, ...features].slice(0, 5).join(', ') || 'varied climbing and local character'
}

function bestSeasonText(seasons) {
  const normalized = seasons.filter(Boolean)
  if (!normalized.length) return null
  const names = normalized.map((season) => season.replaceAll('-', ' ')).map(titleCase)
  if (names.length >= 2) return `${names[0]}-${names[names.length - 1]}`
  return names[0]
}

function compactGradeRange(value) {
  const cleaned = value
    .replace(/^from\s+/i, '')
    .replace(/with the strongest coverage around.*$/i, '')
    .replace(/densest around.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length <= 16 ? cleaned : value.slice(0, 16).trim()
}

function roundDisplayCount(value) {
  if (value >= 1000) return Math.floor(value / 100) * 100
  if (value >= 100) return Math.floor(value / 10) * 10
  return value
}

function firstWord(value) {
  return cleanText(value)?.split(/\s+/)[0] ?? null
}

function firstParagraph(value) {
  return normalizeBody(value)?.split(/\n{2,}/)[0]?.trim() ?? null
}

function secondParagraph(value) {
  return normalizeBody(value)?.split(/\n{2,}/)[1]?.trim() ?? null
}

function thirdParagraph(value) {
  return normalizeBody(value)?.split(/\n{2,}/)[2]?.trim() ?? null
}

function firstSentence(value) {
  const text = normalizeBody(value)
  if (!text) return null
  const match = text.match(/^(.+?[.!?])(\s|$)/s)
  return (match?.[1] ?? firstParagraph(text) ?? text).trim()
}

function beginnerFallback(facts) {
  const gradeRange = cleanText(facts.gradeRange)
  if (gradeRange && /(^|\D)(3|4|5|5a|5b|5c|6a)(\D|$)/i.test(gradeRange)) {
    return 'Beginner-friendly climbing may be available when the group chooses sectors carefully and keeps conditions in mind.'
  }
  return 'Beginners should check the grade spread and sector choice carefully before using this as a first outdoor trip.'
}

function normalizeBody(value) {
  const text = cleanText(value)
  if (!text || text.toLowerCase() === 'null') return null
  return text
}

function cleanText(value) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned || null
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map(cleanText).filter(Boolean) : []
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function titleCase(value) {
  return cleanText(value)
    ?.split(/[\s-]+/)
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(' ') ?? ''
}

function joinList(values) {
  if (values.length <= 1) return values.join('')
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`
}

function uniqueByLabel(options) {
  const seen = new Set()
  return options.filter((option) => {
    const key = option.label
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
