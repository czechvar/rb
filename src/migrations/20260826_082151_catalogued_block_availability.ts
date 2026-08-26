import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_programs_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple', 'brandEditorial');
  CREATE TYPE "public"."enum_programs_blocks_section_intro_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_programs_blocks_rich_text_width" AS ENUM('standard', 'wide');
  CREATE TYPE "public"."enum_programs_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
  CREATE TYPE "public"."enum_programs_blocks_cta_variant" AS ENUM('dark', 'light', 'red', 'finalRed');
  CREATE TYPE "public"."enum_programs_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_program_grid_variant" AS ENUM('cards', 'compact', 'darkCompact');
  CREATE TYPE "public"."enum_programs_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_location_grid_variant" AS ENUM('cards', 'compact', 'countryTiles');
  CREATE TYPE "public"."enum_programs_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_programs_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_programs_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_programs_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_programs_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_programs_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TYPE "public"."enum_programs_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_programs_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_guides_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple', 'brandEditorial');
  CREATE TYPE "public"."enum_guides_blocks_section_intro_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_guides_blocks_rich_text_width" AS ENUM('standard', 'wide');
  CREATE TYPE "public"."enum_guides_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
  CREATE TYPE "public"."enum_guides_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_program_grid_variant" AS ENUM('cards', 'compact', 'darkCompact');
  CREATE TYPE "public"."enum_guides_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_location_grid_variant" AS ENUM('cards', 'compact', 'countryTiles');
  CREATE TYPE "public"."enum_guides_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_guide_grid_variant" AS ENUM('cards', 'compact', 'photoOverlay');
  CREATE TYPE "public"."enum_guides_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_guides_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_guides_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_guides_blocks_partner_strip_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_guides_blocks_partner_strip_variant" AS ENUM('logos', 'cards');
  CREATE TYPE "public"."enum_guides_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_guides_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple', 'brandEditorial');
  CREATE TYPE "public"."enum_locations_blocks_section_intro_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_locations_blocks_rich_text_width" AS ENUM('standard', 'wide');
  CREATE TYPE "public"."enum_locations_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
  CREATE TYPE "public"."enum_locations_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_program_grid_variant" AS ENUM('cards', 'compact', 'darkCompact');
  CREATE TYPE "public"."enum_locations_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_location_grid_variant" AS ENUM('cards', 'compact', 'countryTiles');
  CREATE TYPE "public"."enum_locations_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_locations_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_locations_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_locations_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TYPE "public"."enum_locations_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_locations_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_events_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple', 'brandEditorial');
  CREATE TYPE "public"."enum_events_blocks_section_intro_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_events_blocks_rich_text_width" AS ENUM('standard', 'wide');
  CREATE TYPE "public"."enum_events_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
  CREATE TYPE "public"."enum_events_blocks_cta_variant" AS ENUM('dark', 'light', 'red', 'finalRed');
  CREATE TYPE "public"."enum_events_blocks_trip_grid_source" AS ENUM('featured', 'upcoming', 'manual', 'byProgram', 'byLocation');
  CREATE TYPE "public"."enum_events_blocks_trip_grid_variant" AS ENUM('cards', 'compact', 'editorial', 'featureLead');
  CREATE TYPE "public"."enum_events_blocks_program_grid_source" AS ENUM('featured', 'all', 'manual');
  CREATE TYPE "public"."enum_events_blocks_program_grid_variant" AS ENUM('cards', 'compact', 'darkCompact');
  CREATE TYPE "public"."enum_events_blocks_location_grid_source" AS ENUM('featured', 'all', 'byCountry', 'manual');
  CREATE TYPE "public"."enum_events_blocks_location_grid_variant" AS ENUM('cards', 'compact', 'countryTiles');
  CREATE TYPE "public"."enum_events_blocks_guide_grid_source" AS ENUM('team', 'friends', 'featured', 'manual');
  CREATE TYPE "public"."enum_events_blocks_guide_grid_variant" AS ENUM('cards', 'compact', 'photoOverlay');
  CREATE TYPE "public"."enum_events_blocks_post_grid_source" AS ENUM('latest', 'byCategory', 'manual');
  CREATE TYPE "public"."enum_events_blocks_post_grid_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_events_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_events_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_events_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_events_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_hero_variant" AS ENUM('overlay', 'editorial', 'simple', 'brandEditorial');
  CREATE TYPE "public"."enum_posts_blocks_section_intro_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_posts_blocks_rich_text_width" AS ENUM('standard', 'wide');
  CREATE TYPE "public"."enum_posts_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
  CREATE TYPE "public"."enum_posts_blocks_calendar_source" AS ENUM('upcoming', 'byEvent', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_calendar_variant" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_media_block_source" AS ENUM('upload', 'externalVideo');
  CREATE TYPE "public"."enum_posts_blocks_media_block_variant" AS ENUM('wide', 'contained', 'split');
  CREATE TYPE "public"."enum_posts_blocks_guide_profile_source" AS ENUM('manual', 'currentGuide');
  CREATE TYPE "public"."enum_posts_blocks_guide_profile_variant" AS ENUM('feature', 'compact');
  CREATE TYPE "public"."enum_posts_blocks_guide_trips_source" AS ENUM('byGuide', 'currentGuide', 'manual');
  CREATE TYPE "public"."enum_posts_blocks_guide_trips_variant" AS ENUM('cards', 'compact');
  CREATE TABLE "programs_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "background_media_id" integer,
    "variant" "enum_programs_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_section_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "alignment" "enum_programs_blocks_section_intro_alignment" DEFAULT 'left' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb NOT NULL,
    "width" "enum_programs_blocks_rich_text_width" DEFAULT 'standard' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_stats_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "body" varchar
  );

  CREATE TABLE "programs_blocks_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "variant" "enum_programs_blocks_stats_variant" DEFAULT 'light' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_cta" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "variant" "enum_programs_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "secondary_action_label" varchar,
    "secondary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_program_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_programs_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_location_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
    "country" varchar,
    "limit" numeric DEFAULT 8,
    "variant" "enum_programs_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_post_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
    "category_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_programs_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_media_block" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "source" "enum_programs_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
    "media_id" integer,
    "video_url" varchar,
    "caption" varchar,
    "variant" "enum_programs_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_partner_strip" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_programs_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_guide_profile" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
    "guide_id" integer,
    "variant" "enum_programs_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "programs_blocks_guide_trips" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_programs_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
    "guide_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_programs_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "background_media_id" integer,
    "variant" "enum_guides_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_section_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "alignment" "enum_guides_blocks_section_intro_alignment" DEFAULT 'left' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb NOT NULL,
    "width" "enum_guides_blocks_rich_text_width" DEFAULT 'standard' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_stats_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "body" varchar
  );

  CREATE TABLE "guides_blocks_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "variant" "enum_guides_blocks_stats_variant" DEFAULT 'light' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_program_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_guides_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_location_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
    "country" varchar,
    "limit" numeric DEFAULT 8,
    "variant" "enum_guides_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_guide_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_guides_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_post_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
    "category_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_guides_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_media_block" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "source" "enum_guides_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
    "media_id" integer,
    "video_url" varchar,
    "caption" varchar,
    "variant" "enum_guides_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_partner_strip" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_partner_strip_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_guides_blocks_partner_strip_variant" DEFAULT 'logos' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "guides_blocks_guide_profile" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_guides_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
    "guide_id" integer,
    "variant" "enum_guides_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "background_media_id" integer,
    "variant" "enum_locations_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_section_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "alignment" "enum_locations_blocks_section_intro_alignment" DEFAULT 'left' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb NOT NULL,
    "width" "enum_locations_blocks_rich_text_width" DEFAULT 'standard' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_stats_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "body" varchar
  );

  CREATE TABLE "locations_blocks_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "variant" "enum_locations_blocks_stats_variant" DEFAULT 'light' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_program_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_locations_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_location_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
    "country" varchar,
    "limit" numeric DEFAULT 8,
    "variant" "enum_locations_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_post_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
    "category_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_locations_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_media_block" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "source" "enum_locations_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
    "media_id" integer,
    "video_url" varchar,
    "caption" varchar,
    "variant" "enum_locations_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_guide_profile" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
    "guide_id" integer,
    "variant" "enum_locations_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_guide_trips" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
    "guide_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_locations_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "background_media_id" integer,
    "variant" "enum_events_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_section_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "alignment" "enum_events_blocks_section_intro_alignment" DEFAULT 'left' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb NOT NULL,
    "width" "enum_events_blocks_rich_text_width" DEFAULT 'standard' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_stats_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "body" varchar
  );

  CREATE TABLE "events_blocks_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "variant" "enum_events_blocks_stats_variant" DEFAULT 'light' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_cta" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "variant" "enum_events_blocks_cta_variant" DEFAULT 'dark' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "secondary_action_label" varchar,
    "secondary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_trip_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Trips',
    "heading" varchar NOT NULL,
    "intro" varchar,
    "source" "enum_events_blocks_trip_grid_source" DEFAULT 'featured' NOT NULL,
    "program_id" integer,
    "location_id" integer,
    "limit" numeric DEFAULT 6 NOT NULL,
    "variant" "enum_events_blocks_trip_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_program_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_events_blocks_program_grid_source" DEFAULT 'featured' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_events_blocks_program_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_location_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_events_blocks_location_grid_source" DEFAULT 'featured' NOT NULL,
    "country" varchar,
    "limit" numeric DEFAULT 8,
    "variant" "enum_events_blocks_location_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_guide_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_events_blocks_guide_grid_source" DEFAULT 'team' NOT NULL,
    "limit" numeric DEFAULT 6,
    "variant" "enum_events_blocks_guide_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_post_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_events_blocks_post_grid_source" DEFAULT 'latest' NOT NULL,
    "category_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_events_blocks_post_grid_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_media_block" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "source" "enum_events_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
    "media_id" integer,
    "video_url" varchar,
    "caption" varchar,
    "variant" "enum_events_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_guide_trips" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_events_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
    "guide_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_events_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "background_media_id" integer,
    "variant" "enum_posts_blocks_hero_variant" DEFAULT 'overlay' NOT NULL,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_section_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "alignment" "enum_posts_blocks_section_intro_alignment" DEFAULT 'left' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "content" jsonb NOT NULL,
    "width" "enum_posts_blocks_rich_text_width" DEFAULT 'standard' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_stats_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "body" varchar
  );

  CREATE TABLE "posts_blocks_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "variant" "enum_posts_blocks_stats_variant" DEFAULT 'light' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_calendar" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_posts_blocks_calendar_source" DEFAULT 'upcoming' NOT NULL,
    "event_id" integer,
    "limit" numeric DEFAULT 6,
    "variant" "enum_posts_blocks_calendar_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_media_block" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "body" varchar,
    "source" "enum_posts_blocks_media_block_source" DEFAULT 'upload' NOT NULL,
    "media_id" integer,
    "video_url" varchar,
    "caption" varchar,
    "variant" "enum_posts_blocks_media_block_variant" DEFAULT 'wide' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_guide_profile" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_posts_blocks_guide_profile_source" DEFAULT 'manual' NOT NULL,
    "guide_id" integer,
    "variant" "enum_posts_blocks_guide_profile_variant" DEFAULT 'feature' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "posts_blocks_guide_trips" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "source" "enum_posts_blocks_guide_trips_source" DEFAULT 'byGuide' NOT NULL,
    "guide_id" integer,
    "limit" numeric DEFAULT 3,
    "variant" "enum_posts_blocks_guide_trips_variant" DEFAULT 'cards' NOT NULL,
    "block_name" varchar
  );

  ALTER TABLE "programs_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "programs_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "guides_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "guides_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "guides_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "guides_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "guides_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "locations_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "events_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "events_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "posts_rels" ADD COLUMN "event_dates_id" integer;
  ALTER TABLE "programs_blocks_hero" ADD CONSTRAINT "programs_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_hero" ADD CONSTRAINT "programs_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_section_intro" ADD CONSTRAINT "programs_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_rich_text" ADD CONSTRAINT "programs_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_stats_items" ADD CONSTRAINT "programs_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_stats" ADD CONSTRAINT "programs_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_cta" ADD CONSTRAINT "programs_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_program_grid" ADD CONSTRAINT "programs_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_location_grid" ADD CONSTRAINT "programs_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_post_grid" ADD CONSTRAINT "programs_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_post_grid" ADD CONSTRAINT "programs_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_media_block" ADD CONSTRAINT "programs_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_media_block" ADD CONSTRAINT "programs_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_partner_strip" ADD CONSTRAINT "programs_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_guide_profile" ADD CONSTRAINT "programs_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_guide_profile" ADD CONSTRAINT "programs_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_blocks_guide_trips" ADD CONSTRAINT "programs_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_blocks_guide_trips" ADD CONSTRAINT "programs_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_hero" ADD CONSTRAINT "guides_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_hero" ADD CONSTRAINT "guides_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_section_intro" ADD CONSTRAINT "guides_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_rich_text" ADD CONSTRAINT "guides_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_stats_items" ADD CONSTRAINT "guides_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_stats" ADD CONSTRAINT "guides_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_program_grid" ADD CONSTRAINT "guides_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_location_grid" ADD CONSTRAINT "guides_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_grid" ADD CONSTRAINT "guides_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_post_grid" ADD CONSTRAINT "guides_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_post_grid" ADD CONSTRAINT "guides_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_media_block" ADD CONSTRAINT "guides_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_media_block" ADD CONSTRAINT "guides_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_partner_strip" ADD CONSTRAINT "guides_blocks_partner_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_profile" ADD CONSTRAINT "guides_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_profile" ADD CONSTRAINT "guides_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_hero" ADD CONSTRAINT "locations_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_hero" ADD CONSTRAINT "locations_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_section_intro" ADD CONSTRAINT "locations_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_rich_text" ADD CONSTRAINT "locations_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_stats_items" ADD CONSTRAINT "locations_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_stats" ADD CONSTRAINT "locations_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_program_grid" ADD CONSTRAINT "locations_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_location_grid" ADD CONSTRAINT "locations_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_post_grid" ADD CONSTRAINT "locations_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_post_grid" ADD CONSTRAINT "locations_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_media_block" ADD CONSTRAINT "locations_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_media_block" ADD CONSTRAINT "locations_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_guide_profile" ADD CONSTRAINT "locations_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_guide_profile" ADD CONSTRAINT "locations_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_guide_trips" ADD CONSTRAINT "locations_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_blocks_guide_trips" ADD CONSTRAINT "locations_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_hero" ADD CONSTRAINT "events_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_hero" ADD CONSTRAINT "events_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_section_intro" ADD CONSTRAINT "events_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_rich_text" ADD CONSTRAINT "events_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_stats_items" ADD CONSTRAINT "events_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_stats" ADD CONSTRAINT "events_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_cta" ADD CONSTRAINT "events_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_grid" ADD CONSTRAINT "events_blocks_trip_grid_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_grid" ADD CONSTRAINT "events_blocks_trip_grid_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_grid" ADD CONSTRAINT "events_blocks_trip_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_program_grid" ADD CONSTRAINT "events_blocks_program_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_location_grid" ADD CONSTRAINT "events_blocks_location_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_guide_grid" ADD CONSTRAINT "events_blocks_guide_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_post_grid" ADD CONSTRAINT "events_blocks_post_grid_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_post_grid" ADD CONSTRAINT "events_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_media_block" ADD CONSTRAINT "events_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_media_block" ADD CONSTRAINT "events_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_guide_trips" ADD CONSTRAINT "events_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_blocks_guide_trips" ADD CONSTRAINT "events_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_hero" ADD CONSTRAINT "posts_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_hero" ADD CONSTRAINT "posts_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_section_intro" ADD CONSTRAINT "posts_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_rich_text" ADD CONSTRAINT "posts_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_stats_items" ADD CONSTRAINT "posts_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_stats" ADD CONSTRAINT "posts_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_calendar" ADD CONSTRAINT "posts_blocks_calendar_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_calendar" ADD CONSTRAINT "posts_blocks_calendar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_media_block" ADD CONSTRAINT "posts_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_media_block" ADD CONSTRAINT "posts_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_guide_profile" ADD CONSTRAINT "posts_blocks_guide_profile_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_guide_profile" ADD CONSTRAINT "posts_blocks_guide_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_guide_trips" ADD CONSTRAINT "posts_blocks_guide_trips_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_guide_trips" ADD CONSTRAINT "posts_blocks_guide_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_blocks_hero_order_idx" ON "programs_blocks_hero" USING btree ("_order");
  CREATE INDEX "programs_blocks_hero_parent_id_idx" ON "programs_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_hero_path_idx" ON "programs_blocks_hero" USING btree ("_path");
  CREATE INDEX "programs_blocks_hero_background_media_idx" ON "programs_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "programs_blocks_section_intro_order_idx" ON "programs_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "programs_blocks_section_intro_parent_id_idx" ON "programs_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_section_intro_path_idx" ON "programs_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "programs_blocks_rich_text_order_idx" ON "programs_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "programs_blocks_rich_text_parent_id_idx" ON "programs_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_rich_text_path_idx" ON "programs_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "programs_blocks_stats_items_order_idx" ON "programs_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "programs_blocks_stats_items_parent_id_idx" ON "programs_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_stats_order_idx" ON "programs_blocks_stats" USING btree ("_order");
  CREATE INDEX "programs_blocks_stats_parent_id_idx" ON "programs_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_stats_path_idx" ON "programs_blocks_stats" USING btree ("_path");
  CREATE INDEX "programs_blocks_cta_order_idx" ON "programs_blocks_cta" USING btree ("_order");
  CREATE INDEX "programs_blocks_cta_parent_id_idx" ON "programs_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_cta_path_idx" ON "programs_blocks_cta" USING btree ("_path");
  CREATE INDEX "programs_blocks_program_grid_order_idx" ON "programs_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_program_grid_parent_id_idx" ON "programs_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_program_grid_path_idx" ON "programs_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "programs_blocks_location_grid_order_idx" ON "programs_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_location_grid_parent_id_idx" ON "programs_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_location_grid_path_idx" ON "programs_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "programs_blocks_post_grid_order_idx" ON "programs_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "programs_blocks_post_grid_parent_id_idx" ON "programs_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_post_grid_path_idx" ON "programs_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "programs_blocks_post_grid_category_idx" ON "programs_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "programs_blocks_media_block_order_idx" ON "programs_blocks_media_block" USING btree ("_order");
  CREATE INDEX "programs_blocks_media_block_parent_id_idx" ON "programs_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_media_block_path_idx" ON "programs_blocks_media_block" USING btree ("_path");
  CREATE INDEX "programs_blocks_media_block_media_idx" ON "programs_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "programs_blocks_partner_strip_order_idx" ON "programs_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "programs_blocks_partner_strip_parent_id_idx" ON "programs_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_partner_strip_path_idx" ON "programs_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "programs_blocks_guide_profile_order_idx" ON "programs_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "programs_blocks_guide_profile_parent_id_idx" ON "programs_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_guide_profile_path_idx" ON "programs_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "programs_blocks_guide_profile_guide_idx" ON "programs_blocks_guide_profile" USING btree ("guide_id");
  CREATE INDEX "programs_blocks_guide_trips_order_idx" ON "programs_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "programs_blocks_guide_trips_parent_id_idx" ON "programs_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "programs_blocks_guide_trips_path_idx" ON "programs_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "programs_blocks_guide_trips_guide_idx" ON "programs_blocks_guide_trips" USING btree ("guide_id");
  CREATE INDEX "guides_blocks_hero_order_idx" ON "guides_blocks_hero" USING btree ("_order");
  CREATE INDEX "guides_blocks_hero_parent_id_idx" ON "guides_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_hero_path_idx" ON "guides_blocks_hero" USING btree ("_path");
  CREATE INDEX "guides_blocks_hero_background_media_idx" ON "guides_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "guides_blocks_section_intro_order_idx" ON "guides_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "guides_blocks_section_intro_parent_id_idx" ON "guides_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_section_intro_path_idx" ON "guides_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "guides_blocks_rich_text_order_idx" ON "guides_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "guides_blocks_rich_text_parent_id_idx" ON "guides_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_rich_text_path_idx" ON "guides_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "guides_blocks_stats_items_order_idx" ON "guides_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "guides_blocks_stats_items_parent_id_idx" ON "guides_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_stats_order_idx" ON "guides_blocks_stats" USING btree ("_order");
  CREATE INDEX "guides_blocks_stats_parent_id_idx" ON "guides_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_stats_path_idx" ON "guides_blocks_stats" USING btree ("_path");
  CREATE INDEX "guides_blocks_program_grid_order_idx" ON "guides_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_program_grid_parent_id_idx" ON "guides_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_program_grid_path_idx" ON "guides_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_location_grid_order_idx" ON "guides_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_location_grid_parent_id_idx" ON "guides_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_location_grid_path_idx" ON "guides_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_grid_order_idx" ON "guides_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_grid_parent_id_idx" ON "guides_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_grid_path_idx" ON "guides_blocks_guide_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_post_grid_order_idx" ON "guides_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "guides_blocks_post_grid_parent_id_idx" ON "guides_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_post_grid_path_idx" ON "guides_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "guides_blocks_post_grid_category_idx" ON "guides_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "guides_blocks_media_block_order_idx" ON "guides_blocks_media_block" USING btree ("_order");
  CREATE INDEX "guides_blocks_media_block_parent_id_idx" ON "guides_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_media_block_path_idx" ON "guides_blocks_media_block" USING btree ("_path");
  CREATE INDEX "guides_blocks_media_block_media_idx" ON "guides_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "guides_blocks_partner_strip_order_idx" ON "guides_blocks_partner_strip" USING btree ("_order");
  CREATE INDEX "guides_blocks_partner_strip_parent_id_idx" ON "guides_blocks_partner_strip" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_partner_strip_path_idx" ON "guides_blocks_partner_strip" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_profile_order_idx" ON "guides_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_profile_parent_id_idx" ON "guides_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_profile_path_idx" ON "guides_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_profile_guide_idx" ON "guides_blocks_guide_profile" USING btree ("guide_id");
  CREATE INDEX "locations_blocks_hero_order_idx" ON "locations_blocks_hero" USING btree ("_order");
  CREATE INDEX "locations_blocks_hero_parent_id_idx" ON "locations_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_hero_path_idx" ON "locations_blocks_hero" USING btree ("_path");
  CREATE INDEX "locations_blocks_hero_background_media_idx" ON "locations_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "locations_blocks_section_intro_order_idx" ON "locations_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "locations_blocks_section_intro_parent_id_idx" ON "locations_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_section_intro_path_idx" ON "locations_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "locations_blocks_rich_text_order_idx" ON "locations_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "locations_blocks_rich_text_parent_id_idx" ON "locations_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_rich_text_path_idx" ON "locations_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "locations_blocks_stats_items_order_idx" ON "locations_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "locations_blocks_stats_items_parent_id_idx" ON "locations_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_stats_order_idx" ON "locations_blocks_stats" USING btree ("_order");
  CREATE INDEX "locations_blocks_stats_parent_id_idx" ON "locations_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_stats_path_idx" ON "locations_blocks_stats" USING btree ("_path");
  CREATE INDEX "locations_blocks_program_grid_order_idx" ON "locations_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_program_grid_parent_id_idx" ON "locations_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_program_grid_path_idx" ON "locations_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_location_grid_order_idx" ON "locations_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_location_grid_parent_id_idx" ON "locations_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_location_grid_path_idx" ON "locations_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_post_grid_order_idx" ON "locations_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_post_grid_parent_id_idx" ON "locations_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_post_grid_path_idx" ON "locations_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_post_grid_category_idx" ON "locations_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "locations_blocks_media_block_order_idx" ON "locations_blocks_media_block" USING btree ("_order");
  CREATE INDEX "locations_blocks_media_block_parent_id_idx" ON "locations_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_media_block_path_idx" ON "locations_blocks_media_block" USING btree ("_path");
  CREATE INDEX "locations_blocks_media_block_media_idx" ON "locations_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "locations_blocks_guide_profile_order_idx" ON "locations_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "locations_blocks_guide_profile_parent_id_idx" ON "locations_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_guide_profile_path_idx" ON "locations_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "locations_blocks_guide_profile_guide_idx" ON "locations_blocks_guide_profile" USING btree ("guide_id");
  CREATE INDEX "locations_blocks_guide_trips_order_idx" ON "locations_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "locations_blocks_guide_trips_parent_id_idx" ON "locations_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_guide_trips_path_idx" ON "locations_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "locations_blocks_guide_trips_guide_idx" ON "locations_blocks_guide_trips" USING btree ("guide_id");
  CREATE INDEX "events_blocks_hero_order_idx" ON "events_blocks_hero" USING btree ("_order");
  CREATE INDEX "events_blocks_hero_parent_id_idx" ON "events_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_hero_path_idx" ON "events_blocks_hero" USING btree ("_path");
  CREATE INDEX "events_blocks_hero_background_media_idx" ON "events_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "events_blocks_section_intro_order_idx" ON "events_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "events_blocks_section_intro_parent_id_idx" ON "events_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_section_intro_path_idx" ON "events_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "events_blocks_rich_text_order_idx" ON "events_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "events_blocks_rich_text_parent_id_idx" ON "events_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_rich_text_path_idx" ON "events_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "events_blocks_stats_items_order_idx" ON "events_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "events_blocks_stats_items_parent_id_idx" ON "events_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_stats_order_idx" ON "events_blocks_stats" USING btree ("_order");
  CREATE INDEX "events_blocks_stats_parent_id_idx" ON "events_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_stats_path_idx" ON "events_blocks_stats" USING btree ("_path");
  CREATE INDEX "events_blocks_cta_order_idx" ON "events_blocks_cta" USING btree ("_order");
  CREATE INDEX "events_blocks_cta_parent_id_idx" ON "events_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_cta_path_idx" ON "events_blocks_cta" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_grid_order_idx" ON "events_blocks_trip_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_grid_parent_id_idx" ON "events_blocks_trip_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_grid_path_idx" ON "events_blocks_trip_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_grid_program_idx" ON "events_blocks_trip_grid" USING btree ("program_id");
  CREATE INDEX "events_blocks_trip_grid_location_idx" ON "events_blocks_trip_grid" USING btree ("location_id");
  CREATE INDEX "events_blocks_program_grid_order_idx" ON "events_blocks_program_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_program_grid_parent_id_idx" ON "events_blocks_program_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_program_grid_path_idx" ON "events_blocks_program_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_location_grid_order_idx" ON "events_blocks_location_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_location_grid_parent_id_idx" ON "events_blocks_location_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_location_grid_path_idx" ON "events_blocks_location_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_guide_grid_order_idx" ON "events_blocks_guide_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_guide_grid_parent_id_idx" ON "events_blocks_guide_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_guide_grid_path_idx" ON "events_blocks_guide_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_post_grid_order_idx" ON "events_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "events_blocks_post_grid_parent_id_idx" ON "events_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_post_grid_path_idx" ON "events_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "events_blocks_post_grid_category_idx" ON "events_blocks_post_grid" USING btree ("category_id");
  CREATE INDEX "events_blocks_media_block_order_idx" ON "events_blocks_media_block" USING btree ("_order");
  CREATE INDEX "events_blocks_media_block_parent_id_idx" ON "events_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_media_block_path_idx" ON "events_blocks_media_block" USING btree ("_path");
  CREATE INDEX "events_blocks_media_block_media_idx" ON "events_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "events_blocks_guide_trips_order_idx" ON "events_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "events_blocks_guide_trips_parent_id_idx" ON "events_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_guide_trips_path_idx" ON "events_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "events_blocks_guide_trips_guide_idx" ON "events_blocks_guide_trips" USING btree ("guide_id");
  CREATE INDEX "posts_blocks_hero_order_idx" ON "posts_blocks_hero" USING btree ("_order");
  CREATE INDEX "posts_blocks_hero_parent_id_idx" ON "posts_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_hero_path_idx" ON "posts_blocks_hero" USING btree ("_path");
  CREATE INDEX "posts_blocks_hero_background_media_idx" ON "posts_blocks_hero" USING btree ("background_media_id");
  CREATE INDEX "posts_blocks_section_intro_order_idx" ON "posts_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "posts_blocks_section_intro_parent_id_idx" ON "posts_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_section_intro_path_idx" ON "posts_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "posts_blocks_rich_text_order_idx" ON "posts_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "posts_blocks_rich_text_parent_id_idx" ON "posts_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_rich_text_path_idx" ON "posts_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "posts_blocks_stats_items_order_idx" ON "posts_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "posts_blocks_stats_items_parent_id_idx" ON "posts_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_stats_order_idx" ON "posts_blocks_stats" USING btree ("_order");
  CREATE INDEX "posts_blocks_stats_parent_id_idx" ON "posts_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_stats_path_idx" ON "posts_blocks_stats" USING btree ("_path");
  CREATE INDEX "posts_blocks_calendar_order_idx" ON "posts_blocks_calendar" USING btree ("_order");
  CREATE INDEX "posts_blocks_calendar_parent_id_idx" ON "posts_blocks_calendar" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_calendar_path_idx" ON "posts_blocks_calendar" USING btree ("_path");
  CREATE INDEX "posts_blocks_calendar_event_idx" ON "posts_blocks_calendar" USING btree ("event_id");
  CREATE INDEX "posts_blocks_media_block_order_idx" ON "posts_blocks_media_block" USING btree ("_order");
  CREATE INDEX "posts_blocks_media_block_parent_id_idx" ON "posts_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_media_block_path_idx" ON "posts_blocks_media_block" USING btree ("_path");
  CREATE INDEX "posts_blocks_media_block_media_idx" ON "posts_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "posts_blocks_guide_profile_order_idx" ON "posts_blocks_guide_profile" USING btree ("_order");
  CREATE INDEX "posts_blocks_guide_profile_parent_id_idx" ON "posts_blocks_guide_profile" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_guide_profile_path_idx" ON "posts_blocks_guide_profile" USING btree ("_path");
  CREATE INDEX "posts_blocks_guide_profile_guide_idx" ON "posts_blocks_guide_profile" USING btree ("guide_id");
  CREATE INDEX "posts_blocks_guide_trips_order_idx" ON "posts_blocks_guide_trips" USING btree ("_order");
  CREATE INDEX "posts_blocks_guide_trips_parent_id_idx" ON "posts_blocks_guide_trips" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_guide_trips_path_idx" ON "posts_blocks_guide_trips" USING btree ("_path");
  CREATE INDEX "posts_blocks_guide_trips_guide_idx" ON "posts_blocks_guide_trips" USING btree ("guide_id");
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_rels_programs_id_idx" ON "programs_rels" USING btree ("programs_id");
  CREATE INDEX "programs_rels_locations_id_idx" ON "programs_rels" USING btree ("locations_id");
  CREATE INDEX "programs_rels_posts_id_idx" ON "programs_rels" USING btree ("posts_id");
  CREATE INDEX "programs_rels_partners_id_idx" ON "programs_rels" USING btree ("partners_id");
  CREATE INDEX "guides_rels_programs_id_idx" ON "guides_rels" USING btree ("programs_id");
  CREATE INDEX "guides_rels_locations_id_idx" ON "guides_rels" USING btree ("locations_id");
  CREATE INDEX "guides_rels_guides_id_idx" ON "guides_rels" USING btree ("guides_id");
  CREATE INDEX "guides_rels_posts_id_idx" ON "guides_rels" USING btree ("posts_id");
  CREATE INDEX "guides_rels_partners_id_idx" ON "guides_rels" USING btree ("partners_id");
  CREATE INDEX "locations_rels_programs_id_idx" ON "locations_rels" USING btree ("programs_id");
  CREATE INDEX "locations_rels_locations_id_idx" ON "locations_rels" USING btree ("locations_id");
  CREATE INDEX "locations_rels_posts_id_idx" ON "locations_rels" USING btree ("posts_id");
  CREATE INDEX "events_rels_events_id_idx" ON "events_rels" USING btree ("events_id");
  CREATE INDEX "events_rels_posts_id_idx" ON "events_rels" USING btree ("posts_id");
  CREATE INDEX "posts_rels_event_dates_id_idx" ON "posts_rels" USING btree ("event_dates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_section_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_program_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_location_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_post_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_partner_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_blocks_guide_trips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_section_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_program_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_location_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_post_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_partner_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_section_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_program_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_location_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_post_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_blocks_guide_trips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_section_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_trip_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_program_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_location_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_guide_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_post_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_blocks_guide_trips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_section_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_calendar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_media_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_guide_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_blocks_guide_trips" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "programs_blocks_hero" CASCADE;
  DROP TABLE "programs_blocks_section_intro" CASCADE;
  DROP TABLE "programs_blocks_rich_text" CASCADE;
  DROP TABLE "programs_blocks_stats_items" CASCADE;
  DROP TABLE "programs_blocks_stats" CASCADE;
  DROP TABLE "programs_blocks_cta" CASCADE;
  DROP TABLE "programs_blocks_program_grid" CASCADE;
  DROP TABLE "programs_blocks_location_grid" CASCADE;
  DROP TABLE "programs_blocks_post_grid" CASCADE;
  DROP TABLE "programs_blocks_media_block" CASCADE;
  DROP TABLE "programs_blocks_partner_strip" CASCADE;
  DROP TABLE "programs_blocks_guide_profile" CASCADE;
  DROP TABLE "programs_blocks_guide_trips" CASCADE;
  DROP TABLE "guides_blocks_hero" CASCADE;
  DROP TABLE "guides_blocks_section_intro" CASCADE;
  DROP TABLE "guides_blocks_rich_text" CASCADE;
  DROP TABLE "guides_blocks_stats_items" CASCADE;
  DROP TABLE "guides_blocks_stats" CASCADE;
  DROP TABLE "guides_blocks_program_grid" CASCADE;
  DROP TABLE "guides_blocks_location_grid" CASCADE;
  DROP TABLE "guides_blocks_guide_grid" CASCADE;
  DROP TABLE "guides_blocks_post_grid" CASCADE;
  DROP TABLE "guides_blocks_media_block" CASCADE;
  DROP TABLE "guides_blocks_partner_strip" CASCADE;
  DROP TABLE "guides_blocks_guide_profile" CASCADE;
  DROP TABLE "locations_blocks_hero" CASCADE;
  DROP TABLE "locations_blocks_section_intro" CASCADE;
  DROP TABLE "locations_blocks_rich_text" CASCADE;
  DROP TABLE "locations_blocks_stats_items" CASCADE;
  DROP TABLE "locations_blocks_stats" CASCADE;
  DROP TABLE "locations_blocks_program_grid" CASCADE;
  DROP TABLE "locations_blocks_location_grid" CASCADE;
  DROP TABLE "locations_blocks_post_grid" CASCADE;
  DROP TABLE "locations_blocks_media_block" CASCADE;
  DROP TABLE "locations_blocks_guide_profile" CASCADE;
  DROP TABLE "locations_blocks_guide_trips" CASCADE;
  DROP TABLE "events_blocks_hero" CASCADE;
  DROP TABLE "events_blocks_section_intro" CASCADE;
  DROP TABLE "events_blocks_rich_text" CASCADE;
  DROP TABLE "events_blocks_stats_items" CASCADE;
  DROP TABLE "events_blocks_stats" CASCADE;
  DROP TABLE "events_blocks_cta" CASCADE;
  DROP TABLE "events_blocks_trip_grid" CASCADE;
  DROP TABLE "events_blocks_program_grid" CASCADE;
  DROP TABLE "events_blocks_location_grid" CASCADE;
  DROP TABLE "events_blocks_guide_grid" CASCADE;
  DROP TABLE "events_blocks_post_grid" CASCADE;
  DROP TABLE "events_blocks_media_block" CASCADE;
  DROP TABLE "events_blocks_guide_trips" CASCADE;
  DROP TABLE "posts_blocks_hero" CASCADE;
  DROP TABLE "posts_blocks_section_intro" CASCADE;
  DROP TABLE "posts_blocks_rich_text" CASCADE;
  DROP TABLE "posts_blocks_stats_items" CASCADE;
  DROP TABLE "posts_blocks_stats" CASCADE;
  DROP TABLE "posts_blocks_calendar" CASCADE;
  DROP TABLE "posts_blocks_media_block" CASCADE;
  DROP TABLE "posts_blocks_guide_profile" CASCADE;
  DROP TABLE "posts_blocks_guide_trips" CASCADE;
  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_programs_fk";

  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_locations_fk";

  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_posts_fk";

  ALTER TABLE "programs_rels" DROP CONSTRAINT "programs_rels_partners_fk";

  ALTER TABLE "guides_rels" DROP CONSTRAINT "guides_rels_programs_fk";

  ALTER TABLE "guides_rels" DROP CONSTRAINT "guides_rels_locations_fk";

  ALTER TABLE "guides_rels" DROP CONSTRAINT "guides_rels_guides_fk";

  ALTER TABLE "guides_rels" DROP CONSTRAINT "guides_rels_posts_fk";

  ALTER TABLE "guides_rels" DROP CONSTRAINT "guides_rels_partners_fk";

  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_programs_fk";

  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_locations_fk";

  ALTER TABLE "locations_rels" DROP CONSTRAINT "locations_rels_posts_fk";

  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_events_fk";

  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_posts_fk";

  ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_event_dates_fk";

  DROP INDEX "programs_rels_programs_id_idx";
  DROP INDEX "programs_rels_locations_id_idx";
  DROP INDEX "programs_rels_posts_id_idx";
  DROP INDEX "programs_rels_partners_id_idx";
  DROP INDEX "guides_rels_programs_id_idx";
  DROP INDEX "guides_rels_locations_id_idx";
  DROP INDEX "guides_rels_guides_id_idx";
  DROP INDEX "guides_rels_posts_id_idx";
  DROP INDEX "guides_rels_partners_id_idx";
  DROP INDEX "locations_rels_programs_id_idx";
  DROP INDEX "locations_rels_locations_id_idx";
  DROP INDEX "locations_rels_posts_id_idx";
  DROP INDEX "events_rels_events_id_idx";
  DROP INDEX "events_rels_posts_id_idx";
  DROP INDEX "posts_rels_event_dates_id_idx";
  ALTER TABLE "programs_rels" DROP COLUMN "programs_id";
  ALTER TABLE "programs_rels" DROP COLUMN "locations_id";
  ALTER TABLE "programs_rels" DROP COLUMN "posts_id";
  ALTER TABLE "programs_rels" DROP COLUMN "partners_id";
  ALTER TABLE "guides_rels" DROP COLUMN "programs_id";
  ALTER TABLE "guides_rels" DROP COLUMN "locations_id";
  ALTER TABLE "guides_rels" DROP COLUMN "guides_id";
  ALTER TABLE "guides_rels" DROP COLUMN "posts_id";
  ALTER TABLE "guides_rels" DROP COLUMN "partners_id";
  ALTER TABLE "locations_rels" DROP COLUMN "programs_id";
  ALTER TABLE "locations_rels" DROP COLUMN "locations_id";
  ALTER TABLE "locations_rels" DROP COLUMN "posts_id";
  ALTER TABLE "events_rels" DROP COLUMN "events_id";
  ALTER TABLE "events_rels" DROP COLUMN "posts_id";
  ALTER TABLE "posts_rels" DROP COLUMN "event_dates_id";
  DROP TYPE "public"."enum_programs_blocks_hero_variant";
  DROP TYPE "public"."enum_programs_blocks_section_intro_alignment";
  DROP TYPE "public"."enum_programs_blocks_rich_text_width";
  DROP TYPE "public"."enum_programs_blocks_stats_variant";
  DROP TYPE "public"."enum_programs_blocks_cta_variant";
  DROP TYPE "public"."enum_programs_blocks_program_grid_source";
  DROP TYPE "public"."enum_programs_blocks_program_grid_variant";
  DROP TYPE "public"."enum_programs_blocks_location_grid_source";
  DROP TYPE "public"."enum_programs_blocks_location_grid_variant";
  DROP TYPE "public"."enum_programs_blocks_post_grid_source";
  DROP TYPE "public"."enum_programs_blocks_post_grid_variant";
  DROP TYPE "public"."enum_programs_blocks_media_block_source";
  DROP TYPE "public"."enum_programs_blocks_media_block_variant";
  DROP TYPE "public"."enum_programs_blocks_partner_strip_source";
  DROP TYPE "public"."enum_programs_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_programs_blocks_guide_profile_source";
  DROP TYPE "public"."enum_programs_blocks_guide_profile_variant";
  DROP TYPE "public"."enum_programs_blocks_guide_trips_source";
  DROP TYPE "public"."enum_programs_blocks_guide_trips_variant";
  DROP TYPE "public"."enum_guides_blocks_hero_variant";
  DROP TYPE "public"."enum_guides_blocks_section_intro_alignment";
  DROP TYPE "public"."enum_guides_blocks_rich_text_width";
  DROP TYPE "public"."enum_guides_blocks_stats_variant";
  DROP TYPE "public"."enum_guides_blocks_program_grid_source";
  DROP TYPE "public"."enum_guides_blocks_program_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_location_grid_source";
  DROP TYPE "public"."enum_guides_blocks_location_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_guide_grid_source";
  DROP TYPE "public"."enum_guides_blocks_guide_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_post_grid_source";
  DROP TYPE "public"."enum_guides_blocks_post_grid_variant";
  DROP TYPE "public"."enum_guides_blocks_media_block_source";
  DROP TYPE "public"."enum_guides_blocks_media_block_variant";
  DROP TYPE "public"."enum_guides_blocks_partner_strip_source";
  DROP TYPE "public"."enum_guides_blocks_partner_strip_variant";
  DROP TYPE "public"."enum_guides_blocks_guide_profile_source";
  DROP TYPE "public"."enum_guides_blocks_guide_profile_variant";
  DROP TYPE "public"."enum_locations_blocks_hero_variant";
  DROP TYPE "public"."enum_locations_blocks_section_intro_alignment";
  DROP TYPE "public"."enum_locations_blocks_rich_text_width";
  DROP TYPE "public"."enum_locations_blocks_stats_variant";
  DROP TYPE "public"."enum_locations_blocks_program_grid_source";
  DROP TYPE "public"."enum_locations_blocks_program_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_location_grid_source";
  DROP TYPE "public"."enum_locations_blocks_location_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_post_grid_source";
  DROP TYPE "public"."enum_locations_blocks_post_grid_variant";
  DROP TYPE "public"."enum_locations_blocks_media_block_source";
  DROP TYPE "public"."enum_locations_blocks_media_block_variant";
  DROP TYPE "public"."enum_locations_blocks_guide_profile_source";
  DROP TYPE "public"."enum_locations_blocks_guide_profile_variant";
  DROP TYPE "public"."enum_locations_blocks_guide_trips_source";
  DROP TYPE "public"."enum_locations_blocks_guide_trips_variant";
  DROP TYPE "public"."enum_events_blocks_hero_variant";
  DROP TYPE "public"."enum_events_blocks_section_intro_alignment";
  DROP TYPE "public"."enum_events_blocks_rich_text_width";
  DROP TYPE "public"."enum_events_blocks_stats_variant";
  DROP TYPE "public"."enum_events_blocks_cta_variant";
  DROP TYPE "public"."enum_events_blocks_trip_grid_source";
  DROP TYPE "public"."enum_events_blocks_trip_grid_variant";
  DROP TYPE "public"."enum_events_blocks_program_grid_source";
  DROP TYPE "public"."enum_events_blocks_program_grid_variant";
  DROP TYPE "public"."enum_events_blocks_location_grid_source";
  DROP TYPE "public"."enum_events_blocks_location_grid_variant";
  DROP TYPE "public"."enum_events_blocks_guide_grid_source";
  DROP TYPE "public"."enum_events_blocks_guide_grid_variant";
  DROP TYPE "public"."enum_events_blocks_post_grid_source";
  DROP TYPE "public"."enum_events_blocks_post_grid_variant";
  DROP TYPE "public"."enum_events_blocks_media_block_source";
  DROP TYPE "public"."enum_events_blocks_media_block_variant";
  DROP TYPE "public"."enum_events_blocks_guide_trips_source";
  DROP TYPE "public"."enum_events_blocks_guide_trips_variant";
  DROP TYPE "public"."enum_posts_blocks_hero_variant";
  DROP TYPE "public"."enum_posts_blocks_section_intro_alignment";
  DROP TYPE "public"."enum_posts_blocks_rich_text_width";
  DROP TYPE "public"."enum_posts_blocks_stats_variant";
  DROP TYPE "public"."enum_posts_blocks_calendar_source";
  DROP TYPE "public"."enum_posts_blocks_calendar_variant";
  DROP TYPE "public"."enum_posts_blocks_media_block_source";
  DROP TYPE "public"."enum_posts_blocks_media_block_variant";
  DROP TYPE "public"."enum_posts_blocks_guide_profile_source";
  DROP TYPE "public"."enum_posts_blocks_guide_profile_variant";
  DROP TYPE "public"."enum_posts_blocks_guide_trips_source";
  DROP TYPE "public"."enum_posts_blocks_guide_trips_variant";`)
}
