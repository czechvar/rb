import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_events_climbing_styles') THEN
      CREATE TYPE "public"."enum_events_climbing_styles" AS ENUM('sport', 'bouldering', 'trad', 'multi-pitch', 'deep-water-soloing');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_events_audience_tags') THEN
      CREATE TYPE "public"."enum_events_audience_tags" AS ENUM('beginner-friendly', 'kids-friendly', 'women-only', 'intermediate', 'advanced', 'expert');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_events_format_tags') THEN
      CREATE TYPE "public"."enum_events_format_tags" AS ENUM('private-guiding', 'coaching', 'learn-to-lead', 'road-trip', 'demo-test', 'family-youth');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_events_partner_tags') THEN
      CREATE TYPE "public"."enum_events_partner_tags" AS ENUM('evolv', 'singing-rock', 'the-send');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "events_climbing_styles" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_events_climbing_styles",
  "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "events_audience_tags" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_events_audience_tags",
  "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "events_format_tags" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_events_format_tags",
  "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "events_partner_tags" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_events_partner_tags",
  "id" serial PRIMARY KEY NOT NULL
  );

  ALTER TABLE "locations_rels" ADD COLUMN IF NOT EXISTS "airports_id" integer;
  ALTER TABLE "event_dates" ADD COLUMN IF NOT EXISTS "logistics_overrides_accommodation" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN IF NOT EXISTS "logistics_overrides_food" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN IF NOT EXISTS "logistics_overrides_included" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN IF NOT EXISTS "logistics_overrides_excluded" jsonb;
  ALTER TABLE "event_dates" ADD COLUMN IF NOT EXISTS "logistics_overrides_note" jsonb;

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_climbing_styles_parent_fk') THEN
      ALTER TABLE "events_climbing_styles" ADD CONSTRAINT "events_climbing_styles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_audience_tags_parent_fk') THEN
      ALTER TABLE "events_audience_tags" ADD CONSTRAINT "events_audience_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_format_tags_parent_fk') THEN
      ALTER TABLE "events_format_tags" ADD CONSTRAINT "events_format_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_partner_tags_parent_fk') THEN
      ALTER TABLE "events_partner_tags" ADD CONSTRAINT "events_partner_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_rels_airports_fk') THEN
      ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_airports_fk" FOREIGN KEY ("airports_id") REFERENCES "public"."airports"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "events_climbing_styles_order_idx" ON "events_climbing_styles" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "events_climbing_styles_parent_idx" ON "events_climbing_styles" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "events_audience_tags_order_idx" ON "events_audience_tags" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "events_audience_tags_parent_idx" ON "events_audience_tags" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "events_format_tags_order_idx" ON "events_format_tags" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "events_format_tags_parent_idx" ON "events_format_tags" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "events_partner_tags_order_idx" ON "events_partner_tags" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "events_partner_tags_parent_idx" ON "events_partner_tags" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "locations_rels_airports_id_idx" ON "locations_rels" USING btree ("airports_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "events_climbing_styles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "events_audience_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "events_format_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "events_partner_tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "events_climbing_styles" CASCADE;
  DROP TABLE IF EXISTS "events_audience_tags" CASCADE;
  DROP TABLE IF EXISTS "events_format_tags" CASCADE;
  DROP TABLE IF EXISTS "events_partner_tags" CASCADE;
  ALTER TABLE "locations_rels" DROP CONSTRAINT IF EXISTS "locations_rels_airports_fk";

  DROP INDEX IF EXISTS "locations_rels_airports_id_idx";
  ALTER TABLE "locations_rels" DROP COLUMN IF EXISTS "airports_id";
  ALTER TABLE "event_dates" DROP COLUMN IF EXISTS "logistics_overrides_accommodation";
  ALTER TABLE "event_dates" DROP COLUMN IF EXISTS "logistics_overrides_food";
  ALTER TABLE "event_dates" DROP COLUMN IF EXISTS "logistics_overrides_included";
  ALTER TABLE "event_dates" DROP COLUMN IF EXISTS "logistics_overrides_excluded";
  ALTER TABLE "event_dates" DROP COLUMN IF EXISTS "logistics_overrides_note";
  DROP TYPE IF EXISTS "public"."enum_events_climbing_styles";
  DROP TYPE IF EXISTS "public"."enum_events_audience_tags";
  DROP TYPE IF EXISTS "public"."enum_events_format_tags";
  DROP TYPE IF EXISTS "public"."enum_events_partner_tags";`)
}
