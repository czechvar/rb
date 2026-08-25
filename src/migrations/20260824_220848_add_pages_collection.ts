import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple');
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('dark', 'light', 'red');
  CREATE TYPE "public"."enum_pages_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_pages_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial');
  CREATE TYPE "public"."enum_pages_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_pages_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_pages_blocks_faq_source" AS ENUM('global', 'manual', 'inline', 'byEvent', 'byProgram');
  CREATE TYPE "public"."enum_pages_blocks_faq_variant" AS ENUM('twoColumn', 'singleColumn');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages_blocks_hero" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"eyebrow" varchar,
	"heading" varchar NOT NULL,
	"body" varchar,
	"background_media_id" integer,
	"variant" "enum_pages_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
	"primary_action_label" varchar,
	"primary_action_href" varchar,
	"block_name" varchar
  );

  CREATE TABLE "pages_blocks_cta" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"eyebrow" varchar,
	"heading" varchar NOT NULL,
	"body" varchar,
	"variant" "enum_pages_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
	"primary_action_label" varchar,
	"primary_action_href" varchar,
	"secondary_action_label" varchar,
	"secondary_action_href" varchar,
	"block_name" varchar
  );

  CREATE TABLE "pages_blocks_trip_grid" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"eyebrow" varchar DEFAULT 'Trips',
	"heading" varchar NOT NULL,
	"intro" varchar,
	"source" "enum_pages_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
	"program_id" integer,
	"location_id" integer,
	"limit" numeric DEFAULT 6 NOT NULL,
	"variant" "enum_pages_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "pages_blocks_media_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"eyebrow" varchar,
	"heading" varchar,
	"body" varchar,
	"source" "enum_pages_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
	"media_id" integer,
	"video_url" varchar,
	"caption" varchar,
	"variant" "enum_pages_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "pages_blocks_faq_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"question" varchar,
	"answer" jsonb
  );

  CREATE TABLE "pages_blocks_faq" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"eyebrow" varchar DEFAULT 'Quick answers',
	"heading" varchar DEFAULT 'FAQ' NOT NULL,
	"source" "enum_pages_blocks_faq_source" DEFAULT 'global' NOT NULL,
	"event_id" integer,
	"program_id" integer,
	"limit" numeric DEFAULT 6 NOT NULL,
	"variant" "enum_pages_blocks_faq_variant" DEFAULT 'twoColumn' NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
	"seo_title" varchar,
	"seo_keywords" varchar,
	"seo_description" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "pages_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"events_id" integer,
	"faqs_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_trip_grid" ADD CONSTRAINT "pages_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_trip_grid" ADD CONSTRAINT "pages_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_trip_grid" ADD CONSTRAINT "pages_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_media_idx" ON "pages_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_trip_grid_order_idx" ON "pages_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_trip_grid_parent_id_idx" ON "pages_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trip_grid_path_idx" ON "pages_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_trip_grid_program_idx" ON "pages_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "pages_blocks_trip_grid_location_idx" ON "pages_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "pages_blocks_media_block_order_idx" ON "pages_blocks_media_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_block_parent_id_idx" ON "pages_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_block_path_idx" ON "pages_blocks_media_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_block_media_idx" ON "pages_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_event_idx" ON "pages_blocks_faq" USING btree ("event_id");
  CREATE INDEX "pages_blocks_faq_program_idx" ON "pages_blocks_faq" USING btree ("program_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_events_id_idx" ON "pages_rels" USING btree ("events_id");
  CREATE INDEX "pages_rels_faqs_id_idx" ON "pages_rels" USING btree ("faqs_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_trip_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_trip_grid" CASCADE;
  DROP TABLE "pages_blocks_media_block" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";

  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_trip_grid_source";
  DROP TYPE "public"."enum_pages_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_media_block_source";
  DROP TYPE "public"."enum_pages_blocks_media_block_variant";
  DROP TYPE "public"."enum_pages_blocks_faq_source";
  DROP TYPE "public"."enum_pages_blocks_faq_variant";
  DROP TYPE "public"."enum_pages_status";`)
}
