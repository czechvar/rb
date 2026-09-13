# Contact intake verification

Run `pnpm test:contact:intake` with a localhost `DATABASE_URL` configured in `.env`.
The runner creates a new random disposable database, applies migrations, tests the
real Payload/Postgres intake boundary, and drops that database afterward. It never
resets the configured database, exports content, or sends real messages.
Notification checks use only the in-memory test adapter and a failing fake;
the runner clears the provider key and recipient override for its child. The database
role needs permission to create/drop its temporary database.

Fixtures are temporary: `[Contact test]` names, `example.invalid` addresses, and
random submission IDs. Checks cover private access, persisted and concurrent
idempotency, changed-payload rejection, atomic network/email/global limits, expiry,
bounded bucket growth, validation, and failure when rate storage is unavailable.
Notification checks verify one message per new save, CMS recipient selection,
no duplicate resend, durable failure status, and no console-adapter disclosure.
The rate table is registered through the Postgres adapter schema hook so schema
push recognises it, while remaining outside the CMS collections. The checks verify
that registration. The content seed excludes enquiries and rate buckets.

Only named check outcomes are printed. A safe verification summary is written to
`.scratch/contact-delivery/intake-verification.json`. A cleanup failure is reported
explicitly; do not treat such a run as successful. The schema migration is separate
from the public Contact Page seed and from any future CRM distribution.
