import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "demo_enabled" boolean DEFAULT false;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "demo_heading" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "demo_body" jsonb;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "demo_cta_label" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "demo_cta_url" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_cta_url";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_cta_label";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_body";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_heading";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_enabled";
  `)
}
