import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."loc_dest_src_status" AS ENUM('curated', 'curated-derived', 'design-derived', 'mixed');
  CREATE TYPE "public"."enum_loc_dest_audience_tone" AS ENUM('neutral', 'positive', 'strong', 'limited', 'warning', 'critical', 'peak', 'good', 'avoid');
  CREATE TYPE "public"."enum_loc_dest_season_months_tone" AS ENUM('neutral', 'positive', 'strong', 'limited', 'warning', 'critical', 'peak', 'good', 'avoid');
  CREATE TYPE "public"."enum_loc_dest_access_rules_tone" AS ENUM('neutral', 'positive', 'strong', 'limited', 'warning', 'critical', 'peak', 'good', 'avoid');
  CREATE TABLE "loc_dest_hero_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "derived_from" varchar,
    "format" varchar,
    "note" varchar,
    "source_status" "loc_dest_src_status"
  );

  CREATE TABLE "loc_dest_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "nav_label" varchar,
    "heading" varchar NOT NULL,
    "body" varchar,
    "source_status" "loc_dest_src_status"
  );

  CREATE TABLE "loc_dest_audience" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "grade_range" varchar,
    "body" varchar,
    "badge" varchar,
    "tone" "enum_loc_dest_audience_tone",
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_sectors" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "grade_range" varchar,
    "body" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_season_months" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "month" numeric NOT NULL,
    "label" varchar NOT NULL,
    "score" numeric NOT NULL,
    "temperature" varchar,
    "conditions" varchar,
    "tone" "enum_loc_dest_season_months_tone",
    "notes" varchar,
    "source_status" "loc_dest_src_status"
  );

  CREATE TABLE "loc_dest_gear_groups" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_transport_opts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "type" varchar,
    "duration" varchar,
    "body" varchar,
    "recommended" boolean DEFAULT false,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_accom_opts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "type" varchar,
    "name" varchar NOT NULL,
    "body" varchar,
    "href" varchar,
    "action_label" varchar,
    "price_hint" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_rest_days" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "body" varchar,
    "distance" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_access_rules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "body" varchar,
    "tone" "enum_loc_dest_access_rules_tone",
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_safety_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "value" varchar,
    "body" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_cost_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "unit" varchar,
    "budget" varchar,
    "mid_range" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_faqs" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar NOT NULL,
    "answer" varchar NOT NULL,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_trip_promos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "type" varchar,
    "title" varchar NOT NULL,
    "body" varchar,
    "action_label" varchar,
    "action_href" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "loc_dest_related_cards" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "slug" varchar,
    "name" varchar NOT NULL,
    "country" varchar,
    "region" varchar,
    "summary" varchar,
    "source_status" "loc_dest_src_status",
    "needs_verification" boolean DEFAULT false
  );

  CREATE TABLE "locations_texts" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar
  );

  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_eyebrow" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_accent_word" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_body" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_primary_action_label" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_hero_primary_action_href" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_eyebrow" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_body" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_primary_action_label" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_primary_action_href" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_secondary_action_label" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_secondary_action_href" varchar;
  ALTER TABLE "locations" ADD COLUMN "destination_detail_cta_source_status" "loc_dest_src_status";
  ALTER TABLE "loc_dest_hero_stats" ADD CONSTRAINT "loc_dest_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_sections" ADD CONSTRAINT "loc_dest_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_audience" ADD CONSTRAINT "loc_dest_audience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_sectors" ADD CONSTRAINT "loc_dest_sectors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_season_months" ADD CONSTRAINT "loc_dest_season_months_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_gear_groups" ADD CONSTRAINT "loc_dest_gear_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_transport_opts" ADD CONSTRAINT "loc_dest_transport_opts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_accom_opts" ADD CONSTRAINT "loc_dest_accom_opts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_rest_days" ADD CONSTRAINT "loc_dest_rest_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_access_rules" ADD CONSTRAINT "loc_dest_access_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_safety_items" ADD CONSTRAINT "loc_dest_safety_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_cost_items" ADD CONSTRAINT "loc_dest_cost_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_faqs" ADD CONSTRAINT "loc_dest_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_trip_promos" ADD CONSTRAINT "loc_dest_trip_promos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "loc_dest_related_cards" ADD CONSTRAINT "loc_dest_related_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_texts" ADD CONSTRAINT "locations_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "loc_dest_hero_stats_order_idx" ON "loc_dest_hero_stats" USING btree ("_order");
  CREATE INDEX "loc_dest_hero_stats_parent_id_idx" ON "loc_dest_hero_stats" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_sections_order_idx" ON "loc_dest_sections" USING btree ("_order");
  CREATE INDEX "loc_dest_sections_parent_id_idx" ON "loc_dest_sections" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_audience_order_idx" ON "loc_dest_audience" USING btree ("_order");
  CREATE INDEX "loc_dest_audience_parent_id_idx" ON "loc_dest_audience" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_sectors_order_idx" ON "loc_dest_sectors" USING btree ("_order");
  CREATE INDEX "loc_dest_sectors_parent_id_idx" ON "loc_dest_sectors" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_season_months_order_idx" ON "loc_dest_season_months" USING btree ("_order");
  CREATE INDEX "loc_dest_season_months_parent_id_idx" ON "loc_dest_season_months" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_gear_groups_order_idx" ON "loc_dest_gear_groups" USING btree ("_order");
  CREATE INDEX "loc_dest_gear_groups_parent_id_idx" ON "loc_dest_gear_groups" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_transport_opts_order_idx" ON "loc_dest_transport_opts" USING btree ("_order");
  CREATE INDEX "loc_dest_transport_opts_parent_id_idx" ON "loc_dest_transport_opts" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_accom_opts_order_idx" ON "loc_dest_accom_opts" USING btree ("_order");
  CREATE INDEX "loc_dest_accom_opts_parent_id_idx" ON "loc_dest_accom_opts" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_rest_days_order_idx" ON "loc_dest_rest_days" USING btree ("_order");
  CREATE INDEX "loc_dest_rest_days_parent_id_idx" ON "loc_dest_rest_days" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_access_rules_order_idx" ON "loc_dest_access_rules" USING btree ("_order");
  CREATE INDEX "loc_dest_access_rules_parent_id_idx" ON "loc_dest_access_rules" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_safety_items_order_idx" ON "loc_dest_safety_items" USING btree ("_order");
  CREATE INDEX "loc_dest_safety_items_parent_id_idx" ON "loc_dest_safety_items" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_cost_items_order_idx" ON "loc_dest_cost_items" USING btree ("_order");
  CREATE INDEX "loc_dest_cost_items_parent_id_idx" ON "loc_dest_cost_items" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_faqs_order_idx" ON "loc_dest_faqs" USING btree ("_order");
  CREATE INDEX "loc_dest_faqs_parent_id_idx" ON "loc_dest_faqs" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_trip_promos_order_idx" ON "loc_dest_trip_promos" USING btree ("_order");
  CREATE INDEX "loc_dest_trip_promos_parent_id_idx" ON "loc_dest_trip_promos" USING btree ("_parent_id");
  CREATE INDEX "loc_dest_related_cards_order_idx" ON "loc_dest_related_cards" USING btree ("_order");
  CREATE INDEX "loc_dest_related_cards_parent_id_idx" ON "loc_dest_related_cards" USING btree ("_parent_id");
  CREATE INDEX "locations_texts_order_parent" ON "locations_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "loc_dest_hero_stats" CASCADE;
  DROP TABLE "loc_dest_sections" CASCADE;
  DROP TABLE "loc_dest_audience" CASCADE;
  DROP TABLE "loc_dest_sectors" CASCADE;
  DROP TABLE "loc_dest_season_months" CASCADE;
  DROP TABLE "loc_dest_gear_groups" CASCADE;
  DROP TABLE "loc_dest_transport_opts" CASCADE;
  DROP TABLE "loc_dest_accom_opts" CASCADE;
  DROP TABLE "loc_dest_rest_days" CASCADE;
  DROP TABLE "loc_dest_access_rules" CASCADE;
  DROP TABLE "loc_dest_safety_items" CASCADE;
  DROP TABLE "loc_dest_cost_items" CASCADE;
  DROP TABLE "loc_dest_faqs" CASCADE;
  DROP TABLE "loc_dest_trip_promos" CASCADE;
  DROP TABLE "loc_dest_related_cards" CASCADE;
  DROP TABLE "locations_texts" CASCADE;
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_eyebrow";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_heading";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_accent_word";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_body";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_primary_action_label";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_hero_primary_action_href";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_eyebrow";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_heading";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_body";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_primary_action_label";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_primary_action_href";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_secondary_action_label";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_secondary_action_href";
  ALTER TABLE "locations" DROP COLUMN "destination_detail_cta_source_status";
  DROP TYPE "public"."loc_dest_src_status";
  DROP TYPE "public"."enum_loc_dest_audience_tone";
  DROP TYPE "public"."enum_loc_dest_season_months_tone";
  DROP TYPE "public"."enum_loc_dest_access_rules_tone";`)
}
