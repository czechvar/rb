import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('customer', 'admin');
  CREATE TYPE "public"."enum_types_program_flow_focus_tracks_color_tag" AS ENUM('red', 'blue', 'green');
  CREATE TYPE "public"."enum_types_state" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_state" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_event_dates_currency" AS ENUM('EUR', 'CZK');
  CREATE TABLE "users_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"street" varchar,
  	"city" varchar,
  	"postal_code" varchar,
  	"country" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'customer' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "difficulties" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"text" varchar,
  	"position" numeric DEFAULT 0,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"photo_id" integer,
  	"content" jsonb,
  	"email" varchar,
  	"phone" varchar,
  	"vimeo_id" varchar,
  	"featured" boolean DEFAULT false,
  	"active" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_keywords" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb,
  	"address" varchar,
  	"city" varchar,
  	"country" varchar,
  	"coordinates" geometry(Point),
  	"active" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_keywords" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "airports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"iata" varchar NOT NULL,
  	"country" varchar,
  	"continent" varchar,
  	"coordinates" geometry(Point),
  	"size" numeric,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"link" varchar,
  	"description" jsonb,
  	"logo_id" integer,
  	"featured" boolean DEFAULT false,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_additional_info" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" jsonb
  );
  
  CREATE TABLE "events_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_audience_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"highlighted" boolean DEFAULT false
  );
  
  CREATE TABLE "events_prerequisites" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_essential_equipment" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"name" varchar NOT NULL,
  	"note" varchar,
  	"mandatory" boolean DEFAULT false
  );
  
  CREATE TABLE "events_what_you_learn_box1_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_what_you_learn_box2_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_itinerary_days_highlight_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_itinerary_days_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar NOT NULL,
  	"activity" varchar NOT NULL
  );
  
  CREATE TABLE "events_itinerary_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day_badge" varchar,
  	"destination_icon" varchar,
  	"destination_name" varchar NOT NULL,
  	"meta_line" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"description" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "events_accommodation_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_accommodation_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_coach_team_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_partner_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"content" jsonb,
  	"main_picture_id" integer,
  	"vimeo_id" varchar,
  	"equipment_intro" varchar,
  	"what_you_learn_intro" varchar,
  	"what_you_learn_box1_heading" varchar,
  	"what_you_learn_box2_heading" varchar,
  	"itinerary_intro" varchar,
  	"accommodation_description" jsonb,
  	"accommodation_cuisine_highlights" jsonb,
  	"transport_description" jsonb,
  	"coach_framing_paragraph" varchar,
  	"partner_id" integer,
  	"partner_eyebrow" varchar,
  	"partner_headline" varchar,
  	"partner_description" varchar,
  	"featured" boolean DEFAULT false,
  	"state" "enum_events_state" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_keywords" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"categories_id" integer,
  	"difficulties_id" integer,
  	"types_id" integer,
  	"locations_id" integer,
  	"airports_id" integer,
  	"guides_id" integer
  );
  
  CREATE TABLE "event_dates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone NOT NULL,
  	"airport_from_id" integer,
  	"airport_to_id" integer,
  	"price" numeric NOT NULL,
  	"vat" numeric DEFAULT 0 NOT NULL,
  	"currency" "enum_event_dates_currency" DEFAULT 'EUR' NOT NULL,
  	"capacity" numeric NOT NULL,
  	"min_participants" numeric DEFAULT 0,
  	"extra_content" jsonb,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_dates_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locations_id" integer,
  	"guides_id" integer
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"event_id" integer,
  	"type_id" integer,
  	"position" numeric DEFAULT 0,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"reviewer_name" varchar NOT NULL,
  	"reviewer_location" varchar,
  	"result_line" varchar,
  	"event_id" integer,
  	"type_id" integer,
  	"position" numeric DEFAULT 0,
  	"active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"difficulties_id" integer,
  	"types_id" integer,
  	"categories_id" integer,
  	"guides_id" integer,
  	"locations_id" integer,
  	"airports_id" integer,
  	"partners_id" integer,
  	"events_id" integer,
  	"event_dates_id" integer,
  	"faqs_id" integer,
  	"reviews_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_addresses" ADD CONSTRAINT "users_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "guides" ADD CONSTRAINT "guides_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_additional_info" ADD CONSTRAINT "events_additional_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_highlights" ADD CONSTRAINT "events_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_audience_cards" ADD CONSTRAINT "events_audience_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_prerequisites" ADD CONSTRAINT "events_prerequisites_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_essential_equipment" ADD CONSTRAINT "events_essential_equipment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_what_you_learn_box1_bullets" ADD CONSTRAINT "events_what_you_learn_box1_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_what_you_learn_box2_bullets" ADD CONSTRAINT "events_what_you_learn_box2_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_itinerary_days_highlight_tags" ADD CONSTRAINT "events_itinerary_days_highlight_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_itinerary_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_itinerary_days_schedule" ADD CONSTRAINT "events_itinerary_days_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_itinerary_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_itinerary_days" ADD CONSTRAINT "events_itinerary_days_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_itinerary_days" ADD CONSTRAINT "events_itinerary_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_accommodation_included" ADD CONSTRAINT "events_accommodation_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_accommodation_not_included" ADD CONSTRAINT "events_accommodation_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_coach_team_bullets" ADD CONSTRAINT "events_coach_team_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_partner_benefits" ADD CONSTRAINT "events_partner_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_difficulties_fk" FOREIGN KEY ("difficulties_id") REFERENCES "public"."difficulties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_airport_from_id_airports_id_fk" FOREIGN KEY ("airport_from_id") REFERENCES "public"."airports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_airport_to_id_airports_id_fk" FOREIGN KEY ("airport_to_id") REFERENCES "public"."airports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_dates_rels" ADD CONSTRAINT "event_dates_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_dates_rels" ADD CONSTRAINT "event_dates_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_dates_rels" ADD CONSTRAINT "event_dates_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_difficulties_fk" FOREIGN KEY ("difficulties_id") REFERENCES "public"."difficulties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_dates_fk" FOREIGN KEY ("event_dates_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_addresses_order_idx" ON "users_addresses" USING btree ("_order");
  CREATE INDEX "users_addresses_parent_id_idx" ON "users_addresses" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "difficulties_updated_at_idx" ON "difficulties" USING btree ("updated_at");
  CREATE INDEX "difficulties_created_at_idx" ON "difficulties" USING btree ("created_at");
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
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_photo_idx" ON "guides" USING btree ("photo_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE UNIQUE INDEX "airports_iata_idx" ON "airports" USING btree ("iata");
  CREATE INDEX "airports_updated_at_idx" ON "airports" USING btree ("updated_at");
  CREATE INDEX "airports_created_at_idx" ON "airports" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "events_additional_info_order_idx" ON "events_additional_info" USING btree ("_order");
  CREATE INDEX "events_additional_info_parent_id_idx" ON "events_additional_info" USING btree ("_parent_id");
  CREATE INDEX "events_highlights_order_idx" ON "events_highlights" USING btree ("_order");
  CREATE INDEX "events_highlights_parent_id_idx" ON "events_highlights" USING btree ("_parent_id");
  CREATE INDEX "events_audience_cards_order_idx" ON "events_audience_cards" USING btree ("_order");
  CREATE INDEX "events_audience_cards_parent_id_idx" ON "events_audience_cards" USING btree ("_parent_id");
  CREATE INDEX "events_prerequisites_order_idx" ON "events_prerequisites" USING btree ("_order");
  CREATE INDEX "events_prerequisites_parent_id_idx" ON "events_prerequisites" USING btree ("_parent_id");
  CREATE INDEX "events_essential_equipment_order_idx" ON "events_essential_equipment" USING btree ("_order");
  CREATE INDEX "events_essential_equipment_parent_id_idx" ON "events_essential_equipment" USING btree ("_parent_id");
  CREATE INDEX "events_what_you_learn_box1_bullets_order_idx" ON "events_what_you_learn_box1_bullets" USING btree ("_order");
  CREATE INDEX "events_what_you_learn_box1_bullets_parent_id_idx" ON "events_what_you_learn_box1_bullets" USING btree ("_parent_id");
  CREATE INDEX "events_what_you_learn_box2_bullets_order_idx" ON "events_what_you_learn_box2_bullets" USING btree ("_order");
  CREATE INDEX "events_what_you_learn_box2_bullets_parent_id_idx" ON "events_what_you_learn_box2_bullets" USING btree ("_parent_id");
  CREATE INDEX "events_itinerary_days_highlight_tags_order_idx" ON "events_itinerary_days_highlight_tags" USING btree ("_order");
  CREATE INDEX "events_itinerary_days_highlight_tags_parent_id_idx" ON "events_itinerary_days_highlight_tags" USING btree ("_parent_id");
  CREATE INDEX "events_itinerary_days_schedule_order_idx" ON "events_itinerary_days_schedule" USING btree ("_order");
  CREATE INDEX "events_itinerary_days_schedule_parent_id_idx" ON "events_itinerary_days_schedule" USING btree ("_parent_id");
  CREATE INDEX "events_itinerary_days_order_idx" ON "events_itinerary_days" USING btree ("_order");
  CREATE INDEX "events_itinerary_days_parent_id_idx" ON "events_itinerary_days" USING btree ("_parent_id");
  CREATE INDEX "events_itinerary_days_image_idx" ON "events_itinerary_days" USING btree ("image_id");
  CREATE INDEX "events_accommodation_included_order_idx" ON "events_accommodation_included" USING btree ("_order");
  CREATE INDEX "events_accommodation_included_parent_id_idx" ON "events_accommodation_included" USING btree ("_parent_id");
  CREATE INDEX "events_accommodation_not_included_order_idx" ON "events_accommodation_not_included" USING btree ("_order");
  CREATE INDEX "events_accommodation_not_included_parent_id_idx" ON "events_accommodation_not_included" USING btree ("_parent_id");
  CREATE INDEX "events_coach_team_bullets_order_idx" ON "events_coach_team_bullets" USING btree ("_order");
  CREATE INDEX "events_coach_team_bullets_parent_id_idx" ON "events_coach_team_bullets" USING btree ("_parent_id");
  CREATE INDEX "events_partner_benefits_order_idx" ON "events_partner_benefits" USING btree ("_order");
  CREATE INDEX "events_partner_benefits_parent_id_idx" ON "events_partner_benefits" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_main_picture_idx" ON "events" USING btree ("main_picture_id");
  CREATE INDEX "events_partner_idx" ON "events" USING btree ("partner_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_media_id_idx" ON "events_rels" USING btree ("media_id");
  CREATE INDEX "events_rels_categories_id_idx" ON "events_rels" USING btree ("categories_id");
  CREATE INDEX "events_rels_difficulties_id_idx" ON "events_rels" USING btree ("difficulties_id");
  CREATE INDEX "events_rels_types_id_idx" ON "events_rels" USING btree ("types_id");
  CREATE INDEX "events_rels_locations_id_idx" ON "events_rels" USING btree ("locations_id");
  CREATE INDEX "events_rels_airports_id_idx" ON "events_rels" USING btree ("airports_id");
  CREATE INDEX "events_rels_guides_id_idx" ON "events_rels" USING btree ("guides_id");
  CREATE INDEX "event_dates_event_idx" ON "event_dates" USING btree ("event_id");
  CREATE INDEX "event_dates_airport_from_idx" ON "event_dates" USING btree ("airport_from_id");
  CREATE INDEX "event_dates_airport_to_idx" ON "event_dates" USING btree ("airport_to_id");
  CREATE INDEX "event_dates_updated_at_idx" ON "event_dates" USING btree ("updated_at");
  CREATE INDEX "event_dates_created_at_idx" ON "event_dates" USING btree ("created_at");
  CREATE INDEX "event_dates_rels_order_idx" ON "event_dates_rels" USING btree ("order");
  CREATE INDEX "event_dates_rels_parent_idx" ON "event_dates_rels" USING btree ("parent_id");
  CREATE INDEX "event_dates_rels_path_idx" ON "event_dates_rels" USING btree ("path");
  CREATE INDEX "event_dates_rels_locations_id_idx" ON "event_dates_rels" USING btree ("locations_id");
  CREATE INDEX "event_dates_rels_guides_id_idx" ON "event_dates_rels" USING btree ("guides_id");
  CREATE INDEX "faqs_event_idx" ON "faqs" USING btree ("event_id");
  CREATE INDEX "faqs_type_idx" ON "faqs" USING btree ("type_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "reviews_event_idx" ON "reviews" USING btree ("event_id");
  CREATE INDEX "reviews_type_idx" ON "reviews" USING btree ("type_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_difficulties_id_idx" ON "payload_locked_documents_rels" USING btree ("difficulties_id");
  CREATE INDEX "payload_locked_documents_rels_types_id_idx" ON "payload_locked_documents_rels" USING btree ("types_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_airports_id_idx" ON "payload_locked_documents_rels" USING btree ("airports_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_event_dates_id_idx" ON "payload_locked_documents_rels" USING btree ("event_dates_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_addresses" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "difficulties" CASCADE;
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
  DROP TABLE "categories" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "airports" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "events_additional_info" CASCADE;
  DROP TABLE "events_highlights" CASCADE;
  DROP TABLE "events_audience_cards" CASCADE;
  DROP TABLE "events_prerequisites" CASCADE;
  DROP TABLE "events_essential_equipment" CASCADE;
  DROP TABLE "events_what_you_learn_box1_bullets" CASCADE;
  DROP TABLE "events_what_you_learn_box2_bullets" CASCADE;
  DROP TABLE "events_itinerary_days_highlight_tags" CASCADE;
  DROP TABLE "events_itinerary_days_schedule" CASCADE;
  DROP TABLE "events_itinerary_days" CASCADE;
  DROP TABLE "events_accommodation_included" CASCADE;
  DROP TABLE "events_accommodation_not_included" CASCADE;
  DROP TABLE "events_coach_team_bullets" CASCADE;
  DROP TABLE "events_partner_benefits" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "event_dates" CASCADE;
  DROP TABLE "event_dates_rels" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_types_program_flow_focus_tracks_color_tag";
  DROP TYPE "public"."enum_types_state";
  DROP TYPE "public"."enum_events_state";
  DROP TYPE "public"."enum_event_dates_currency";`)
}
