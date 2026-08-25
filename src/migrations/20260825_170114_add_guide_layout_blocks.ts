import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_guides_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_guides_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial');
  CREATE TYPE "public"."enum_guides_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_guides_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  CREATE TYPE "public"."enum_guides_blocks_video_variant" AS ENUM('wide', 'contained');
  CREATE TYPE "public"."enum_guides_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_guides_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_guides_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_guides_blocks_cta_variant" AS ENUM('dark', 'light', 'red');
  CREATE TABLE "guides_blocks_guide_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_trips_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_achievements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_testimonial" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_c_t_a" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
  	"guide_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_guides_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_trip_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Trips',
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"source" "enum_guides_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
  	"program_id" integer,
  	"location_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_guides_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_calendar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
  	"event_id" integer,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_guides_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"variant" "enum_guides_blocks_gallery_variant" DEFAULT 'grid' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"video_url" varchar NOT NULL,
  	"caption" varchar,
  	"variant" "enum_guides_blocks_video_variant" DEFAULT 'wide' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "guides_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Quick answers',
  	"heading" varchar DEFAULT 'FAQ' NOT NULL,
  	"source" "enum_guides_blocks_faq_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_guides_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_guides_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"variant" "enum_guides_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer,
  	"event_dates_id" integer,
  	"media_id" integer,
  	"faqs_id" integer,
  	"reviews_id" integer
  );
  
  ALTER TABLE "guides_blocks_guide_hero" ADD CONSTRAINT "guides_blocks_guide_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_stats" ADD CONSTRAINT "guides_blocks_guide_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_about" ADD CONSTRAINT "guides_blocks_guide_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_video" ADD CONSTRAINT "guides_blocks_guide_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_pillars" ADD CONSTRAINT "guides_blocks_guide_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_trips_section" ADD CONSTRAINT "guides_blocks_guide_trips_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_achievements" ADD CONSTRAINT "guides_blocks_guide_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_testimonial" ADD CONSTRAINT "guides_blocks_guide_testimonial_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_c_t_a" ADD CONSTRAINT "guides_blocks_guide_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_trips" ADD CONSTRAINT "guides_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_trips" ADD CONSTRAINT "guides_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_trip_grid" ADD CONSTRAINT "guides_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_trip_grid" ADD CONSTRAINT "guides_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_trip_grid" ADD CONSTRAINT "guides_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_calendar" ADD CONSTRAINT "guides_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_calendar" ADD CONSTRAINT "guides_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_gallery" ADD CONSTRAINT "guides_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_video" ADD CONSTRAINT "guides_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq_items" ADD CONSTRAINT "guides_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq" ADD CONSTRAINT "guides_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq" ADD CONSTRAINT "guides_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_faq" ADD CONSTRAINT "guides_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_review_grid" ADD CONSTRAINT "guides_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_review_grid" ADD CONSTRAINT "guides_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_review_grid" ADD CONSTRAINT "guides_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_cta" ADD CONSTRAINT "guides_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_blocks_guide_hero_order_idx" ON "guides_blocks_guide_hero" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_hero_parent_id_idx" ON "guides_blocks_guide_hero" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_hero_path_idx" ON "guides_blocks_guide_hero" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_stats_order_idx" ON "guides_blocks_guide_stats" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_stats_parent_id_idx" ON "guides_blocks_guide_stats" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_stats_path_idx" ON "guides_blocks_guide_stats" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_about_order_idx" ON "guides_blocks_guide_about" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_about_parent_id_idx" ON "guides_blocks_guide_about" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_about_path_idx" ON "guides_blocks_guide_about" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_video_order_idx" ON "guides_blocks_guide_video" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_video_parent_id_idx" ON "guides_blocks_guide_video" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_video_path_idx" ON "guides_blocks_guide_video" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_pillars_order_idx" ON "guides_blocks_guide_pillars" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_pillars_parent_id_idx" ON "guides_blocks_guide_pillars" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_pillars_path_idx" ON "guides_blocks_guide_pillars" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_trips_section_order_idx" ON "guides_blocks_guide_trips_section" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_trips_section_parent_id_idx" ON "guides_blocks_guide_trips_section" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_trips_section_path_idx" ON "guides_blocks_guide_trips_section" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_achievements_order_idx" ON "guides_blocks_guide_achievements" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_achievements_parent_id_idx" ON "guides_blocks_guide_achievements" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_achievements_path_idx" ON "guides_blocks_guide_achievements" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_testimonial_order_idx" ON "guides_blocks_guide_testimonial" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_testimonial_parent_id_idx" ON "guides_blocks_guide_testimonial" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_testimonial_path_idx" ON "guides_blocks_guide_testimonial" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_c_t_a_order_idx" ON "guides_blocks_guide_c_t_a" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_c_t_a_parent_id_idx" ON "guides_blocks_guide_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_c_t_a_path_idx" ON "guides_blocks_guide_c_t_a" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_trips_order_idx" ON "guides_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_trips_parent_id_idx" ON "guides_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_trips_path_idx" ON "guides_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_trips_guide_idx" ON "guides_blocks_guide_trips" USING btree ("guide_id");
  CREATE INDEX "guides_blocks_trip_grid_order_idx" ON "guides_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_trip_grid_parent_id_idx" ON "guides_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_trip_grid_path_idx" ON "guides_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_trip_grid_program_idx" ON "guides_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "guides_blocks_trip_grid_location_idx" ON "guides_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "guides_blocks_calendar_order_idx" ON "guides_blocks_calendar" USING btree ("_order");
  CREATE INDEX "guides_blocks_calendar_parent_id_idx" ON "guides_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_calendar_path_idx" ON "guides_blocks_calendar" USING btree ("_path");
  CREATE INDEX "guides_blocks_calendar_event_idx" ON "guides_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "guides_blocks_gallery_order_idx" ON "guides_blocks_gallery" USING btree ("_order");
  CREATE INDEX "guides_blocks_gallery_parent_id_idx" ON "guides_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_gallery_path_idx" ON "guides_blocks_gallery" USING btree ("_path");
  CREATE INDEX "guides_blocks_video_order_idx" ON "guides_blocks_video" USING btree ("_order");
  CREATE INDEX "guides_blocks_video_parent_id_idx" ON "guides_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_video_path_idx" ON "guides_blocks_video" USING btree ("_path");
  CREATE INDEX "guides_blocks_faq_items_order_idx" ON "guides_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "guides_blocks_faq_items_parent_id_idx" ON "guides_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_faq_order_idx" ON "guides_blocks_faq" USING btree ("_order");
  CREATE INDEX "guides_blocks_faq_parent_id_idx" ON "guides_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_faq_path_idx" ON "guides_blocks_faq" USING btree ("_path");
  CREATE INDEX "guides_blocks_faq_event_idx" ON "guides_blocks_faq" USING btree ("event_id");
  CREATE INDEX "guides_blocks_faq_program_idx" ON "guides_blocks_faq" USING btree ("program_id");
  CREATE INDEX "guides_blocks_review_grid_order_idx" ON "guides_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_review_grid_parent_id_idx" ON "guides_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_review_grid_path_idx" ON "guides_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_review_grid_event_idx" ON "guides_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "guides_blocks_review_grid_program_idx" ON "guides_blocks_review_grid" USING btree ("program_id");
  CREATE INDEX "guides_blocks_cta_order_idx" ON "guides_blocks_cta" USING btree ("_order");
  CREATE INDEX "guides_blocks_cta_parent_id_idx" ON "guides_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_cta_path_idx" ON "guides_blocks_cta" USING btree ("_path");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_events_id_idx" ON "guides_rels" USING btree ("events_id");
  CREATE INDEX "guides_rels_event_dates_id_idx" ON "guides_rels" USING btree ("event_dates_id");
  CREATE INDEX "guides_rels_media_id_idx" ON "guides_rels" USING btree ("media_id");
  CREATE INDEX "guides_rels_faqs_id_idx" ON "guides_rels" USING btree ("faqs_id");
  CREATE INDEX "guides_rels_reviews_id_idx" ON "guides_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guides_blocks_guide_hero" CASCADE;
  DROP TABLE "guides_blocks_guide_stats" CASCADE;
  DROP TABLE "guides_blocks_guide_about" CASCADE;
  DROP TABLE "guides_blocks_guide_video" CASCADE;
  DROP TABLE "guides_blocks_guide_pillars" CASCADE;
  DROP TABLE "guides_blocks_guide_trips_section" CASCADE;
  DROP TABLE "guides_blocks_guide_achievements" CASCADE;
  DROP TABLE "guides_blocks_guide_testimonial" CASCADE;
  DROP TABLE "guides_blocks_guide_c_t_a" CASCADE;
  DROP TABLE "guides_blocks_guide_trips" CASCADE;
  DROP TABLE "guides_blocks_trip_grid" CASCADE;
  DROP TABLE "guides_blocks_calendar" CASCADE;
  DROP TABLE "guides_blocks_gallery" CASCADE;
  DROP TABLE "guides_blocks_video" CASCADE;
  DROP TABLE "guides_blocks_faq_items" CASCADE;
  DROP TABLE "guides_blocks_faq" CASCADE;
  DROP TABLE "guides_blocks_review_grid" CASCADE;
  DROP TABLE "guides_blocks_cta" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TYPE "public"."enum_guides_blocks_guide_trips_source";
  DROP TYPE "public"."enum_guides_blocks_guide_trips_variant";
  DROP TYPE "public"."enum_guides_blocks_trip_grid_source";
  DROP TYPE "public"."enum_guides_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_calendar_source";
  DROP TYPE "public"."enum_guides_blocks_calendar_variant";
  DROP TYPE "public"."enum_guides_blocks_gallery_variant";
  DROP TYPE "public"."enum_guides_blocks_video_variant";
  DROP TYPE "public"."enum_guides_blocks_faq_source";
  DROP TYPE "public"."enum_guides_blocks_faq_variant";
  DROP TYPE "public"."enum_guides_blocks_review_grid_source";
  DROP TYPE "public"."enum_guides_blocks_review_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_cta_variant";`)
}
