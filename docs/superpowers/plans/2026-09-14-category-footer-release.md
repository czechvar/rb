# Category and footer release

Scope since live `af9750d`: trip navigation correction (`360f14a`), eight authored
trip categories, approved assignments on 60 Events (five held unchanged), exact
footer grouping and filtered links, and valid empty-category results.

Review:
- Spec review: no blockers; checked all mappings, definitions, held records,
  publication states, seed scope, footer labels and empty filters.
- Standards review: corrected a seed-ID portability issue. Category imports now
  retain canonical IDs by slug and preserve unrelated rows. Regression coverage
  uses differing local IDs and a numeric collision. Final read-back found no
  further issues.

Validation: TypeScript and scoped lint pass. Unit/component suite and live browser
checks are recorded in the release report under `.scratch/release-20260914/`.

Production delivery uses an archive-validated backup followed by one narrow SQL
transaction: upsert category definitions by slug; resolve Event/category IDs in the
production database; replace only approved Event category relations; correct five
CMS browse-action hrefs. Hold records, publication states, Event Dates and protected
operational tables are checked before committing. No schema replacement or seed
reset is needed. Purge the project cache and deploy the reviewed commit, then check
all eight filters and the production alias.

Checkout enablement is preserved. Existing email/payment setup limitations and
missing global FAQ/Terms pages remain outside this release.
