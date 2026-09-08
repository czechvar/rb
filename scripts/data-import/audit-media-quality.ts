/**
 * Read-only technical audit for the imported media catalogue.
 *
 * It fetches the original image through the local media route, evaluates its
 * decoded pixels, and writes JSON/CSV review reports. It never writes to
 * Payload, R2, or the source media seed.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'

const DEFAULT_INPUT = path.resolve('scripts/data-import/seed/legacy-media.json')
const DEFAULT_OUTPUT_DIRECTORY = path.resolve('.artifacts/media-quality-audit')
const DEFAULT_BASE_URL = 'http://localhost:3333'
const FETCH_TIMEOUT_MS = 12_000
const CONCURRENCY = 6

// These thresholds match the current full-width destination hero and four-up
// 3:4 gallery strip at a useful high-density display resolution.
const HERO_MIN_LONG_EDGE = 2400
const HERO_MIN_SHORT_EDGE = 1350
const GALLERY_MIN_LONG_EDGE = 1200
const GALLERY_MIN_SHORT_EDGE = 800
// Calibrated from the imported library's 5th-percentile Laplacian variance.
// This is a technical soft-focus screen, not an editorial composition score.
const FOCUS_REVIEW_THRESHOLD = 400
const NEAR_DUPLICATE_DISTANCE = 8

type MediaSeedRow = {
  id: string
  alt: string
  url: string | null
  filename: string | null
  mimeType: string | null
  filesize: number | null
  width: number | null
  height: number | null
}

type MediaSeed = { rows: MediaSeedRow[] }

type Args = {
  baseUrl: string
  input: string
  limit: number | null
  outputDirectory: string
}

type AuditRow = {
  id: string
  filename: string | null
  alt: string
  url: string | null
  declaredWidth: number | null
  declaredHeight: number | null
  decodedWidth: number | null
  decodedHeight: number | null
  filesize: number | null
  mimeType: string | null
  focusScore: number | null
  exactHash: string | null
  perceptualHash: string | null
  heroSuitable: boolean
  gallerySuitable: boolean
  flags: string[]
  error: string | null
}

type DuplicatePair = {
  kind: 'exact' | 'near'
  firstId: string
  secondId: string
  distance: number
}

function valueFor(argv: string[], name: string) {
  const exact = argv.find((argument) => argument.startsWith(`${name}=`))
  if (exact) return exact.slice(name.length + 1)
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}

function parseArgs(argv: string[]): Args {
  const limitValue = valueFor(argv, '--limit')
  const limit = limitValue ? Number(limitValue) : null
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error('--limit must be a positive integer')
  }

  return {
    baseUrl: (valueFor(argv, '--base-url') ?? DEFAULT_BASE_URL).replace(/\/$/, ''),
    input: path.resolve(valueFor(argv, '--input') ?? DEFAULT_INPUT),
    limit,
    outputDirectory: path.resolve(valueFor(argv, '--output') ?? DEFAULT_OUTPUT_DIRECTORY),
  }
}

function absoluteMediaUrl(url: string, baseUrl: string) {
  return new URL(url, baseUrl).toString()
}

function numberOrNull(value: number | undefined) {
  return Number.isFinite(value) ? value ?? null : null
}

function focusScore(pixels: Buffer, width: number, height: number) {
  if (width < 3 || height < 3) return 0

  let count = 0
  let mean = 0
  let sumOfSquares = 0
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const laplacian =
        4 * pixels[index] - pixels[index - 1] - pixels[index + 1] - pixels[index - width] - pixels[index + width]
      count += 1
      const delta = laplacian - mean
      mean += delta / count
      sumOfSquares += delta * (laplacian - mean)
    }
  }
  return count > 1 ? sumOfSquares / (count - 1) : 0
}

async function perceptualHash(buffer: Buffer) {
  const { data } = await sharp(buffer)
    .resize({ width: 9, height: 8, fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let output = ''
  for (let y = 0; y < 8; y += 1) {
    let byte = 0
    for (let x = 0; x < 8; x += 1) {
      if (data[y * 9 + x] > data[y * 9 + x + 1]) byte |= 1 << (7 - x)
    }
    output += byte.toString(16).padStart(2, '0')
  }
  return output
}

function hammingDistance(first: string, second: string) {
  let distance = 0
  for (let index = 0; index < first.length; index += 2) {
    let difference = (Number.parseInt(first.slice(index, index + 2), 16) ^ Number.parseInt(second.slice(index, index + 2), 16)) >>> 0
    while (difference) {
      distance += 1
      difference = (difference & (difference - 1)) >>> 0
    }
  }
  return distance
}

function csvCell(value: string | number | boolean | null) {
  const text = value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

async function fetchImage(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function auditOne(media: MediaSeedRow, args: Args): Promise<AuditRow> {
  const base: Omit<AuditRow, 'focusScore' | 'exactHash' | 'perceptualHash' | 'heroSuitable' | 'gallerySuitable' | 'flags' | 'error'> = {
    id: media.id,
    filename: media.filename,
    alt: media.alt,
    url: media.url,
    declaredWidth: media.width,
    declaredHeight: media.height,
    decodedWidth: null,
    decodedHeight: null,
    filesize: media.filesize,
    mimeType: media.mimeType,
  }

  if (!media.url || !media.mimeType?.startsWith('image/')) {
    return { ...base, focusScore: null, exactHash: null, perceptualHash: null, heroSuitable: false, gallerySuitable: false, flags: ['not-a-raster-image'], error: null }
  }

  try {
    const buffer = await fetchImage(absoluteMediaUrl(media.url, args.baseUrl))
    const metadata = await sharp(buffer).metadata()
    const { data, info } = await sharp(buffer)
      .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const width = numberOrNull(metadata.width)
    const height = numberOrNull(metadata.height)
    const longEdge = Math.max(width ?? 0, height ?? 0)
    const shortEdge = Math.min(width ?? 0, height ?? 0)
    const focus = focusScore(data, info.width, info.height)
    const flags: string[] = []

    if (width !== media.width || height !== media.height) flags.push('declared-dimensions-mismatch')
    if (focus < FOCUS_REVIEW_THRESHOLD) flags.push('focus-review')
    if (shortEdge < GALLERY_MIN_SHORT_EDGE || longEdge < GALLERY_MIN_LONG_EDGE) flags.push('gallery-resolution-too-small')
    if (shortEdge < HERO_MIN_SHORT_EDGE || longEdge < HERO_MIN_LONG_EDGE) flags.push('hero-resolution-too-small')

    return {
      ...base,
      decodedWidth: width,
      decodedHeight: height,
      focusScore: Number(focus.toFixed(2)),
      exactHash: createHash('sha256').update(buffer).digest('hex'),
      perceptualHash: await perceptualHash(buffer),
      heroSuitable: focus >= FOCUS_REVIEW_THRESHOLD && shortEdge >= HERO_MIN_SHORT_EDGE && longEdge >= HERO_MIN_LONG_EDGE,
      gallerySuitable: focus >= FOCUS_REVIEW_THRESHOLD && shortEdge >= GALLERY_MIN_SHORT_EDGE && longEdge >= GALLERY_MIN_LONG_EDGE,
      flags,
      error: null,
    }
  } catch (error) {
    return {
      ...base,
      focusScore: null,
      exactHash: null,
      perceptualHash: null,
      heroSuitable: false,
      gallerySuitable: false,
      flags: ['unreadable'],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function mapConcurrent<T, R>(items: T[], worker: (item: T) => Promise<R>) {
  const output = new Array<R>(items.length)
  let nextIndex = 0
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      output[index] = await worker(items[index])
      if ((index + 1) % 50 === 0 || index + 1 === items.length) console.log(`audited ${index + 1}/${items.length}`)
    }
  }))
  return output
}

function duplicatePairs(rows: AuditRow[]) {
  const pairs: DuplicatePair[] = []
  const exact = new Map<string, AuditRow[]>()
  for (const row of rows) {
    if (!row.exactHash) continue
    exact.set(row.exactHash, [...(exact.get(row.exactHash) ?? []), row])
  }
  for (const matches of exact.values()) {
    for (let index = 1; index < matches.length; index += 1) {
      pairs.push({ kind: 'exact', firstId: matches[0].id, secondId: matches[index].id, distance: 0 })
      matches[index].flags.push('exact-duplicate')
    }
  }

  const hashes = rows.filter((row): row is AuditRow & { perceptualHash: string } => Boolean(row.perceptualHash))
  for (let firstIndex = 0; firstIndex < hashes.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < hashes.length; secondIndex += 1) {
      const first = hashes[firstIndex]
      const second = hashes[secondIndex]
      if (first.exactHash === second.exactHash) continue
      const distance = hammingDistance(first.perceptualHash, second.perceptualHash)
      if (distance > NEAR_DUPLICATE_DISTANCE) continue
      pairs.push({ kind: 'near', firstId: first.id, secondId: second.id, distance })
      first.flags.push('near-duplicate')
      second.flags.push('near-duplicate')
    }
  }
  return pairs
}

async function writeReports(rows: AuditRow[], duplicates: DuplicatePair[], outputDirectory: string) {
  await fs.mkdir(outputDirectory, { recursive: true })
  const summary = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      hero: { minimumLongEdge: HERO_MIN_LONG_EDGE, minimumShortEdge: HERO_MIN_SHORT_EDGE },
      gallery: { minimumLongEdge: GALLERY_MIN_LONG_EDGE, minimumShortEdge: GALLERY_MIN_SHORT_EDGE },
      focusReviewThreshold: FOCUS_REVIEW_THRESHOLD,
      nearDuplicateDistance: NEAR_DUPLICATE_DISTANCE,
    },
    total: rows.length,
    heroSuitable: rows.filter((row) => row.heroSuitable).length,
    gallerySuitable: rows.filter((row) => row.gallerySuitable).length,
    focusReview: rows.filter((row) => row.flags.includes('focus-review')).length,
    unreadable: rows.filter((row) => row.error).length,
    exactDuplicates: duplicates.filter((pair) => pair.kind === 'exact').length,
    nearDuplicates: duplicates.filter((pair) => pair.kind === 'near').length,
  }
  await fs.writeFile(path.join(outputDirectory, 'media-quality-audit.json'), `${JSON.stringify({ summary, rows, duplicates }, null, 2)}\n`)
  const header = ['id', 'filename', 'alt', 'decodedWidth', 'decodedHeight', 'focusScore', 'heroSuitable', 'gallerySuitable', 'flags', 'error']
  const csv = [header.join(','), ...rows.map((row) => [row.id, row.filename, row.alt, row.decodedWidth, row.decodedHeight, row.focusScore, row.heroSuitable, row.gallerySuitable, row.flags.join(';'), row.error].map(csvCell).join(','))]
  await fs.writeFile(path.join(outputDirectory, 'media-quality-audit.csv'), `${csv.join('\n')}\n`)
  await fs.writeFile(path.join(outputDirectory, 'media-duplicates.json'), `${JSON.stringify(duplicates, null, 2)}\n`)
  return summary
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const source = JSON.parse(await fs.readFile(args.input, 'utf8')) as MediaSeed
  const rows = args.limit ? source.rows.slice(0, args.limit) : source.rows
  console.log(`Auditing ${rows.length} images through ${args.baseUrl}`)
  const audited = await mapConcurrent(rows, (media) => auditOne(media, args))
  const duplicates = duplicatePairs(audited)
  const summary = await writeReports(audited, duplicates, args.outputDirectory)
  console.log(JSON.stringify({ ...summary, outputDirectory: args.outputDirectory }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('media quality audit failed:', error)
    process.exit(1)
  })
}
