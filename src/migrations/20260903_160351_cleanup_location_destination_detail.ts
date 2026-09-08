import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "locations_content_sections" CASCADE;
  ALTER TABLE "locations" DROP COLUMN "content";
  ALTER TABLE "locations" DROP COLUMN "season_summary";
  ALTER TABLE "locations" DROP COLUMN "transport_summary";
  ALTER TABLE "locations" DROP COLUMN "accommodation_summary";
  DROP TYPE "public"."enum_locations_content_sections_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_locations_content_sections_status" AS ENUM('enriched', 'mixed', 'legacy', 'missing', 'not-applicable');
  CREATE TABLE "locations_content_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "heading" varchar NOT NULL,
    "status" "enum_locations_content_sections_status" NOT NULL,
    "body" varchar,
    "source_refs" jsonb,
    "warnings" jsonb
  );

  ALTER TABLE "locations" ADD COLUMN "content" jsonb;
  ALTER TABLE "locations" ADD COLUMN "season_summary" varchar;
  ALTER TABLE "locations" ADD COLUMN "transport_summary" varchar;
  ALTER TABLE "locations" ADD COLUMN "accommodation_summary" varchar;
  ALTER TABLE "locations_content_sections" ADD CONSTRAINT "locations_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_content_sections_order_idx" ON "locations_content_sections" USING btree ("_order");
  CREATE INDEX "locations_content_sections_parent_id_idx" ON "locations_content_sections" USING btree ("_parent_id");`)
}
