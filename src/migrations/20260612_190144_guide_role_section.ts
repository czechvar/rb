import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_section" AS ENUM('team', 'friends');
  ALTER TABLE "guides" ADD COLUMN "role" varchar;
  ALTER TABLE "guides" ADD COLUMN "section" "enum_guides_section" DEFAULT 'team' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" DROP COLUMN "role";
  ALTER TABLE "guides" DROP COLUMN "section";
  DROP TYPE "public"."enum_guides_section";`)
}
