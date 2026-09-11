import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_ed_editorial_sections_b9f8df7c_key" AS ENUM('overview', 'dates', 'gallery', 'audience', 'learning', 'itinerary', 'comparison', 'venue', 'team', 'reviews', 'logistics', 'package', 'faq', 'booking');
  CREATE TYPE "public"."enum_event_ed_editorial_sections_b9f8df7c_visibility" AS ENUM('inherit', 'show', 'hide');
  CREATE TYPE "public"."enum_events_editorial_clear_content_fields" AS ENUM('shortDescription', 'content', 'tripDetail', 'additionalInfo', 'audienceCards', 'prerequisites', 'equipmentIntro', 'essentialEquipment', 'whatYouLearn', 'comparison', 'itinerary', 'accommodation', 'transport', 'coachFramingParagraph', 'coachTeamBullets', 'tripDetail.sections');
  CREATE TYPE "public"."enum_event_ed_editorial_content_tri_5c01bcef_kind" AS ENUM('overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes');
  CREATE TYPE "public"."enum_events_editorial_hero_secondary_target" AS ENUM('programme', 'dates');
  CREATE TYPE "public"."enum_date_ed_editorial_sections_b9f8df7c_key" AS ENUM('overview', 'dates', 'gallery', 'audience', 'learning', 'itinerary', 'comparison', 'venue', 'team', 'reviews', 'logistics', 'package', 'faq', 'booking');
  CREATE TYPE "public"."enum_date_ed_editorial_sections_b9f8df7c_visibility" AS ENUM('inherit', 'show', 'hide');
  CREATE TYPE "public"."enum_event_dates_editorial_clear_content_fields" AS ENUM('shortDescription', 'content', 'tripDetail', 'additionalInfo', 'audienceCards', 'prerequisites', 'equipmentIntro', 'essentialEquipment', 'whatYouLearn', 'comparison', 'itinerary', 'accommodation', 'transport', 'coachFramingParagraph', 'coachTeamBullets', 'tripDetail.sections');
  CREATE TYPE "public"."enum_date_ed_editorial_content_tri_5c01bcef_kind" AS ENUM('overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes');
  CREATE TYPE "public"."enum_event_dates_editorial_hero_secondary_target" AS ENUM('programme', 'dates');
  CREATE TABLE "event_ed_editorial_sections_he_ed36432a" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );

  CREATE TABLE "event_ed_editorial_sections_b9f8df7c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" "enum_event_ed_editorial_sections_b9f8df7c_key" NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "visibility" "enum_event_ed_editorial_sections_b9f8df7c_visibility" DEFAULT 'inherit',
    "clear_eyebrow" boolean,
    "clear_heading" boolean,
    "clear_intro" boolean
  );

  CREATE TABLE "event_ed_editorial_hero_title__4e20ff8e" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );

  CREATE TABLE "event_ed_editorial_daily_sched_b0663f40" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar,
    "title" varchar,
    "description" varchar
  );

  CREATE TABLE "event_ed_editorial_overview_fa_3bd2f27a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "event_ed_editorial_venue_parag_c6c437f8" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "event_ed_editorial_venue_facts_9d35d1ae" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "event_ed_editorial_practical_c_1b1f147a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "body" varchar
  );

  CREATE TABLE "event_ed_editorial_package_ite_d1fc3af4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "event_ed_editorial_faqs_1e3b6dd1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "answer" varchar
  );

  CREATE TABLE "event_ed_editorial_preview_rev_9fc4f1a1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "quote" varchar,
    "context" varchar
  );

  CREATE TABLE "event_ed_editorial_coach_profi_395ecd24" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "guide_id" integer,
    "role" varchar,
    "bio" varchar
  );

  CREATE TABLE "events_editorial_clear_content_fields" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum_events_editorial_clear_content_fields",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_tri_5c01bcef" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_event_ed_editorial_content_tri_5c01bcef_kind" NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_add_5d613f54" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb
  );

  CREATE TABLE "event_ed_editorial_content_aud_8cde1906" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" varchar NOT NULL,
    "highlighted" boolean DEFAULT false
  );

  CREATE TABLE "event_ed_editorial_content_pre_17ab7c0c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_ess_dd4c2f99" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon" varchar,
    "name" varchar NOT NULL,
    "note" varchar,
    "mandatory" boolean DEFAULT false
  );

  CREATE TABLE "event_ed_editorial_content_wha_32ae2a6b" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_wha_68706f10" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_wha_8f6bee89" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_com_49a73a0f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "left" varchar NOT NULL,
    "right" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_iti_4e3b5df0" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_iti_c4c53fc6" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar NOT NULL,
    "activity" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_iti_cfed60f3" (
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
    "image_id" varchar
  );

  CREATE TABLE "event_ed_editorial_content_acc_eaedfe7f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_acc_36bf3dd4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "event_ed_editorial_content_coa_eee2c84d" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_sections_he_ed36432a" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );

  CREATE TABLE "date_ed_editorial_sections_b9f8df7c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" "enum_date_ed_editorial_sections_b9f8df7c_key" NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "visibility" "enum_date_ed_editorial_sections_b9f8df7c_visibility" DEFAULT 'inherit',
    "clear_eyebrow" boolean,
    "clear_heading" boolean,
    "clear_intro" boolean
  );

  CREATE TABLE "date_ed_editorial_hero_title__4e20ff8e" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );

  CREATE TABLE "date_ed_editorial_daily_sched_b0663f40" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar,
    "title" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_overview_fa_3bd2f27a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_venue_parag_c6c437f8" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "date_ed_editorial_venue_facts_9d35d1ae" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_practical_c_1b1f147a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "body" varchar
  );

  CREATE TABLE "date_ed_editorial_package_ite_d1fc3af4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "date_ed_editorial_faqs_1e3b6dd1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "answer" varchar
  );

  CREATE TABLE "date_ed_editorial_preview_rev_9fc4f1a1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "quote" varchar,
    "context" varchar
  );

  CREATE TABLE "date_ed_editorial_coach_profi_395ecd24" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "guide_id" integer,
    "role" varchar,
    "bio" varchar
  );

  CREATE TABLE "event_dates_editorial_clear_content_fields" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum_event_dates_editorial_clear_content_fields",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_tri_5c01bcef" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_date_ed_editorial_content_tri_5c01bcef_kind" NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_add_5d613f54" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb
  );

  CREATE TABLE "date_ed_editorial_content_aud_8cde1906" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" varchar NOT NULL,
    "highlighted" boolean DEFAULT false
  );

  CREATE TABLE "date_ed_editorial_content_pre_17ab7c0c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_ess_dd4c2f99" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon" varchar,
    "name" varchar NOT NULL,
    "note" varchar,
    "mandatory" boolean DEFAULT false
  );

  CREATE TABLE "date_ed_editorial_content_wha_32ae2a6b" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_wha_68706f10" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_wha_8f6bee89" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_com_49a73a0f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "left" varchar NOT NULL,
    "right" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_iti_4e3b5df0" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_iti_c4c53fc6" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar NOT NULL,
    "activity" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_iti_cfed60f3" (
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
    "image_id" varchar
  );

  CREATE TABLE "date_ed_editorial_content_acc_eaedfe7f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_acc_36bf3dd4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "date_ed_editorial_content_coa_eee2c84d" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );

  ALTER TABLE "events" ADD COLUMN "editorial_hero_description" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_hero_hashtag" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_hero_primary_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_hero_secondary_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_hero_secondary_target" "enum_events_editorial_hero_secondary_target";
  ALTER TABLE "events" ADD COLUMN "editorial_hero_clear_hashtag" boolean;
  ALTER TABLE "events" ADD COLUMN "editorial_package_note" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_booking_primary_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_booking_secondary_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_booking_support" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_title" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_short_description" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_content" jsonb;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_location_descriptor" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_grade_range" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_lead_requirement" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_minimum_participants" numeric;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_price_caption" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_travel_note" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_trip_detail_hashtag" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_equipment_intro" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_what_you_learn_intro" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_what_you_learn_box1_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_what_you_learn_box2_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_what_you_learn_box3_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_comparison_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_comparison_intro" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_comparison_left_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_comparison_right_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_itinerary_intro" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_content_accommodation_description" jsonb;
  ALTER TABLE "events" ADD COLUMN "editorial_content_accommodation_cuisine_highlights" jsonb;
  ALTER TABLE "events" ADD COLUMN "editorial_content_transport_description" jsonb;
  ALTER TABLE "events" ADD COLUMN "editorial_content_coach_framing_paragraph" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_description" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_hashtag" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_primary_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_secondary_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_secondary_target" "enum_event_dates_editorial_hero_secondary_target";
  ALTER TABLE "event_dates" ADD COLUMN "editorial_hero_clear_hashtag" boolean;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_package_note" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_booking_primary_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_booking_secondary_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_booking_support" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_title" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_short_description" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_content" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_location_descriptor" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_grade_range" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_lead_requirement" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_minimum_participants" numeric;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_price_caption" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_travel_note" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_trip_detail_hashtag" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_equipment_intro" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_what_you_learn_intro" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_what_you_learn_box1_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_what_you_learn_box2_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_what_you_learn_box3_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_comparison_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_comparison_intro" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_comparison_left_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_comparison_right_heading" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_itinerary_intro" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_accommodation_description" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_accommodation_cuisine_highlights" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_transport_description" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_content_coach_framing_paragraph" varchar;
  ALTER TABLE "event_dates_rels" ADD COLUMN "airports_id" integer;
  ALTER TABLE "event_ed_editorial_sections_he_ed36432a" ADD CONSTRAINT "event_ed_editorial_sections_he_ed36432a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_ed_editorial_sections_b9f8df7c"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_sections_b9f8df7c" ADD CONSTRAINT "event_ed_editorial_sections_b9f8df7c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_hero_title__4e20ff8e" ADD CONSTRAINT "event_ed_editorial_hero_title__4e20ff8e_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_daily_sched_b0663f40" ADD CONSTRAINT "event_ed_editorial_daily_sched_b0663f40_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_overview_fa_3bd2f27a" ADD CONSTRAINT "event_ed_editorial_overview_fa_3bd2f27a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_venue_parag_c6c437f8" ADD CONSTRAINT "event_ed_editorial_venue_parag_c6c437f8_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_venue_facts_9d35d1ae" ADD CONSTRAINT "event_ed_editorial_venue_facts_9d35d1ae_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_practical_c_1b1f147a" ADD CONSTRAINT "event_ed_editorial_practical_c_1b1f147a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_package_ite_d1fc3af4" ADD CONSTRAINT "event_ed_editorial_package_ite_d1fc3af4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_faqs_1e3b6dd1" ADD CONSTRAINT "event_ed_editorial_faqs_1e3b6dd1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_preview_rev_9fc4f1a1" ADD CONSTRAINT "event_ed_editorial_preview_rev_9fc4f1a1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "event_ed_editorial_coach_profi_395ecd24_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "event_ed_editorial_coach_profi_395ecd24_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_editorial_clear_content_fields" ADD CONSTRAINT "events_editorial_clear_content_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_tri_5c01bcef" ADD CONSTRAINT "event_ed_editorial_content_tri_5c01bcef_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_add_5d613f54" ADD CONSTRAINT "event_ed_editorial_content_add_5d613f54_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_aud_8cde1906" ADD CONSTRAINT "event_ed_editorial_content_aud_8cde1906_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_pre_17ab7c0c" ADD CONSTRAINT "event_ed_editorial_content_pre_17ab7c0c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_ess_dd4c2f99" ADD CONSTRAINT "event_ed_editorial_content_ess_dd4c2f99_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_wha_32ae2a6b" ADD CONSTRAINT "event_ed_editorial_content_wha_32ae2a6b_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_wha_68706f10" ADD CONSTRAINT "event_ed_editorial_content_wha_68706f10_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_wha_8f6bee89" ADD CONSTRAINT "event_ed_editorial_content_wha_8f6bee89_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_com_49a73a0f" ADD CONSTRAINT "event_ed_editorial_content_com_49a73a0f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_iti_4e3b5df0" ADD CONSTRAINT "event_ed_editorial_content_iti_4e3b5df0_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_iti_c4c53fc6" ADD CONSTRAINT "event_ed_editorial_content_iti_c4c53fc6_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_iti_cfed60f3" ADD CONSTRAINT "event_ed_editorial_content_iti_cfed60f3_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_iti_cfed60f3" ADD CONSTRAINT "event_ed_editorial_content_iti_cfed60f3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_acc_eaedfe7f" ADD CONSTRAINT "event_ed_editorial_content_acc_eaedfe7f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_acc_36bf3dd4" ADD CONSTRAINT "event_ed_editorial_content_acc_36bf3dd4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_content_coa_eee2c84d" ADD CONSTRAINT "event_ed_editorial_content_coa_eee2c84d_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_sections_he_ed36432a" ADD CONSTRAINT "date_ed_editorial_sections_he_ed36432a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."date_ed_editorial_sections_b9f8df7c"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_sections_b9f8df7c" ADD CONSTRAINT "date_ed_editorial_sections_b9f8df7c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_hero_title__4e20ff8e" ADD CONSTRAINT "date_ed_editorial_hero_title__4e20ff8e_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_daily_sched_b0663f40" ADD CONSTRAINT "date_ed_editorial_daily_sched_b0663f40_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_overview_fa_3bd2f27a" ADD CONSTRAINT "date_ed_editorial_overview_fa_3bd2f27a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_venue_parag_c6c437f8" ADD CONSTRAINT "date_ed_editorial_venue_parag_c6c437f8_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_venue_facts_9d35d1ae" ADD CONSTRAINT "date_ed_editorial_venue_facts_9d35d1ae_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_practical_c_1b1f147a" ADD CONSTRAINT "date_ed_editorial_practical_c_1b1f147a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_package_ite_d1fc3af4" ADD CONSTRAINT "date_ed_editorial_package_ite_d1fc3af4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_faqs_1e3b6dd1" ADD CONSTRAINT "date_ed_editorial_faqs_1e3b6dd1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_preview_rev_9fc4f1a1" ADD CONSTRAINT "date_ed_editorial_preview_rev_9fc4f1a1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "date_ed_editorial_coach_profi_395ecd24_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "date_ed_editorial_coach_profi_395ecd24_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_dates_editorial_clear_content_fields" ADD CONSTRAINT "event_dates_editorial_clear_content_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_tri_5c01bcef" ADD CONSTRAINT "date_ed_editorial_content_tri_5c01bcef_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_add_5d613f54" ADD CONSTRAINT "date_ed_editorial_content_add_5d613f54_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_aud_8cde1906" ADD CONSTRAINT "date_ed_editorial_content_aud_8cde1906_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_pre_17ab7c0c" ADD CONSTRAINT "date_ed_editorial_content_pre_17ab7c0c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_ess_dd4c2f99" ADD CONSTRAINT "date_ed_editorial_content_ess_dd4c2f99_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_wha_32ae2a6b" ADD CONSTRAINT "date_ed_editorial_content_wha_32ae2a6b_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_wha_68706f10" ADD CONSTRAINT "date_ed_editorial_content_wha_68706f10_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_wha_8f6bee89" ADD CONSTRAINT "date_ed_editorial_content_wha_8f6bee89_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_com_49a73a0f" ADD CONSTRAINT "date_ed_editorial_content_com_49a73a0f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_iti_4e3b5df0" ADD CONSTRAINT "date_ed_editorial_content_iti_4e3b5df0_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."date_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_iti_c4c53fc6" ADD CONSTRAINT "date_ed_editorial_content_iti_c4c53fc6_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."date_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_iti_cfed60f3" ADD CONSTRAINT "date_ed_editorial_content_iti_cfed60f3_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_iti_cfed60f3" ADD CONSTRAINT "date_ed_editorial_content_iti_cfed60f3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_acc_eaedfe7f" ADD CONSTRAINT "date_ed_editorial_content_acc_eaedfe7f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_acc_36bf3dd4" ADD CONSTRAINT "date_ed_editorial_content_acc_36bf3dd4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_content_coa_eee2c84d" ADD CONSTRAINT "date_ed_editorial_content_coa_eee2c84d_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_ed_editorial_sections_he_ed36432a_order_idx" ON "event_ed_editorial_sections_he_ed36432a" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_sections_he_ed36432a_parent_id_idx" ON "event_ed_editorial_sections_he_ed36432a" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_sections_b9f8df7c_order_idx" ON "event_ed_editorial_sections_b9f8df7c" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_sections_b9f8df7c_parent_id_idx" ON "event_ed_editorial_sections_b9f8df7c" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_hero_title__4e20ff8e_order_idx" ON "event_ed_editorial_hero_title__4e20ff8e" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_hero_title__4e20ff8e_parent_id_idx" ON "event_ed_editorial_hero_title__4e20ff8e" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_daily_sched_b0663f40_order_idx" ON "event_ed_editorial_daily_sched_b0663f40" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_daily_sched_b0663f40_parent_id_idx" ON "event_ed_editorial_daily_sched_b0663f40" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_overview_fa_3bd2f27a_order_idx" ON "event_ed_editorial_overview_fa_3bd2f27a" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_overview_fa_3bd2f27a_parent_id_idx" ON "event_ed_editorial_overview_fa_3bd2f27a" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_venue_parag_c6c437f8_order_idx" ON "event_ed_editorial_venue_parag_c6c437f8" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_venue_parag_c6c437f8_parent_id_idx" ON "event_ed_editorial_venue_parag_c6c437f8" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_venue_facts_9d35d1ae_order_idx" ON "event_ed_editorial_venue_facts_9d35d1ae" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_venue_facts_9d35d1ae_parent_id_idx" ON "event_ed_editorial_venue_facts_9d35d1ae" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_practical_c_1b1f147a_order_idx" ON "event_ed_editorial_practical_c_1b1f147a" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_practical_c_1b1f147a_parent_id_idx" ON "event_ed_editorial_practical_c_1b1f147a" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_package_ite_d1fc3af4_order_idx" ON "event_ed_editorial_package_ite_d1fc3af4" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_package_ite_d1fc3af4_parent_id_idx" ON "event_ed_editorial_package_ite_d1fc3af4" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_faqs_1e3b6dd1_order_idx" ON "event_ed_editorial_faqs_1e3b6dd1" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_faqs_1e3b6dd1_parent_id_idx" ON "event_ed_editorial_faqs_1e3b6dd1" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_preview_rev_9fc4f1a1_order_idx" ON "event_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_preview_rev_9fc4f1a1_parent_id_idx" ON "event_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_coach_profi_395ecd24_order_idx" ON "event_ed_editorial_coach_profi_395ecd24" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_coach_profi_395ecd24_parent_id_idx" ON "event_ed_editorial_coach_profi_395ecd24" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_coach_profi_395ecd24_guide_idx" ON "event_ed_editorial_coach_profi_395ecd24" USING btree ("guide_id");
  CREATE INDEX "events_editorial_clear_content_fields_order_idx" ON "events_editorial_clear_content_fields" USING btree ("order");
  CREATE INDEX "events_editorial_clear_content_fields_parent_idx" ON "events_editorial_clear_content_fields" USING btree ("parent_id");
  CREATE INDEX "event_ed_editorial_content_tri_5c01bcef_order_idx" ON "event_ed_editorial_content_tri_5c01bcef" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_tri_5c01bcef_parent_id_idx" ON "event_ed_editorial_content_tri_5c01bcef" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_add_5d613f54_order_idx" ON "event_ed_editorial_content_add_5d613f54" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_add_5d613f54_parent_id_idx" ON "event_ed_editorial_content_add_5d613f54" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_aud_8cde1906_order_idx" ON "event_ed_editorial_content_aud_8cde1906" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_aud_8cde1906_parent_id_idx" ON "event_ed_editorial_content_aud_8cde1906" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_pre_17ab7c0c_order_idx" ON "event_ed_editorial_content_pre_17ab7c0c" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_pre_17ab7c0c_parent_id_idx" ON "event_ed_editorial_content_pre_17ab7c0c" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_ess_dd4c2f99_order_idx" ON "event_ed_editorial_content_ess_dd4c2f99" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_ess_dd4c2f99_parent_id_idx" ON "event_ed_editorial_content_ess_dd4c2f99" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_wha_32ae2a6b_order_idx" ON "event_ed_editorial_content_wha_32ae2a6b" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_wha_32ae2a6b_parent_id_idx" ON "event_ed_editorial_content_wha_32ae2a6b" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_wha_68706f10_order_idx" ON "event_ed_editorial_content_wha_68706f10" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_wha_68706f10_parent_id_idx" ON "event_ed_editorial_content_wha_68706f10" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_wha_8f6bee89_order_idx" ON "event_ed_editorial_content_wha_8f6bee89" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_wha_8f6bee89_parent_id_idx" ON "event_ed_editorial_content_wha_8f6bee89" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_com_49a73a0f_order_idx" ON "event_ed_editorial_content_com_49a73a0f" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_com_49a73a0f_parent_id_idx" ON "event_ed_editorial_content_com_49a73a0f" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_iti_4e3b5df0_order_idx" ON "event_ed_editorial_content_iti_4e3b5df0" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_iti_4e3b5df0_parent_id_idx" ON "event_ed_editorial_content_iti_4e3b5df0" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_iti_c4c53fc6_order_idx" ON "event_ed_editorial_content_iti_c4c53fc6" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_iti_c4c53fc6_parent_id_idx" ON "event_ed_editorial_content_iti_c4c53fc6" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_iti_cfed60f3_order_idx" ON "event_ed_editorial_content_iti_cfed60f3" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_iti_cfed60f3_parent_id_idx" ON "event_ed_editorial_content_iti_cfed60f3" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_iti_cfed60f3_image_idx" ON "event_ed_editorial_content_iti_cfed60f3" USING btree ("image_id");
  CREATE INDEX "event_ed_editorial_content_acc_eaedfe7f_order_idx" ON "event_ed_editorial_content_acc_eaedfe7f" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_acc_eaedfe7f_parent_id_idx" ON "event_ed_editorial_content_acc_eaedfe7f" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_acc_36bf3dd4_order_idx" ON "event_ed_editorial_content_acc_36bf3dd4" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_acc_36bf3dd4_parent_id_idx" ON "event_ed_editorial_content_acc_36bf3dd4" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_content_coa_eee2c84d_order_idx" ON "event_ed_editorial_content_coa_eee2c84d" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_content_coa_eee2c84d_parent_id_idx" ON "event_ed_editorial_content_coa_eee2c84d" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_sections_he_ed36432a_order_idx" ON "date_ed_editorial_sections_he_ed36432a" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_sections_he_ed36432a_parent_id_idx" ON "date_ed_editorial_sections_he_ed36432a" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_sections_b9f8df7c_order_idx" ON "date_ed_editorial_sections_b9f8df7c" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_sections_b9f8df7c_parent_id_idx" ON "date_ed_editorial_sections_b9f8df7c" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_hero_title__4e20ff8e_order_idx" ON "date_ed_editorial_hero_title__4e20ff8e" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_hero_title__4e20ff8e_parent_id_idx" ON "date_ed_editorial_hero_title__4e20ff8e" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_daily_sched_b0663f40_order_idx" ON "date_ed_editorial_daily_sched_b0663f40" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_daily_sched_b0663f40_parent_id_idx" ON "date_ed_editorial_daily_sched_b0663f40" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_overview_fa_3bd2f27a_order_idx" ON "date_ed_editorial_overview_fa_3bd2f27a" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_overview_fa_3bd2f27a_parent_id_idx" ON "date_ed_editorial_overview_fa_3bd2f27a" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_venue_parag_c6c437f8_order_idx" ON "date_ed_editorial_venue_parag_c6c437f8" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_venue_parag_c6c437f8_parent_id_idx" ON "date_ed_editorial_venue_parag_c6c437f8" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_venue_facts_9d35d1ae_order_idx" ON "date_ed_editorial_venue_facts_9d35d1ae" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_venue_facts_9d35d1ae_parent_id_idx" ON "date_ed_editorial_venue_facts_9d35d1ae" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_practical_c_1b1f147a_order_idx" ON "date_ed_editorial_practical_c_1b1f147a" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_practical_c_1b1f147a_parent_id_idx" ON "date_ed_editorial_practical_c_1b1f147a" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_package_ite_d1fc3af4_order_idx" ON "date_ed_editorial_package_ite_d1fc3af4" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_package_ite_d1fc3af4_parent_id_idx" ON "date_ed_editorial_package_ite_d1fc3af4" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_faqs_1e3b6dd1_order_idx" ON "date_ed_editorial_faqs_1e3b6dd1" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_faqs_1e3b6dd1_parent_id_idx" ON "date_ed_editorial_faqs_1e3b6dd1" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_preview_rev_9fc4f1a1_order_idx" ON "date_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_preview_rev_9fc4f1a1_parent_id_idx" ON "date_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_coach_profi_395ecd24_order_idx" ON "date_ed_editorial_coach_profi_395ecd24" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_coach_profi_395ecd24_parent_id_idx" ON "date_ed_editorial_coach_profi_395ecd24" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_coach_profi_395ecd24_guide_idx" ON "date_ed_editorial_coach_profi_395ecd24" USING btree ("guide_id");
  CREATE INDEX "event_dates_editorial_clear_content_fields_order_idx" ON "event_dates_editorial_clear_content_fields" USING btree ("order");
  CREATE INDEX "event_dates_editorial_clear_content_fields_parent_idx" ON "event_dates_editorial_clear_content_fields" USING btree ("parent_id");
  CREATE INDEX "date_ed_editorial_content_tri_5c01bcef_order_idx" ON "date_ed_editorial_content_tri_5c01bcef" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_tri_5c01bcef_parent_id_idx" ON "date_ed_editorial_content_tri_5c01bcef" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_add_5d613f54_order_idx" ON "date_ed_editorial_content_add_5d613f54" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_add_5d613f54_parent_id_idx" ON "date_ed_editorial_content_add_5d613f54" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_aud_8cde1906_order_idx" ON "date_ed_editorial_content_aud_8cde1906" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_aud_8cde1906_parent_id_idx" ON "date_ed_editorial_content_aud_8cde1906" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_pre_17ab7c0c_order_idx" ON "date_ed_editorial_content_pre_17ab7c0c" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_pre_17ab7c0c_parent_id_idx" ON "date_ed_editorial_content_pre_17ab7c0c" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_ess_dd4c2f99_order_idx" ON "date_ed_editorial_content_ess_dd4c2f99" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_ess_dd4c2f99_parent_id_idx" ON "date_ed_editorial_content_ess_dd4c2f99" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_wha_32ae2a6b_order_idx" ON "date_ed_editorial_content_wha_32ae2a6b" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_wha_32ae2a6b_parent_id_idx" ON "date_ed_editorial_content_wha_32ae2a6b" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_wha_68706f10_order_idx" ON "date_ed_editorial_content_wha_68706f10" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_wha_68706f10_parent_id_idx" ON "date_ed_editorial_content_wha_68706f10" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_wha_8f6bee89_order_idx" ON "date_ed_editorial_content_wha_8f6bee89" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_wha_8f6bee89_parent_id_idx" ON "date_ed_editorial_content_wha_8f6bee89" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_com_49a73a0f_order_idx" ON "date_ed_editorial_content_com_49a73a0f" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_com_49a73a0f_parent_id_idx" ON "date_ed_editorial_content_com_49a73a0f" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_iti_4e3b5df0_order_idx" ON "date_ed_editorial_content_iti_4e3b5df0" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_iti_4e3b5df0_parent_id_idx" ON "date_ed_editorial_content_iti_4e3b5df0" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_iti_c4c53fc6_order_idx" ON "date_ed_editorial_content_iti_c4c53fc6" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_iti_c4c53fc6_parent_id_idx" ON "date_ed_editorial_content_iti_c4c53fc6" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_iti_cfed60f3_order_idx" ON "date_ed_editorial_content_iti_cfed60f3" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_iti_cfed60f3_parent_id_idx" ON "date_ed_editorial_content_iti_cfed60f3" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_iti_cfed60f3_image_idx" ON "date_ed_editorial_content_iti_cfed60f3" USING btree ("image_id");
  CREATE INDEX "date_ed_editorial_content_acc_eaedfe7f_order_idx" ON "date_ed_editorial_content_acc_eaedfe7f" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_acc_eaedfe7f_parent_id_idx" ON "date_ed_editorial_content_acc_eaedfe7f" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_acc_36bf3dd4_order_idx" ON "date_ed_editorial_content_acc_36bf3dd4" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_acc_36bf3dd4_parent_id_idx" ON "date_ed_editorial_content_acc_36bf3dd4" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_content_coa_eee2c84d_order_idx" ON "date_ed_editorial_content_coa_eee2c84d" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_content_coa_eee2c84d_parent_id_idx" ON "date_ed_editorial_content_coa_eee2c84d" USING btree ("_parent_id");
  ALTER TABLE "event_dates_rels" ADD CONSTRAINT "event_dates_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_dates_rels_airports_id_idx" ON "event_dates_rels" USING btree ("airports_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_ed_editorial_sections_he_ed36432a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_sections_b9f8df7c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_hero_title__4e20ff8e" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_daily_sched_b0663f40" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_overview_fa_3bd2f27a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_venue_parag_c6c437f8" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_venue_facts_9d35d1ae" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_practical_c_1b1f147a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_package_ite_d1fc3af4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_faqs_1e3b6dd1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_preview_rev_9fc4f1a1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_coach_profi_395ecd24" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_editorial_clear_content_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_tri_5c01bcef" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_add_5d613f54" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_aud_8cde1906" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_pre_17ab7c0c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_ess_dd4c2f99" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_wha_32ae2a6b" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_wha_68706f10" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_wha_8f6bee89" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_com_49a73a0f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_iti_4e3b5df0" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_iti_c4c53fc6" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_iti_cfed60f3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_acc_eaedfe7f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_acc_36bf3dd4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_content_coa_eee2c84d" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_sections_he_ed36432a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_sections_b9f8df7c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_hero_title__4e20ff8e" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_daily_sched_b0663f40" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_overview_fa_3bd2f27a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_venue_parag_c6c437f8" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_venue_facts_9d35d1ae" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_practical_c_1b1f147a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_package_ite_d1fc3af4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_faqs_1e3b6dd1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_preview_rev_9fc4f1a1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_coach_profi_395ecd24" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_dates_editorial_clear_content_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_tri_5c01bcef" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_add_5d613f54" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_aud_8cde1906" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_pre_17ab7c0c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_ess_dd4c2f99" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_wha_32ae2a6b" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_wha_68706f10" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_wha_8f6bee89" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_com_49a73a0f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_iti_4e3b5df0" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_iti_c4c53fc6" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_iti_cfed60f3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_acc_eaedfe7f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_acc_36bf3dd4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_content_coa_eee2c84d" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_ed_editorial_sections_he_ed36432a" CASCADE;
  DROP TABLE "event_ed_editorial_sections_b9f8df7c" CASCADE;
  DROP TABLE "event_ed_editorial_hero_title__4e20ff8e" CASCADE;
  DROP TABLE "event_ed_editorial_daily_sched_b0663f40" CASCADE;
  DROP TABLE "event_ed_editorial_overview_fa_3bd2f27a" CASCADE;
  DROP TABLE "event_ed_editorial_venue_parag_c6c437f8" CASCADE;
  DROP TABLE "event_ed_editorial_venue_facts_9d35d1ae" CASCADE;
  DROP TABLE "event_ed_editorial_practical_c_1b1f147a" CASCADE;
  DROP TABLE "event_ed_editorial_package_ite_d1fc3af4" CASCADE;
  DROP TABLE "event_ed_editorial_faqs_1e3b6dd1" CASCADE;
  DROP TABLE "event_ed_editorial_preview_rev_9fc4f1a1" CASCADE;
  DROP TABLE "event_ed_editorial_coach_profi_395ecd24" CASCADE;
  DROP TABLE "events_editorial_clear_content_fields" CASCADE;
  DROP TABLE "event_ed_editorial_content_tri_5c01bcef" CASCADE;
  DROP TABLE "event_ed_editorial_content_add_5d613f54" CASCADE;
  DROP TABLE "event_ed_editorial_content_aud_8cde1906" CASCADE;
  DROP TABLE "event_ed_editorial_content_pre_17ab7c0c" CASCADE;
  DROP TABLE "event_ed_editorial_content_ess_dd4c2f99" CASCADE;
  DROP TABLE "event_ed_editorial_content_wha_32ae2a6b" CASCADE;
  DROP TABLE "event_ed_editorial_content_wha_68706f10" CASCADE;
  DROP TABLE "event_ed_editorial_content_wha_8f6bee89" CASCADE;
  DROP TABLE "event_ed_editorial_content_com_49a73a0f" CASCADE;
  DROP TABLE "event_ed_editorial_content_iti_4e3b5df0" CASCADE;
  DROP TABLE "event_ed_editorial_content_iti_c4c53fc6" CASCADE;
  DROP TABLE "event_ed_editorial_content_iti_cfed60f3" CASCADE;
  DROP TABLE "event_ed_editorial_content_acc_eaedfe7f" CASCADE;
  DROP TABLE "event_ed_editorial_content_acc_36bf3dd4" CASCADE;
  DROP TABLE "event_ed_editorial_content_coa_eee2c84d" CASCADE;
  DROP TABLE "date_ed_editorial_sections_he_ed36432a" CASCADE;
  DROP TABLE "date_ed_editorial_sections_b9f8df7c" CASCADE;
  DROP TABLE "date_ed_editorial_hero_title__4e20ff8e" CASCADE;
  DROP TABLE "date_ed_editorial_daily_sched_b0663f40" CASCADE;
  DROP TABLE "date_ed_editorial_overview_fa_3bd2f27a" CASCADE;
  DROP TABLE "date_ed_editorial_venue_parag_c6c437f8" CASCADE;
  DROP TABLE "date_ed_editorial_venue_facts_9d35d1ae" CASCADE;
  DROP TABLE "date_ed_editorial_practical_c_1b1f147a" CASCADE;
  DROP TABLE "date_ed_editorial_package_ite_d1fc3af4" CASCADE;
  DROP TABLE "date_ed_editorial_faqs_1e3b6dd1" CASCADE;
  DROP TABLE "date_ed_editorial_preview_rev_9fc4f1a1" CASCADE;
  DROP TABLE "date_ed_editorial_coach_profi_395ecd24" CASCADE;
  DROP TABLE "event_dates_editorial_clear_content_fields" CASCADE;
  DROP TABLE "date_ed_editorial_content_tri_5c01bcef" CASCADE;
  DROP TABLE "date_ed_editorial_content_add_5d613f54" CASCADE;
  DROP TABLE "date_ed_editorial_content_aud_8cde1906" CASCADE;
  DROP TABLE "date_ed_editorial_content_pre_17ab7c0c" CASCADE;
  DROP TABLE "date_ed_editorial_content_ess_dd4c2f99" CASCADE;
  DROP TABLE "date_ed_editorial_content_wha_32ae2a6b" CASCADE;
  DROP TABLE "date_ed_editorial_content_wha_68706f10" CASCADE;
  DROP TABLE "date_ed_editorial_content_wha_8f6bee89" CASCADE;
  DROP TABLE "date_ed_editorial_content_com_49a73a0f" CASCADE;
  DROP TABLE "date_ed_editorial_content_iti_4e3b5df0" CASCADE;
  DROP TABLE "date_ed_editorial_content_iti_c4c53fc6" CASCADE;
  DROP TABLE "date_ed_editorial_content_iti_cfed60f3" CASCADE;
  DROP TABLE "date_ed_editorial_content_acc_eaedfe7f" CASCADE;
  DROP TABLE "date_ed_editorial_content_acc_36bf3dd4" CASCADE;
  DROP TABLE "date_ed_editorial_content_coa_eee2c84d" CASCADE;
  ALTER TABLE "event_dates_rels" DROP CONSTRAINT "event_dates_rels_airports_fk";

  DROP INDEX "event_dates_rels_airports_id_idx";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_description";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_hashtag";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_primary_label";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_secondary_label";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_secondary_target";
  ALTER TABLE "events" DROP COLUMN "editorial_hero_clear_hashtag";
  ALTER TABLE "events" DROP COLUMN "editorial_package_note";
  ALTER TABLE "events" DROP COLUMN "editorial_booking_primary_label";
  ALTER TABLE "events" DROP COLUMN "editorial_booking_secondary_label";
  ALTER TABLE "events" DROP COLUMN "editorial_booking_support";
  ALTER TABLE "events" DROP COLUMN "editorial_content_title";
  ALTER TABLE "events" DROP COLUMN "editorial_content_short_description";
  ALTER TABLE "events" DROP COLUMN "editorial_content_content";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_location_descriptor";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_grade_range";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_lead_requirement";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_minimum_participants";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_price_caption";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_travel_note";
  ALTER TABLE "events" DROP COLUMN "editorial_content_trip_detail_hashtag";
  ALTER TABLE "events" DROP COLUMN "editorial_content_equipment_intro";
  ALTER TABLE "events" DROP COLUMN "editorial_content_what_you_learn_intro";
  ALTER TABLE "events" DROP COLUMN "editorial_content_what_you_learn_box1_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_what_you_learn_box2_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_what_you_learn_box3_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_comparison_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_comparison_intro";
  ALTER TABLE "events" DROP COLUMN "editorial_content_comparison_left_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_comparison_right_heading";
  ALTER TABLE "events" DROP COLUMN "editorial_content_itinerary_intro";
  ALTER TABLE "events" DROP COLUMN "editorial_content_accommodation_description";
  ALTER TABLE "events" DROP COLUMN "editorial_content_accommodation_cuisine_highlights";
  ALTER TABLE "events" DROP COLUMN "editorial_content_transport_description";
  ALTER TABLE "events" DROP COLUMN "editorial_content_coach_framing_paragraph";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_description";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_hashtag";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_primary_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_secondary_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_secondary_target";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_hero_clear_hashtag";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_package_note";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_booking_primary_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_booking_secondary_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_booking_support";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_title";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_short_description";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_content";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_location_descriptor";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_grade_range";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_lead_requirement";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_minimum_participants";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_price_caption";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_travel_note";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_trip_detail_hashtag";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_equipment_intro";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_what_you_learn_intro";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_what_you_learn_box1_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_what_you_learn_box2_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_what_you_learn_box3_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_comparison_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_comparison_intro";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_comparison_left_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_comparison_right_heading";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_itinerary_intro";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_accommodation_description";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_accommodation_cuisine_highlights";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_transport_description";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_content_coach_framing_paragraph";
  ALTER TABLE "event_dates_rels" DROP COLUMN "airports_id";
  DROP TYPE "public"."enum_event_ed_editorial_sections_b9f8df7c_key";
  DROP TYPE "public"."enum_event_ed_editorial_sections_b9f8df7c_visibility";
  DROP TYPE "public"."enum_events_editorial_clear_content_fields";
  DROP TYPE "public"."enum_event_ed_editorial_content_tri_5c01bcef_kind";
  DROP TYPE "public"."enum_events_editorial_hero_secondary_target";
  DROP TYPE "public"."enum_date_ed_editorial_sections_b9f8df7c_key";
  DROP TYPE "public"."enum_date_ed_editorial_sections_b9f8df7c_visibility";
  DROP TYPE "public"."enum_event_dates_editorial_clear_content_fields";
  DROP TYPE "public"."enum_date_ed_editorial_content_tri_5c01bcef_kind";
  DROP TYPE "public"."enum_event_dates_editorial_hero_secondary_target";`)
}
