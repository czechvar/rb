/**
 * Promote reviewed event catalogue-card copy proposals into seed data.
 *
 * This writes persistent catalogue seed data derived from existing legacy
 * event/date content. It does not touch the CMS.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const PROPOSALS_FILE = path.resolve(process.cwd(), '.scratch/event-catalogue-card-copy-proposals.md')
const OUT_FILE = path.resolve(process.cwd(), 'scripts/data-import/seed/event-catalogue-cards.json')

type CatalogueCardSeedRow = {
  slug: string
  title: string
  description: string
}

function parseTableRow(line: string): CatalogueCardSeedRow | null {
  const match = line.match(/^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/)
  if (!match) return null
  const [, slug, title, description] = match
  if (slug === 'Slug') return null
  return {
    slug: slug.trim(),
    title: title.trim(),
    description: description.trim(),
  }
}

async function main() {
  const markdown = await fs.readFile(PROPOSALS_FILE, 'utf8')
  const proposalSections = markdown.split('## Excluded Fixtures')[0] ?? markdown
  const rows = proposalSections
    .split('\n')
    .map(parseTableRow)
    .filter((row): row is CatalogueCardSeedRow => Boolean(row))

  const uniqueSlugs = new Set(rows.map((row) => row.slug))
  if (uniqueSlugs.size !== rows.length) {
    throw new Error(`Duplicate event catalogue card proposals found (${rows.length - uniqueSlugs.size})`)
  }

  await fs.writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source:
          '.scratch/event-catalogue-card-copy-proposals.md, derived from legacy event and event-date seed copy',
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(`promoted ${rows.length} catalogue card rows to ${path.relative(process.cwd(), OUT_FILE)}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('event catalogue card proposal promotion failed:', err)
    process.exit(1)
  })
