import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "locations_blocks_destination_sidebar" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "include_cta" boolean DEFAULT true,
    "include_quick_facts" boolean DEFAULT true,
    "include_accommodation_links" boolean DEFAULT true,
    "include_resources" boolean DEFAULT true,
    "include_emergency_contacts" boolean DEFAULT true,
    "block_name" varchar
  );

  ALTER TABLE "locations_blocks_destination_sidebar" ADD CONSTRAINT "locations_blocks_destination_sidebar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_blocks_destination_sidebar_order_idx" ON "locations_blocks_destination_sidebar" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_sidebar_parent_id_idx" ON "locations_blocks_destination_sidebar" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_sidebar_path_idx" ON "locations_blocks_destination_sidebar" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "locations_blocks_destination_sidebar" CASCADE;`)
}
