import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_locations_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_locations_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial');
  CREATE TYPE "public"."enum_locations_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  CREATE TYPE "public"."enum_locations_blocks_video_variant" AS ENUM('wide', 'contained');
  CREATE TYPE "public"."enum_locations_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_locations_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_locations_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_guide_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_locations_blocks_cta_variant" AS ENUM('dark', 'light', 'red');
  CREATE TABLE "locations_blocks_location_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_location_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'The Venue',
  	"eyebrow" varchar DEFAULT 'Destination',
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_location_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Where it is',
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_location_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_trip_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Trips',
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"source" "enum_locations_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
  	"program_id" integer,
  	"location_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_locations_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
  	"event_id" integer,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_locations_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"variant" "enum_locations_blocks_gallery_variant" DEFAULT 'grid' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"video_url" varchar NOT NULL,
  	"caption" varchar,
  	"variant" "enum_locations_blocks_video_variant" DEFAULT 'wide' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "locations_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Quick answers',
  	"heading" varchar DEFAULT 'FAQ' NOT NULL,
  	"source" "enum_locations_blocks_faq_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_locations_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_locations_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_guide_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_locations_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_partner_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_locations_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"variant" "enum_locations_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "locations_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "event_dates_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "locations_blocks_location_hero" ADD CONSTRAINT "locations_blocks_location_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_location_content" ADD CONSTRAINT "locations_blocks_location_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_location_map" ADD CONSTRAINT "locations_blocks_location_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_location_trips" ADD CONSTRAINT "locations_blocks_location_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_trip_grid" ADD CONSTRAINT "locations_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_trip_grid" ADD CONSTRAINT "locations_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_trip_grid" ADD CONSTRAINT "locations_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_calendar" ADD CONSTRAINT "locations_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_calendar" ADD CONSTRAINT "locations_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_gallery" ADD CONSTRAINT "locations_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_video" ADD CONSTRAINT "locations_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_faq_items" ADD CONSTRAINT "locations_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_faq" ADD CONSTRAINT "locations_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_faq" ADD CONSTRAINT "locations_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_faq" ADD CONSTRAINT "locations_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_review_grid" ADD CONSTRAINT "locations_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_review_grid" ADD CONSTRAINT "locations_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_review_grid" ADD CONSTRAINT "locations_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_guide_grid" ADD CONSTRAINT "locations_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_partner_strip" ADD CONSTRAINT "locations_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_cta" ADD CONSTRAINT "locations_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_blocks_location_hero_order_idx" ON "locations_blocks_location_hero" USING btree ("_order");
  CREATE INDEX "locations_blocks_location_hero_parent_id_idx" ON "locations_blocks_location_hero" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_location_hero_path_idx" ON "locations_blocks_location_hero" USING btree ("_path");
  CREATE INDEX "locations_blocks_location_content_order_idx" ON "locations_blocks_location_content" USING btree ("_order");
  CREATE INDEX "locations_blocks_location_content_parent_id_idx" ON "locations_blocks_location_content" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_location_content_path_idx" ON "locations_blocks_location_content" USING btree ("_path");
  CREATE INDEX "locations_blocks_location_map_order_idx" ON "locations_blocks_location_map" USING btree ("_order");
  CREATE INDEX "locations_blocks_location_map_parent_id_idx" ON "locations_blocks_location_map" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_location_map_path_idx" ON "locations_blocks_location_map" USING btree ("_path");
  CREATE INDEX "locations_blocks_location_trips_order_idx" ON "locations_blocks_location_trips" USING btree ("_order");
  CREATE INDEX "locations_blocks_location_trips_parent_id_idx" ON "locations_blocks_location_trips" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_location_trips_path_idx" ON "locations_blocks_location_trips" USING btree ("_path");
  CREATE INDEX "locations_blocks_trip_grid_order_idx" ON "locations_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_trip_grid_parent_id_idx" ON "locations_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_trip_grid_path_idx" ON "locations_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_trip_grid_program_idx" ON "locations_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "locations_blocks_trip_grid_location_idx" ON "locations_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "locations_blocks_calendar_order_idx" ON "locations_blocks_calendar" USING btree ("_order");
  CREATE INDEX "locations_blocks_calendar_parent_id_idx" ON "locations_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_calendar_path_idx" ON "locations_blocks_calendar" USING btree ("_path");
  CREATE INDEX "locations_blocks_calendar_event_idx" ON "locations_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "locations_blocks_gallery_order_idx" ON "locations_blocks_gallery" USING btree ("_order");
  CREATE INDEX "locations_blocks_gallery_parent_id_idx" ON "locations_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_gallery_path_idx" ON "locations_blocks_gallery" USING btree ("_path");
  CREATE INDEX "locations_blocks_video_order_idx" ON "locations_blocks_video" USING btree ("_order");
  CREATE INDEX "locations_blocks_video_parent_id_idx" ON "locations_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_video_path_idx" ON "locations_blocks_video" USING btree ("_path");
  CREATE INDEX "locations_blocks_faq_items_order_idx" ON "locations_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "locations_blocks_faq_items_parent_id_idx" ON "locations_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_faq_order_idx" ON "locations_blocks_faq" USING btree ("_order");
  CREATE INDEX "locations_blocks_faq_parent_id_idx" ON "locations_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_faq_path_idx" ON "locations_blocks_faq" USING btree ("_path");
  CREATE INDEX "locations_blocks_faq_event_idx" ON "locations_blocks_faq" USING btree ("event_id");
  CREATE INDEX "locations_blocks_faq_program_idx" ON "locations_blocks_faq" USING btree ("program_id");
  CREATE INDEX "locations_blocks_review_grid_order_idx" ON "locations_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_review_grid_parent_id_idx" ON "locations_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_review_grid_path_idx" ON "locations_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_review_grid_event_idx" ON "locations_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "locations_blocks_review_grid_program_idx" ON "locations_blocks_review_grid" USING btree ("program_id");
  CREATE INDEX "locations_blocks_guide_grid_order_idx" ON "locations_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_guide_grid_parent_id_idx" ON "locations_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_guide_grid_path_idx" ON "locations_blocks_guide_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_partner_strip_order_idx" ON "locations_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "locations_blocks_partner_strip_parent_id_idx" ON "locations_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_partner_strip_path_idx" ON "locations_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "locations_blocks_cta_order_idx" ON "locations_blocks_cta" USING btree ("_order");
  CREATE INDEX "locations_blocks_cta_parent_id_idx" ON "locations_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_cta_path_idx" ON "locations_blocks_cta" USING btree ("_path");
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_rels_events_id_idx" ON "locations_rels" USING btree ("events_id");
  CREATE INDEX "locations_rels_event_dates_id_idx" ON "locations_rels" USING btree ("event_dates_id");
  CREATE INDEX "locations_rels_faqs_id_idx" ON "locations_rels" USING btree ("faqs_id");
  CREATE INDEX "locations_rels_reviews_id_idx" ON "locations_rels" USING btree ("reviews_id");
  CREATE INDEX "locations_rels_guides_id_idx" ON "locations_rels" USING btree ("guides_id");
  CREATE INDEX "locations_rels_partners_id_idx" ON "locations_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "locations_blocks_location_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_location_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_location_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_location_trips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_trip_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_review_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_guide_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_partner_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_cta" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "locations_blocks_location_hero" CASCADE;
  DROP TABLE "locations_blocks_location_content" CASCADE;
  DROP TABLE "locations_blocks_location_map" CASCADE;
  DROP TABLE "locations_blocks_location_trips" CASCADE;
  DROP TABLE "locations_blocks_trip_grid" CASCADE;
  DROP TABLE "locations_blocks_calendar" CASCADE;
  DROP TABLE "locations_blocks_gallery" CASCADE;
  DROP TABLE "locations_blocks_video" CASCADE;
  DROP TABLE "locations_blocks_faq_items" CASCADE;
  DROP TABLE "locations_blocks_faq" CASCADE;
  DROP TABLE "locations_blocks_review_grid" CASCADE;
  DROP TABLE "locations_blocks_guide_grid" CASCADE;
  DROP TABLE "locations_blocks_partner_strip" CASCADE;
  DROP TABLE "locations_blocks_cta" CASCADE;
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_events_fk";
  
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_event_dates_fk";
  
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_faqs_fk";
  
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_reviews_fk";
  
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_guides_fk";
  
  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_partners_fk";
  
  DROP INDEX "locations_rels_events_id_idx";
  DROP INDEX "locations_rels_event_dates_id_idx";
  DROP INDEX "locations_rels_faqs_id_idx";
  DROP INDEX "locations_rels_reviews_id_idx";
  DROP INDEX "locations_rels_guides_id_idx";
  DROP INDEX "locations_rels_partners_id_idx";
  ALTER TABLE "locations_rels" DROP COLUMN "events_id";
  ALTER TABLE "locations_rels" DROP COLUMN "event_dates_id";
  ALTER TABLE "locations_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "locations_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "locations_rels" DROP COLUMN "guides_id";
  ALTER TABLE "locations_rels" DROP COLUMN "partners_id";
  DROP TYPE "public"."enum_locations_blocks_trip_grid_source";
  DROP TYPE "public"."enum_locations_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_calendar_source";
  DROP TYPE "public"."enum_locations_blocks_calendar_variant";
  DROP TYPE "public"."enum_locations_blocks_gallery_variant";
  DROP TYPE "public"."enum_locations_blocks_video_variant";
  DROP TYPE "public"."enum_locations_blocks_faq_source";
  DROP TYPE "public"."enum_locations_blocks_faq_variant";
  DROP TYPE "public"."enum_locations_blocks_review_grid_source";
  DROP TYPE "public"."enum_locations_blocks_review_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_guide_grid_source";
  DROP TYPE "public"."enum_locations_blocks_guide_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_partner_strip_source";
  DROP TYPE "public"."enum_locations_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_locations_blocks_cta_variant";`)
}
