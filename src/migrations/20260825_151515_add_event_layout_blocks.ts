import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_events_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_events_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  CREATE TYPE "public"."enum_events_blocks_video_variant" AS ENUM('wide', 'contained');
  CREATE TYPE "public"."enum_events_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_events_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_events_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_events_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_events_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_events_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_events_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_events_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TABLE "events_blocks_trip_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_trip_pitch" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'overview',
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_trip_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Trip Highlights',
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_trip_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Dates & Pricing',
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_trip_booking_c_t_a" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Reserve Your Place',
  	"heading" varchar DEFAULT 'Ready to join?',
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_trip_logistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Everything Sorted',
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
  	"event_id" integer,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_events_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"variant" "enum_events_blocks_gallery_variant" DEFAULT 'grid' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"video_url" varchar NOT NULL,
  	"caption" varchar,
  	"variant" "enum_events_blocks_video_variant" DEFAULT 'wide' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "events_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Quick answers',
  	"heading" varchar DEFAULT 'FAQ' NOT NULL,
  	"source" "enum_events_blocks_faq_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_events_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_events_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_partner_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_events_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_guide_profile" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_events_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "events_rels" ADD COLUMN "event_dates_id" integer;
  ALTER TABLE "events_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "events_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "events_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "events_blocks_trip_hero" ADD CONSTRAINT "events_blocks_trip_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_pitch" ADD CONSTRAINT "events_blocks_trip_pitch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_highlights" ADD CONSTRAINT "events_blocks_trip_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_dates" ADD CONSTRAINT "events_blocks_trip_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_booking_c_t_a" ADD CONSTRAINT "events_blocks_trip_booking_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_logistics" ADD CONSTRAINT "events_blocks_trip_logistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_calendar" ADD CONSTRAINT "events_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_calendar" ADD CONSTRAINT "events_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_gallery" ADD CONSTRAINT "events_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_video" ADD CONSTRAINT "events_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_faq_items" ADD CONSTRAINT "events_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_faq" ADD CONSTRAINT "events_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_faq" ADD CONSTRAINT "events_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_faq" ADD CONSTRAINT "events_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_review_grid" ADD CONSTRAINT "events_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_review_grid" ADD CONSTRAINT "events_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_review_grid" ADD CONSTRAINT "events_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_partner_strip" ADD CONSTRAINT "events_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_guide_profile" ADD CONSTRAINT "events_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_guide_profile" ADD CONSTRAINT "events_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_blocks_trip_hero_order_idx" ON "events_blocks_trip_hero" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_hero_parent_id_idx" ON "events_blocks_trip_hero" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_hero_path_idx" ON "events_blocks_trip_hero" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_pitch_order_idx" ON "events_blocks_trip_pitch" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_pitch_parent_id_idx" ON "events_blocks_trip_pitch" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_pitch_path_idx" ON "events_blocks_trip_pitch" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_highlights_order_idx" ON "events_blocks_trip_highlights" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_highlights_parent_id_idx" ON "events_blocks_trip_highlights" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_highlights_path_idx" ON "events_blocks_trip_highlights" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_dates_order_idx" ON "events_blocks_trip_dates" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_dates_parent_id_idx" ON "events_blocks_trip_dates" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_dates_path_idx" ON "events_blocks_trip_dates" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_booking_c_t_a_order_idx" ON "events_blocks_trip_booking_c_t_a" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_booking_c_t_a_parent_id_idx" ON "events_blocks_trip_booking_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_booking_c_t_a_path_idx" ON "events_blocks_trip_booking_c_t_a" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_logistics_order_idx" ON "events_blocks_trip_logistics" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_logistics_parent_id_idx" ON "events_blocks_trip_logistics" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_logistics_path_idx" ON "events_blocks_trip_logistics" USING btree ("_path");
  CREATE INDEX "events_blocks_calendar_order_idx" ON "events_blocks_calendar" USING btree ("_order");
  CREATE INDEX "events_blocks_calendar_parent_id_idx" ON "events_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_calendar_path_idx" ON "events_blocks_calendar" USING btree ("_path");
  CREATE INDEX "events_blocks_calendar_event_idx" ON "events_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "events_blocks_gallery_order_idx" ON "events_blocks_gallery" USING btree ("_order");
  CREATE INDEX "events_blocks_gallery_parent_id_idx" ON "events_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_gallery_path_idx" ON "events_blocks_gallery" USING btree ("_path");
  CREATE INDEX "events_blocks_video_order_idx" ON "events_blocks_video" USING btree ("_order");
  CREATE INDEX "events_blocks_video_parent_id_idx" ON "events_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_video_path_idx" ON "events_blocks_video" USING btree ("_path");
  CREATE INDEX "events_blocks_faq_items_order_idx" ON "events_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "events_blocks_faq_items_parent_id_idx" ON "events_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_faq_order_idx" ON "events_blocks_faq" USING btree ("_order");
  CREATE INDEX "events_blocks_faq_parent_id_idx" ON "events_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_faq_path_idx" ON "events_blocks_faq" USING btree ("_path");
  CREATE INDEX "events_blocks_faq_event_idx" ON "events_blocks_faq" USING btree ("event_id");
  CREATE INDEX "events_blocks_faq_program_idx" ON "events_blocks_faq" USING btree ("program_id");
  CREATE INDEX "events_blocks_review_grid_order_idx" ON "events_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_review_grid_parent_id_idx" ON "events_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_review_grid_path_idx" ON "events_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_review_grid_event_idx" ON "events_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "events_blocks_review_grid_program_idx" ON "events_blocks_review_grid" USING btree ("program_id");
  CREATE INDEX "events_blocks_partner_strip_order_idx" ON "events_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "events_blocks_partner_strip_parent_id_idx" ON "events_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_partner_strip_path_idx" ON "events_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "events_blocks_guide_profile_order_idx" ON "events_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "events_blocks_guide_profile_parent_id_idx" ON "events_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_guide_profile_path_idx" ON "events_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "events_blocks_guide_profile_guide_idx" ON "events_blocks_guide_profile" USING btree ("guide_id");
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_rels_event_dates_id_idx" ON "events_rels" USING btree ("event_dates_id");
  CREATE INDEX "events_rels_faqs_id_idx" ON "events_rels" USING btree ("faqs_id");
  CREATE INDEX "events_rels_reviews_id_idx" ON "events_rels" USING btree ("reviews_id");
  CREATE INDEX "events_rels_partners_id_idx" ON "events_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_blocks_trip_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_pitch" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_dates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_booking_c_t_a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_logistics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_review_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_partner_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_blocks_trip_hero" CASCADE;
  DROP TABLE "events_blocks_trip_pitch" CASCADE;
  DROP TABLE "events_blocks_trip_highlights" CASCADE;
  DROP TABLE "events_blocks_trip_dates" CASCADE;
  DROP TABLE "events_blocks_trip_booking_c_t_a" CASCADE;
  DROP TABLE "events_blocks_trip_logistics" CASCADE;
  DROP TABLE "events_blocks_calendar" CASCADE;
  DROP TABLE "events_blocks_gallery" CASCADE;
  DROP TABLE "events_blocks_video" CASCADE;
  DROP TABLE "events_blocks_faq_items" CASCADE;
  DROP TABLE "events_blocks_faq" CASCADE;
  DROP TABLE "events_blocks_review_grid" CASCADE;
  DROP TABLE "events_blocks_partner_strip" CASCADE;
  DROP TABLE "events_blocks_guide_profile" CASCADE;
  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_event_dates_fk";
  
  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_faqs_fk";
  
  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_reviews_fk";
  
  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_partners_fk";
  
  DROP INDEX "events_rels_event_dates_id_idx";
  DROP INDEX "events_rels_faqs_id_idx";
  DROP INDEX "events_rels_reviews_id_idx";
  DROP INDEX "events_rels_partners_id_idx";
  ALTER TABLE "events_rels" DROP COLUMN "event_dates_id";
  ALTER TABLE "events_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "events_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "events_rels" DROP COLUMN "partners_id";
  DROP TYPE "public"."enum_events_blocks_calendar_source";
  DROP TYPE "public"."enum_events_blocks_calendar_variant";
  DROP TYPE "public"."enum_events_blocks_gallery_variant";
  DROP TYPE "public"."enum_events_blocks_video_variant";
  DROP TYPE "public"."enum_events_blocks_faq_source";
  DROP TYPE "public"."enum_events_blocks_faq_variant";
  DROP TYPE "public"."enum_events_blocks_review_grid_source";
  DROP TYPE "public"."enum_events_blocks_review_grid_variant";
  DROP TYPE "public"."enum_events_blocks_partner_strip_source";
  DROP TYPE "public"."enum_events_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_events_blocks_guide_profile_source";
  DROP TYPE "public"."enum_events_blocks_guide_profile_variant";`)
}
