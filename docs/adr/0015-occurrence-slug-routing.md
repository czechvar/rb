# ADR-0015: Stable occurrence slugs and parent departure selection

- Status: Accepted
- Date: 2026-09-14
- Owners: Engineering

Superseded for canonical public identity by
[ADR-0016](0016-trip-variants-and-dated-query-leaves.md). Exact occurrence
selection, alias preservation, and booking-safety decisions remain applicable.

## Context

Distinct Event Date editorial content currently shares a parent trip route with
numeric query selection and automatic upcoming-date fallback. The user approved
location-and-date public slugs and parent redirection because the parent does not
yet have sufficient evergreen content. The rebuilt site is not live or indexed.

## Decision

Use `/trips/{eventSlug}/{occurrenceSlug}`, with a stored occurrence slug initially
derived from location and start date. Enforce uniqueness within the parent Event.
Keep numeric primary keys and commerce relationships. Venue/date edits do not
silently rename URLs; deliberate published path changes require preserved aliases.
Canonical seed export/import preserves public slugs across numeric ID remapping.

The parent route temporarily redirects to its earliest upcoming bookable departure.
With none available, render a noindex availability/enquiry page with useful public
departure links. Omit parent selection routes from the sitemap. Temporary redirects
do not guarantee search-engine exclusion of the source; strict exclusion is not a
pre-launch acceptance requirement.

Explicit occurrence routes always resolve that public occurrence or return 404.
Past and sold-out occurrences retain identity and useful content with booking
disabled as appropriate. Eligible substantive occurrence pages self-canonicalize
and enter the sitemap; preview indexing protections remain unchanged.

Event Dates carry an editorial `indexable` switch that defaults to enabled.
Editors disable it when an occurrence page is thin or substantially duplicates
another page; disabled occurrences remain publicly renderable with `noindex` but
are omitted from the sitemap.

The canonical seed can contain historical records whose parent, location/context
and date range do not establish a unique customer-facing identity. Until an editor
can choose a meaningful qualifier or approve a data correction, those records use
a stable provenance quarantine suffix (`legacy-record-{sourceId}`) and
`indexable: false`. This suffix is an operational identity for lossless seeding,
not an accepted public slug or evidence that the ambiguity is resolved. Active
quarantined records remain reachable but are omitted from the sitemap.

This supersedes only ADR-0010's implicit selection and fallback behaviour for
public trip routing. Its layout, content ownership and live availability decisions
remain accepted. ADR-0011's Date-over-Event editorial merge remains in force, now
applied to the explicitly addressed occurrence. This also replaces the earlier
Workstreams proposal for indexable evergreen parents and numeric query canonicals.

## Alternatives Considered

- Indexable evergreen parent: deferred until sufficient parent content exists.
- Numeric public query identifiers: replaced with readable, seed-portable slugs.
- Permanent parent-to-next-date redirect: rejected because the destination changes.
- Automatic slug regeneration after date/venue edits: rejected to preserve identity.
- Full compatibility migration for unlaunched query URLs: unnecessary; a small
  adapter may be retained while internal links are updated.

## Consequences

CMS validation, migrations, public queries, metadata, links, sitemap and canonical
seed must agree on the new identity. Missing/multiple locations and collisions
require editorial resolution. The offline backfill must report the quarantined
record, its semantic collision siblings and active state so the outstanding set
is actionable. Legacy live-site mappings can point directly to
matching occurrences once verified; they remain a separate migration task.

## References

- [Implementation plan](../superpowers/plans/2026-09-14-occurrence-slug-routing.md)
- [ADR-0010](0010-trip-layout-variants-and-occurrence-context.md)
- [ADR-0011](0011-trip-editorial-occurrence-overrides.md)
- [ADR-0012](0012-canonical-content-seed.md)
