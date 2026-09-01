import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_structured_data_schema_type" AS ENUM('WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'FAQPage');
  ALTER TABLE "pages" ADD COLUMN "structured_data_schema_type" "enum_pages_structured_data_schema_type" DEFAULT 'WebPage';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "structured_data_schema_type";
  DROP TYPE "public"."enum_pages_structured_data_schema_type";`)
}
