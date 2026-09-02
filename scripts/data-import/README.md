# Data import — old rockbusters.net → v3

Seeds v3 Payload collections from the old rockbusters Symfony/MySQL dump.
The dump-derived seed is **committed** at `scripts/data-import/seed/` so
anyone running the pipeline against dev or prod doesn't need MAMP — you
only need MAMP when refreshing the seed from an updated source dump.

Two commands, both idempotent:

- `pnpm data-import:import` — imports both collections.
- `pnpm data-import:guides` — imports guides only (alias for `--only=guides`);
  matching slugs are overwritten from the legacy seed.
- `pnpm data-import:locations` — imports locations only.
- `pnpm data-import:legacy-destinations` — upserts the curated destination
  research snapshot into `locations`.

Plus one refresh command:

- `pnpm data-import:extract` — regenerates `seed/{guides,locations}.json` from
  a local MySQL loaded from the dump. Run this only when the source data
  changes; commit the diff so the seed stays in git.
- `pnpm data-import:extract-location-media` — regenerates legacy media
  references from the local legacy Postgres container and the live legacy
  location pages.
- `pnpm data-import:extract-legacy-support-content` — regenerates support
  content seeds from the local legacy Postgres container.

This slice covers `team_member` → `guides` (38 rows) and `location` → `locations`
(59 rows). Other entities are follow-up specs.

Locations are text bones only:

- No images. `<img>` tags are stripped from body HTML; per-row stripped-image
  counts are logged. Photos are re-uploaded through the admin.

Guides are imported from scratch from `team_member`:

- Existing matching guide slugs are overwritten with legacy name, body, contact
  fields, active state, and photo.
- The current `jany` seed slug is treated as the same person as legacy
  `jan-novotny` and is renamed to the legacy slug during import.
- Inactive legacy team members are imported and kept inactive.
- Active guide rows that are not present in the legacy seed are deactivated,
  not deleted.
- `team_member.image_id` is translated through the uploaded media lookup into
  `guides.photo`.
- The import writes `scripts/data-import/seed/legacy-guide-lookup.json` with
  `team_member.id` → Payload guide ID mappings for later event/team joins.
- Rich profile-page fields on `guides` (stats, about, coaching pillars,
  achievements, testimonial, tagline, role, hero-caption, vimeoId) are cleared
  for the legacy baseline; the content team fills them in later.

## Common workflow — import into an environment

You do NOT need MAMP for this. The seed lives in git.

1. Point `DATABASE_URL` in `.env` at your target (dev by default; for prod,
   `vercel env pull .env.production.local` and source it — see below).
2. Run:
   ```bash
   PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import
   # or, per-entity:
   PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:guides
   PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:locations
   ```

That's it. Locations use skip-if-exists, while guides are overwritten from the
legacy seed. Both are safe to re-run when that behavior is intentional.

## Fresh local sandbox check

Before trusting import changes, run the full pipeline into a disposable local
database:

```bash
pnpm data-import:sandbox
```

This resets only `rockbusters_import_sandbox` on local Postgres, runs migrations,
imports media metadata, airports, locations, guides, seed data, curated
partners, testimonials, blog categories, blog posts, destinations, legacy
events, catalogue-card copy, and the homepage snapshot.
It then reruns the FK-heavy imports to prove they are idempotent.
Target-specific lookup files are written under
`.scratch/data-import-sandbox-lookups` so committed seed files are not polluted
with sandbox-local numeric IDs.

Override the database name when needed:

```bash
pnpm data-import:sandbox -- --database rockbusters_import_sandbox_2
```

The sandbox runner refuses non-local admin database hosts.

### Against production

```bash
vercel env pull .env.production.local --environment=production
set -a; source .env.production.local; set +a
grep 'ep-[a-z0-9-]*' <<< "$DATABASE_URL"    # expect: ep-weathered-pine-alvc3sdj
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import --allow-production
# then close the terminal or `unset DATABASE_URL PAYLOAD_SECRET R2_*`
```

The `--allow-production` flag is the guard that the script requires when the
production Neon host is detected. Same guard is applied by all three aliases
(`data-import:import`, `data-import:guides`, `data-import:locations`).

## Refreshing the seed from an updated dump

Do this only when the source data changes and you want the committed seed to
match. The dump is `old_db/20260827_rb.sql` (or newer), gitignored.

### One-time: load the dump into MAMP MySQL

The current setup uses `rb_old` everywhere — DB name, user, password — to keep
it obviously scoped to this import. Either through the MAMP UI ("Create
database…") or the CLI:

```bash
# adjust path/port to your MAMP install — MAMP Pro = 3306 (default), MAMP standard = 8889
# use MAMP's bundled binary at /Applications/MAMP/Library/bin/mysql57/bin/mysql if the system one complains about a socket path
/Applications/MAMP/Library/bin/mysql -u root -proot -h 127.0.0.1 -P 3306 \
  -e "CREATE DATABASE IF NOT EXISTS rb_old CHARACTER SET utf8 COLLATE utf8_unicode_ci;
      CREATE USER IF NOT EXISTS 'rb_old'@'localhost' IDENTIFIED BY 'rb_old';
      GRANT ALL ON rb_old.* TO 'rb_old'@'localhost';"
```

Then load the dump:

```bash
/Applications/MAMP/Library/bin/mysql -u rb_old -prb_old -h 127.0.0.1 -P 3306 \
  rb_old < old_db/20260827_rb.sql
```

Sanity check:

```bash
/Applications/MAMP/Library/bin/mysql -u rb_old -prb_old -h 127.0.0.1 -P 3306 rb_old \
  -e "SELECT COUNT(*) FROM team_member; SELECT COUNT(*) FROM location;"
# expect 38, 59
```

Docker fallback (if you don't have MAMP or a local MySQL):

```bash
docker run --name rb-old -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -p 3307:3306 -d mysql:5.7
docker exec -i rb-old mysql -e "CREATE DATABASE rb_old"
docker exec -i rb-old mysql rb_old < old_db/20260827_rb.sql
# then OLD_DB_URL=mysql://root@127.0.0.1:3307/rb_old
```

### Environment

Set `OLD_DB_URL` in `.env.local` (gitignored — never in `.env`):

```
OLD_DB_URL=mysql://rb_old:rb_old@127.0.0.1:3306/rb_old
```

### Extract

```bash
pnpm data-import:extract    # → scripts/data-import/seed/{guides,locations}.json
git diff scripts/data-import/seed/
# review the diff; if it looks right, commit. If not, `git restore` those files.
```

Extract connects to `OLD_DB_URL`, runs two queries (locations JOIN country,
then team_member), and overwrites the two JSON files in `seed/`. Row fields
carry the pre-transform names (`title`, `body`, `country_nicename`,
`image_id`, …) so tweaking the transform means re-running only the import
stage.

## Guards

- **Production DB refusal.** If `DATABASE_URL` host is `ep-weathered-pine-alvc3sdj`
  (production Neon), the import stage refuses to run unless `--allow-production`
  is passed. Same guard, same constant, as `scripts/blog-import/import.ts`.
- **Interactive schema push.** If Payload wedges silently at startup, prefix
  with `PAYLOAD_DISABLE_DB_PUSH=true` — a schema drift triggers Drizzle's
  interactive `push`, which is not answerable from a non-interactive script.

## Body cleanup

For each row's `body` HTML, before conversion to Lexical:

1. JSDOM parses the HTML (handles entity decoding + tag closure).
2. `<img>` tags are removed; the count is tallied per collection.
3. Inline `style="…"` attributes are dropped (Word-paste noise).
4. Empty `<p>` (`<p></p>`, `<p>&nbsp;</p>`, `<p>\s*</p>`) are removed.
5. Cleaned HTML is fed to `convertHTMLToLexical` from
   `@payloadcms/richtext-lexical`.

## What this does NOT do

- Location images / galleries / `mainPicture`. The guide importer does set
  `guides.photo` from the uploaded legacy media lookup.
- Rich guide fields (`stats`, `about`, `coaching`, `achievements`,
  `testimonial`, `tagline`, `role`, `heroSub`, `heroCaption`, `vimeoId`).
- Locales — English only. `ext_translations` is not read.
- `content_block` (static homepage/team copy blocks) — future spec.
- Any FK-heavy entity (`event`, `event_date`, `event_date_team`,
  `event_location`, `order`).
- The 301 redirect map. Slug-verbatim minimizes the surface but doesn't
  produce the map.

## Curated legacy destination import

The enriched destination import reads the committed seed snapshot:

```text
scripts/data-import/seed/legacy-destinations/*.curated.json
```

Run it after the location taxonomy migration is applied:

```bash
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:legacy-destinations
```

It upserts `locations` by slug:

- creates missing records,
- updates existing records with the curated title, active state, structured
  taxonomy fields, route/problem/sector facts, planning summaries, source
  references, and generated rich-text content assembled from sourced sections,
- translates `media.mainImage.legacyMediaId` through the media lookup table and
  sets `mainPicture` when a matching Payload media ID exists,
- keeps omitted CMS-owned fields untouched, including `gallery` and `layout`.

It also reuses the older `seed/locations.json` snapshot for stable basics when
available: country, coordinates, and SEO keywords/description.

Media lookup defaults to:

```text
/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json
```

Override it with `PAYLOAD_MEDIA_LOOKUP_FILE=/path/to/payload-media-lookup.json`.
The destination import only reads this lookup. It does not upload media and does
not invent new media IDs.

This command is allowed to publish partial records because that product decision
was accepted for the first migration pass. The `contentCompleteness` field keeps
those records visible for later editorial review.

## Legacy location media references

The media-reference extraction step writes:

```text
scripts/data-import/seed/legacy-location-media.json
```

and also copies each row's legacy main-image metadata into the matching
curated destination file under:

```text
scripts/data-import/seed/legacy-destinations/*.curated.json
```

Refresh these references only when the legacy source changes:

```bash
pnpm data-import:extract-location-media
```

The extractor reads the same curated destination slug set, joins
`location.image_id` to `media__media` in the local legacy Postgres container,
and fetches each live legacy location page to capture the exact
`/uploads/media/default/...` URL that page uses.

The extracted data intentionally stays in the old-world namespace:

- `legacyLocationId`
- `legacyMediaId`
- legacy media filename/provider reference/content type/dimensions
- live legacy `sourceUrl`

It does not create Payload `media`, does not create new media IDs, and does not
update `locations.mainPicture`.

## Legacy media seed

After the one-time legacy media upload has populated R2 and the Payload `media`
table, export a committed DB-row snapshot:

```bash
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:export-media-seed
```

This writes:

```text
scripts/data-import/seed/legacy-media.json
```

Use it to recreate media records in a fresh environment where the same R2
objects already exist:

```bash
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:seed-media
```

The seed importer does not upload files and does not call Payload upload
processing. It directly inserts missing `media` rows with stable `med_...` IDs
and skips existing rows by default. Use `--update-existing` only when you
intentionally want the seed snapshot to overwrite existing media metadata.

## Legacy support content import

Refresh the committed support-content seed snapshots from the local legacy
Postgres container only when the source dump changes:

```bash
pnpm data-import:extract-legacy-support-content
```

This writes:

```text
scripts/data-import/seed/legacy-partners.json
scripts/data-import/seed/legacy-testimonials.json
scripts/data-import/seed/legacy-blog-categories.json
scripts/data-import/seed/legacy-blog-posts.json
```

Import them into Payload:

```bash
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:legacy-support-content
```

The importer upserts by slug:

- `partner` → `partners`, including logo media when the legacy media lookup
  resolves,
- `testimonial` → global `reviews`,
- `blog_category` → `post-categories`,
- `blog` → `posts`, including hero image, rich-text body, SEO fields, published
  state, and the first legacy category relation.

Legacy `blog_post_category` can contain multiple categories per post, but the
current Payload `posts.category` field stores only one relation. The importer
chooses the first legacy category ID deterministically; the full legacy
`categoryIds` array remains in `legacy-blog-posts.json` for a future schema
expansion if needed.
