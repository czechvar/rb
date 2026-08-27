# Data import — old rockbusters.net → v3

Seeds v3 Payload collections from the old rockbusters Symfony/MySQL dump.
Two stages, both idempotent and re-runnable:

1. `pnpm data-import:extract` — reads a local MySQL loaded from the dump, writes JSON into `scripts/data-import/data/` (gitignored).
2. `pnpm data-import:import` — reads that JSON, upserts into Payload via the Local API with **skip-if-exists** semantics.

This slice covers `team_member` → `guides` (39 rows) and `location` → `locations` (63 rows). Other entities are follow-up specs.

Text bones only:
- No images. `<img>` tags are stripped from body HTML; per-row stripped-image counts are logged. Photos and galleries are re-uploaded through the admin.
- No enrichment. The rich profile-page fields on `guides` (stats, about, coaching pillars, achievements, testimonial, tagline, role, hero-caption, vimeoId) are left empty — the content team fills them in.

## Prerequisites

- The MySQL dump lives at `old_db/20260827_rb.sql` (584 MB, gitignored).
- A locally-running MySQL 5.7+ server. MAMP works; Docker works; a system MySQL works. Anything reachable over the network.

### One-time: load the dump into MAMP MySQL

Create a dedicated database + user (the current setup uses `rb_old`
everywhere — DB name, user, password — to keep it obviously scoped to
this import). Either through the MAMP UI ("Create database…") or the CLI:

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

Sanity check afterwards:

```bash
/Applications/MAMP/Library/bin/mysql -u rb_old -prb_old -h 127.0.0.1 -P 3306 rb_old \
  -e "SELECT COUNT(*) FROM team_member; SELECT COUNT(*) FROM location;"
# expect 39, 63
```

Docker fallback (if you don't have MAMP or a local MySQL):

```bash
docker run --name rb-old -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -p 3307:3306 -d mysql:5.7
docker exec -i rb-old mysql -e "CREATE DATABASE rb_old"
docker exec -i rb-old mysql rb_old < old_db/20260827_rb.sql
# then OLD_DB_URL=mysql://root@127.0.0.1:3307/rb_old
```

### Environment

Set `OLD_DB_URL` in your shell, or (recommended) in `.env.local` (already gitignored — never in `.env`):

```
OLD_DB_URL=mysql://rb_old:rb_old@127.0.0.1:3306/rb_old
```

The import stage reads `DATABASE_URL` from `.env` — that's Payload's target. **Local `.env` must point at the Neon `dev` branch, never the production host `ep-weathered-pine-alvc3sdj`.** See the database-branches warning in `CLAUDE.md`.

## Workflow

```bash
pnpm data-import:extract                                    # → scripts/data-import/data/
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import        # → Payload via Local API
```

### Extract

Connects to `OLD_DB_URL`, runs two queries (locations JOIN country, then team_member), writes:

- `scripts/data-import/data/locations.json`
- `scripts/data-import/data/guides.json`

Both files carry `{ generatedAt, source, rows }`. Row fields carry the pre-transform names (`title`, `body`, `country_nicename`, …) so that tweaking the transform means re-running only the import stage.

### Import

For each row: converts the HTML body to Payload Lexical (stripping `<img>` and inline `style` first, dropping empty paragraphs), then upserts by slug:

- If a doc with the same slug already exists → **skip** (never update, never delete). Protects hand-crafted seeds like Jany (`jan-novotny`).
- Else → create.

Finishes with a per-entity summary:

```
import (locations): imported=63 skipped-existing=0 total=63 imgs-stripped=124
import (guides):    imported=38 skipped-existing=1 total=39 imgs-stripped=87
```

## Guards

- **Production DB refusal.** If `DATABASE_URL` host is `ep-weathered-pine-alvc3sdj` (production Neon), the import stage refuses to run unless `--allow-production` is passed. Same guard, same constant, as `scripts/blog-import/import.ts`.
- **Interactive schema push.** If Payload wedges silently at startup, prefix with `PAYLOAD_DISABLE_DB_PUSH=true` — a schema drift triggers Drizzle's interactive `push`, which is not answerable from a non-interactive script.

## Re-running

Both stages are safe to re-run at any time:
- Extract regenerates the JSON in place.
- Import skips every row already present. To re-import a single row, delete it in the admin first, then re-run.

## What this does NOT do

- Images / galleries / `mainPicture`. Re-uploaded through admin.
- Rich guide fields (`stats`, `about`, `coaching`, `achievements`, `testimonial`, `tagline`, `role`, `heroSub`, `heroCaption`, `vimeoId`).
- Locales — English only. `ext_translations` is not read.
- `content_block` (static homepage/team copy blocks) — future spec.
- Any FK-heavy entity (`event`, `event_date`, `event_date_team`, `event_location`, `order`).
- The 301 redirect map. Slug-verbatim minimizes the surface but doesn't produce the map.
