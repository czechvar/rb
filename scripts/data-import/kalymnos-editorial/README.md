# Kalymnos occurrence editorial pilot

Classification: temporary local design comparison content. Not canonical seed, not a remote import. Target Event 8 (`sport-climbing`), Event Date 745, 26 September–10 October 2026, capacity 8. Existing imagery and all booking relationships remain unchanged.

`reference.json` is exact text extracted from the supplied HTML, including adjacent heading segments with explicit `accent` and `breakBefore`. No images/CSS/embedded source data are copied. `extract.py [path-to-source.html]` rebuilds it. `node scripts/data-import/kalymnos-editorial/build-manifest.mjs` creates `manifest.json` with the selected occurrence contract and explicit editorial adaptations.

Adaptations: group 5–15 becomes 5–8 to respect actual capacity; meal inclusion is unverified, so both package and food FAQ say “Food arrangements and any included meals are confirmed before departure.” Testimonials remain visibly marked `[Design preview]`, attached only to the occurrence. The original text remains in the reference/provenance. Prices and dates shown by commercial components remain catalogue data.

After the editorial schema migration is applied locally:

```sh
pnpm exec tsx scripts/data-import/kalymnos-editorial/manage.ts dry-run
pnpm exec tsx scripts/data-import/kalymnos-editorial/manage.ts apply
pnpm exec tsx scripts/data-import/kalymnos-editorial/manage.ts check
pnpm exec tsx scripts/data-import/kalymnos-editorial/manage.ts rollback
```

The runner rejects all non-local database hosts before initializing Payload and disables schema push. It uses Payload transactions, suppresses Payload logs, and prints only allowlisted action counts, target IDs and internal stage labels. It does not print runtime errors or configuration values. `apply` requires an empty occurrence editorial layer. The historical `pilot-baseline.json` holds only content and related preview-record preconditions from the previously authorized pilot.

Event 8 restoration is field-by-field for scalar content and whole-array for structured content: only fields still equal to the captured pilot after-state return to the captured before-state. Subsequent edits are skipped and reported. Exact unchanged prior pilot FAQ/review rows are deactivated, not deleted; occurrence arrays replace their visible content. Relationships, images, commercial fields and unrelated rows are never included in the patch. Repeated apply checks its receipt and does not append records.

`.scratch/kalymnos-editorial-745/dry-run.json` is the reviewable plan. `receipt.json` records only touched content fields before/after plus related active flags and provenance. Rollback refuses touched-content conflicts and restores only those fields. If a process stops between writing `pending.json` and finalizing the commit, the runner refuses further action: inspect the local database against that pending receipt to determine commit state, then rename it to `receipt.json` only if the after-state was committed. Never discard a pending receipt blindly.

Guide profile IDs 28 (Sergi Medina) and 30 (Miha Popovic) are from the audited local catalogue; these are presentation overrides for already assigned guides, not relationship changes. A different catalogue requires a fresh identity mapping before application.

## Reviewed manifest revisions

Use `manage.ts refresh-dry-run` to validate a revised manifest against an applied receipt, then `manage.ts refresh` only after reviewing that dry-run. Refresh updates only Date 745's editorial group in a transaction; it preserves the receipt's original `before` snapshot and Event/related-record restoration plan. Previous editorial/provenance is retained in `refreshHistory`. `check` and the final `rollback` continue to use the newest after-state.

The revised manifest uses explicit `{durationDays}`, `{location}`, `{capacity}`, `{coaches}`, `{price}` and `{weeklyPrice}` tokens on overview facts, comparison price headings and the closing booking label. These require the corresponding renderer's controlled interpolation; unresolved tokens must never be shown. Scoped audience/practical text says “up to 8” instead of asserting an unsupported minimum of 5. Original design words remain in `reference.json`.

Historical receipt comparison permits only two removed schema paths to normalize away: `editorial.content.transport.airports` when absent/null/empty, and `editorial.content.itinerary.days[].image` when absent/null. Populated obsolete relationships cause refusal. This narrow normalization does not change the stored original receipt or permit other later edits.
