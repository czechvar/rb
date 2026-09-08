import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the CZK price fields used by the Benefit+ (MuzaPay) gateway, plus the
 * human order reference sent to gateways that accept one.
 *
 * The generator also emitted statements for `locations_content_sections` and
 * `pages.structured_data_schema_type`. Those belong to the two migrations
 * dated 20260901 that precede this one, and are applied there — they were
 * regenerated here only because 20260901_190820 shipped without its Drizzle
 * `.json` snapshot, leaving the diff baseline stale. They are removed from
 * these statements so the changes are not applied twice; this migration's own
 * snapshot is complete, which restores the baseline for future migrations.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "event_dates" ADD COLUMN "price_czk" numeric;
  ALTER TABLE "orders" ADD COLUMN "unit_price_czk" numeric;
  ALTER TABLE "orders" ADD COLUMN "total_price_czk" numeric;
  ALTER TABLE "transactions" ADD COLUMN "order_reference" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "event_dates" DROP COLUMN "price_czk";
  ALTER TABLE "orders" DROP COLUMN "unit_price_czk";
  ALTER TABLE "orders" DROP COLUMN "total_price_czk";
  ALTER TABLE "transactions" DROP COLUMN "order_reference";`)
}
