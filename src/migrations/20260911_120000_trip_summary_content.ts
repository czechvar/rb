import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "events" ADD COLUMN "trip_detail_location_descriptor" varchar;
ALTER TABLE "events" ADD COLUMN "trip_detail_grade_range" varchar;
ALTER TABLE "events" ADD COLUMN "trip_detail_lead_requirement" varchar;
ALTER TABLE "events" ADD COLUMN "trip_detail_minimum_participants" numeric;
ALTER TABLE "events" ADD COLUMN "trip_detail_price_caption" varchar;
ALTER TABLE "events" ADD COLUMN "trip_detail_travel_note" varchar;
ALTER TABLE "events" ADD COLUMN "trip_detail_hashtag" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN "trip_detail_location_descriptor";
ALTER TABLE "events" DROP COLUMN "trip_detail_grade_range";
ALTER TABLE "events" DROP COLUMN "trip_detail_lead_requirement";
ALTER TABLE "events" DROP COLUMN "trip_detail_minimum_participants";
ALTER TABLE "events" DROP COLUMN "trip_detail_price_caption";
ALTER TABLE "events" DROP COLUMN "trip_detail_travel_note";
ALTER TABLE "events" DROP COLUMN "trip_detail_hashtag";`)
}
