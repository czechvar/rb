/**
 * Extract legacy Rockbusters support content from the local Postgres dump.
 *
 * Produces committed seed snapshots for partners, testimonials, blog
 * categories, and blog posts.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const SOURCE = 'legacy postgres dump in rb-legacy-pg-20260827'

const container = process.env.LEGACY_PG_CONTAINER ?? 'rb-legacy-pg-20260827'
const user = process.env.LEGACY_PG_USER ?? 'rockbusters'
const database = process.env.LEGACY_PG_DATABASE ?? 'rockbusters_legacy'

async function psqlJson(sql: string) {
  const { stdout } = await execFileAsync(
    'docker',
    ['exec', container, 'psql', '-U', user, '-d', database, '-At', '-c', sql],
    { maxBuffer: 128 * 1024 * 1024 },
  )

  return stdout.trim()
}

async function writeJson(name: string, rowsJson: string) {
  await fs.mkdir(SEED_DIR, { recursive: true })
  const file = path.join(SEED_DIR, `${name}.json`)
  const rows = JSON.parse(rowsJson) as unknown[]
  await fs.writeFile(
    file,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: SOURCE,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  console.log(`extract: ${name}: ${rows.length} rows -> ${path.relative(process.cwd(), file)}`)
}

async function main() {
  await writeJson(
    'legacy-partners',
    await psqlJson(`
      select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
      from (
        select
          id,
          image_id as "imageId",
          name,
          link,
          description,
          created,
          updated,
          display,
          slug,
          featured
        from partner
        order by id
      ) src
    `),
  )

  await writeJson(
    'legacy-testimonials',
    await psqlJson(`
      select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
      from (
        select
          id,
          title,
          author,
          text,
          slug,
          created,
          updated,
          display
        from testimonial
        order by id
      ) src
    `),
  )

  await writeJson(
    'legacy-blog-categories',
    await psqlJson(`
      select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
      from (
        select
          id,
          title,
          slug,
          color,
          created,
          updated
        from blog_category
        order by id
      ) src
    `),
  )

  await writeJson(
    'legacy-blog-posts',
    await psqlJson(`
      select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
      from (
        select
          b.id,
          b.gallery_id as "galleryId",
          b.title,
          b.slug,
          b.body,
          b.keywords,
          b.description,
          b.created,
          b.updated,
          b."coverImage_id" as "coverImageId",
          b."fbShareImage_id" as "fbShareImageId",
          b.featured,
          b.custom_url as "customUrl",
          b.fb_title as "fbTitle",
          b.fb_description as "fbDescription",
          b.active,
          coalesce((
            select json_agg(bpc.blog_category_id order by bpc.blog_category_id)
            from blog_post_category bpc
            where bpc.blog_id = b.id
          ), '[]'::json) as "categoryIds"
        from blog b
        order by b.id
      ) src
    `),
  )
}

main().catch((err) => {
  console.error('legacy support content extract failed:', err)
  process.exit(1)
})
