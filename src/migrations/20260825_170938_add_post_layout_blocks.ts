import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_posts_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial');
  CREATE TYPE "public"."enum_posts_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_program_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_location_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_guide_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  CREATE TYPE "public"."enum_posts_blocks_video_variant" AS ENUM('wide', 'contained');
  CREATE TYPE "public"."enum_posts_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_posts_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_posts_blocks_review_grid_source" AS ENUM('global', 'byEvent', 'byProgram', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_review_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_posts_blocks_cta_variant" AS ENUM('dark', 'light', 'red');
  CREATE TABLE "posts_blocks_post_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_post_body" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_related_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Related Reading',
  	"limit" numeric DEFAULT 3 NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_post_c_t_a" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_post_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_posts_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_trip_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Trips',
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"source" "enum_posts_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
  	"program_id" integer,
  	"location_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_posts_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_program_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_posts_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_location_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
  	"country" varchar,
  	"limit" numeric DEFAULT 8,
  	"variant" "enum_posts_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_guide_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_posts_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"variant" "enum_posts_blocks_gallery_variant" DEFAULT 'grid' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"video_url" varchar NOT NULL,
  	"caption" varchar,
  	"variant" "enum_posts_blocks_video_variant" DEFAULT 'wide' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "posts_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Quick answers',
  	"heading" varchar DEFAULT 'FAQ' NOT NULL,
  	"source" "enum_posts_blocks_faq_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 6 NOT NULL,
  	"variant" "enum_posts_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_review_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_review_grid_source" DEFAULT 'global' NOT NULL,
  	"event_id" integer,
  	"program_id" integer,
  	"limit" numeric DEFAULT 3,
  	"variant" "enum_posts_blocks_review_grid_variant" DEFAULT 'cards' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_partner_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"variant" "enum_posts_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"variant" "enum_posts_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"events_id" integer,
  	"programs_id" integer,
  	"locations_id" integer,
  	"guides_id" integer,
  	"media_id" integer,
  	"faqs_id" integer,
  	"reviews_id" integer,
  	"partners_id" integer
  );
  
  ALTER TABLE "posts_blocks_post_hero" ADD CONSTRAINT "posts_blocks_post_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_post_body" ADD CONSTRAINT "posts_blocks_post_body_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_related_posts" ADD CONSTRAINT "posts_blocks_related_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_post_c_t_a" ADD CONSTRAINT "posts_blocks_post_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_post_grid" ADD CONSTRAINT "posts_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_post_grid" ADD CONSTRAINT "posts_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_trip_grid" ADD CONSTRAINT "posts_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_trip_grid" ADD CONSTRAINT "posts_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_trip_grid" ADD CONSTRAINT "posts_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_program_grid" ADD CONSTRAINT "posts_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_location_grid" ADD CONSTRAINT "posts_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_guide_grid" ADD CONSTRAINT "posts_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_gallery" ADD CONSTRAINT "posts_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_video" ADD CONSTRAINT "posts_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_faq_items" ADD CONSTRAINT "posts_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_faq" ADD CONSTRAINT "posts_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_faq" ADD CONSTRAINT "posts_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_faq" ADD CONSTRAINT "posts_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_review_grid" ADD CONSTRAINT "posts_blocks_review_grid_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_review_grid" ADD CONSTRAINT "posts_blocks_review_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_review_grid" ADD CONSTRAINT "posts_blocks_review_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_partner_strip" ADD CONSTRAINT "posts_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_cta" ADD CONSTRAINT "posts_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_blocks_post_hero_order_idx" ON "posts_blocks_post_hero" USING btree ("_order");
  CREATE INDEX "posts_blocks_post_hero_parent_id_idx" ON "posts_blocks_post_hero" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_post_hero_path_idx" ON "posts_blocks_post_hero" USING btree ("_path");
  CREATE INDEX "posts_blocks_post_body_order_idx" ON "posts_blocks_post_body" USING btree ("_order");
  CREATE INDEX "posts_blocks_post_body_parent_id_idx" ON "posts_blocks_post_body" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_post_body_path_idx" ON "posts_blocks_post_body" USING btree ("_path");
  CREATE INDEX "posts_blocks_related_posts_order_idx" ON "posts_blocks_related_posts" USING btree ("_order");
  CREATE INDEX "posts_blocks_related_posts_parent_id_idx" ON "posts_blocks_related_posts" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_related_posts_path_idx" ON "posts_blocks_related_posts" USING btree ("_path");
  CREATE INDEX "posts_blocks_post_c_t_a_order_idx" ON "posts_blocks_post_c_t_a" USING btree ("_order");
  CREATE INDEX "posts_blocks_post_c_t_a_parent_id_idx" ON "posts_blocks_post_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_post_c_t_a_path_idx" ON "posts_blocks_post_c_t_a" USING btree ("_path");
  CREATE INDEX "posts_blocks_post_grid_order_idx" ON "posts_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_post_grid_parent_id_idx" ON "posts_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_post_grid_path_idx" ON "posts_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_post_grid_category_idx" ON "posts_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "posts_blocks_trip_grid_order_idx" ON "posts_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_trip_grid_parent_id_idx" ON "posts_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_trip_grid_path_idx" ON "posts_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_trip_grid_program_idx" ON "posts_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "posts_blocks_trip_grid_location_idx" ON "posts_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "posts_blocks_program_grid_order_idx" ON "posts_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_program_grid_parent_id_idx" ON "posts_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_program_grid_path_idx" ON "posts_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_location_grid_order_idx" ON "posts_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_location_grid_parent_id_idx" ON "posts_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_location_grid_path_idx" ON "posts_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_guide_grid_order_idx" ON "posts_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_guide_grid_parent_id_idx" ON "posts_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_guide_grid_path_idx" ON "posts_blocks_guide_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_gallery_order_idx" ON "posts_blocks_gallery" USING btree ("_order");
  CREATE INDEX "posts_blocks_gallery_parent_id_idx" ON "posts_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_gallery_path_idx" ON "posts_blocks_gallery" USING btree ("_path");
  CREATE INDEX "posts_blocks_video_order_idx" ON "posts_blocks_video" USING btree ("_order");
  CREATE INDEX "posts_blocks_video_parent_id_idx" ON "posts_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_video_path_idx" ON "posts_blocks_video" USING btree ("_path");
  CREATE INDEX "posts_blocks_faq_items_order_idx" ON "posts_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "posts_blocks_faq_items_parent_id_idx" ON "posts_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_faq_order_idx" ON "posts_blocks_faq" USING btree ("_order");
  CREATE INDEX "posts_blocks_faq_parent_id_idx" ON "posts_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_faq_path_idx" ON "posts_blocks_faq" USING btree ("_path");
  CREATE INDEX "posts_blocks_faq_event_idx" ON "posts_blocks_faq" USING btree ("event_id");
  CREATE INDEX "posts_blocks_faq_program_idx" ON "posts_blocks_faq" USING btree ("program_id");
  CREATE INDEX "posts_blocks_review_grid_order_idx" ON "posts_blocks_review_grid" USING btree ("_order");
  CREATE INDEX "posts_blocks_review_grid_parent_id_idx" ON "posts_blocks_review_grid" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_review_grid_path_idx" ON "posts_blocks_review_grid" USING btree ("_path");
  CREATE INDEX "posts_blocks_review_grid_event_idx" ON "posts_blocks_review_grid" USING btree ("event_id");
  CREATE INDEX "posts_blocks_review_grid_program_idx" ON "posts_blocks_review_grid" USING btree ("program_id");
  CREATE INDEX "posts_blocks_partner_strip_order_idx" ON "posts_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "posts_blocks_partner_strip_parent_id_idx" ON "posts_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_partner_strip_path_idx" ON "posts_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "posts_blocks_cta_order_idx" ON "posts_blocks_cta" USING btree ("_order");
  CREATE INDEX "posts_blocks_cta_parent_id_idx" ON "posts_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_cta_path_idx" ON "posts_blocks_cta" USING btree ("_path");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX "posts_rels_events_id_idx" ON "posts_rels" USING btree ("events_id");
  CREATE INDEX "posts_rels_programs_id_idx" ON "posts_rels" USING btree ("programs_id");
  CREATE INDEX "posts_rels_locations_id_idx" ON "posts_rels" USING btree ("locations_id");
  CREATE INDEX "posts_rels_guides_id_idx" ON "posts_rels" USING btree ("guides_id");
  CREATE INDEX "posts_rels_media_id_idx" ON "posts_rels" USING btree ("media_id");
  CREATE INDEX "posts_rels_faqs_id_idx" ON "posts_rels" USING btree ("faqs_id");
  CREATE INDEX "posts_rels_reviews_id_idx" ON "posts_rels" USING btree ("reviews_id");
  CREATE INDEX "posts_rels_partners_id_idx" ON "posts_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "posts_blocks_post_hero" CASCADE;
  DROP TABLE "posts_blocks_post_body" CASCADE;
  DROP TABLE "posts_blocks_related_posts" CASCADE;
  DROP TABLE "posts_blocks_post_c_t_a" CASCADE;
  DROP TABLE "posts_blocks_post_grid" CASCADE;
  DROP TABLE "posts_blocks_trip_grid" CASCADE;
  DROP TABLE "posts_blocks_program_grid" CASCADE;
  DROP TABLE "posts_blocks_location_grid" CASCADE;
  DROP TABLE "posts_blocks_guide_grid" CASCADE;
  DROP TABLE "posts_blocks_gallery" CASCADE;
  DROP TABLE "posts_blocks_video" CASCADE;
  DROP TABLE "posts_blocks_faq_items" CASCADE;
  DROP TABLE "posts_blocks_faq" CASCADE;
  DROP TABLE "posts_blocks_review_grid" CASCADE;
  DROP TABLE "posts_blocks_partner_strip" CASCADE;
  DROP TABLE "posts_blocks_cta" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TYPE "public"."enum_posts_blocks_post_grid_source";
  DROP TYPE "public"."enum_posts_blocks_post_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_trip_grid_source";
  DROP TYPE "public"."enum_posts_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_program_grid_source";
  DROP TYPE "public"."enum_posts_blocks_program_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_location_grid_source";
  DROP TYPE "public"."enum_posts_blocks_location_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_guide_grid_source";
  DROP TYPE "public"."enum_posts_blocks_guide_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_gallery_variant";
  DROP TYPE "public"."enum_posts_blocks_video_variant";
  DROP TYPE "public"."enum_posts_blocks_faq_source";
  DROP TYPE "public"."enum_posts_blocks_faq_variant";
  DROP TYPE "public"."enum_posts_blocks_review_grid_source";
  DROP TYPE "public"."enum_posts_blocks_review_grid_variant";
  DROP TYPE "public"."enum_posts_blocks_partner_strip_source";
  DROP TYPE "public"."enum_posts_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_posts_blocks_cta_variant";`)
}
