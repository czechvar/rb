import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "catalogue_card_title" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "catalogue_card_description" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "catalogue_card_title";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "catalogue_card_description";
  `)
}
