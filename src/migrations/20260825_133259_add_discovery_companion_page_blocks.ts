import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_pages_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_pages_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TABLE "pages_blocks_post_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_pages_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
  	"event_id" integer,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_pages_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_partner_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_pages_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_guide_profile" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_pages_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_guide_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
  	"guide_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_pages_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "event_dates_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "pages_blocks_post_grid" ADD CONSTRAINT "pages_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_post_grid" ADD CONSTRAINT "pages_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_calendar" ADD CONSTRAINT "pages_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_calendar" ADD CONSTRAINT "pages_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_partner_strip" ADD CONSTRAINT "pages_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_profile" ADD CONSTRAINT "pages_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_profile" ADD CONSTRAINT "pages_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_trips" ADD CONSTRAINT "pages_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_trips" ADD CONSTRAINT "pages_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_post_grid_order_idx" ON "pages_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_post_grid_parent_id_idx" ON "pages_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_post_grid_path_idx" ON "pages_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_post_grid_category_idx" ON "pages_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "pages_blocks_calendar_order_idx" ON "pages_blocks_calendar" USING btree ("_order");
  CREATE INDEX "pages_blocks_calendar_parent_id_idx" ON "pages_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_calendar_path_idx" ON "pages_blocks_calendar" USING btree ("_path");
  CREATE INDEX "pages_blocks_calendar_event_idx" ON "pages_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "pages_blocks_partner_strip_order_idx" ON "pages_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_partner_strip_parent_id_idx" ON "pages_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_partner_strip_path_idx" ON "pages_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_guide_profile_order_idx" ON "pages_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "pages_blocks_guide_profile_parent_id_idx" ON "pages_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guide_profile_path_idx" ON "pages_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "pages_blocks_guide_profile_guide_idx" ON "pages_blocks_guide_profile" USING btree ("guide_id");
  CREATE INDEX "pages_blocks_guide_trips_order_idx" ON "pages_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "pages_blocks_guide_trips_parent_id_idx" ON "pages_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guide_trips_path_idx" ON "pages_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "pages_blocks_guide_trips_guide_idx" ON "pages_blocks_guide_trips" USING btree ("guide_id");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id");
  CREATE INDEX "pages_rels_event_dates_id_idx" ON "pages_rels" USING btree ("event_dates_id");
  CREATE INDEX "pages_rels_partners_id_idx" ON "pages_rels" USING btree ("partners_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_post_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_partner_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_guide_trips" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_post_grid" CASCADE;
  DROP TABLE "pages_blocks_calendar" CASCADE;
  DROP TABLE "pages_blocks_partner_strip" CASCADE;
  DROP TABLE "pages_blocks_guide_profile" CASCADE;
  DROP TABLE "pages_blocks_guide_trips" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_posts_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_event_dates_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_partners_fk";
  
  DROP INDEX "pages_rels_posts_id_idx";
  DROP INDEX "pages_rels_event_dates_id_idx";
  DROP INDEX "pages_rels_partners_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "posts_id";
  ALTER TABLE "pages_rels" DROP COLUMN "event_dates_id";
  ALTER TABLE "pages_rels" DROP COLUMN "partners_id";
  DROP TYPE "public"."enum_pages_blocks_post_grid_source";
  DROP TYPE "public"."enum_pages_blocks_post_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_calendar_source";
  DROP TYPE "public"."enum_pages_blocks_calendar_variant";
  DROP TYPE "public"."enum_pages_blocks_partner_strip_source";
  DROP TYPE "public"."enum_pages_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_pages_blocks_guide_profile_source";
  DROP TYPE "public"."enum_pages_blocks_guide_profile_variant";
  DROP TYPE "public"."enum_pages_blocks_guide_trips_source";
  DROP TYPE "public"."enum_pages_blocks_guide_trips_variant";`)
}
