# Canonical content seed consolidation

Status: complete

User request: one seed approach containing current trip data before a full SQL dump.
Scope: all configured public CMS content, including 26 reviewed enriched occurrences.
Classification: persistent canonical seed content. Verification databases are temporary
fixtures, created with unique markers and dropped by the verification runner.

- [x] Check source target is local and non-production; disable schema push during export.
- [x] Export current catalogue into the existing canonical snapshot.
- [x] Verify all 26 occurrence manifests are represented with the correct parent Event.
- [x] Make historical importers provenance/maintenance tools, not fresh bootstrap steps.
- [x] Document content scope and separate operational DB/media binary backups (ADR-0012).
- [x] Remap internal companion-link occurrence IDs after importing all occurrences.
- [x] Rebuild a fresh disposable database using migrations plus the single seed.
- [x] Verify every exported content record and relationship after ID remapping.
- [x] Run the seed again and verify idempotence.
- [x] Confirm temporary database cleanup and final review/type checks.

The source database is read-only for this task. No production deployment or SQL dump
is part of this change. Existing unrelated working-tree changes remain preserved.

## Review

Standards review: no blocking findings; add independent relationship checks where
possible because the full snapshot verifier shares the importer's remapper.
Spec review: found 23 internal companion links containing source occurrence IDs.
Fixed with a final pass after the complete occurrence map exists and explicit tests
using a different target ID. Fresh-environment verification must exercise shifted IDs.

## Verification evidence

- Source target matches local configuration; localhost confirmed, production false.
- Full shifted-ID rebuild: 15 collections, 11,446 records, 26 enriched occurrences;
  exact content and mapped relationships passed on the first import.
- Reduced diagnostic: both imports passed for 2,431 records, including all trip,
  occurrence, location and guide records plus all 43 referenced airports.
- 224 automated tests passed; TypeScript, scoped ESLint and whitespace checks passed.
- Review also exposed missing plural taxonomy/coach mappings and three duplicate
  occurrence fingerprint groups. Corrected with independent identity regressions.

Final full run exited successfully: both passes matched all 11,446 records, 15
collections and 26 enriched occurrences. The verifier proved one-to-one identity
mapping and checked occurrence links independently. The uniquely created database
was cleaned up. The source database was not modified. Standards and specification
reviews have no remaining blocking findings.
