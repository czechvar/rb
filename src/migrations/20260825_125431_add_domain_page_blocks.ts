import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_program_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_location_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_guide_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TABLE "pages_blocks_program_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_pages_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_location_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
  	"country" varchar,
  	"limit" numeric DEFAULT 8,
  	"variant" "enum_pages_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_guide_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_pages_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_pages_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "pages_blocks_program_grid" ADD CONSTRAINT "pages_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_location_grid" ADD CONSTRAINT "pages_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_grid" ADD CONSTRAINT "pages_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_review_grid" ADD CONSTRAINT "pages_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_review_grid" ADD CONSTRAINT "pages_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_review_grid" ADD CONSTRAINT "pages_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_program_grid_order_idx" ON "pages_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_program_grid_parent_id_idx" ON "pages_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_program_grid_path_idx" ON "pages_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_location_grid_order_idx" ON "pages_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_location_grid_parent_id_idx" ON "pages_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_location_grid_path_idx" ON "pages_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_guide_grid_order_idx" ON "pages_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_guide_grid_parent_id_idx" ON "pages_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guide_grid_path_idx" ON "pages_blocks_guide_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_review_grid_order_idx" ON "pages_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_review_grid_parent_id_idx" ON "pages_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_review_grid_path_idx" ON "pages_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_review_grid_event_idx" ON "pages_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "pages_blocks_review_grid_program_idx" ON "pages_blocks_review_grid" USING btree ("program_id");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_programs_id_idx" ON "pages_rels" USING btree ("programs_id");
  CREATE INDEX "pages_rels_locations_id_idx" ON "pages_rels" USING btree ("locations_id");
  CREATE INDEX "pages_rels_guides_id_idx" ON "pages_rels" USING btree ("guides_id");
  CREATE INDEX "pages_rels_reviews_id_idx" ON "pages_rels" USING btree ("reviews_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_program_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_location_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_guide_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_review_grid" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_program_grid" CASCADE;
  DROP TABLE "pages_blocks_location_grid" CASCADE;
  DROP TABLE "pages_blocks_guide_grid" CASCADE;
  DROP TABLE "pages_blocks_review_grid" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_programs_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_locations_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_guides_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_reviews_fk";
  
  DROP INDEX "pages_rels_programs_id_idx";
  DROP INDEX "pages_rels_locations_id_idx";
  DROP INDEX "pages_rels_guides_id_idx";
  DROP INDEX "pages_rels_reviews_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "programs_id";
  ALTER TABLE "pages_rels" DROP COLUMN "locations_id";
  ALTER TABLE "pages_rels" DROP COLUMN "guides_id";
  ALTER TABLE "pages_rels" DROP COLUMN "reviews_id";
  DROP TYPE "public"."enum_pages_blocks_program_grid_source";
  DROP TYPE "public"."enum_pages_blocks_program_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_location_grid_source";
  DROP TYPE "public"."enum_pages_blocks_location_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_guide_grid_source";
  DROP TYPE "public"."enum_pages_blocks_guide_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_review_grid_source";
  DROP TYPE "public"."enum_pages_blocks_review_grid_variant";`)
}
