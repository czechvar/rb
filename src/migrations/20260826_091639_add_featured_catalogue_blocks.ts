import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_programs_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_programs_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_programs_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_programs_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_programs_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_programs_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_programs_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_programs_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_programs_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_programs_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_programs_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_guides_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_guides_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_guides_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_guides_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_guides_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_guides_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_locations_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_locations_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_locations_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_locations_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_locations_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_locations_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_events_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_events_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_events_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_events_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_events_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_events_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_posts_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_posts_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_posts_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_posts_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_posts_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_posts_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_trip_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_pages_blocks_featured_trip_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_program_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_pages_blocks_featured_program_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_location_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_pages_blocks_featured_location_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_guide_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_pages_blocks_featured_guide_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_post_source" AS ENUM('manual', 'currentContext');
  CREATE TYPE "public"."enum_pages_blocks_featured_post_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TYPE "public"."enum_pages_blocks_featured_event_date_variant" AS ENUM('card', 'feature', 'compact', 'mediaLed');
  CREATE TABLE "programs_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_programs_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_programs_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_programs_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_programs_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_programs_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_programs_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "programs_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_programs_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_guides_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_guides_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_guides_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_guides_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_guides_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_guides_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_guides_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_locations_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_locations_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_locations_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_locations_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_locations_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_locations_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_locations_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_events_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_events_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_events_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_events_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_events_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_events_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "events_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_events_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_posts_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_posts_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_posts_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_posts_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_posts_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_posts_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_posts_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_trip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_featured_trip_source" DEFAULT 'manual' NOT NULL,
  	"event_id" integer,
  	"variant" "enum_pages_blocks_featured_trip_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_featured_program_source" DEFAULT 'manual' NOT NULL,
  	"program_id" integer,
  	"variant" "enum_pages_blocks_featured_program_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_featured_location_source" DEFAULT 'manual' NOT NULL,
  	"location_id" integer,
  	"variant" "enum_pages_blocks_featured_location_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_featured_guide_source" DEFAULT 'manual' NOT NULL,
  	"guide_id" integer,
  	"variant" "enum_pages_blocks_featured_guide_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_post" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_featured_post_source" DEFAULT 'manual' NOT NULL,
  	"post_id" integer,
  	"variant" "enum_pages_blocks_featured_post_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_event_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"event_date_id" integer,
  	"variant" "enum_pages_blocks_featured_event_date_variant" DEFAULT 'card' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "programs_blocks_featured_trip" ADD CONSTRAINT "programs_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_trip" ADD CONSTRAINT "programs_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_program" ADD CONSTRAINT "programs_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_program" ADD CONSTRAINT "programs_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_location" ADD CONSTRAINT "programs_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_location" ADD CONSTRAINT "programs_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_guide" ADD CONSTRAINT "programs_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_guide" ADD CONSTRAINT "programs_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_post" ADD CONSTRAINT "programs_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_post" ADD CONSTRAINT "programs_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_event_date" ADD CONSTRAINT "programs_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_featured_event_date" ADD CONSTRAINT "programs_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_trip" ADD CONSTRAINT "guides_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_trip" ADD CONSTRAINT "guides_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_program" ADD CONSTRAINT "guides_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_program" ADD CONSTRAINT "guides_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_location" ADD CONSTRAINT "guides_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_location" ADD CONSTRAINT "guides_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_guide" ADD CONSTRAINT "guides_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_guide" ADD CONSTRAINT "guides_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_post" ADD CONSTRAINT "guides_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_post" ADD CONSTRAINT "guides_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_event_date" ADD CONSTRAINT "guides_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_featured_event_date" ADD CONSTRAINT "guides_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_trip" ADD CONSTRAINT "locations_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_trip" ADD CONSTRAINT "locations_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_program" ADD CONSTRAINT "locations_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_program" ADD CONSTRAINT "locations_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_location" ADD CONSTRAINT "locations_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_location" ADD CONSTRAINT "locations_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_guide" ADD CONSTRAINT "locations_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_guide" ADD CONSTRAINT "locations_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_post" ADD CONSTRAINT "locations_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_post" ADD CONSTRAINT "locations_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_event_date" ADD CONSTRAINT "locations_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_featured_event_date" ADD CONSTRAINT "locations_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_trip" ADD CONSTRAINT "events_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_trip" ADD CONSTRAINT "events_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_program" ADD CONSTRAINT "events_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_program" ADD CONSTRAINT "events_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_location" ADD CONSTRAINT "events_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_location" ADD CONSTRAINT "events_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_guide" ADD CONSTRAINT "events_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_guide" ADD CONSTRAINT "events_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_post" ADD CONSTRAINT "events_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_post" ADD CONSTRAINT "events_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_event_date" ADD CONSTRAINT "events_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_featured_event_date" ADD CONSTRAINT "events_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_trip" ADD CONSTRAINT "posts_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_trip" ADD CONSTRAINT "posts_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_program" ADD CONSTRAINT "posts_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_program" ADD CONSTRAINT "posts_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_location" ADD CONSTRAINT "posts_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_location" ADD CONSTRAINT "posts_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_guide" ADD CONSTRAINT "posts_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_guide" ADD CONSTRAINT "posts_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_post" ADD CONSTRAINT "posts_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_post" ADD CONSTRAINT "posts_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_event_date" ADD CONSTRAINT "posts_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_featured_event_date" ADD CONSTRAINT "posts_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_trip" ADD CONSTRAINT "pages_blocks_featured_trip_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_trip" ADD CONSTRAINT "pages_blocks_featured_trip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_program" ADD CONSTRAINT "pages_blocks_featured_program_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_program" ADD CONSTRAINT "pages_blocks_featured_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_location" ADD CONSTRAINT "pages_blocks_featured_location_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_location" ADD CONSTRAINT "pages_blocks_featured_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_guide" ADD CONSTRAINT "pages_blocks_featured_guide_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_guide" ADD CONSTRAINT "pages_blocks_featured_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_post" ADD CONSTRAINT "pages_blocks_featured_post_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_post" ADD CONSTRAINT "pages_blocks_featured_post_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_event_date" ADD CONSTRAINT "pages_blocks_featured_event_date_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_event_date" ADD CONSTRAINT "pages_blocks_featured_event_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_blocks_featured_trip_order_idx" ON "programs_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_trip_parent_id_idx" ON "programs_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_trip_path_idx" ON "programs_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_trip_event_idx" ON "programs_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "programs_blocks_featured_program_order_idx" ON "programs_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_program_parent_id_idx" ON "programs_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_program_path_idx" ON "programs_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_program_program_idx" ON "programs_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "programs_blocks_featured_location_order_idx" ON "programs_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_location_parent_id_idx" ON "programs_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_location_path_idx" ON "programs_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_location_location_idx" ON "programs_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "programs_blocks_featured_guide_order_idx" ON "programs_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_guide_parent_id_idx" ON "programs_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_guide_path_idx" ON "programs_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_guide_guide_idx" ON "programs_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "programs_blocks_featured_post_order_idx" ON "programs_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_post_parent_id_idx" ON "programs_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_post_path_idx" ON "programs_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_post_post_idx" ON "programs_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "programs_blocks_featured_event_date_order_idx" ON "programs_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "programs_blocks_featured_event_date_parent_id_idx" ON "programs_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_featured_event_date_path_idx" ON "programs_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "programs_blocks_featured_event_date_event_date_idx" ON "programs_blocks_featured_event_date" USING btree ("event_date_id");
  CREATE INDEX "guides_blocks_featured_trip_order_idx" ON "guides_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_trip_parent_id_idx" ON "guides_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_trip_path_idx" ON "guides_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_trip_event_idx" ON "guides_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "guides_blocks_featured_program_order_idx" ON "guides_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_program_parent_id_idx" ON "guides_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_program_path_idx" ON "guides_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_program_program_idx" ON "guides_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "guides_blocks_featured_location_order_idx" ON "guides_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_location_parent_id_idx" ON "guides_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_location_path_idx" ON "guides_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_location_location_idx" ON "guides_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "guides_blocks_featured_guide_order_idx" ON "guides_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_guide_parent_id_idx" ON "guides_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_guide_path_idx" ON "guides_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_guide_guide_idx" ON "guides_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "guides_blocks_featured_post_order_idx" ON "guides_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_post_parent_id_idx" ON "guides_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_post_path_idx" ON "guides_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_post_post_idx" ON "guides_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "guides_blocks_featured_event_date_order_idx" ON "guides_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "guides_blocks_featured_event_date_parent_id_idx" ON "guides_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_featured_event_date_path_idx" ON "guides_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "guides_blocks_featured_event_date_event_date_idx" ON "guides_blocks_featured_event_date" USING btree ("event_date_id");
  CREATE INDEX "locations_blocks_featured_trip_order_idx" ON "locations_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_trip_parent_id_idx" ON "locations_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_trip_path_idx" ON "locations_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_trip_event_idx" ON "locations_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "locations_blocks_featured_program_order_idx" ON "locations_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_program_parent_id_idx" ON "locations_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_program_path_idx" ON "locations_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_program_program_idx" ON "locations_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "locations_blocks_featured_location_order_idx" ON "locations_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_location_parent_id_idx" ON "locations_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_location_path_idx" ON "locations_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_location_location_idx" ON "locations_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "locations_blocks_featured_guide_order_idx" ON "locations_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_guide_parent_id_idx" ON "locations_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_guide_path_idx" ON "locations_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_guide_guide_idx" ON "locations_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "locations_blocks_featured_post_order_idx" ON "locations_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_post_parent_id_idx" ON "locations_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_post_path_idx" ON "locations_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_post_post_idx" ON "locations_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "locations_blocks_featured_event_date_order_idx" ON "locations_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "locations_blocks_featured_event_date_parent_id_idx" ON "locations_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_featured_event_date_path_idx" ON "locations_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "locations_blocks_featured_event_date_event_date_idx" ON "locations_blocks_featured_event_date" USING btree ("event_date_id");
  CREATE INDEX "events_blocks_featured_trip_order_idx" ON "events_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_trip_parent_id_idx" ON "events_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_trip_path_idx" ON "events_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_trip_event_idx" ON "events_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "events_blocks_featured_program_order_idx" ON "events_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_program_parent_id_idx" ON "events_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_program_path_idx" ON "events_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_program_program_idx" ON "events_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "events_blocks_featured_location_order_idx" ON "events_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_location_parent_id_idx" ON "events_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_location_path_idx" ON "events_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_location_location_idx" ON "events_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "events_blocks_featured_guide_order_idx" ON "events_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_guide_parent_id_idx" ON "events_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_guide_path_idx" ON "events_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_guide_guide_idx" ON "events_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "events_blocks_featured_post_order_idx" ON "events_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_post_parent_id_idx" ON "events_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_post_path_idx" ON "events_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_post_post_idx" ON "events_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "events_blocks_featured_event_date_order_idx" ON "events_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "events_blocks_featured_event_date_parent_id_idx" ON "events_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_featured_event_date_path_idx" ON "events_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "events_blocks_featured_event_date_event_date_idx" ON "events_blocks_featured_event_date" USING btree ("event_date_id");
  CREATE INDEX "posts_blocks_featured_trip_order_idx" ON "posts_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_trip_parent_id_idx" ON "posts_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_trip_path_idx" ON "posts_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_trip_event_idx" ON "posts_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "posts_blocks_featured_program_order_idx" ON "posts_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_program_parent_id_idx" ON "posts_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_program_path_idx" ON "posts_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_program_program_idx" ON "posts_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "posts_blocks_featured_location_order_idx" ON "posts_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_location_parent_id_idx" ON "posts_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_location_path_idx" ON "posts_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_location_location_idx" ON "posts_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "posts_blocks_featured_guide_order_idx" ON "posts_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_guide_parent_id_idx" ON "posts_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_guide_path_idx" ON "posts_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_guide_guide_idx" ON "posts_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "posts_blocks_featured_post_order_idx" ON "posts_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_post_parent_id_idx" ON "posts_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_post_path_idx" ON "posts_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_post_post_idx" ON "posts_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "posts_blocks_featured_event_date_order_idx" ON "posts_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "posts_blocks_featured_event_date_parent_id_idx" ON "posts_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_featured_event_date_path_idx" ON "posts_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "posts_blocks_featured_event_date_event_date_idx" ON "posts_blocks_featured_event_date" USING btree ("event_date_id");
  CREATE INDEX "pages_blocks_featured_trip_order_idx" ON "pages_blocks_featured_trip" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_trip_parent_id_idx" ON "pages_blocks_featured_trip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_trip_path_idx" ON "pages_blocks_featured_trip" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_trip_event_idx" ON "pages_blocks_featured_trip" USING btree ("event_id");
  CREATE INDEX "pages_blocks_featured_program_order_idx" ON "pages_blocks_featured_program" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_program_parent_id_idx" ON "pages_blocks_featured_program" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_program_path_idx" ON "pages_blocks_featured_program" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_program_program_idx" ON "pages_blocks_featured_program" USING btree ("program_id");
  CREATE INDEX "pages_blocks_featured_location_order_idx" ON "pages_blocks_featured_location" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_location_parent_id_idx" ON "pages_blocks_featured_location" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_location_path_idx" ON "pages_blocks_featured_location" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_location_location_idx" ON "pages_blocks_featured_location" USING btree ("location_id");
  CREATE INDEX "pages_blocks_featured_guide_order_idx" ON "pages_blocks_featured_guide" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_guide_parent_id_idx" ON "pages_blocks_featured_guide" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_guide_path_idx" ON "pages_blocks_featured_guide" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_guide_guide_idx" ON "pages_blocks_featured_guide" USING btree ("guide_id");
  CREATE INDEX "pages_blocks_featured_post_order_idx" ON "pages_blocks_featured_post" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_post_parent_id_idx" ON "pages_blocks_featured_post" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_post_path_idx" ON "pages_blocks_featured_post" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_post_post_idx" ON "pages_blocks_featured_post" USING btree ("post_id");
  CREATE INDEX "pages_blocks_featured_event_date_order_idx" ON "pages_blocks_featured_event_date" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_event_date_parent_id_idx" ON "pages_blocks_featured_event_date" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_event_date_path_idx" ON "pages_blocks_featured_event_date" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_event_date_event_date_idx" ON "pages_blocks_featured_event_date" USING btree ("event_date_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "programs_blocks_featured_trip" CASCADE;
  DROP TABLE "programs_blocks_featured_program" CASCADE;
  DROP TABLE "programs_blocks_featured_location" CASCADE;
  DROP TABLE "programs_blocks_featured_guide" CASCADE;
  DROP TABLE "programs_blocks_featured_post" CASCADE;
  DROP TABLE "programs_blocks_featured_event_date" CASCADE;
  DROP TABLE "guides_blocks_featured_trip" CASCADE;
  DROP TABLE "guides_blocks_featured_program" CASCADE;
  DROP TABLE "guides_blocks_featured_location" CASCADE;
  DROP TABLE "guides_blocks_featured_guide" CASCADE;
  DROP TABLE "guides_blocks_featured_post" CASCADE;
  DROP TABLE "guides_blocks_featured_event_date" CASCADE;
  DROP TABLE "locations_blocks_featured_trip" CASCADE;
  DROP TABLE "locations_blocks_featured_program" CASCADE;
  DROP TABLE "locations_blocks_featured_location" CASCADE;
  DROP TABLE "locations_blocks_featured_guide" CASCADE;
  DROP TABLE "locations_blocks_featured_post" CASCADE;
  DROP TABLE "locations_blocks_featured_event_date" CASCADE;
  DROP TABLE "events_blocks_featured_trip" CASCADE;
  DROP TABLE "events_blocks_featured_program" CASCADE;
  DROP TABLE "events_blocks_featured_location" CASCADE;
  DROP TABLE "events_blocks_featured_guide" CASCADE;
  DROP TABLE "events_blocks_featured_post" CASCADE;
  DROP TABLE "events_blocks_featured_event_date" CASCADE;
  DROP TABLE "posts_blocks_featured_trip" CASCADE;
  DROP TABLE "posts_blocks_featured_program" CASCADE;
  DROP TABLE "posts_blocks_featured_location" CASCADE;
  DROP TABLE "posts_blocks_featured_guide" CASCADE;
  DROP TABLE "posts_blocks_featured_post" CASCADE;
  DROP TABLE "posts_blocks_featured_event_date" CASCADE;
  DROP TABLE "pages_blocks_featured_trip" CASCADE;
  DROP TABLE "pages_blocks_featured_program" CASCADE;
  DROP TABLE "pages_blocks_featured_location" CASCADE;
  DROP TABLE "pages_blocks_featured_guide" CASCADE;
  DROP TABLE "pages_blocks_featured_post" CASCADE;
  DROP TABLE "pages_blocks_featured_event_date" CASCADE;
  DROP TYPE "public"."enum_programs_blocks_featured_trip_source";
  DROP TYPE "public"."enum_programs_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_programs_blocks_featured_program_source";
  DROP TYPE "public"."enum_programs_blocks_featured_program_variant";
  DROP TYPE "public"."enum_programs_blocks_featured_location_source";
  DROP TYPE "public"."enum_programs_blocks_featured_location_variant";
  DROP TYPE "public"."enum_programs_blocks_featured_guide_source";
  DROP TYPE "public"."enum_programs_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_programs_blocks_featured_post_source";
  DROP TYPE "public"."enum_programs_blocks_featured_post_variant";
  DROP TYPE "public"."enum_programs_blocks_featured_event_date_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_trip_source";
  DROP TYPE "public"."enum_guides_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_program_source";
  DROP TYPE "public"."enum_guides_blocks_featured_program_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_location_source";
  DROP TYPE "public"."enum_guides_blocks_featured_location_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_guide_source";
  DROP TYPE "public"."enum_guides_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_post_source";
  DROP TYPE "public"."enum_guides_blocks_featured_post_variant";
  DROP TYPE "public"."enum_guides_blocks_featured_event_date_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_trip_source";
  DROP TYPE "public"."enum_locations_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_program_source";
  DROP TYPE "public"."enum_locations_blocks_featured_program_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_location_source";
  DROP TYPE "public"."enum_locations_blocks_featured_location_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_guide_source";
  DROP TYPE "public"."enum_locations_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_post_source";
  DROP TYPE "public"."enum_locations_blocks_featured_post_variant";
  DROP TYPE "public"."enum_locations_blocks_featured_event_date_variant";
  DROP TYPE "public"."enum_events_blocks_featured_trip_source";
  DROP TYPE "public"."enum_events_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_events_blocks_featured_program_source";
  DROP TYPE "public"."enum_events_blocks_featured_program_variant";
  DROP TYPE "public"."enum_events_blocks_featured_location_source";
  DROP TYPE "public"."enum_events_blocks_featured_location_variant";
  DROP TYPE "public"."enum_events_blocks_featured_guide_source";
  DROP TYPE "public"."enum_events_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_events_blocks_featured_post_source";
  DROP TYPE "public"."enum_events_blocks_featured_post_variant";
  DROP TYPE "public"."enum_events_blocks_featured_event_date_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_trip_source";
  DROP TYPE "public"."enum_posts_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_program_source";
  DROP TYPE "public"."enum_posts_blocks_featured_program_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_location_source";
  DROP TYPE "public"."enum_posts_blocks_featured_location_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_guide_source";
  DROP TYPE "public"."enum_posts_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_post_source";
  DROP TYPE "public"."enum_posts_blocks_featured_post_variant";
  DROP TYPE "public"."enum_posts_blocks_featured_event_date_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_trip_source";
  DROP TYPE "public"."enum_pages_blocks_featured_trip_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_program_source";
  DROP TYPE "public"."enum_pages_blocks_featured_program_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_location_source";
  DROP TYPE "public"."enum_pages_blocks_featured_location_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_guide_source";
  DROP TYPE "public"."enum_pages_blocks_featured_guide_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_post_source";
  DROP TYPE "public"."enum_pages_blocks_featured_post_variant";
  DROP TYPE "public"."enum_pages_blocks_featured_event_date_variant";`)
}
