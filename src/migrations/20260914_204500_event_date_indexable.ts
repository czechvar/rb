import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "event_dates" ADD COLUMN "indexable" boolean DEFAULT true;
    UPDATE "event_dates" SET "indexable" = true WHERE "indexable" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "event_dates" DROP COLUMN "indexable";`)
}
