import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_blocks_trip_content" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "events_blocks_trip_team" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "events_blocks_trip_dates" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "events_blocks_trip_logistics" ADD COLUMN "eyebrow" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_blocks_trip_content" DROP COLUMN "eyebrow";
  ALTER TABLE "events_blocks_trip_team" DROP COLUMN "eyebrow";
  ALTER TABLE "events_blocks_trip_dates" DROP COLUMN "eyebrow";
  ALTER TABLE "events_blocks_trip_logistics" DROP COLUMN "eyebrow";`)
}
