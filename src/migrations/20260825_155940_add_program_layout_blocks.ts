import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_programs_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_programs_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial');
  CREATE TYPE "public"."enum_programs_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_programs_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  CREATE TYPE "public"."enum_programs_blocks_video_variant" AS ENUM('wide', 'contained');
  CREATE TYPE "public"."enum_programs_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_programs_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_programs_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_programs_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_guide_grid_variant" AS ENUM('cards', 'compact');
  CREATE TABLE "programs_blocks_program_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Program Highlights',
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_audience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_curriculum" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_flow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_weeks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_logistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_coaches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Upcoming Dates',
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_program_c_t_a" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_trip_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Trips',
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"source" "enum_programs_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
  	"program_id" integer,
  	"location_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_programs_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
  	"event_id" integer,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_programs_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"variant" "enum_programs_blocks_gallery_variant" DEFAULT 'grid' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"video_url" varchar NOT NULL,
  	"caption" varchar,
  	"variant" "enum_programs_blocks_video_variant" DEFAULT 'wide' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "programs_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Quick answers',
  	"heading" varchar DEFAULT 'FAQ' NOT NULL,
  	"source" "enum_programs_blocks_faq_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_programs_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_programs_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_guide_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_programs_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "programs_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "event_dates_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "programs_blocks_program_hero" ADD CONSTRAINT "programs_blocks_program_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_highlights" ADD CONSTRAINT "programs_blocks_program_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_audience" ADD CONSTRAINT "programs_blocks_program_audience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_curriculum" ADD CONSTRAINT "programs_blocks_program_curriculum_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_flow" ADD CONSTRAINT "programs_blocks_program_flow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_weeks" ADD CONSTRAINT "programs_blocks_program_weeks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_logistics" ADD CONSTRAINT "programs_blocks_program_logistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_coaches" ADD CONSTRAINT "programs_blocks_program_coaches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_results" ADD CONSTRAINT "programs_blocks_program_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_trips" ADD CONSTRAINT "programs_blocks_program_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_c_t_a" ADD CONSTRAINT "programs_blocks_program_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_trip_grid" ADD CONSTRAINT "programs_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_trip_grid" ADD CONSTRAINT "programs_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_trip_grid" ADD CONSTRAINT "programs_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_calendar" ADD CONSTRAINT "programs_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_calendar" ADD CONSTRAINT "programs_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_gallery" ADD CONSTRAINT "programs_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_video" ADD CONSTRAINT "programs_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_faq_items" ADD CONSTRAINT "programs_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_faq" ADD CONSTRAINT "programs_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_faq" ADD CONSTRAINT "programs_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_faq" ADD CONSTRAINT "programs_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_review_grid" ADD CONSTRAINT "programs_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_review_grid" ADD CONSTRAINT "programs_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_review_grid" ADD CONSTRAINT "programs_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_guide_grid" ADD CONSTRAINT "programs_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_blocks_program_hero_order_idx" ON "programs_blocks_program_hero" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_hero_parent_id_idx" ON "programs_blocks_program_hero" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_hero_path_idx" ON "programs_blocks_program_hero" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_highlights_order_idx" ON "programs_blocks_program_highlights" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_highlights_parent_id_idx" ON "programs_blocks_program_highlights" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_highlights_path_idx" ON "programs_blocks_program_highlights" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_audience_order_idx" ON "programs_blocks_program_audience" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_audience_parent_id_idx" ON "programs_blocks_program_audience" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_audience_path_idx" ON "programs_blocks_program_audience" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_curriculum_order_idx" ON "programs_blocks_program_curriculum" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_curriculum_parent_id_idx" ON "programs_blocks_program_curriculum" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_curriculum_path_idx" ON "programs_blocks_program_curriculum" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_flow_order_idx" ON "programs_blocks_program_flow" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_flow_parent_id_idx" ON "programs_blocks_program_flow" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_flow_path_idx" ON "programs_blocks_program_flow" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_weeks_order_idx" ON "programs_blocks_program_weeks" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_weeks_parent_id_idx" ON "programs_blocks_program_weeks" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_weeks_path_idx" ON "programs_blocks_program_weeks" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_logistics_order_idx" ON "programs_blocks_program_logistics" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_logistics_parent_id_idx" ON "programs_blocks_program_logistics" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_logistics_path_idx" ON "programs_blocks_program_logistics" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_coaches_order_idx" ON "programs_blocks_program_coaches" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_coaches_parent_id_idx" ON "programs_blocks_program_coaches" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_coaches_path_idx" ON "programs_blocks_program_coaches" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_results_order_idx" ON "programs_blocks_program_results" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_results_parent_id_idx" ON "programs_blocks_program_results" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_results_path_idx" ON "programs_blocks_program_results" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_trips_order_idx" ON "programs_blocks_program_trips" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_trips_parent_id_idx" ON "programs_blocks_program_trips" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_trips_path_idx" ON "programs_blocks_program_trips" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_c_t_a_order_idx" ON "programs_blocks_program_c_t_a" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_c_t_a_parent_id_idx" ON "programs_blocks_program_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_c_t_a_path_idx" ON "programs_blocks_program_c_t_a" USING btree ("_path");
  CREATE INDEX "programs_blocks_trip_grid_order_idx" ON "programs_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_trip_grid_parent_id_idx" ON "programs_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_trip_grid_path_idx" ON "programs_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "programs_blocks_trip_grid_program_idx" ON "programs_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "programs_blocks_trip_grid_location_idx" ON "programs_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "programs_blocks_calendar_order_idx" ON "programs_blocks_calendar" USING btree ("_order");
  CREATE INDEX "programs_blocks_calendar_parent_id_idx" ON "programs_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_calendar_path_idx" ON "programs_blocks_calendar" USING btree ("_path");
  CREATE INDEX "programs_blocks_calendar_event_idx" ON "programs_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "programs_blocks_gallery_order_idx" ON "programs_blocks_gallery" USING btree ("_order");
  CREATE INDEX "programs_blocks_gallery_parent_id_idx" ON "programs_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_gallery_path_idx" ON "programs_blocks_gallery" USING btree ("_path");
  CREATE INDEX "programs_blocks_video_order_idx" ON "programs_blocks_video" USING btree ("_order");
  CREATE INDEX "programs_blocks_video_parent_id_idx" ON "programs_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_video_path_idx" ON "programs_blocks_video" USING btree ("_path");
  CREATE INDEX "programs_blocks_faq_items_order_idx" ON "programs_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "programs_blocks_faq_items_parent_id_idx" ON "programs_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_faq_order_idx" ON "programs_blocks_faq" USING btree ("_order");
  CREATE INDEX "programs_blocks_faq_parent_id_idx" ON "programs_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_faq_path_idx" ON "programs_blocks_faq" USING btree ("_path");
  CREATE INDEX "programs_blocks_faq_event_idx" ON "programs_blocks_faq" USING btree ("event_id");
  CREATE INDEX "programs_blocks_faq_program_idx" ON "programs_blocks_faq" USING btree ("program_id");
  CREATE INDEX "programs_blocks_review_grid_order_idx" ON "programs_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_review_grid_parent_id_idx" ON "programs_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_review_grid_path_idx" ON "programs_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "programs_blocks_review_grid_event_idx" ON "programs_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "programs_blocks_review_grid_program_idx" ON "programs_blocks_review_grid" USING btree ("program_id");
  CREATE INDEX "programs_blocks_guide_grid_order_idx" ON "programs_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_guide_grid_parent_id_idx" ON "programs_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_guide_grid_path_idx" ON "programs_blocks_guide_grid" USING btree ("_path");
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_rels_events_id_idx" ON "programs_rels" USING btree ("events_id");
  CREATE INDEX "programs_rels_event_dates_id_idx" ON "programs_rels" USING btree ("event_dates_id");
  CREATE INDEX "programs_rels_faqs_id_idx" ON "programs_rels" USING btree ("faqs_id");
  CREATE INDEX "programs_rels_reviews_id_idx" ON "programs_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs_blocks_program_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_audience" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_curriculum" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_flow" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_weeks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_logistics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_coaches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_trips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_c_t_a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_trip_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_review_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_guide_grid" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "programs_blocks_program_hero" CASCADE;
  DROP TABLE "programs_blocks_program_highlights" CASCADE;
  DROP TABLE "programs_blocks_program_audience" CASCADE;
  DROP TABLE "programs_blocks_program_curriculum" CASCADE;
  DROP TABLE "programs_blocks_program_flow" CASCADE;
  DROP TABLE "programs_blocks_program_weeks" CASCADE;
  DROP TABLE "programs_blocks_program_logistics" CASCADE;
  DROP TABLE "programs_blocks_program_coaches" CASCADE;
  DROP TABLE "programs_blocks_program_results" CASCADE;
  DROP TABLE "programs_blocks_program_trips" CASCADE;
  DROP TABLE "programs_blocks_program_c_t_a" CASCADE;
  DROP TABLE "programs_blocks_trip_grid" CASCADE;
  DROP TABLE "programs_blocks_calendar" CASCADE;
  DROP TABLE "programs_blocks_gallery" CASCADE;
  DROP TABLE "programs_blocks_video" CASCADE;
  DROP TABLE "programs_blocks_faq_items" CASCADE;
  DROP TABLE "programs_blocks_faq" CASCADE;
  DROP TABLE "programs_blocks_review_grid" CASCADE;
  DROP TABLE "programs_blocks_guide_grid" CASCADE;
  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_events_fk";
  
  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_event_dates_fk";
  
  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_faqs_fk";
  
  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_reviews_fk";
  
  DROP INDEX "programs_rels_events_id_idx";
  DROP INDEX "programs_rels_event_dates_id_idx";
  DROP INDEX "programs_rels_faqs_id_idx";
  DROP INDEX "programs_rels_reviews_id_idx";
  ALTER TABLE "programs_rels" DROP COLUMN "events_id";
  ALTER TABLE "programs_rels" DROP COLUMN "event_dates_id";
  ALTER TABLE "programs_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "programs_rels" DROP COLUMN "reviews_id";
  DROP TYPE "public"."enum_programs_blocks_trip_grid_source";
  DROP TYPE "public"."enum_programs_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_programs_blocks_calendar_source";
  DROP TYPE "public"."enum_programs_blocks_calendar_variant";
  DROP TYPE "public"."enum_programs_blocks_gallery_variant";
  DROP TYPE "public"."enum_programs_blocks_video_variant";
  DROP TYPE "public"."enum_programs_blocks_faq_source";
  DROP TYPE "public"."enum_programs_blocks_faq_variant";
  DROP TYPE "public"."enum_programs_blocks_review_grid_source";
  DROP TYPE "public"."enum_programs_blocks_review_grid_variant";
  DROP TYPE "public"."enum_programs_blocks_guide_grid_source";
  DROP TYPE "public"."enum_programs_blocks_guide_grid_variant";`)
}
