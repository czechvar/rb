#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))
const inputDir =
  args.input ?? '.scratch/legacy-destination-work/native-output'
const outDir =
  args.out ?? '.scratch/legacy-destination-work/normalized-taxonomy'

const TAXONOMY = {
  locationKind: [
    ['sport-climbing-area', 'Sport climbing area'],
    ['bouldering-area', 'Bouldering area'],
    ['multi-pitch-area', 'Multi-pitch area'],
    ['mixed-climbing-area', 'Mixed climbing area'],
    ['alpine-climbing-area', 'Alpine climbing area'],
    ['online', 'Online'],
  ],
  destinationScope: [
    ['crag', 'Crag'],
    ['area', 'Area'],
    ['region', 'Region'],
    ['country', 'Country'],
    ['indoor', 'Indoor'],
    ['unknown', 'Unknown'],
  ],
  climbingStyles: [
    ['sport', 'Sport climbing'],
    ['bouldering', 'Bouldering'],
    ['multi-pitch', 'Multi-pitch'],
    ['trad', 'Traditional climbing'],
    ['deep-water-soloing', 'Deep water soloing'],
  ],
  rockTypes: [
    ['limestone', 'Limestone'],
    ['sandstone', 'Sandstone'],
    ['granite', 'Granite'],
    ['conglomerate', 'Conglomerate'],
    ['gneiss', 'Gneiss'],
    ['dolomite', 'Dolomite'],
  ],
  rockFeatures: [
    ['tufas', 'Tufas'],
    ['caves', 'Caves'],
    ['overhangs', 'Overhangs'],
    ['slabs', 'Slabs'],
    ['pockets', 'Pockets'],
    ['crimps', 'Crimps'],
    ['cracks', 'Cracks'],
    ['roofs', 'Roofs'],
  ],
  settingTags: [
    ['coastal', 'Coastal'],
    ['island', 'Island'],
    ['gorge-canyon', 'Gorge or canyon'],
    ['forest', 'Forest'],
    ['mountain', 'Mountain'],
    ['valley', 'Valley'],
  ],
  seasonTags: [
    ['spring', 'Spring'],
    ['summer', 'Summer'],
    ['autumn', 'Autumn'],
    ['winter', 'Winter'],
    ['year-round', 'Year-round'],
  ],
  accommodationTags: [
    ['campsite', 'Campsite'],
    ['hotel', 'Hotel'],
    ['guesthouse-b-and-b', 'Guesthouse or B&B'],
    ['apartment', 'Apartment'],
    ['hostel', 'Hostel'],
    ['refuge-hut', 'Refuge or hut'],
    ['villa', 'Villa'],
    ['rural-cottage', 'Rural cottage'],
    ['luxury', 'Luxury option'],
  ],
  transportTags: [
    ['car-recommended', 'Car recommended'],
    ['public-transport-possible', 'Public transport possible'],
    ['flight-access', 'Flight access'],
    ['ferry-access', 'Ferry access'],
    ['walkable-local-access', 'Walkable local access'],
  ],
}

const STYLE_ALIASES = new Map([
  ['sport climbing', 'sport'],
  ['bolted', 'sport'],
  ['lead climbing', 'sport'],
  ['single-pitch climbing', 'sport'],
  ['bouldering', 'bouldering'],
  ['boulder', 'bouldering'],
  ['multi-pitch climbing', 'multi-pitch'],
  ['multipitch', 'multi-pitch'],
  ['big wall', 'multi-pitch'],
  ['traditional climbing', 'trad'],
  ['trad climbing', 'trad'],
  ['traditional protection', 'trad'],
  ['deep water soloing', 'deep-water-soloing'],
])

const ROCK_ALIASES = new Map([
  ['limestone', 'limestone'],
  ['sandstone', 'sandstone'],
  ['granite', 'granite'],
  ['conglomerate', 'conglomerate'],
  ['gneiss', 'gneiss'],
  ['dolomite', 'dolomite'],
])

const ACCOMMODATION_ALIASES = [
  [/camp ?sites?|camping/i, 'campsite'],
  [/hotels?/i, 'hotel'],
  [/guest ?houses?|b ?& ?b|bed ?& ?breakfast|bedandbreakfast/i, 'guesthouse-b-and-b'],
  [/apartments?/i, 'apartment'],
  [/hostels?/i, 'hostel'],
  [/refuge|shelter|hut/i, 'refuge-hut'],
  [/villas?/i, 'villa'],
  [/rural cottages?/i, 'rural-cottage'],
  [/luxury/i, 'luxury'],
]

const SETTING_ALIASES = [
  [/beach|coast|coastal|calanques/i, 'coastal'],
  [/island/i, 'island'],
  [/gorge|canyon/i, 'gorge-canyon'],
  [/forest/i, 'forest'],
  [/mountain|alpine|pyrenees|alps/i, 'mountain'],
  [/valley/i, 'valley'],
]

const ROCK_FEATURE_ALIASES = [
  [/tufa/i, 'tufas'],
  [/caves?/i, 'caves'],
  [/overhang/i, 'overhangs'],
  [/slabs?/i, 'slabs'],
  [/pockets?|holes/i, 'pockets'],
  [/crimps?/i, 'crimps'],
  [/cracks?/i, 'cracks'],
  [/roofs?/i, 'roofs'],
]

const AIRPORT_ALIASES = [
  [/barcelona/i, 'Barcelona'],
  [/girona/i, 'Girona'],
  [/alicante/i, 'Alicante'],
  [/antalya/i, 'Antalya'],
  [/genova|genoa/i, 'Genoa'],
  [/innsbruck/i, 'Innsbruck'],
  [/munich/i, 'Munich'],
  [/salzburg/i, 'Salzburg'],
  [/valencia/i, 'Valencia'],
  [/zaragoza/i, 'Zaragoza'],
  [/malaga/i, 'Malaga'],
  [/madrid/i, 'Madrid'],
  [/kos/i, 'Kos'],
  [/athens/i, 'Athens'],
  [/lyon/i, 'Lyon'],
  [/nimes|nîmes/i, 'Nimes'],
  [/avignon/i, 'Avignon'],
]

await mkdir(outDir, { recursive: true })

const files = (await readdirSorted(inputDir)).filter((file) =>
  file.endsWith('.review.json'),
)
const locations = []

for (const file of files) {
  const review = JSON.parse(await readFile(path.join(inputDir, file), 'utf8'))
  locations.push(normalizeReview(review))
}

const taxonomyUsage = buildUsage(locations)

await writeFile(
  path.join(outDir, 'location-taxonomy.json'),
  `${JSON.stringify({ taxonomy: objectFromEntries(TAXONOMY), locations }, null, 2)}\n`,
)
await writeFile(
  path.join(outDir, 'location-taxonomy-usage.json'),
  `${JSON.stringify(taxonomyUsage, null, 2)}\n`,
)
await writeFile(path.join(outDir, 'location-taxonomy.csv'), toCsv(locations))
await writeFile(path.join(outDir, 'README.md'), toMarkdown(taxonomyUsage))

console.log(
  JSON.stringify(
    {
      reviewed: locations.length,
      outDir,
      files: [
        'location-taxonomy.json',
        'location-taxonomy-usage.json',
        'location-taxonomy.csv',
        'README.md',
      ],
    },
    null,
    2,
  ),
)

async function readdirSorted(dir) {
  const { readdir } = await import('node:fs/promises')
  return (await readdir(dir)).sort((a, b) => a.localeCompare(b))
}

function normalizeReview(review) {
  const facts = review.facts ?? {}
  const sourceText = collectText([
    facts.destinationType,
    facts.climbingStyles,
    facts.rockTypes,
    facts.bestSeasons,
    facts.avoidSeasons,
    facts.recommendedTransport,
    facts.accommodationTypes,
    facts.gradeRange,
    ...(review.sections ?? []).map((section) => section.body),
  ])

  const climbingStyles = unique([
    ...normalizeArray(facts.climbingStyles, STYLE_ALIASES),
    ...normalizeArray(facts.destinationType, STYLE_ALIASES),
  ]).filter((style) => style !== undefined)

  const rockTypes = unique(normalizeArray(facts.rockTypes, ROCK_ALIASES))
  const rockFeatures = unique([
    ...normalizeByPatterns(facts.rockTypes, ROCK_FEATURE_ALIASES),
    ...normalizeByPatterns(sourceText, ROCK_FEATURE_ALIASES),
  ])
  const settingTags = unique([
    ...normalizeByPatterns(facts.destinationType, SETTING_ALIASES),
    ...normalizeByPatterns(sourceText, SETTING_ALIASES),
  ])
  const avoidSeasons = normalizeAvoidSeasonTags(facts.avoidSeasons)
  const bestSeasons = normalizeSeasonTags(facts.bestSeasons)
    .filter((season) => !avoidSeasons.includes(season))
    .filter((season) => season !== 'year-round' || avoidSeasons.length === 0)
  const accommodationTags = unique(
    normalizeByPatterns(facts.accommodationTypes, ACCOMMODATION_ALIASES),
  )
  const nearestAirports = unique([
    ...normalizeByPatterns(facts.nearestAirports, AIRPORT_ALIASES),
    ...normalizeByPatterns(facts.recommendedTransport, AIRPORT_ALIASES),
  ])
  const transportTags = normalizeTransportTags(facts.recommendedTransport)

  return {
    slug: review.slug,
    title: review.title,
    status: review.status,
    quality: review.quality,
    locationKind: inferLocationKind(review.slug, climbingStyles, settingTags, sourceText),
    destinationScope: inferDestinationScope(review.slug, review.title, sourceText),
    climbingStyles,
    rockTypes,
    rockFeatures,
    settingTags,
    bestSeasons,
    avoidSeasons,
    nearestAirports,
    accommodationTags,
    transportTags,
    structuredTextFields: {
      gradeRange: facts.gradeRange ?? null,
    },
    rawFacts: facts,
  }
}

function inferLocationKind(slug, styles, settings, sourceText) {
  if (slug === 'online') return 'online'
  if (styles.length > 1) return 'mixed-climbing-area'
  if (styles.includes('bouldering')) return 'bouldering-area'
  if (styles.includes('multi-pitch') || styles.includes('trad')) return 'multi-pitch-area'
  if (styles.length === 0) return null
  if (/alpine|mountain|mountaineering/i.test(sourceText)) return 'alpine-climbing-area'
  if (styles.includes('sport')) return 'sport-climbing-area'
  return 'mixed-climbing-area'
}

function inferDestinationScope(slug, title, sourceText) {
  const explicitScopes = new Map([
    ['andalucia', 'region'],
    ['ardeche', 'region'],
    ['balkan', 'country'],
    ['bohuslan', 'region'],
    ['chamonix', 'region'],
    ['chulilla', 'area'],
    ['costa-blanca-spain', 'region'],
    ['dolomites', 'region'],
    ['durance-valley-hautes-alps', 'region'],
    ['gran-canaria', 'region'],
    ['hvar', 'region'],
    ['istria', 'region'],
    ['istria-1', 'region'],
    ['kyparissi', 'area'],
    ['labske-udoli', 'area'],
    ['leonidio', 'area'],
    ['mallorca', 'region'],
    ['malta', 'country'],
    ['norway', 'country'],
    ['picos-de-europa', 'region'],
    ['riglos', 'area'],
    ['sardinia', 'region'],
    ['slovenia', 'country'],
    ['sulov', 'area'],
    ['valdegovia', 'area'],
  ])
  if (explicitScopes.has(slug)) return explicitScopes.get(slug)
  if (slug === 'online') return 'unknown'
  if (/monobloc|indoor|gym/i.test(`${slug} ${title} ${sourceText}`)) return 'indoor'
  if (/^(norway|slovenia|balkan)$/.test(slug)) return 'country'
  if (/andalucia|dolomites|sardinia|costa-blanca|picos|durance|chamonix|ardeche|istria/i.test(slug)) {
    return 'region'
  }
  if (/gorge|gorges|valley|calanques|fontainebleau|magic-wood|maltatal|zillertal|ticino/i.test(slug)) {
    return 'area'
  }
  if (/crag|wall|sector|cliff|single crag/i.test(sourceText)) return 'crag'
  if (/region|island|peninsula|coast|range|valley|gorge|area/i.test(sourceText)) return 'area'
  return 'unknown'
}

function normalizeArray(values, aliases) {
  return toArray(values)
    .map((value) => aliases.get(String(value).trim().toLowerCase()))
    .filter(Boolean)
}

function normalizeByPatterns(values, aliases) {
  const text = collectText(values)
  const tags = []
  for (const [pattern, tag] of aliases) {
    if (pattern.test(text)) tags.push(tag)
  }
  return tags
}

function normalizeSeasonTags(values) {
  const text = collectText(values)
  const tags = []
  if (/year[- ]round|throughout the whole year|throughout the year|any time of the year/i.test(text)) {
    tags.push('year-round')
  }
  if (/spring|april|may|late spring|early spring/i.test(text)) tags.push('spring')
  if (/summer|june|july|august/i.test(text)) tags.push('summer')
  if (/autumn|fall|september|october|november/i.test(text)) tags.push('autumn')
  if (/winter|december|january|february|march|cold sunny/i.test(text)) tags.push('winter')
  return unique(tags)
}

function normalizeAvoidSeasonTags(values) {
  const text = collectText(values)
  const tags = []
  if (/\bwinter\b/i.test(text) && /(cold|wet|rain|snow|fog|too cold|avoid)/i.test(text)) {
    tags.push('winter')
  }
  if (/\bsummer|summertime|august\b/i.test(text) && /(hot|heat|crowd|packed|avoid|thunderstorm)/i.test(text)) {
    tags.push('summer')
  }
  return unique(tags)
}

function normalizeTransportTags(value) {
  const text = collectText(value)
  const tags = []
  if (/car|drive|rent|hire/i.test(text)) tags.push('car-recommended')
  if (/public transport|bus|train|railway/i.test(text)) tags.push('public-transport-possible')
  if (/airport|fly|flight|plane/i.test(text)) tags.push('flight-access')
  if (/\bferry\b|\bport\b/i.test(text)) tags.push('ferry-access')
  if (/walk|walking distance|within \d+ minutes/i.test(text)) tags.push('walkable-local-access')
  return unique(tags)
}

function collectText(values) {
  return toArray(values)
    .map((value) => (value == null ? '' : String(value)))
    .join(' ')
}

function toArray(value) {
  if (Array.isArray(value)) return value.flatMap(toArray)
  if (value == null) return []
  return [value]
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function objectFromEntries(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, entries]) => [
      key,
      Object.fromEntries(entries),
    ]),
  )
}

function buildUsage(locations) {
  const usage = { reviewed: locations.length, fields: {} }
  for (const field of [
    'locationKind',
    'destinationScope',
    'climbingStyles',
    'rockTypes',
    'rockFeatures',
    'settingTags',
    'bestSeasons',
    'avoidSeasons',
    'accommodationTags',
    'transportTags',
  ]) {
    usage.fields[field] = {}
  }
  usage.fields.nearestAirports = {}

  for (const location of locations) {
    for (const field of Object.keys(usage.fields)) {
      const values = Array.isArray(location[field])
        ? location[field]
        : [location[field]].filter(Boolean)
      for (const value of values) {
        usage.fields[field][value] ??= []
        usage.fields[field][value].push(location.slug)
      }
    }
  }

  for (const field of Object.keys(usage.fields)) {
    usage.fields[field] = Object.fromEntries(
      Object.entries(usage.fields[field]).sort((a, b) => {
        const diff = b[1].length - a[1].length
        return diff || a[0].localeCompare(b[0])
      }),
    )
  }

  return usage
}

function toCsv(locations) {
  const rows = [
    [
      'slug',
      'title',
      'locationKind',
      'destinationScope',
      'climbingStyles',
      'rockTypes',
      'rockFeatures',
      'settingTags',
      'bestSeasons',
      'avoidSeasons',
      'nearestAirports',
      'accommodationTags',
      'transportTags',
      'confidence',
      'coverage',
    ],
  ]

  for (const location of locations) {
    rows.push([
      location.slug,
      location.title,
      location.locationKind,
      location.destinationScope,
      location.climbingStyles.join(';'),
      location.rockTypes.join(';'),
      location.rockFeatures.join(';'),
      location.settingTags.join(';'),
      location.bestSeasons.join(';'),
      location.avoidSeasons.join(';'),
      location.nearestAirports.join(';'),
      location.accommodationTags.join(';'),
      location.transportTags.join(';'),
      location.quality?.overallConfidence ?? '',
      location.quality?.sourceCoverage ?? '',
    ])
  }

  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toMarkdown(usage) {
  const lines = [
    '# Normalized Location Taxonomy',
    '',
    `Generated from ${usage.reviewed} native destination review files.`,
    '',
    'This output intentionally keeps controlled taxonomy small. Long extracted prose remains in structured text fields and should not become enum values.',
    '',
  ]

  for (const [field, values] of Object.entries(usage.fields)) {
    lines.push(`## ${field}`, '')
    for (const [value, slugs] of Object.entries(values)) {
      lines.push(`- ${value} (${slugs.length}): ${slugs.join(', ')}`)
    }
    if (!Object.keys(values).length) lines.push('- no values')
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--input') parsed.input = argv[++index]
    else if (arg === '--out') parsed.out = argv[++index]
    else if (arg === '--help') {
      console.log('Usage: node scripts/data-import/legacy/normalize-destination-taxonomy.mjs [--input DIR] [--out DIR]')
      process.exit(0)
    }
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return parsed
}
