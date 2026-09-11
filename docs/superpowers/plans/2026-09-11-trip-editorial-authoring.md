# Editing trip section copy

Kalymnos pilot: `/admin/collections/event-dates/745` → **Trip editorial copy**.
Shared defaults: the parent Event → **Trip editorial copy**. Leave Event Date overrides empty to inherit those defaults. Editing this group does not replace the page layout.

## Headings and introductions

In **Sections**, add a single row for the relevant section key (for example `gallery` or `audience`). Set its eyebrow, heading and introduction. Use **Heading parts** when color accents or line breaks are needed; these take precedence over the plain heading in that row.

Each part has **Text**, **Accent**, and **Break before**. Parts join exactly: include spaces where needed. For example `Rock` + accented `busters` colors only the second part of the same word. Kalymnos gallery uses `Tufas, Pockets`, then a line break before `& `, then accented `Pure Grit`. The theme defines the accent color.

Blank fields inherit. Use **Clear inherited heading/eyebrow/intro** to deliberately remove that text. Section visibility offers **inherit**, **show**, and **hide**. Delete an override row to return to inherited section copy. A saved custom layout's supplied text takes precedence; its structure remains intact.

## Structured copy

The same editorial group contains daily schedule rows, overview facts, venue paragraphs/facts, practical cards, package items/note, FAQ entries, and guide profile copy. The **Content** subgroup reuses existing trip content fields for occurrence-specific stories, audience cards, learning pillars and comparisons. **Clear content fields** deliberately suppresses inherited source fields in this view; it does not delete the parent record's content.

Hero title parts, description, hashtag and button labels are under **Hero**. The secondary button can target the programme or dates page. Closing button labels/support are under **Booking**. Inquiry behavior still takes precedence when booking is unavailable.

Prominent commercial text uses explicit placeholders in overview fact values/descriptions, comparison column headings, and the closing primary button label: `{price}`, `{weeklyPrice}`, `{durationDays}`, `{capacity}`, `{location}`, `{coaches}`. These resolve from the selected occurrence. For example `Book Now — {price}`. A weekly price requires an actual matching one-week occurrence; otherwise it says Enquire. These placeholders are supported in those fields only, not arbitrary prose/headings.

Design preview testimonials are visibly marked and remain unverified local demo content. Do not publish them as approved customer reviews. The pilot preserves existing imagery and commercial relationships; changing editorial text does not change booking data.

## Current delivery boundary

Only Date745 has reference-rich content. The one-week Kalymnos and other destinations retain their own inherited copy. No production deployment or canonical seed promotion is included. Import/check/rollback instructions and source provenance are in `scripts/data-import/kalymnos-editorial/README.md`.
