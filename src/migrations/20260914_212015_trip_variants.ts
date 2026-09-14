import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_variant_ed_editorial_sections_b9f8df7c_key" AS ENUM('overview', 'dates', 'gallery', 'audience', 'learning', 'itinerary', 'comparison', 'venue', 'team', 'reviews', 'logistics', 'package', 'faq', 'booking');
  CREATE TYPE "public"."enum_variant_ed_editorial_sections_b9f8df7c_visibility" AS ENUM('inherit', 'show', 'hide');
  CREATE TYPE "public"."enum_trip_variants_editorial_clear_content_fields" AS ENUM('shortDescription', 'content', 'tripDetail', 'additionalInfo', 'audienceCards', 'prerequisites', 'equipmentIntro', 'essentialEquipment', 'whatYouLearn', 'comparison', 'itinerary', 'accommodation', 'transport', 'coachFramingParagraph', 'coachTeamBullets', 'tripDetail.sections');
  CREATE TYPE "public"."enum_variant_ed_editorial_content_tri_5c01bcef_kind" AS ENUM('overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes');
  CREATE TYPE "public"."enum_trip_variants_editorial_hero_secondary_target" AS ENUM('programme', 'dates');
  CREATE TYPE "public"."enum_trip_variants_editorial_dates_mode" AS ENUM('list', 'notice');
  CREATE TABLE "trip_variants_slug_aliases" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_sections_he_ed36432a" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );
  CREATE TABLE "variant_ed_editorial_sections_b9f8df7c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" "enum_variant_ed_editorial_sections_b9f8df7c_key" NOT NULL,
    "eyebrow" varchar,
    "heading" varchar,
    "intro" varchar,
    "visibility" "enum_variant_ed_editorial_sections_b9f8df7c_visibility" DEFAULT 'inherit',
    "clear_eyebrow" boolean,
    "clear_heading" boolean,
    "clear_intro" boolean
  );
  CREATE TABLE "variant_ed_editorial_hero_title__4e20ff8e" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL,
    "accent" boolean,
    "break_before" boolean
  );
  CREATE TABLE "variant_ed_editorial_daily_sched_b0663f40" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar,
    "title" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_overview_fa_3bd2f27a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_facts_strip_adc3993f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_summary_row_f87389cd" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_companion_c_d9e77b3f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar
  );
  CREATE TABLE "variant_ed_editorial_companion_r_21fbc092" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );
  CREATE TABLE "variant_ed_editorial_companion_r_5d4fe449" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_companion_l_1f347525" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "href" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_venue_parag_c6c437f8" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );
  CREATE TABLE "variant_ed_editorial_venue_facts_9d35d1ae" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_practical_c_1b1f147a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "body" varchar
  );
  CREATE TABLE "variant_ed_editorial_package_ite_d1fc3af4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );
  CREATE TABLE "variant_ed_editorial_faqs_1e3b6dd1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "answer" varchar
  );
  CREATE TABLE "variant_ed_editorial_preview_rev_9fc4f1a1" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "quote" varchar,
    "context" varchar
  );
  CREATE TABLE "variant_ed_editorial_coach_profi_395ecd24" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "guide_id" integer,
    "role" varchar,
    "bio" varchar
  );
  CREATE TABLE "trip_variants_editorial_clear_content_fields" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum_trip_variants_editorial_clear_content_fields",
    "id" serial PRIMARY KEY NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_tri_5c01bcef" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_variant_ed_editorial_content_tri_5c01bcef_kind" NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_add_5d613f54" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb
  );
  CREATE TABLE "variant_ed_editorial_content_aud_8cde1906" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "body" varchar NOT NULL,
    "highlighted" boolean DEFAULT false
  );
  CREATE TABLE "variant_ed_editorial_content_pre_17ab7c0c" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_ess_dd4c2f99" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon" varchar,
    "name" varchar NOT NULL,
    "note" varchar,
    "mandatory" boolean DEFAULT false
  );
  CREATE TABLE "variant_ed_editorial_content_wha_32ae2a6b" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_wha_68706f10" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_wha_8f6bee89" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_com_49a73a0f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "left" varchar NOT NULL,
    "right" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_iti_4e3b5df0" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_iti_c4c53fc6" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar NOT NULL,
    "activity" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_iti_cfed60f3" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "day_badge" varchar,
    "destination_icon" varchar,
    "destination_name" varchar NOT NULL,
    "meta_line" varchar,
    "eyebrow" varchar,
    "heading" varchar,
    "description" varchar
  );
  CREATE TABLE "variant_ed_editorial_content_acc_eaedfe7f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_acc_36bf3dd4" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "variant_ed_editorial_content_coa_eee2c84d" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar NOT NULL
  );
  CREATE TABLE "trip_variants" (
    "id" serial PRIMARY KEY NOT NULL,
    "event_id" integer NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "active" boolean DEFAULT true,
    "indexable" boolean DEFAULT false,
    "extra_content" jsonb,
    "editorial_hero_description" varchar,
    "editorial_hero_hashtag" varchar,
    "editorial_hero_primary_label" varchar,
    "editorial_hero_secondary_label" varchar,
    "editorial_hero_secondary_target" "enum_trip_variants_editorial_hero_secondary_target",
    "editorial_hero_clear_hashtag" boolean,
    "editorial_actions_overview_label" varchar,
    "editorial_actions_summary_label" varchar,
    "editorial_dates_mode" "enum_trip_variants_editorial_dates_mode",
    "editorial_package_note" varchar,
    "editorial_booking_primary_label" varchar,
    "editorial_booking_secondary_label" varchar,
    "editorial_booking_support" varchar,
    "editorial_content_title" varchar,
    "editorial_content_short_description" varchar,
    "editorial_content_content" jsonb,
    "editorial_content_trip_detail_location_descriptor" varchar,
    "editorial_content_trip_detail_grade_range" varchar,
    "editorial_content_trip_detail_lead_requirement" varchar,
    "editorial_content_trip_detail_minimum_participants" numeric,
    "editorial_content_trip_detail_price_caption" varchar,
    "editorial_content_trip_detail_travel_note" varchar,
    "editorial_content_trip_detail_hashtag" varchar,
    "editorial_content_equipment_intro" varchar,
    "editorial_content_what_you_learn_intro" varchar,
    "editorial_content_what_you_learn_box1_heading" varchar,
    "editorial_content_what_you_learn_box2_heading" varchar,
    "editorial_content_what_you_learn_box3_heading" varchar,
    "editorial_content_comparison_heading" varchar,
    "editorial_content_comparison_intro" varchar,
    "editorial_content_comparison_left_heading" varchar,
    "editorial_content_comparison_right_heading" varchar,
    "editorial_content_itinerary_intro" varchar,
    "editorial_content_accommodation_description" jsonb,
    "editorial_content_accommodation_cuisine_highlights" jsonb,
    "editorial_content_transport_description" jsonb,
    "editorial_content_coach_framing_paragraph" varchar,
    "logistics_overrides_accommodation" jsonb,
    "logistics_overrides_food" jsonb,
    "logistics_overrides_included" jsonb,
    "logistics_overrides_excluded" jsonb,
    "logistics_overrides_note" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "trip_variants_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "locations_id" integer
  );
  ALTER TABLE "event_dates" ADD COLUMN "trip_variant_id" integer;
  ALTER TABLE "event_dates" ADD COLUMN "public_date_key" varchar;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "trip_variants_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "trip_variants_create" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "trip_variants_update" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trip_variants_id" integer;
  ALTER TABLE "trip_variants_slug_aliases" ADD CONSTRAINT "trip_variants_slug_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_sections_he_ed36432a" ADD CONSTRAINT "variant_ed_editorial_sections_he_ed36432a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_ed_editorial_sections_b9f8df7c"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_sections_b9f8df7c" ADD CONSTRAINT "variant_ed_editorial_sections_b9f8df7c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_hero_title__4e20ff8e" ADD CONSTRAINT "variant_ed_editorial_hero_title__4e20ff8e_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_daily_sched_b0663f40" ADD CONSTRAINT "variant_ed_editorial_daily_sched_b0663f40_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_overview_fa_3bd2f27a" ADD CONSTRAINT "variant_ed_editorial_overview_fa_3bd2f27a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_facts_strip_adc3993f" ADD CONSTRAINT "variant_ed_editorial_facts_strip_adc3993f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_summary_row_f87389cd" ADD CONSTRAINT "variant_ed_editorial_summary_row_f87389cd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_companion_c_d9e77b3f" ADD CONSTRAINT "variant_ed_editorial_companion_c_d9e77b3f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_companion_r_21fbc092" ADD CONSTRAINT "variant_ed_editorial_companion_r_21fbc092_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_ed_editorial_companion_r_5d4fe449"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_companion_r_5d4fe449" ADD CONSTRAINT "variant_ed_editorial_companion_r_5d4fe449_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_companion_l_1f347525" ADD CONSTRAINT "variant_ed_editorial_companion_l_1f347525_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_venue_parag_c6c437f8" ADD CONSTRAINT "variant_ed_editorial_venue_parag_c6c437f8_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_venue_facts_9d35d1ae" ADD CONSTRAINT "variant_ed_editorial_venue_facts_9d35d1ae_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_practical_c_1b1f147a" ADD CONSTRAINT "variant_ed_editorial_practical_c_1b1f147a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_package_ite_d1fc3af4" ADD CONSTRAINT "variant_ed_editorial_package_ite_d1fc3af4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_faqs_1e3b6dd1" ADD CONSTRAINT "variant_ed_editorial_faqs_1e3b6dd1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_preview_rev_9fc4f1a1" ADD CONSTRAINT "variant_ed_editorial_preview_rev_9fc4f1a1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "variant_ed_editorial_coach_profi_395ecd24_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_coach_profi_395ecd24" ADD CONSTRAINT "variant_ed_editorial_coach_profi_395ecd24_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trip_variants_editorial_clear_content_fields" ADD CONSTRAINT "trip_variants_editorial_clear_content_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_tri_5c01bcef" ADD CONSTRAINT "variant_ed_editorial_content_tri_5c01bcef_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_add_5d613f54" ADD CONSTRAINT "variant_ed_editorial_content_add_5d613f54_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_aud_8cde1906" ADD CONSTRAINT "variant_ed_editorial_content_aud_8cde1906_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_pre_17ab7c0c" ADD CONSTRAINT "variant_ed_editorial_content_pre_17ab7c0c_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_ess_dd4c2f99" ADD CONSTRAINT "variant_ed_editorial_content_ess_dd4c2f99_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_wha_32ae2a6b" ADD CONSTRAINT "variant_ed_editorial_content_wha_32ae2a6b_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_wha_68706f10" ADD CONSTRAINT "variant_ed_editorial_content_wha_68706f10_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_wha_8f6bee89" ADD CONSTRAINT "variant_ed_editorial_content_wha_8f6bee89_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_com_49a73a0f" ADD CONSTRAINT "variant_ed_editorial_content_com_49a73a0f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_iti_4e3b5df0" ADD CONSTRAINT "variant_ed_editorial_content_iti_4e3b5df0_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_iti_c4c53fc6" ADD CONSTRAINT "variant_ed_editorial_content_iti_c4c53fc6_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_ed_editorial_content_iti_cfed60f3"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_iti_cfed60f3" ADD CONSTRAINT "variant_ed_editorial_content_iti_cfed60f3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_acc_eaedfe7f" ADD CONSTRAINT "variant_ed_editorial_content_acc_eaedfe7f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_acc_36bf3dd4" ADD CONSTRAINT "variant_ed_editorial_content_acc_36bf3dd4_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_ed_editorial_content_coa_eee2c84d" ADD CONSTRAINT "variant_ed_editorial_content_coa_eee2c84d_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trip_variants" ADD CONSTRAINT "trip_variants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trip_variants_rels" ADD CONSTRAINT "trip_variants_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trip_variants_rels" ADD CONSTRAINT "trip_variants_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trip_variants_slug_aliases_order_idx" ON "trip_variants_slug_aliases" USING btree ("_order");
  CREATE INDEX "trip_variants_slug_aliases_parent_id_idx" ON "trip_variants_slug_aliases" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_sections_he_ed36432a_order_idx" ON "variant_ed_editorial_sections_he_ed36432a" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_sections_he_ed36432a_parent_id_idx" ON "variant_ed_editorial_sections_he_ed36432a" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_sections_b9f8df7c_order_idx" ON "variant_ed_editorial_sections_b9f8df7c" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_sections_b9f8df7c_parent_id_idx" ON "variant_ed_editorial_sections_b9f8df7c" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_hero_title__4e20ff8e_order_idx" ON "variant_ed_editorial_hero_title__4e20ff8e" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_hero_title__4e20ff8e_parent_id_idx" ON "variant_ed_editorial_hero_title__4e20ff8e" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_daily_sched_b0663f40_order_idx" ON "variant_ed_editorial_daily_sched_b0663f40" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_daily_sched_b0663f40_parent_id_idx" ON "variant_ed_editorial_daily_sched_b0663f40" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_overview_fa_3bd2f27a_order_idx" ON "variant_ed_editorial_overview_fa_3bd2f27a" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_overview_fa_3bd2f27a_parent_id_idx" ON "variant_ed_editorial_overview_fa_3bd2f27a" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_facts_strip_adc3993f_order_idx" ON "variant_ed_editorial_facts_strip_adc3993f" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_facts_strip_adc3993f_parent_id_idx" ON "variant_ed_editorial_facts_strip_adc3993f" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_summary_row_f87389cd_order_idx" ON "variant_ed_editorial_summary_row_f87389cd" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_summary_row_f87389cd_parent_id_idx" ON "variant_ed_editorial_summary_row_f87389cd" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_companion_c_d9e77b3f_order_idx" ON "variant_ed_editorial_companion_c_d9e77b3f" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_companion_c_d9e77b3f_parent_id_idx" ON "variant_ed_editorial_companion_c_d9e77b3f" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_companion_r_21fbc092_order_idx" ON "variant_ed_editorial_companion_r_21fbc092" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_companion_r_21fbc092_parent_id_idx" ON "variant_ed_editorial_companion_r_21fbc092" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_companion_r_5d4fe449_order_idx" ON "variant_ed_editorial_companion_r_5d4fe449" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_companion_r_5d4fe449_parent_id_idx" ON "variant_ed_editorial_companion_r_5d4fe449" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_companion_l_1f347525_order_idx" ON "variant_ed_editorial_companion_l_1f347525" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_companion_l_1f347525_parent_id_idx" ON "variant_ed_editorial_companion_l_1f347525" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_venue_parag_c6c437f8_order_idx" ON "variant_ed_editorial_venue_parag_c6c437f8" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_venue_parag_c6c437f8_parent_id_idx" ON "variant_ed_editorial_venue_parag_c6c437f8" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_venue_facts_9d35d1ae_order_idx" ON "variant_ed_editorial_venue_facts_9d35d1ae" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_venue_facts_9d35d1ae_parent_id_idx" ON "variant_ed_editorial_venue_facts_9d35d1ae" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_practical_c_1b1f147a_order_idx" ON "variant_ed_editorial_practical_c_1b1f147a" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_practical_c_1b1f147a_parent_id_idx" ON "variant_ed_editorial_practical_c_1b1f147a" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_package_ite_d1fc3af4_order_idx" ON "variant_ed_editorial_package_ite_d1fc3af4" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_package_ite_d1fc3af4_parent_id_idx" ON "variant_ed_editorial_package_ite_d1fc3af4" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_faqs_1e3b6dd1_order_idx" ON "variant_ed_editorial_faqs_1e3b6dd1" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_faqs_1e3b6dd1_parent_id_idx" ON "variant_ed_editorial_faqs_1e3b6dd1" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_preview_rev_9fc4f1a1_order_idx" ON "variant_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_preview_rev_9fc4f1a1_parent_id_idx" ON "variant_ed_editorial_preview_rev_9fc4f1a1" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_coach_profi_395ecd24_order_idx" ON "variant_ed_editorial_coach_profi_395ecd24" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_coach_profi_395ecd24_parent_id_idx" ON "variant_ed_editorial_coach_profi_395ecd24" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_coach_profi_395ecd24_guide_idx" ON "variant_ed_editorial_coach_profi_395ecd24" USING btree ("guide_id");
  CREATE INDEX "trip_variants_editorial_clear_content_fields_order_idx" ON "trip_variants_editorial_clear_content_fields" USING btree ("order");
  CREATE INDEX "trip_variants_editorial_clear_content_fields_parent_idx" ON "trip_variants_editorial_clear_content_fields" USING btree ("parent_id");
  CREATE INDEX "variant_ed_editorial_content_tri_5c01bcef_order_idx" ON "variant_ed_editorial_content_tri_5c01bcef" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_tri_5c01bcef_parent_id_idx" ON "variant_ed_editorial_content_tri_5c01bcef" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_add_5d613f54_order_idx" ON "variant_ed_editorial_content_add_5d613f54" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_add_5d613f54_parent_id_idx" ON "variant_ed_editorial_content_add_5d613f54" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_aud_8cde1906_order_idx" ON "variant_ed_editorial_content_aud_8cde1906" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_aud_8cde1906_parent_id_idx" ON "variant_ed_editorial_content_aud_8cde1906" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_pre_17ab7c0c_order_idx" ON "variant_ed_editorial_content_pre_17ab7c0c" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_pre_17ab7c0c_parent_id_idx" ON "variant_ed_editorial_content_pre_17ab7c0c" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_ess_dd4c2f99_order_idx" ON "variant_ed_editorial_content_ess_dd4c2f99" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_ess_dd4c2f99_parent_id_idx" ON "variant_ed_editorial_content_ess_dd4c2f99" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_wha_32ae2a6b_order_idx" ON "variant_ed_editorial_content_wha_32ae2a6b" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_wha_32ae2a6b_parent_id_idx" ON "variant_ed_editorial_content_wha_32ae2a6b" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_wha_68706f10_order_idx" ON "variant_ed_editorial_content_wha_68706f10" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_wha_68706f10_parent_id_idx" ON "variant_ed_editorial_content_wha_68706f10" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_wha_8f6bee89_order_idx" ON "variant_ed_editorial_content_wha_8f6bee89" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_wha_8f6bee89_parent_id_idx" ON "variant_ed_editorial_content_wha_8f6bee89" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_com_49a73a0f_order_idx" ON "variant_ed_editorial_content_com_49a73a0f" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_com_49a73a0f_parent_id_idx" ON "variant_ed_editorial_content_com_49a73a0f" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_iti_4e3b5df0_order_idx" ON "variant_ed_editorial_content_iti_4e3b5df0" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_iti_4e3b5df0_parent_id_idx" ON "variant_ed_editorial_content_iti_4e3b5df0" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_iti_c4c53fc6_order_idx" ON "variant_ed_editorial_content_iti_c4c53fc6" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_iti_c4c53fc6_parent_id_idx" ON "variant_ed_editorial_content_iti_c4c53fc6" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_iti_cfed60f3_order_idx" ON "variant_ed_editorial_content_iti_cfed60f3" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_iti_cfed60f3_parent_id_idx" ON "variant_ed_editorial_content_iti_cfed60f3" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_acc_eaedfe7f_order_idx" ON "variant_ed_editorial_content_acc_eaedfe7f" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_acc_eaedfe7f_parent_id_idx" ON "variant_ed_editorial_content_acc_eaedfe7f" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_acc_36bf3dd4_order_idx" ON "variant_ed_editorial_content_acc_36bf3dd4" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_acc_36bf3dd4_parent_id_idx" ON "variant_ed_editorial_content_acc_36bf3dd4" USING btree ("_parent_id");
  CREATE INDEX "variant_ed_editorial_content_coa_eee2c84d_order_idx" ON "variant_ed_editorial_content_coa_eee2c84d" USING btree ("_order");
  CREATE INDEX "variant_ed_editorial_content_coa_eee2c84d_parent_id_idx" ON "variant_ed_editorial_content_coa_eee2c84d" USING btree ("_parent_id");
  CREATE INDEX "trip_variants_event_idx" ON "trip_variants" USING btree ("event_id");
  CREATE INDEX "trip_variants_slug_idx" ON "trip_variants" USING btree ("slug");
  CREATE UNIQUE INDEX "trip_variants_event_slug_unique" ON "trip_variants" USING btree ("event_id", "slug");
  CREATE INDEX "trip_variants_updated_at_idx" ON "trip_variants" USING btree ("updated_at");
  CREATE INDEX "trip_variants_created_at_idx" ON "trip_variants" USING btree ("created_at");
  CREATE INDEX "trip_variants_rels_order_idx" ON "trip_variants_rels" USING btree ("order");
  CREATE INDEX "trip_variants_rels_parent_idx" ON "trip_variants_rels" USING btree ("parent_id");
  CREATE INDEX "trip_variants_rels_path_idx" ON "trip_variants_rels" USING btree ("path");
  CREATE INDEX "trip_variants_rels_locations_id_idx" ON "trip_variants_rels" USING btree ("locations_id");
  ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_trip_variant_id_trip_variants_id_fk" FOREIGN KEY ("trip_variant_id") REFERENCES "public"."trip_variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_variants_fk" FOREIGN KEY ("trip_variants_id") REFERENCES "public"."trip_variants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_dates_trip_variant_idx" ON "event_dates" USING btree ("trip_variant_id");
  CREATE INDEX "event_dates_public_date_key_idx" ON "event_dates" USING btree ("public_date_key");
  CREATE UNIQUE INDEX "event_dates_variant_date_key_unique" ON "event_dates" USING btree ("trip_variant_id", "public_date_key") WHERE "trip_variant_id" IS NOT NULL AND "public_date_key" IS NOT NULL;
  CREATE INDEX "payload_locked_documents_rels_trip_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("trip_variants_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "event_dates" DROP CONSTRAINT "event_dates_trip_variant_id_trip_variants_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trip_variants_fk";
  DROP INDEX "event_dates_variant_date_key_unique";
  DROP INDEX "event_dates_public_date_key_idx";
  DROP INDEX "event_dates_trip_variant_idx";
  DROP INDEX "payload_locked_documents_rels_trip_variants_id_idx";
  ALTER TABLE "event_dates" DROP COLUMN "public_date_key";
  ALTER TABLE "event_dates" DROP COLUMN "trip_variant_id";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "trip_variants_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "trip_variants_create";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "trip_variants_update";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trip_variants_id";
  ALTER TABLE "trip_variants_slug_aliases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_sections_he_ed36432a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_sections_b9f8df7c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_hero_title__4e20ff8e" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_daily_sched_b0663f40" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_overview_fa_3bd2f27a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_facts_strip_adc3993f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_summary_row_f87389cd" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_companion_c_d9e77b3f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_companion_r_21fbc092" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_companion_r_5d4fe449" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_companion_l_1f347525" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_venue_parag_c6c437f8" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_venue_facts_9d35d1ae" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_practical_c_1b1f147a" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_package_ite_d1fc3af4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_faqs_1e3b6dd1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_preview_rev_9fc4f1a1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_coach_profi_395ecd24" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trip_variants_editorial_clear_content_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_tri_5c01bcef" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_add_5d613f54" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_aud_8cde1906" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_pre_17ab7c0c" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_ess_dd4c2f99" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_wha_32ae2a6b" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_wha_68706f10" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_wha_8f6bee89" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_com_49a73a0f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_iti_4e3b5df0" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_iti_c4c53fc6" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_iti_cfed60f3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_acc_eaedfe7f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_acc_36bf3dd4" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_ed_editorial_content_coa_eee2c84d" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trip_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trip_variants_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "trip_variants_slug_aliases" CASCADE;
  DROP TABLE "variant_ed_editorial_sections_he_ed36432a" CASCADE;
  DROP TABLE "variant_ed_editorial_sections_b9f8df7c" CASCADE;
  DROP TABLE "variant_ed_editorial_hero_title__4e20ff8e" CASCADE;
  DROP TABLE "variant_ed_editorial_daily_sched_b0663f40" CASCADE;
  DROP TABLE "variant_ed_editorial_overview_fa_3bd2f27a" CASCADE;
  DROP TABLE "variant_ed_editorial_facts_strip_adc3993f" CASCADE;
  DROP TABLE "variant_ed_editorial_summary_row_f87389cd" CASCADE;
  DROP TABLE "variant_ed_editorial_companion_c_d9e77b3f" CASCADE;
  DROP TABLE "variant_ed_editorial_companion_r_21fbc092" CASCADE;
  DROP TABLE "variant_ed_editorial_companion_r_5d4fe449" CASCADE;
  DROP TABLE "variant_ed_editorial_companion_l_1f347525" CASCADE;
  DROP TABLE "variant_ed_editorial_venue_parag_c6c437f8" CASCADE;
  DROP TABLE "variant_ed_editorial_venue_facts_9d35d1ae" CASCADE;
  DROP TABLE "variant_ed_editorial_practical_c_1b1f147a" CASCADE;
  DROP TABLE "variant_ed_editorial_package_ite_d1fc3af4" CASCADE;
  DROP TABLE "variant_ed_editorial_faqs_1e3b6dd1" CASCADE;
  DROP TABLE "variant_ed_editorial_preview_rev_9fc4f1a1" CASCADE;
  DROP TABLE "variant_ed_editorial_coach_profi_395ecd24" CASCADE;
  DROP TABLE "trip_variants_editorial_clear_content_fields" CASCADE;
  DROP TABLE "variant_ed_editorial_content_tri_5c01bcef" CASCADE;
  DROP TABLE "variant_ed_editorial_content_add_5d613f54" CASCADE;
  DROP TABLE "variant_ed_editorial_content_aud_8cde1906" CASCADE;
  DROP TABLE "variant_ed_editorial_content_pre_17ab7c0c" CASCADE;
  DROP TABLE "variant_ed_editorial_content_ess_dd4c2f99" CASCADE;
  DROP TABLE "variant_ed_editorial_content_wha_32ae2a6b" CASCADE;
  DROP TABLE "variant_ed_editorial_content_wha_68706f10" CASCADE;
  DROP TABLE "variant_ed_editorial_content_wha_8f6bee89" CASCADE;
  DROP TABLE "variant_ed_editorial_content_com_49a73a0f" CASCADE;
  DROP TABLE "variant_ed_editorial_content_iti_4e3b5df0" CASCADE;
  DROP TABLE "variant_ed_editorial_content_iti_c4c53fc6" CASCADE;
  DROP TABLE "variant_ed_editorial_content_iti_cfed60f3" CASCADE;
  DROP TABLE "variant_ed_editorial_content_acc_eaedfe7f" CASCADE;
  DROP TABLE "variant_ed_editorial_content_acc_36bf3dd4" CASCADE;
  DROP TABLE "variant_ed_editorial_content_coa_eee2c84d" CASCADE;
  DROP TABLE "trip_variants" CASCADE;
  DROP TABLE "trip_variants_rels" CASCADE;
  DROP TYPE "public"."enum_variant_ed_editorial_sections_b9f8df7c_key";
  DROP TYPE "public"."enum_variant_ed_editorial_sections_b9f8df7c_visibility";
  DROP TYPE "public"."enum_trip_variants_editorial_clear_content_fields";
  DROP TYPE "public"."enum_variant_ed_editorial_content_tri_5c01bcef_kind";
  DROP TYPE "public"."enum_trip_variants_editorial_hero_secondary_target";
  DROP TYPE "public"."enum_trip_variants_editorial_dates_mode";
  `)
}
