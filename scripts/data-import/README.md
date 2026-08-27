# Data import — old rockbusters.net → v3

Seeds v3 Payload collections from the old rockbusters Symfony/MySQL dump.
The dump-derived seed is **committed** at `scripts/data-import/seed/` so
anyone running the pipeline against dev or prod doesn't need MAMP — you
only need MAMP when refreshing the seed from an updated source dump.

Two commands, both idempotent (skip-if-exists on slug):

- `pnpm data-import:import` — imports both collections.
- `pnpm data-import:guides` — imports guides only (alias for `--only=guides`).
- `pnpm data-import:locations` — imports locations only.

Plus one refresh command:

- `pnpm data-import:extract` — regenerates `seed/{guides,locations}.json` from
  a local MySQL loaded from the dump. Run this only when the source data
  changes; commit the diff so the seed stays in git.

This slice covers `team_member` → `guides` (38 rows) and `location` → `locations`
(59 rows). Other entities are follow-up specs.

Text bones only:

- No images. `<img>` tags are stripped from body HTML; per-row stripped-image
  counts are logged. Photos are re-uploaded through the admin.
- No enrichment. The rich profile-page fields on `guides` (stats, about,
  coaching pillars, achievements, testimonial, tagline, role, hero-caption,
  vimeoId) are left empty — the content team fills them in.

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

That's it. Skip-if-exists means it's safe to re-run — every row already in the
target DB is left untouched (including any admin-edited content).

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
carry the pre-transform names (`title`, `body`, `country_nicename`, …) so
tweaking the transform means re-running only the import stage.

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

- Images / galleries / `mainPicture`. Re-uploaded through admin.
- Rich guide fields (`stats`, `about`, `coaching`, `achievements`,
  `testimonial`, `tagline`, `role`, `heroSub`, `heroCaption`, `vimeoId`).
- Locales — English only. `ext_translations` is not read.
- `content_block` (static homepage/team copy blocks) — future spec.
- Any FK-heavy entity (`event`, `event_date`, `event_date_team`,
  `event_location`, `order`).
- The 301 redirect map. Slug-verbatim minimizes the surface but doesn't
  produce the map.
