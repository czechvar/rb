import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
 CREATE TYPE enum_checkouts_state AS ENUM ('unverified','awaitingReview','approved','reserved','cancelled','expired','reconciliation');
 CREATE TYPE enum_checkouts_customer_kind AS ENUM ('new','returning');
 CREATE TYPE enum_checkouts_currency AS ENUM ('EUR','CZK');
 CREATE TYPE enum_checkouts_payment_method AS ENUM ('comgate-card','muzapay');
 CREATE TYPE enum_checkouts_notification_status AS ENUM ('pending','sent','failed','notConfigured');
 CREATE TYPE enum_transactions_purpose AS ENUM ('full','deposit','balance');
 CREATE TABLE checkouts (
  id serial PRIMARY KEY, reference varchar NOT NULL, submission_key varchar NOT NULL, request_digest varchar NOT NULL,
  state enum_checkouts_state NOT NULL, customer_kind enum_checkouts_customer_kind NOT NULL,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  contact_name varchar NOT NULL, contact_email varchar NOT NULL, contact_phone varchar NOT NULL,
  items jsonb NOT NULL, currency enum_checkouts_currency NOT NULL, billing_address jsonb,
  expires_at timestamptz(3), payment_method enum_checkouts_payment_method,
  verification_hash varchar, verification_expires_at timestamptz(3), verified_at timestamptz(3),
  invitation_hash varchar, invitation_expires_at timestamptz(3), invited_at timestamptz(3), approved_at timestamptz(3),
  reviewed_by_id integer REFERENCES users(id) ON DELETE SET NULL, review_note varchar, discount_code varchar, referral_code varchar,
  notification_status enum_checkouts_notification_status DEFAULT 'pending', reconciliation_reason varchar,
  updated_at timestamptz(3) DEFAULT now() NOT NULL, created_at timestamptz(3) DEFAULT now() NOT NULL
 );
 CREATE UNIQUE INDEX checkouts_reference_idx ON checkouts(reference);
 CREATE UNIQUE INDEX checkouts_submission_key_idx ON checkouts(submission_key);
 CREATE INDEX checkouts_state_idx ON checkouts(state);
 CREATE INDEX checkouts_user_idx ON checkouts(user_id);
 CREATE INDEX checkouts_expires_at_idx ON checkouts(expires_at);
 CREATE INDEX checkouts_verification_hash_idx ON checkouts(verification_hash);
 CREATE INDEX checkouts_updated_at_idx ON checkouts(updated_at);
 CREATE INDEX checkouts_created_at_idx ON checkouts(created_at);
 ALTER TABLE orders ADD COLUMN checkout_id integer REFERENCES checkouts(id) ON DELETE SET NULL;
 CREATE INDEX orders_checkout_idx ON orders(checkout_id);
 ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL,
 ALTER COLUMN billing_address_first_name DROP NOT NULL, ALTER COLUMN billing_address_last_name DROP NOT NULL,
 ALTER COLUMN billing_address_street DROP NOT NULL, ALTER COLUMN billing_address_city DROP NOT NULL,
 ALTER COLUMN billing_address_postal_code DROP NOT NULL, ALTER COLUMN billing_address_country DROP NOT NULL;
 ALTER TABLE orders_participants ALTER COLUMN first_name DROP NOT NULL, ALTER COLUMN last_name DROP NOT NULL, ALTER COLUMN phone DROP NOT NULL;
 ALTER TABLE transactions ALTER COLUMN order_id DROP NOT NULL,
 ADD COLUMN checkout_id integer REFERENCES checkouts(id) ON DELETE SET NULL,
 ADD COLUMN refunds jsonb, ADD COLUMN amount_minor numeric, ADD COLUMN allocations jsonb, ADD COLUMN purpose enum_transactions_purpose,
 ADD COLUMN settled_at timestamptz(3), ADD COLUMN reconciliation_reason varchar,
 ADD COLUMN cancel_attempts numeric DEFAULT 0, ADD COLUMN last_cancel_attempt_at timestamptz(3);
 CREATE INDEX transactions_checkout_idx ON transactions(checkout_id);
 ALTER TABLE payload_locked_documents_rels ADD COLUMN checkouts_id integer REFERENCES checkouts(id) ON DELETE CASCADE;
 CREATE INDEX payload_locked_documents_rels_checkouts_id_idx ON payload_locked_documents_rels(checkouts_id);
 `)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Never discard operational reservations or allocated payment history during rollback.
  await db.execute(
    sql`DO $$ BEGIN IF EXISTS (SELECT 1 FROM checkouts) THEN RAISE EXCEPTION 'Checkout data exists; rollback requires explicit reconciliation'; END IF; END $$;`,
  )
  await db.execute(sql`
 ALTER TABLE payload_locked_documents_rels DROP COLUMN checkouts_id;
 ALTER TABLE transactions DROP COLUMN checkout_id, DROP COLUMN refunds, DROP COLUMN amount_minor, DROP COLUMN allocations, DROP COLUMN purpose,
 DROP COLUMN settled_at, DROP COLUMN reconciliation_reason, DROP COLUMN cancel_attempts, DROP COLUMN last_cancel_attempt_at;
 ALTER TABLE transactions ALTER COLUMN order_id SET NOT NULL;
 ALTER TABLE orders DROP COLUMN checkout_id;
 ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL,
 ALTER COLUMN billing_address_first_name SET NOT NULL, ALTER COLUMN billing_address_last_name SET NOT NULL,
 ALTER COLUMN billing_address_street SET NOT NULL, ALTER COLUMN billing_address_city SET NOT NULL,
 ALTER COLUMN billing_address_postal_code SET NOT NULL, ALTER COLUMN billing_address_country SET NOT NULL;
 ALTER TABLE orders_participants ALTER COLUMN first_name SET NOT NULL, ALTER COLUMN last_name SET NOT NULL, ALTER COLUMN phone SET NOT NULL;
 DROP TABLE checkouts;
 DROP TYPE enum_transactions_purpose, enum_checkouts_state, enum_checkouts_customer_kind, enum_checkouts_currency, enum_checkouts_payment_method, enum_checkouts_notification_status;
 `)
}
