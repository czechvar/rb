# Data Import — Guides + Locations (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a two-stage, throwaway import pipeline that seeds v3's `guides` and `locations` collections from the old rockbusters MySQL dump. Text bones only — no images, no enrichment. Idempotent, skip-if-exists, production-safe.

**Spec:** `docs/superpowers/specs/2026-08-27-data-import-guides-locations-design.md`

**Reference implementation:** `origin/blogImport` branch — `scripts/blog-import/import.ts` is the pattern for the Payload Local API + prod guard + upsert-by-slug shape. It is not on `main` or `dataImport` yet; read via `git show origin/blogImport:scripts/blog-import/import.ts` when you need it.

**Branch:** stay on `dataImport`. Commits land as `feat(data-import): ...`.

---

## Prerequisites (do these before Task 1)

- MAMP running with a MySQL 5.7+ server on a known port (MAMP standard = `8889`, MAMP Pro = `3306`).
- `old_db/20260827_rb.sql` present at repo root; `old_db/` gitignored (done).
- One-time load of the dump into MAMP MySQL:
  ```bash
  /Applications/MAMP/Library/bin/mysql -u root -proot -h 127.0.0.1 -P 8889 \
    -e "CREATE DATABASE IF NOT EXISTS rockbusters CHARACTER SET utf8 COLLATE utf8_unicode_ci"
  /Applications/MAMP/Library/bin/mysql -u root -proot -h 127.0.0.1 -P 8889 \
    rockbusters < old_db/20260827_rb.sql
  ```
  (Path and port adjust to your MAMP install; document what you did in `scripts/data-import/README.md`.)
- Sanity: `SELECT COUNT(*) FROM team_member;` = 39, `SELECT COUNT(*) FROM location;` = 63.
- Local `.env` points at the Neon **dev** branch — never `ep-weathered-pine-alvc3sdj`.

---

## File structure

### To CREATE

- `scripts/data-import/README.md`
- `scripts/data-import/extract.ts`
- `scripts/data-import/import.ts`
- `scripts/data-import/data/` — gitignored; populated by extract stage
- `scripts/data-import/.gitignore` — one line: `data/`

### To EDIT

- `package.json` — add `data-import:extract` and `data-import:import` script aliases; add `mysql2` to `devDependencies`.
- `scripts/README.md` — add two rows to the reference table + a short "Data import workflow" section mirroring the blog-import one.
- (Conditional, only if Task 2 finds them) `src/app/(frontend)/team/[slug]/page.tsx` and/or `src/app/(frontend)/destinations/[slug]/page.tsx` — add conditional-render guards around any rich section that assumes populated data.

### To LEAVE ALONE

- Any existing `docs/superpowers/specs/2026-07-30-*.md` and `tickets.md` untracked files on `dataImport` — unrelated to this work.
- `src/collections/Guides.ts` and `src/collections/Locations.ts` — schemas already fit; no changes needed.

---

## Tasks

### Task 1: Add `mysql2` dependency

- [ ] `pnpm add -D mysql2` (pure-JS MySQL client; no native build; supports Promise API).
- [ ] Commit: `chore(deps): add mysql2 for data-import`.

### Task 2: Verify guide + location detail pages render with empty rich fields

Before pouring in 38+63 bare rows, confirm the pages don't crash on empty structured data. Only Jany (guide) and the seeded locations have been rendered so far.

- [ ] Grep the guide/location detail page templates for direct reads of `stats`, `about`, `coaching`, `achievements`, `testimonial`, `heroSub`, `heroCaption`, `tagline`, `role`, `city`, `address`, `mainPicture`, `gallery`.
- [ ] For any section whose render logic assumes the field is populated, add `if (empty) return null` (or the section-specific equivalent). Match the existing conditional-render patterns in these files.
- [ ] Verify locally by editing Jany in admin, temporarily blanking (say) `stats`, saving, reloading `/team/jan-novotny`. Restore afterwards.
- [ ] Commit any template edits as `fix(team|destinations): guard <section> on empty <field>`. If no edits were needed, note that in the PR body — nothing to commit.

### Task 3: Scaffold `scripts/data-import/`

- [ ] Create `scripts/data-import/.gitignore` containing `data/`.
- [ ] Create `scripts/data-import/README.md` with:
  - Purpose (one paragraph).
  - MAMP setup command block (copy from Prerequisites above).
  - `OLD_DB_URL` env var explanation + example (`mysql://root:root@127.0.0.1:8889/rockbusters`).
  - Two-step workflow: `pnpm data-import:extract` → `pnpm data-import:import`.
  - Production guard note (identical wording to `scripts/blog-import/README` / `scripts/README.md`).
  - `PAYLOAD_DISABLE_DB_PUSH=true` note.

### Task 4: Extract stage — `scripts/data-import/extract.ts`

Contract: connect to `OLD_DB_URL`, query the two tables + country join, write JSON.

- [ ] Load `dotenv/config`.
- [ ] Read `process.env.OLD_DB_URL`; refuse to start if unset (loud error).
- [ ] Connect via `mysql2/promise` `createConnection(url)`.
- [ ] Query 1 (locations):
  ```sql
  SELECT l.id, l.title, l.slug, l.body, l.latitude, l.longitude,
         l.keywords, l.description, l.display,
         c.nicename AS country_nicename
  FROM location l
  LEFT JOIN country c ON c.id = l.country_id
  ORDER BY l.id;
  ```
- [ ] Query 2 (guides):
  ```sql
  SELECT id, name, slug, body, email, phone, display
  FROM team_member
  ORDER BY id;
  ```
- [ ] Serialize into `{ generatedAt, source, rows }` shape.
- [ ] Write `scripts/data-import/data/locations.json` and `data/guides.json` (mkdir -p first).
- [ ] Log `extract: locations: <n> rows → data/locations.json` etc.
- [ ] Close the MySQL connection; exit 0.
- [ ] Commit: `feat(data-import): extract stage for guides + locations`.

### Task 5: Wire `data-import:extract` into package.json

- [ ] Add `"data-import:extract": "tsx scripts/data-import/extract.ts"` to `package.json` `scripts`.
- [ ] Run `pnpm data-import:extract`; confirm both JSON files exist and contain the expected row counts.
- [ ] `jq '.rows[0]' scripts/data-import/data/locations.json` and same for `guides.json` — visually confirm one row of each looks sane.
- [ ] Commit: `chore(scripts): pnpm data-import:extract alias`.

### Task 6: Import stage — `scripts/data-import/import.ts`

Contract: read the JSON, upsert by slug into Payload (skip-if-exists), report counts.

- [ ] Load `dotenv/config`.
- [ ] `PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'` — refuse to run unless `--allow-production` is passed when `DATABASE_URL` host matches (copy the guard function from `origin/blogImport:scripts/blog-import/import.ts`).
- [ ] Instantiate Payload via `getPayload({ config })`.
- [ ] Read `scripts/data-import/data/locations.json` and `data/guides.json`; abort with a clear message if either is missing ("run `pnpm data-import:extract` first").
- [ ] Helper `skipOrCreate(payload, { collection, slug, data })`:
  - `find` by slug, `limit: 1`, `depth: 0`.
  - If exists → return `{ id, existed: true }`. Do **not** update.
  - Else `create` → return `{ id, existed: false }`.
- [ ] Helper `cleanBody(html: string): { html: string, strippedImgs: number }`:
  - Decode HTML entities (use `he` or `html-entities` from existing deps; if not present, add `he` as a devDependency in this task's commit).
  - Count and strip `<img …>` tags (case-insensitive; self-closing variants).
  - Strip inline `style="…"` attributes.
  - Remove empty `<p></p>` / `<p>\s*</p>` / `<p>&nbsp;</p>` runs (post-decode).
  - Return cleaned HTML + stripped image count.
- [ ] Helper `toLexical(html: string): Promise<SerializedEditorState>`:
  - `convertHTMLToLexical` from `@payloadcms/richtext-lexical` with `editorConfigFactory`. Follow the exact call shape used in `origin/blogImport:scripts/blog-import/import.ts` (minus the image-marker/videoEmbed logic — we strip images, and there are no video embeds in guide/location bodies).
- [ ] For each location row:
  - Build data: `name`, `slug`, `content` (from `cleanBody` → `toLexical`), `country` (from `country_nicename` or empty), `coordinates` (`[longitude, latitude]` if not both 0, else omit), `seo.description`, `seo.keywords`, `active`, `featured=false`.
  - `skipOrCreate('locations', slug, data)`.
  - Accumulate `imported`/`existed` and per-run `imgsStripped` totals.
- [ ] For each guide row:
  - Build data: `name`, `slug`, `content` (from `cleanBody` → `toLexical`), `email`, `phone`, `active`, `section='team'`, `featured=false`, `isFounder=false`. All other fields omitted (Payload defaults to unset for optional groups/arrays).
  - `skipOrCreate('guides', slug, data)`.
  - Accumulate totals.
- [ ] Print summary:
  ```
  import (locations): imported=X skipped-existing=Y total=63 imgs-stripped=Z
  import (guides):    imported=X skipped-existing=Y total=39 imgs-stripped=Z
  ```
- [ ] Any per-row error → rethrow with row context (`throw new Error(\`location #${row.id} (${row.slug}): ${cause}\`)`).
- [ ] Exit 0 on success; process.exit(1) on any handled error surface.
- [ ] Commit: `feat(data-import): import stage — upsert by slug into Payload`.

### Task 7: Wire `data-import:import` into package.json

- [ ] Add `"data-import:import": "tsx scripts/data-import/import.ts"` to `package.json`.
- [ ] Commit: `chore(scripts): pnpm data-import:import alias`.

### Task 8: Update `scripts/README.md`

- [ ] Add two rows to the reference table:
  - `pnpm data-import:extract` — `data-import/extract.ts` — ❌ (writes files) — Reads OLD_DB_URL, writes `data-import/data/*.json`.
  - `pnpm data-import:import` — `data-import/import.ts` — ✅ upsert — Loads scraped JSON into Payload. Skip-if-exists on slug. Guarded against production.
- [ ] Add a "Data import workflow" section after the "Blog import workflow" section, mirroring its shape. Include the MAMP load command and the `--allow-production` note.
- [ ] Commit: `docs(scripts): document data-import workflow`.

### Task 9: End-to-end verification against dev DB

- [ ] Confirm `.env`'s `DATABASE_URL` host is **not** `ep-weathered-pine-alvc3sdj`.
- [ ] `PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import`.
- [ ] Expect: `import (locations): imported=63 skipped-existing=0 total=63 …`. If the dev DB is a copy of production, seeded Jany already exists → `import (guides): imported=38 skipped-existing=1 total=39`.
- [ ] `pnpm dev`, then:
  - `/admin/collections/guides` — 39 rows total, Jany's rich profile intact, sample 3 imported guides (name/body/email/phone/active correct, rich fields empty).
  - `/admin/collections/locations` — 63 rows total, sample 3 (name/body/country/coordinates/seo correct).
  - `/team/laszlo-juhasz` — renders, no crash on empty structured sections.
  - `/destinations/rodellar` — renders, no crash.
- [ ] Re-run `pnpm data-import:import` — expect all rows reported as `skipped-existing`. Idempotency check.

### Task 10: Wrap-up

- [ ] Push `dataImport` branch.
- [ ] Open PR to `main`. PR body: link the spec + this plan; list the verification results; note that images and rich profile fields are the content team's next passes.

---

## Decisions carried from the spec (repeat for the executor)

- **Slug policy**: reuse verbatim. Skip-if-exists on collision. Never update, never delete.
- **Image handling**: strip `<img>` from body; count per-row; don't touch old `image_id`.
- **Rich guide fields**: all empty on import (stats, about, coaching, achievements, testimonial, tagline, role, hero-caption, vimeoId).
- **Location `city` / `address`**: empty (old schema didn't have them).
- **Locale**: English only; `ext_translations` not read.
- **`active`**: mirrors old `display`. Retired members/locations imported but unpublished.
- **`content_block` (10 rows)**: NOT imported. Future spec.
- **Production DB**: refuse without `--allow-production`.
- **No automated tests** for the import scripts themselves. Throwaway pipeline; verification is manual.
