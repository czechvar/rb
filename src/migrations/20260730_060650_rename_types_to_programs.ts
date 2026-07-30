import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_programs_flow_focus_tracks_color_tag" AS ENUM('red', 'blue', 'green');
  CREATE TYPE "public"."enum_programs_state" AS ENUM('draft', 'published');
  CREATE TABLE "programs_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_audience_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"highlighted" boolean DEFAULT false
  );
  
  CREATE TABLE "programs_curriculum_pillars_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_curriculum_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "programs_flow_mix_and_match_blocks_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_flow_mix_and_match_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"tagline" varchar
  );
  
  CREATE TABLE "programs_flow_tailored_to_you" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_flow_focus_tracks_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_flow_focus_tracks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"color_tag" "enum_programs_flow_focus_tracks_color_tag"
  );
  
  CREATE TABLE "programs_week_variants_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_week_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "programs_accommodation_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_accommodation_food_beverages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_accommodation_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"content" jsonb,
  	"main_picture_id" integer,
  	"vimeo_id" varchar,
  	"solo_note" varchar,
  	"redirect_callout" jsonb,
  	"flow_framing_paragraph" varchar,
  	"week_recommendation" varchar,
  	"accommodation_description" jsonb,
  	"transport_description" jsonb,
  	"coach_framing_paragraph" varchar,
  	"featured" boolean DEFAULT false,
  	"active" boolean DEFAULT false,
  	"state" "enum_programs_state" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_keywords" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"airports_id" integer,
  	"guides_id" integer
  );
  
  ALTER TABLE "types_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_audience_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_curriculum_pillars_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_curriculum_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_program_flow_mix_and_match_blocks_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_program_flow_mix_and_match_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_program_flow_tailored_to_you" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_program_flow_focus_tracks_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_program_flow_focus_tracks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_week_variants_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_week_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_accommodation_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_accommodation_food_beverages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_accommodation_not_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "types_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "types_highlights" CASCADE;
  DROP TABLE "types_audience_cards" CASCADE;
  DROP TABLE "types_curriculum_pillars_bullets" CASCADE;
  DROP TABLE "types_curriculum_pillars" CASCADE;
  DROP TABLE "types_program_flow_mix_and_match_blocks_bullets" CASCADE;
  DROP TABLE "types_program_flow_mix_and_match_blocks" CASCADE;
  DROP TABLE "types_program_flow_tailored_to_you" CASCADE;
  DROP TABLE "types_program_flow_focus_tracks_bullets" CASCADE;
  DROP TABLE "types_program_flow_focus_tracks" CASCADE;
  DROP TABLE "types_week_variants_bullets" CASCADE;
  DROP TABLE "types_week_variants" CASCADE;
  DROP TABLE "types_accommodation_included" CASCADE;
  DROP TABLE "types_accommodation_food_beverages" CASCADE;
  DROP TABLE "types_accommodation_not_included" CASCADE;
  DROP TABLE "types_results" CASCADE;
  DROP TABLE "types" CASCADE;
  DROP TABLE "types_rels" CASCADE;
  ALTER TABLE "events_rels" DROP CONSTRAINT IF EXISTS "events_rels_types_fk";
  
  ALTER TABLE "faqs" DROP CONSTRAINT IF EXISTS "faqs_type_id_types_id_fk";
  
  ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_type_id_types_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_types_fk";
  
  DROP INDEX IF EXISTS "events_rels_types_id_idx";
  DROP INDEX IF EXISTS "faqs_type_idx";
  DROP INDEX IF EXISTS "reviews_type_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_types_id_idx";
  ALTER TABLE "events_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "faqs" ADD COLUMN "program_id" integer;
  ALTER TABLE "reviews" ADD COLUMN "program_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "programs_highlights" ADD CONSTRAINT "programs_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_audience_cards" ADD CONSTRAINT "programs_audience_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_curriculum_pillars_bullets" ADD CONSTRAINT "programs_curriculum_pillars_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_curriculum_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_curriculum_pillars" ADD CONSTRAINT "programs_curriculum_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_flow_mix_and_match_blocks_bullets" ADD CONSTRAINT "programs_flow_mix_and_match_blocks_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_flow_mix_and_match_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_flow_mix_and_match_blocks" ADD CONSTRAINT "programs_flow_mix_and_match_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_flow_tailored_to_you" ADD CONSTRAINT "programs_flow_tailored_to_you_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_flow_focus_tracks_bullets" ADD CONSTRAINT "programs_flow_focus_tracks_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_flow_focus_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_flow_focus_tracks" ADD CONSTRAINT "programs_flow_focus_tracks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_week_variants_bullets" ADD CONSTRAINT "programs_week_variants_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_week_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_week_variants" ADD CONSTRAINT "programs_week_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_accommodation_included" ADD CONSTRAINT "programs_accommodation_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_accommodation_food_beverages" ADD CONSTRAINT "programs_accommodation_food_beverages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_accommodation_not_included" ADD CONSTRAINT "programs_accommodation_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_results" ADD CONSTRAINT "programs_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs" ADD CONSTRAINT "programs_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_highlights_order_idx" ON "programs_highlights" USING btree ("_order");
  CREATE INDEX "programs_highlights_parent_id_idx" ON "programs_highlights" USING btree ("_parent_id");
  CREATE INDEX "programs_audience_cards_order_idx" ON "programs_audience_cards" USING btree ("_order");
  CREATE INDEX "programs_audience_cards_parent_id_idx" ON "programs_audience_cards" USING btree ("_parent_id");
  CREATE INDEX "programs_curriculum_pillars_bullets_order_idx" ON "programs_curriculum_pillars_bullets" USING btree ("_order");
  CREATE INDEX "programs_curriculum_pillars_bullets_parent_id_idx" ON "programs_curriculum_pillars_bullets" USING btree ("_parent_id");
  CREATE INDEX "programs_curriculum_pillars_order_idx" ON "programs_curriculum_pillars" USING btree ("_order");
  CREATE INDEX "programs_curriculum_pillars_parent_id_idx" ON "programs_curriculum_pillars" USING btree ("_parent_id");
  CREATE INDEX "programs_flow_mix_and_match_blocks_bullets_order_idx" ON "programs_flow_mix_and_match_blocks_bullets" USING btree ("_order");
  CREATE INDEX "programs_flow_mix_and_match_blocks_bullets_parent_id_idx" ON "programs_flow_mix_and_match_blocks_bullets" USING btree ("_parent_id");
  CREATE INDEX "programs_flow_mix_and_match_blocks_order_idx" ON "programs_flow_mix_and_match_blocks" USING btree ("_order");
  CREATE INDEX "programs_flow_mix_and_match_blocks_parent_id_idx" ON "programs_flow_mix_and_match_blocks" USING btree ("_parent_id");
  CREATE INDEX "programs_flow_tailored_to_you_order_idx" ON "programs_flow_tailored_to_you" USING btree ("_order");
  CREATE INDEX "programs_flow_tailored_to_you_parent_id_idx" ON "programs_flow_tailored_to_you" USING btree ("_parent_id");
  CREATE INDEX "programs_flow_focus_tracks_bullets_order_idx" ON "programs_flow_focus_tracks_bullets" USING btree ("_order");
  CREATE INDEX "programs_flow_focus_tracks_bullets_parent_id_idx" ON "programs_flow_focus_tracks_bullets" USING btree ("_parent_id");
  CREATE INDEX "programs_flow_focus_tracks_order_idx" ON "programs_flow_focus_tracks" USING btree ("_order");
  CREATE INDEX "programs_flow_focus_tracks_parent_id_idx" ON "programs_flow_focus_tracks" USING btree ("_parent_id");
  CREATE INDEX "programs_week_variants_bullets_order_idx" ON "programs_week_variants_bullets" USING btree ("_order");
  CREATE INDEX "programs_week_variants_bullets_parent_id_idx" ON "programs_week_variants_bullets" USING btree ("_parent_id");
  CREATE INDEX "programs_week_variants_order_idx" ON "programs_week_variants" USING btree ("_order");
  CREATE INDEX "programs_week_variants_parent_id_idx" ON "programs_week_variants" USING btree ("_parent_id");
  CREATE INDEX "programs_accommodation_included_order_idx" ON "programs_accommodation_included" USING btree ("_order");
  CREATE INDEX "programs_accommodation_included_parent_id_idx" ON "programs_accommodation_included" USING btree ("_parent_id");
  CREATE INDEX "programs_accommodation_food_beverages_order_idx" ON "programs_accommodation_food_beverages" USING btree ("_order");
  CREATE INDEX "programs_accommodation_food_beverages_parent_id_idx" ON "programs_accommodation_food_beverages" USING btree ("_parent_id");
  CREATE INDEX "programs_accommodation_not_included_order_idx" ON "programs_accommodation_not_included" USING btree ("_order");
  CREATE INDEX "programs_accommodation_not_included_parent_id_idx" ON "programs_accommodation_not_included" USING btree ("_parent_id");
  CREATE INDEX "programs_results_order_idx" ON "programs_results" USING btree ("_order");
  CREATE INDEX "programs_results_parent_id_idx" ON "programs_results" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "programs_slug_idx" ON "programs" USING btree ("slug");
  CREATE INDEX "programs_main_picture_idx" ON "programs" USING btree ("main_picture_id");
  CREATE INDEX "programs_updated_at_idx" ON "programs" USING btree ("updated_at");
  CREATE INDEX "programs_created_at_idx" ON "programs" USING btree ("created_at");
  CREATE INDEX "programs_rels_order_idx" ON "programs_rels" USING btree ("order");
  CREATE INDEX "programs_rels_parent_idx" ON "programs_rels" USING btree ("parent_id");
  CREATE INDEX "programs_rels_path_idx" ON "programs_rels" USING btree ("path");
  CREATE INDEX "programs_rels_media_id_idx" ON "programs_rels" USING btree ("media_id");
  CREATE INDEX "programs_rels_airports_id_idx" ON "programs_rels" USING btree ("airports_id");
  CREATE INDEX "programs_rels_guides_id_idx" ON "programs_rels" USING btree ("guides_id");
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_rels_programs_id_idx" ON "events_rels" USING btree ("programs_id");
  CREATE INDEX "faqs_program_idx" ON "faqs" USING btree ("program_id");
  CREATE INDEX "reviews_program_idx" ON "reviews" USING btree ("program_id");
  CREATE INDEX "payload_locked_documents_rels_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("programs_id");
  ALTER TABLE "events_rels" DROP COLUMN "types_id";
  ALTER TABLE "faqs" DROP COLUMN "type_id";
  ALTER TABLE "reviews" DROP COLUMN "type_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "types_id";
  DROP TYPE "public"."enum_types_program_flow_focus_tracks_color_tag";
  DROP TYPE "public"."enum_types_state";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_types_program_flow_focus_tracks_color_tag" AS ENUM('red', 'blue', 'green');
  CREATE TYPE "public"."enum_types_state" AS ENUM('draft', 'published');
  CREATE TABLE "types_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_audience_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"highlighted" boolean DEFAULT false
  );
  
  CREATE TABLE "types_curriculum_pillars_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_curriculum_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "types_program_flow_mix_and_match_blocks_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_program_flow_mix_and_match_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"tagline" varchar
  );
  
  CREATE TABLE "types_program_flow_tailored_to_you" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_program_flow_focus_tracks_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_program_flow_focus_tracks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"color_tag" "enum_types_program_flow_focus_tracks_color_tag"
  );
  
  CREATE TABLE "types_week_variants_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_week_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "types_accommodation_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_accommodation_food_beverages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_accommodation_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"content" jsonb,
  	"main_picture_id" integer,
  	"vimeo_id" varchar,
  	"solo_note" varchar,
  	"redirect_callout" jsonb,
  	"program_flow_framing_paragraph" varchar,
  	"week_recommendation" varchar,
  	"accommodation_description" jsonb,
  	"transport_description" jsonb,
  	"coach_framing_paragraph" varchar,
  	"featured" boolean DEFAULT false,
  	"active" boolean DEFAULT false,
  	"state" "enum_types_state" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_keywords" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "types_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"airports_id" integer,
  	"guides_id" integer
  );
  
  ALTER TABLE "programs_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_audience_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_curriculum_pillars_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_curriculum_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_flow_mix_and_match_blocks_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_flow_mix_and_match_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_flow_tailored_to_you" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_flow_focus_tracks_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_flow_focus_tracks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_week_variants_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_week_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_accommodation_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_accommodation_food_beverages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_accommodation_not_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "programs_highlights" CASCADE;
  DROP TABLE "programs_audience_cards" CASCADE;
  DROP TABLE "programs_curriculum_pillars_bullets" CASCADE;
  DROP TABLE "programs_curriculum_pillars" CASCADE;
  DROP TABLE "programs_flow_mix_and_match_blocks_bullets" CASCADE;
  DROP TABLE "programs_flow_mix_and_match_blocks" CASCADE;
  DROP TABLE "programs_flow_tailored_to_you" CASCADE;
  DROP TABLE "programs_flow_focus_tracks_bullets" CASCADE;
  DROP TABLE "programs_flow_focus_tracks" CASCADE;
  DROP TABLE "programs_week_variants_bullets" CASCADE;
  DROP TABLE "programs_week_variants" CASCADE;
  DROP TABLE "programs_accommodation_included" CASCADE;
  DROP TABLE "programs_accommodation_food_beverages" CASCADE;
  DROP TABLE "programs_accommodation_not_included" CASCADE;
  DROP TABLE "programs_results" CASCADE;
  DROP TABLE "programs" CASCADE;
  DROP TABLE "programs_rels" CASCADE;
  ALTER TABLE "events_rels" DROP CONSTRAINT IF EXISTS "events_rels_programs_fk";
  
  ALTER TABLE "faqs" DROP CONSTRAINT IF EXISTS "faqs_program_id_programs_id_fk";
  
  ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_program_id_programs_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_programs_fk";
  
  DROP INDEX "events_rels_programs_id_idx";
  DROP INDEX "faqs_program_idx";
  DROP INDEX "reviews_program_idx";
  DROP INDEX "payload_locked_documents_rels_programs_id_idx";
  ALTER TABLE "events_rels" ADD COLUMN "types_id" integer;
  ALTER TABLE "faqs" ADD COLUMN "type_id" integer;
  ALTER TABLE "reviews" ADD COLUMN "type_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "types_id" integer;
  ALTER TABLE "types_highlights" ADD CONSTRAINT "types_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_audience_cards" ADD CONSTRAINT "types_audience_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_curriculum_pillars_bullets" ADD CONSTRAINT "types_curriculum_pillars_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types_curriculum_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_curriculum_pillars" ADD CONSTRAINT "types_curriculum_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_program_flow_mix_and_match_blocks_bullets" ADD CONSTRAINT "types_program_flow_mix_and_match_blocks_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types_program_flow_mix_and_match_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_program_flow_mix_and_match_blocks" ADD CONSTRAINT "types_program_flow_mix_and_match_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_program_flow_tailored_to_you" ADD CONSTRAINT "types_program_flow_tailored_to_you_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_program_flow_focus_tracks_bullets" ADD CONSTRAINT "types_program_flow_focus_tracks_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types_program_flow_focus_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_program_flow_focus_tracks" ADD CONSTRAINT "types_program_flow_focus_tracks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_week_variants_bullets" ADD CONSTRAINT "types_week_variants_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types_week_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_week_variants" ADD CONSTRAINT "types_week_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_accommodation_included" ADD CONSTRAINT "types_accommodation_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_accommodation_food_beverages" ADD CONSTRAINT "types_accommodation_food_beverages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_accommodation_not_included" ADD CONSTRAINT "types_accommodation_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_results" ADD CONSTRAINT "types_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types" ADD CONSTRAINT "types_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "types_rels" ADD CONSTRAINT "types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_rels" ADD CONSTRAINT "types_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_rels" ADD CONSTRAINT "types_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "types_rels" ADD CONSTRAINT "types_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "types_highlights_order_idx" ON "types_highlights" USING btree ("_order");
  CREATE INDEX "types_highlights_parent_id_idx" ON "types_highlights" USING btree ("_parent_id");
  CREATE INDEX "types_audience_cards_order_idx" ON "types_audience_cards" USING btree ("_order");
  CREATE INDEX "types_audience_cards_parent_id_idx" ON "types_audience_cards" USING btree ("_parent_id");
  CREATE INDEX "types_curriculum_pillars_bullets_order_idx" ON "types_curriculum_pillars_bullets" USING btree ("_order");
  CREATE INDEX "types_curriculum_pillars_bullets_parent_id_idx" ON "types_curriculum_pillars_bullets" USING btree ("_parent_id");
  CREATE INDEX "types_curriculum_pillars_order_idx" ON "types_curriculum_pillars" USING btree ("_order");
  CREATE INDEX "types_curriculum_pillars_parent_id_idx" ON "types_curriculum_pillars" USING btree ("_parent_id");
  CREATE INDEX "types_program_flow_mix_and_match_blocks_bullets_order_idx" ON "types_program_flow_mix_and_match_blocks_bullets" USING btree ("_order");
  CREATE INDEX "types_program_flow_mix_and_match_blocks_bullets_parent_id_idx" ON "types_program_flow_mix_and_match_blocks_bullets" USING btree ("_parent_id");
  CREATE INDEX "types_program_flow_mix_and_match_blocks_order_idx" ON "types_program_flow_mix_and_match_blocks" USING btree ("_order");
  CREATE INDEX "types_program_flow_mix_and_match_blocks_parent_id_idx" ON "types_program_flow_mix_and_match_blocks" USING btree ("_parent_id");
  CREATE INDEX "types_program_flow_tailored_to_you_order_idx" ON "types_program_flow_tailored_to_you" USING btree ("_order");
  CREATE INDEX "types_program_flow_tailored_to_you_parent_id_idx" ON "types_program_flow_tailored_to_you" USING btree ("_parent_id");
  CREATE INDEX "types_program_flow_focus_tracks_bullets_order_idx" ON "types_program_flow_focus_tracks_bullets" USING btree ("_order");
  CREATE INDEX "types_program_flow_focus_tracks_bullets_parent_id_idx" ON "types_program_flow_focus_tracks_bullets" USING btree ("_parent_id");
  CREATE INDEX "types_program_flow_focus_tracks_order_idx" ON "types_program_flow_focus_tracks" USING btree ("_order");
  CREATE INDEX "types_program_flow_focus_tracks_parent_id_idx" ON "types_program_flow_focus_tracks" USING btree ("_parent_id");
  CREATE INDEX "types_week_variants_bullets_order_idx" ON "types_week_variants_bullets" USING btree ("_order");
  CREATE INDEX "types_week_variants_bullets_parent_id_idx" ON "types_week_variants_bullets" USING btree ("_parent_id");
  CREATE INDEX "types_week_variants_order_idx" ON "types_week_variants" USING btree ("_order");
  CREATE INDEX "types_week_variants_parent_id_idx" ON "types_week_variants" USING btree ("_parent_id");
  CREATE INDEX "types_accommodation_included_order_idx" ON "types_accommodation_included" USING btree ("_order");
  CREATE INDEX "types_accommodation_included_parent_id_idx" ON "types_accommodation_included" USING btree ("_parent_id");
  CREATE INDEX "types_accommodation_food_beverages_order_idx" ON "types_accommodation_food_beverages" USING btree ("_order");
  CREATE INDEX "types_accommodation_food_beverages_parent_id_idx" ON "types_accommodation_food_beverages" USING btree ("_parent_id");
  CREATE INDEX "types_accommodation_not_included_order_idx" ON "types_accommodation_not_included" USING btree ("_order");
  CREATE INDEX "types_accommodation_not_included_parent_id_idx" ON "types_accommodation_not_included" USING btree ("_parent_id");
  CREATE INDEX "types_results_order_idx" ON "types_results" USING btree ("_order");
  CREATE INDEX "types_results_parent_id_idx" ON "types_results" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "types_slug_idx" ON "types" USING btree ("slug");
  CREATE INDEX "types_main_picture_idx" ON "types" USING btree ("main_picture_id");
  CREATE INDEX "types_updated_at_idx" ON "types" USING btree ("updated_at");
  CREATE INDEX "types_created_at_idx" ON "types" USING btree ("created_at");
  CREATE INDEX "types_rels_order_idx" ON "types_rels" USING btree ("order");
  CREATE INDEX "types_rels_parent_idx" ON "types_rels" USING btree ("parent_id");
  CREATE INDEX "types_rels_path_idx" ON "types_rels" USING btree ("path");
  CREATE INDEX "types_rels_media_id_idx" ON "types_rels" USING btree ("media_id");
  CREATE INDEX "types_rels_airports_id_idx" ON "types_rels" USING btree ("airports_id");
  CREATE INDEX "types_rels_guides_id_idx" ON "types_rels" USING btree ("guides_id");
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_rels_types_id_idx" ON "events_rels" USING btree ("types_id");
  CREATE INDEX "faqs_type_idx" ON "faqs" USING btree ("type_id");
  CREATE INDEX "reviews_type_idx" ON "reviews" USING btree ("type_id");
  CREATE INDEX "payload_locked_documents_rels_types_id_idx" ON "payload_locked_documents_rels" USING btree ("types_id");
  ALTER TABLE "events_rels" DROP COLUMN "programs_id";
  ALTER TABLE "faqs" DROP COLUMN "program_id";
  ALTER TABLE "reviews" DROP COLUMN "program_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "programs_id";
  DROP TYPE "public"."enum_programs_flow_focus_tracks_color_tag";
  DROP TYPE "public"."enum_programs_state";`)
}
