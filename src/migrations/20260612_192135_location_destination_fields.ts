import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "locations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "locations" ADD COLUMN "main_picture_id" integer;
  ALTER TABLE "locations" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_rels_order_idx" ON "locations_rels" USING btree ("order");
  CREATE INDEX "locations_rels_parent_idx" ON "locations_rels" USING btree ("parent_id");
  CREATE INDEX "locations_rels_path_idx" ON "locations_rels" USING btree ("path");
  CREATE INDEX "locations_rels_media_id_idx" ON "locations_rels" USING btree ("media_id");
  ALTER TABLE "locations" ADD CONSTRAINT "locations_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "locations_main_picture_idx" ON "locations" USING btree ("main_picture_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "locations_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "locations_rels" CASCADE;
  ALTER TABLE "locations" DROP CONSTRAINT "locations_main_picture_id_media_id_fk";
  
  DROP INDEX "locations_main_picture_idx";
  ALTER TABLE "locations" DROP COLUMN "main_picture_id";
  ALTER TABLE "locations" DROP COLUMN "featured";`)
}
