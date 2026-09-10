import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_blocks_trip_content_section" AS ENUM('overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes', 'remaining');
  CREATE TYPE "public"."enum_events_blocks_trip_content_variant" AS ENUM('prose', 'cards', 'timeline', 'overview');
  CREATE TYPE "public"."enum_events_blocks_trip_facts_variant" AS ENUM('heroBar', 'grid');
  CREATE TYPE "public"."enum_events_blocks_trip_venue_variant" AS ENUM('default', 'editorial');
  CREATE TYPE "public"."enum_events_blocks_trip_team_variant" AS ENUM('default', 'cards');
  CREATE TYPE "public"."enum_events_blocks_trip_hero_variant" AS ENUM('default', 'editorial');
  CREATE TYPE "public"."enum_events_blocks_trip_dates_variant" AS ENUM('default', 'rows');
  CREATE TYPE "public"."enum_events_blocks_trip_booking_c_t_a_variant" AS ENUM('default', 'image');
  CREATE TYPE "public"."enum_events_blocks_trip_logistics_variant" AS ENUM('default', 'cards');
  ALTER TYPE "public"."enum_programs_blocks_gallery_variant" ADD VALUE 'featureLead';
  ALTER TYPE "public"."enum_guides_blocks_gallery_variant" ADD VALUE 'featureLead';
  ALTER TYPE "public"."enum_locations_blocks_gallery_variant" ADD VALUE 'featureLead';
  ALTER TYPE "public"."enum_events_blocks_gallery_variant" ADD VALUE 'featureLead';
  ALTER TYPE "public"."enum_posts_blocks_gallery_variant" ADD VALUE 'featureLead';
  ALTER TYPE "public"."enum_pages_blocks_gallery_variant" ADD VALUE 'featureLead';
  CREATE TABLE "events_blocks_trip_content" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "section" "enum_events_blocks_trip_content_section" DEFAULT 'overview' NOT NULL,
    "variant" "enum_events_blocks_trip_content_variant" DEFAULT 'prose' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_trip_facts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "variant" "enum_events_blocks_trip_facts_variant" DEFAULT 'heroBar' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_trip_venue" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "variant" "enum_events_blocks_trip_venue_variant" DEFAULT 'default' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "events_blocks_trip_team" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "variant" "enum_events_blocks_trip_team_variant" DEFAULT 'default' NOT NULL,
    "block_name" varchar
  );

  ALTER TABLE "events_blocks_trip_hero" ADD COLUMN "variant" "enum_events_blocks_trip_hero_variant" DEFAULT 'default' NOT NULL;
  ALTER TABLE "events_blocks_trip_dates" ADD COLUMN "variant" "enum_events_blocks_trip_dates_variant" DEFAULT 'default' NOT NULL;
  ALTER TABLE "events_blocks_trip_booking_c_t_a" ADD COLUMN "variant" "enum_events_blocks_trip_booking_c_t_a_variant" DEFAULT 'default' NOT NULL;
  ALTER TABLE "events_blocks_trip_logistics" ADD COLUMN "variant" "enum_events_blocks_trip_logistics_variant" DEFAULT 'default' NOT NULL;
  ALTER TABLE "events_blocks_trip_content" ADD CONSTRAINT "events_blocks_trip_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_facts" ADD CONSTRAINT "events_blocks_trip_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_venue" ADD CONSTRAINT "events_blocks_trip_venue_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_trip_team" ADD CONSTRAINT "events_blocks_trip_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_blocks_trip_content_order_idx" ON "events_blocks_trip_content" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_content_parent_id_idx" ON "events_blocks_trip_content" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_content_path_idx" ON "events_blocks_trip_content" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_facts_order_idx" ON "events_blocks_trip_facts" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_facts_parent_id_idx" ON "events_blocks_trip_facts" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_facts_path_idx" ON "events_blocks_trip_facts" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_venue_order_idx" ON "events_blocks_trip_venue" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_venue_parent_id_idx" ON "events_blocks_trip_venue" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_venue_path_idx" ON "events_blocks_trip_venue" USING btree ("_path");
  CREATE INDEX "events_blocks_trip_team_order_idx" ON "events_blocks_trip_team" USING btree ("_order");
  CREATE INDEX "events_blocks_trip_team_parent_id_idx" ON "events_blocks_trip_team" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_trip_team_path_idx" ON "events_blocks_trip_team" USING btree ("_path");`)
}

// Rollback preserves gallery media/order, reverting the new presentation to grid.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_blocks_trip_content" CASCADE;
  DROP TABLE "events_blocks_trip_facts" CASCADE;
  DROP TABLE "events_blocks_trip_venue" CASCADE;
  DROP TABLE "events_blocks_trip_team" CASCADE;
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "programs_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_programs_blocks_gallery_variant";
  CREATE TYPE "public"."enum_programs_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_programs_blocks_gallery_variant";
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_programs_blocks_gallery_variant" USING "variant"::"public"."enum_programs_blocks_gallery_variant";
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "guides_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_guides_blocks_gallery_variant";
  CREATE TYPE "public"."enum_guides_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_guides_blocks_gallery_variant";
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_guides_blocks_gallery_variant" USING "variant"::"public"."enum_guides_blocks_gallery_variant";
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "locations_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_locations_blocks_gallery_variant";
  CREATE TYPE "public"."enum_locations_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_locations_blocks_gallery_variant";
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_locations_blocks_gallery_variant" USING "variant"::"public"."enum_locations_blocks_gallery_variant";
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "events_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_events_blocks_gallery_variant";
  CREATE TYPE "public"."enum_events_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_events_blocks_gallery_variant";
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_events_blocks_gallery_variant" USING "variant"::"public"."enum_events_blocks_gallery_variant";
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "posts_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_posts_blocks_gallery_variant";
  CREATE TYPE "public"."enum_posts_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_posts_blocks_gallery_variant";
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_posts_blocks_gallery_variant" USING "variant"::"public"."enum_posts_blocks_gallery_variant";
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  UPDATE "pages_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'featureLead';
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_pages_blocks_gallery_variant";
  CREATE TYPE "public"."enum_pages_blocks_gallery_variant" AS ENUM('grid', 'masonry', 'tiles');
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_pages_blocks_gallery_variant";
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_gallery_variant" USING "variant"::"public"."enum_pages_blocks_gallery_variant";
  ALTER TABLE "events_blocks_trip_hero" DROP COLUMN "variant";
  ALTER TABLE "events_blocks_trip_dates" DROP COLUMN "variant";
  ALTER TABLE "events_blocks_trip_booking_c_t_a" DROP COLUMN "variant";
  ALTER TABLE "events_blocks_trip_logistics" DROP COLUMN "variant";
  DROP TYPE "public"."enum_events_blocks_trip_content_section";
  DROP TYPE "public"."enum_events_blocks_trip_content_variant";
  DROP TYPE "public"."enum_events_blocks_trip_facts_variant";
  DROP TYPE "public"."enum_events_blocks_trip_venue_variant";
  DROP TYPE "public"."enum_events_blocks_trip_team_variant";
  DROP TYPE "public"."enum_events_blocks_trip_hero_variant";
  DROP TYPE "public"."enum_events_blocks_trip_dates_variant";
  DROP TYPE "public"."enum_events_blocks_trip_booking_c_t_a_variant";
  DROP TYPE "public"."enum_events_blocks_trip_logistics_variant";`)
}
