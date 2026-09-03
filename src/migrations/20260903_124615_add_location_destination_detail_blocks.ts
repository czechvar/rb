import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_locations_blocks_destination_card_grid_source" AS ENUM('audience', 'sectors', 'restDayIdeas', 'accessRules', 'safetyItems', 'destinationFaqs', 'tripPromos', 'relatedLocations', 'relatedDestinationCards');
  CREATE TYPE "public"."enum_locations_blocks_destination_card_grid_columns" AS ENUM('auto', '2', '3');
  CREATE TYPE "public"."enum_locations_blocks_destination_logistics_source" AS ENUM('all', 'gearGroups', 'transportOptions', 'accommodationOptions', 'costItems');
  CREATE TABLE "locations_blocks_destination_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_destination_sections_section_keys" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL
  );

  CREATE TABLE "locations_blocks_destination_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Overview',
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_destination_card_grid" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Destination',
    "heading" varchar,
    "intro" varchar,
    "source" "enum_locations_blocks_destination_card_grid_source" DEFAULT 'audience' NOT NULL,
    "columns" "enum_locations_blocks_destination_card_grid_columns" DEFAULT 'auto' NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_destination_season" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Season',
    "heading" varchar DEFAULT 'When to go',
    "intro" varchar,
    "block_name" varchar
  );

  CREATE TABLE "locations_blocks_destination_logistics" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Logistics',
    "heading" varchar DEFAULT 'Plan the trip',
    "intro" varchar,
    "source" "enum_locations_blocks_destination_logistics_source" DEFAULT 'all' NOT NULL,
    "block_name" varchar
  );

  ALTER TABLE "locations_blocks_destination_hero" ADD CONSTRAINT "locations_blocks_destination_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_destination_sections_section_keys" ADD CONSTRAINT "locations_blocks_destination_sections_section_keys_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_destination_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_destination_sections" ADD CONSTRAINT "locations_blocks_destination_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_destination_card_grid" ADD CONSTRAINT "locations_blocks_destination_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_destination_season" ADD CONSTRAINT "locations_blocks_destination_season_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_destination_logistics" ADD CONSTRAINT "locations_blocks_destination_logistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_blocks_destination_hero_order_idx" ON "locations_blocks_destination_hero" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_hero_parent_id_idx" ON "locations_blocks_destination_hero" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_hero_path_idx" ON "locations_blocks_destination_hero" USING btree ("_path");
  CREATE INDEX "locations_blocks_destination_sections_section_keys_order_idx" ON "locations_blocks_destination_sections_section_keys" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_sections_section_keys_parent_id_idx" ON "locations_blocks_destination_sections_section_keys" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_sections_order_idx" ON "locations_blocks_destination_sections" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_sections_parent_id_idx" ON "locations_blocks_destination_sections" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_sections_path_idx" ON "locations_blocks_destination_sections" USING btree ("_path");
  CREATE INDEX "locations_blocks_destination_card_grid_order_idx" ON "locations_blocks_destination_card_grid" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_card_grid_parent_id_idx" ON "locations_blocks_destination_card_grid" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_card_grid_path_idx" ON "locations_blocks_destination_card_grid" USING btree ("_path");
  CREATE INDEX "locations_blocks_destination_season_order_idx" ON "locations_blocks_destination_season" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_season_parent_id_idx" ON "locations_blocks_destination_season" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_season_path_idx" ON "locations_blocks_destination_season" USING btree ("_path");
  CREATE INDEX "locations_blocks_destination_logistics_order_idx" ON "locations_blocks_destination_logistics" USING btree ("_order");
  CREATE INDEX "locations_blocks_destination_logistics_parent_id_idx" ON "locations_blocks_destination_logistics" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_destination_logistics_path_idx" ON "locations_blocks_destination_logistics" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "locations_blocks_destination_hero" CASCADE;
  DROP TABLE "locations_blocks_destination_sections_section_keys" CASCADE;
  DROP TABLE "locations_blocks_destination_sections" CASCADE;
  DROP TABLE "locations_blocks_destination_card_grid" CASCADE;
  DROP TABLE "locations_blocks_destination_season" CASCADE;
  DROP TABLE "locations_blocks_destination_logistics" CASCADE;
  DROP TYPE "public"."enum_locations_blocks_destination_card_grid_source";
  DROP TYPE "public"."enum_locations_blocks_destination_card_grid_columns";
  DROP TYPE "public"."enum_locations_blocks_destination_logistics_source";`)
}
