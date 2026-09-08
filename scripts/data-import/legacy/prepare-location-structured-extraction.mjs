#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_SOURCE_INDEX = '.scratch/legacy-destination-export-native/index.json'
const DEFAULT_CURATED_DIR = 'scripts/data-import/seed/legacy-destinations'
const DEFAULT_V3_DIR = '.scratch/legacy-destination-work/v3-output'
const DEFAULT_EXAMPLE = '.scratch/albarracin-derived-structured-content.json'
const DEFAULT_OUT = '.scratch/location-structured-extraction'

const args = parseArgs(process.argv.slice(2))
const sourceIndexPath = path.resolve(args.sourceIndex ?? DEFAULT_SOURCE_INDEX)
const sourceRoot = path.resolve(args.sourceRoot ?? path.dirname(sourceIndexPath))
const curatedDir = path.resolve(args.curatedDir ?? DEFAULT_CURATED_DIR)
const v3Dir = path.resolve(args.v3Dir ?? DEFAULT_V3_DIR)
const examplePath = path.resolve(args.example ?? DEFAULT_EXAMPLE)
const outDir = path.resolve(args.out ?? DEFAULT_OUT)
const batchCount = positiveInt(args.batches ?? '6', '--batches')

const sourceIndex = await readJson(sourceIndexPath)
const destinations = [...(sourceIndex.destinations ?? [])].sort((a, b) =>
  String(a.slug).localeCompare(String(b.slug)),
)
if (!destinations.length) {
  throw new Error(`No destinations found in ${relative(sourceIndexPath)}`)
}

const latestV3BySlug = await findLatestV3Files(v3Dir)
const example = await readOptionalText(examplePath)
const prompt = destinationDetailPrompt()
const outputSchema = destinationDetailOutputSchema()

await mkdir(outDir, { recursive: true })
await mkdir(path.join(outDir, 'packets'), { recursive: true })
await mkdir(path.join(outDir, 'batches'), { recursive: true })
await mkdir(path.join(outDir, 'output'), { recursive: true })

await writeFile(path.join(outDir, 'prompt.md'), `${prompt}\n`)
await writeFile(path.join(outDir, 'output-schema.json'), `${JSON.stringify(outputSchema, null, 2)}\n`)
if (example) {
  await writeFile(path.join(outDir, 'albarracin-example.json'), example.endsWith('\n') ? example : `${example}\n`)
}

const packets = []
for (const destination of destinations) {
  const slug = requiredString(destination.slug, 'destination.slug')
  const packetPath = destination.packet ? path.resolve(sourceRoot, destination.packet) : null
  const sourceJsonPath = destination.sourceJson ? path.resolve(sourceRoot, destination.sourceJson) : null
  const curatedPath = path.join(curatedDir, `${slug}.curated.json`)
  const latestV3Path = latestV3BySlug.get(slug) ?? null

  const packet = {
    instructions: {
      promptFile: '../prompt.md',
      outputSchemaFile: '../output-schema.json',
      exampleFile: example ? '../albarracin-example.json' : null,
      outputFile: `../output/${slug}.json`,
      validationCommand:
        'pnpm data-import:validate-location-structured -- --input .scratch/location-structured-extraction/output --strict',
      importCommand:
        `pnpm data-import:location-structured -- --slug ${slug} --file .scratch/location-structured-extraction/output/${slug}.json --validate-only`,
    },
    destination: {
      slug,
      name: destination.name ?? null,
      country: destination.country ?? null,
      legacyUrl: destination.legacyUrl ?? null,
      quality: destination.quality ?? null,
    },
    sourcePacket: await readOptionalText(packetPath),
    sourceJson: await readOptionalJson(sourceJsonPath),
    currentCuratedDestination: await readOptionalJson(curatedPath),
    latestV3CuratedDestination: await readOptionalJson(latestV3Path),
    notes: [
      'Produce the new destinationDetail extraction JSON only.',
      'Do not output the older curated destination shape.',
      'Keep public copy free of source/process language.',
      'Use sourceStatus and needsVerification for uncertain facts instead of hiding uncertainty in public body text.',
    ],
  }

  const outputPath = path.join(outDir, 'packets', `${slug}.json`)
  await writeFile(outputPath, `${JSON.stringify(packet, null, 2)}\n`)
  packets.push({
    slug,
    name: packet.destination.name,
    country: packet.destination.country,
    packet: `packets/${slug}.json`,
    output: `output/${slug}.json`,
    hasSourcePacket: Boolean(packet.sourcePacket),
    hasSourceJson: Boolean(packet.sourceJson),
    hasCurrentCuratedDestination: Boolean(packet.currentCuratedDestination),
    hasLatestV3CuratedDestination: Boolean(packet.latestV3CuratedDestination),
    warnings: packet.destination.quality?.warnings ?? [],
  })
}

const batches = Array.from({ length: batchCount }, () => [])
packets.forEach((packet, index) => {
  batches[index % batchCount].push(packet)
})

for (const [index, batch] of batches.entries()) {
  const id = String(index).padStart(2, '0')
  await writeFile(
    path.join(outDir, 'batches', `batch-${id}.json`),
    `${JSON.stringify({ batch: id, count: batch.length, destinations: batch }, null, 2)}\n`,
  )
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceIndex: relative(sourceIndexPath),
  curatedDir: relative(curatedDir),
  v3Dir: relative(v3Dir),
  outDir: relative(outDir),
  count: packets.length,
  batches: batches.map((batch, index) => ({
    batch: String(index).padStart(2, '0'),
    count: batch.length,
    slugs: batch.map((packet) => packet.slug),
  })),
  coverage: {
    sourcePacket: packets.filter((packet) => packet.hasSourcePacket).length,
    sourceJson: packets.filter((packet) => packet.hasSourceJson).length,
    currentCuratedDestination: packets.filter((packet) => packet.hasCurrentCuratedDestination).length,
    latestV3CuratedDestination: packets.filter((packet) => packet.hasLatestV3CuratedDestination).length,
  },
  destinations: packets,
}

await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(path.join(outDir, 'README.md'), extractionReadme(manifest))

console.log(JSON.stringify(manifest, null, 2))

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--') continue
    else if (arg === '--source-index') parsed.sourceIndex = argv[++index]
    else if (arg === '--source-root') parsed.sourceRoot = argv[++index]
    else if (arg === '--curated-dir') parsed.curatedDir = argv[++index]
    else if (arg === '--v3-dir') parsed.v3Dir = argv[++index]
    else if (arg === '--example') parsed.example = argv[++index]
    else if (arg === '--out') parsed.out = argv[++index]
    else if (arg === '--batches') parsed.batches = argv[++index]
    else if (arg === '--help') {
      console.log(
        [
          'Usage: node scripts/data-import/legacy/prepare-location-structured-extraction.mjs [options]',
          '',
          'Options:',
          `  --source-index FILE  Default: ${DEFAULT_SOURCE_INDEX}`,
          '  --source-root DIR    Default: source-index directory',
          `  --curated-dir DIR    Default: ${DEFAULT_CURATED_DIR}`,
          `  --v3-dir DIR         Default: ${DEFAULT_V3_DIR}`,
          `  --example FILE       Default: ${DEFAULT_EXAMPLE}`,
          `  --out DIR            Default: ${DEFAULT_OUT}`,
          '  --batches NUMBER     Default: 6',
        ].join('\n'),
      )
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}

function positiveInt(value, label) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`)
  }
  return parsed
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required string: ${label}`)
  }
  return value.trim()
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function readOptionalText(file) {
  if (!file) return null
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function readOptionalJson(file) {
  const text = await readOptionalText(file)
  return text ? JSON.parse(text) : null
}

async function findLatestV3Files(dir) {
  const files = await walk(dir)
  const bySlug = new Map()
  for (const file of files.filter((entry) => entry.endsWith('.curated-v3.json'))) {
    const slug = path.basename(file).replace(/\.curated-v3\.json$/, '')
    const current = bySlug.get(slug)
    if (!current || file.localeCompare(current) > 0) bySlug.set(slug, file)
  }
  return bySlug
}

async function walk(dir) {
  try {
    const dirStat = await stat(dir)
    if (dirStat.isFile()) return [dir]
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(fullPath))
    else if (entry.isFile()) files.push(fullPath)
  }
  return files
}

function relative(file) {
  return path.relative(process.cwd(), file) || '.'
}

function destinationDetailPrompt() {
  return `# Location destinationDetail extraction

Produce one importer-compatible JSON object for the current Rockbusters Location.

Use the attached source packet, source JSON, current curated destination JSON, and latest V3 curated destination JSON as source material. Use the Albarracin example as the target shape and level of specificity.

Rules:
- Return valid JSON only.
- The top-level object must have \`slug\` matching the packet slug.
- Output the new destinationDetail extraction shape, not the older curated destination shape.
- Preserve useful source richness, but remove source/process language from public body copy.
- Public copy should sound like a climber briefing another climber.
- Counts, seasons, access rules, named sectors, named accommodation, prices, transport times, and emergency details must either be sourced or marked with \`sourceStatus\` / \`needsVerification\`.
- Always include 12 \`seasonMonths\` entries with \`month\` 1-12 and \`score\` 0-5.
- Use conservative values when sources conflict.
- Keep accents in names and display text when the source has them.
- Do not invent a separate page-block layout model.
`
}

function destinationDetailOutputSchema() {
  return {
    slug: 'string',
    name: 'string',
    displayName: 'string',
    country: 'string or null',
    region: 'string or null',
    status: 'draft-derived | enriched | partial | insufficient-source',
    sources: [
      {
        id: 'string',
        url: 'string or null',
        title: 'string or null',
        publisher: 'string or null',
        accessedAt: 'YYYY-MM-DD or null',
        notes: 'string or null',
      },
    ],
    facts: {
      locationKind: 'string or null',
      destinationScope: 'string or null',
      climbingStyles: ['string'],
      rockTypes: ['string'],
      rockFeatures: ['string'],
      settingTags: ['string'],
      bestSeasons: ['string'],
      avoidSeasons: ['string'],
      nearestAirports: ['string'],
      accommodationTags: ['string'],
      transportTags: ['string'],
      gradeRange: 'string or null',
      routeCount: 'number or null',
      problemCount: 'number or null',
      sectorCount: 'number or null',
    },
    hero: {
      eyebrow: 'string or null',
      heading: 'string',
      accentWord: 'string or null',
      body: 'string or null',
      primaryAction: { label: 'string or null', href: 'string or null' },
      heroStats: [
        {
          value: 'string',
          label: 'string',
          derivedFrom: 'string or null',
          format: 'string or null',
          note: 'string or null',
          sourceStatus: 'string or null',
        },
      ],
    },
    sections: [
      {
        key: 'intro | history | rock | grades | gear | restdays | safety | costs | etc',
        navLabel: 'string or null',
        heading: 'string',
        body: 'multi-paragraph plain text or null',
        keyCharacteristics: ['string'],
        sourceStatus: 'string or null',
      },
    ],
    audience: [{ label: 'string', gradeRange: 'string or null', body: 'string or null', badge: 'string or null', tone: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    sectors: [{ name: 'string', badges: ['string'], gradeRange: 'string or null', body: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    seasonMonths: [{ month: 'number 1-12', label: 'Jan-Dec', score: 'number 0-5', temperature: 'string or null', conditions: 'string or null', tone: 'string or null', notes: 'string or null', sourceStatus: 'string or null' }],
    gearGroups: [{ heading: 'string', items: ['string'], sourceStatus: 'string or null', needsVerification: 'boolean' }],
    transportOptions: [{ label: 'string', type: 'string or null', duration: 'string or null', body: 'string or null', recommended: 'boolean', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    accommodationOptions: [{ type: 'string or null', name: 'string', body: 'string or null', href: 'string or null', actionLabel: 'string or null', priceHint: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    restDayIdeas: [{ title: 'string', body: 'string or null', distance: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    accessRules: [{ title: 'string', body: 'string or null', tone: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    safetyItems: [{ label: 'string', value: 'string or null', body: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    costItems: [{ label: 'string', unit: 'string or null', budget: 'string or null', midRange: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    destinationFaqs: [{ question: 'string', answer: 'string', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    tripPromos: [{ type: 'string or null', title: 'string', body: 'string or null', action: { label: 'string or null', href: 'string or null' }, sourceStatus: 'string or null', needsVerification: 'boolean' }],
    relatedDestinations: [{ slug: 'string or null', name: 'string', country: 'string or null', region: 'string or null', summary: 'string or null', sourceStatus: 'string or null', needsVerification: 'boolean' }],
    cta: {
      eyebrow: 'string or null',
      heading: 'string or null',
      body: 'string or null',
      primaryAction: { label: 'string or null', href: 'string or null' },
      secondaryAction: { label: 'string or null', href: 'string or null' },
      sourceStatus: 'string or null',
    },
    editorialNotes: ['string'],
  }
}

function extractionReadme(manifest) {
  const lines = [
    '# Location Structured Extraction',
    '',
    'Prepared source packets for generating `locations.destinationDetail` JSON across all legacy destinations.',
    '',
    '## Files',
    '',
    '- `prompt.md` - extraction instructions.',
    '- `output-schema.json` - target JSON shape.',
    '- `albarracin-example.json` - reference output that currently powers the Albarracin page.',
    '- `packets/*.json` - one source packet per destination.',
    '- `batches/*.json` - batch manifests for parallel extraction work.',
    '- `output/*.json` - expected location for generated structured outputs.',
    '',
    '## Validate Generated Output',
    '',
    '```bash',
    'pnpm data-import:validate-location-structured -- --input .scratch/location-structured-extraction/output --strict',
    '```',
    '',
    '## Validate One Output Against Importer Mapping',
    '',
    '```bash',
    'pnpm data-import:location-structured -- --slug albarracin --file .scratch/location-structured-extraction/output/albarracin.json --validate-only',
    '```',
    '',
    '## Coverage',
    '',
    `- destinations: ${manifest.count}`,
    `- source packets: ${manifest.coverage.sourcePacket}/${manifest.count}`,
    `- source JSON: ${manifest.coverage.sourceJson}/${manifest.count}`,
    `- committed curated destination JSON: ${manifest.coverage.currentCuratedDestination}/${manifest.count}`,
    `- latest V3 curated destination JSON: ${manifest.coverage.latestV3CuratedDestination}/${manifest.count}`,
    '',
  ]

  for (const batch of manifest.batches) {
    lines.push(`## Batch ${batch.batch}`, '', batch.slugs.map((slug) => `- ${slug}`).join('\n'), '')
  }

  return `${lines.join('\n')}\n`
}
