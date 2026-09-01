import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_locations_climbing_styles" AS ENUM('sport', 'bouldering', 'multi-pitch', 'trad', 'deep-water-soloing');
  CREATE TYPE "public"."enum_locations_rock_types" AS ENUM('limestone', 'sandstone', 'granite', 'conglomerate', 'gneiss', 'dolomite');
  CREATE TYPE "public"."enum_locations_rock_features" AS ENUM('tufas', 'caves', 'overhangs', 'slabs', 'pockets', 'crimps', 'cracks', 'roofs');
  CREATE TYPE "public"."enum_locations_setting_tags" AS ENUM('coastal', 'island', 'gorge-canyon', 'forest', 'mountain', 'valley');
  CREATE TYPE "public"."enum_locations_best_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter', 'year-round');
  CREATE TYPE "public"."enum_locations_avoid_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter', 'year-round');
  CREATE TYPE "public"."enum_locations_accommodation_tags" AS ENUM('campsite', 'hotel', 'guesthouse-b-and-b', 'apartment', 'hostel', 'refuge-hut', 'villa', 'rural-cottage', 'luxury');
  CREATE TYPE "public"."enum_locations_transport_tags" AS ENUM('car-recommended', 'public-transport-possible', 'flight-access', 'ferry-access', 'walkable-local-access');
  CREATE TYPE "public"."enum_locations_location_kind" AS ENUM('sport-climbing-area', 'bouldering-area', 'multi-pitch-area', 'mixed-climbing-area', 'alpine-climbing-area', 'online');
  CREATE TYPE "public"."enum_locations_destination_scope" AS ENUM('crag', 'area', 'region', 'country', 'indoor', 'unknown');
  CREATE TYPE "public"."enum_locations_content_completeness" AS ENUM('enriched', 'partial', 'insufficient-source', 'manual-review');
  CREATE TABLE "locations_climbing_styles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_climbing_styles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_rock_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_rock_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_rock_features" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_rock_features",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_setting_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_setting_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_best_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_best_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_avoid_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_avoid_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_accommodation_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_accommodation_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_transport_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_locations_transport_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "locations_nearest_airports" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "locations_source_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_id" varchar,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"accessed_at" timestamp(3) with time zone,
  	"notes" varchar
  );
  ALTER TABLE "locations" ADD COLUMN "location_kind" "enum_locations_location_kind";
  ALTER TABLE "locations" ADD COLUMN "destination_scope" "enum_locations_destination_scope";
  ALTER TABLE "locations" ADD COLUMN "content_completeness" "enum_locations_content_completeness";
  ALTER TABLE "locations" ADD COLUMN "grade_range" varchar;
  ALTER TABLE "locations" ADD COLUMN "route_count" numeric;
  ALTER TABLE "locations" ADD COLUMN "problem_count" numeric;
  ALTER TABLE "locations" ADD COLUMN "sector_count" numeric;
  ALTER TABLE "locations" ADD COLUMN "season_summary" varchar;
  ALTER TABLE "locations" ADD COLUMN "transport_summary" varchar;
  ALTER TABLE "locations" ADD COLUMN "accommodation_summary" varchar;
  ALTER TABLE "locations_climbing_styles" ADD CONSTRAINT "locations_climbing_styles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rock_types" ADD CONSTRAINT "locations_rock_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rock_features" ADD CONSTRAINT "locations_rock_features_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_setting_tags" ADD CONSTRAINT "locations_setting_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_best_seasons" ADD CONSTRAINT "locations_best_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_avoid_seasons" ADD CONSTRAINT "locations_avoid_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_accommodation_tags" ADD CONSTRAINT "locations_accommodation_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_transport_tags" ADD CONSTRAINT "locations_transport_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_nearest_airports" ADD CONSTRAINT "locations_nearest_airports_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_source_references" ADD CONSTRAINT "locations_source_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_climbing_styles_order_idx" ON "locations_climbing_styles" USING btree ("order");
  CREATE INDEX "locations_climbing_styles_parent_idx" ON "locations_climbing_styles" USING btree ("parent_id");
  CREATE INDEX "locations_rock_types_order_idx" ON "locations_rock_types" USING btree ("order");
  CREATE INDEX "locations_rock_types_parent_idx" ON "locations_rock_types" USING btree ("parent_id");
  CREATE INDEX "locations_rock_features_order_idx" ON "locations_rock_features" USING btree ("order");
  CREATE INDEX "locations_rock_features_parent_idx" ON "locations_rock_features" USING btree ("parent_id");
  CREATE INDEX "locations_setting_tags_order_idx" ON "locations_setting_tags" USING btree ("order");
  CREATE INDEX "locations_setting_tags_parent_idx" ON "locations_setting_tags" USING btree ("parent_id");
  CREATE INDEX "locations_best_seasons_order_idx" ON "locations_best_seasons" USING btree ("order");
  CREATE INDEX "locations_best_seasons_parent_idx" ON "locations_best_seasons" USING btree ("parent_id");
  CREATE INDEX "locations_avoid_seasons_order_idx" ON "locations_avoid_seasons" USING btree ("order");
  CREATE INDEX "locations_avoid_seasons_parent_idx" ON "locations_avoid_seasons" USING btree ("parent_id");
  CREATE INDEX "locations_accommodation_tags_order_idx" ON "locations_accommodation_tags" USING btree ("order");
  CREATE INDEX "locations_accommodation_tags_parent_idx" ON "locations_accommodation_tags" USING btree ("parent_id");
  CREATE INDEX "locations_transport_tags_order_idx" ON "locations_transport_tags" USING btree ("order");
  CREATE INDEX "locations_transport_tags_parent_idx" ON "locations_transport_tags" USING btree ("parent_id");
  CREATE INDEX "locations_nearest_airports_order_idx" ON "locations_nearest_airports" USING btree ("_order");
  CREATE INDEX "locations_nearest_airports_parent_id_idx" ON "locations_nearest_airports" USING btree ("_parent_id");
  CREATE INDEX "locations_source_references_order_idx" ON "locations_source_references" USING btree ("_order");
  CREATE INDEX "locations_source_references_parent_id_idx" ON "locations_source_references" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "locations_climbing_styles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_rock_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_rock_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_setting_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_best_seasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_avoid_seasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_accommodation_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_transport_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_nearest_airports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_source_references" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "locations_climbing_styles" CASCADE;
  DROP TABLE "locations_rock_types" CASCADE;
  DROP TABLE "locations_rock_features" CASCADE;
  DROP TABLE "locations_setting_tags" CASCADE;
  DROP TABLE "locations_best_seasons" CASCADE;
  DROP TABLE "locations_avoid_seasons" CASCADE;
  DROP TABLE "locations_accommodation_tags" CASCADE;
  DROP TABLE "locations_transport_tags" CASCADE;
  DROP TABLE "locations_nearest_airports" CASCADE;
  DROP TABLE "locations_source_references" CASCADE;
  ALTER TABLE "locations" DROP COLUMN "location_kind";
  ALTER TABLE "locations" DROP COLUMN "destination_scope";
  ALTER TABLE "locations" DROP COLUMN "content_completeness";
  ALTER TABLE "locations" DROP COLUMN "grade_range";
  ALTER TABLE "locations" DROP COLUMN "route_count";
  ALTER TABLE "locations" DROP COLUMN "problem_count";
  ALTER TABLE "locations" DROP COLUMN "sector_count";
  ALTER TABLE "locations" DROP COLUMN "season_summary";
  ALTER TABLE "locations" DROP COLUMN "transport_summary";
  ALTER TABLE "locations" DROP COLUMN "accommodation_summary";
  DROP TYPE "public"."enum_locations_climbing_styles";
  DROP TYPE "public"."enum_locations_rock_types";
  DROP TYPE "public"."enum_locations_rock_features";
  DROP TYPE "public"."enum_locations_setting_tags";
  DROP TYPE "public"."enum_locations_best_seasons";
  DROP TYPE "public"."enum_locations_avoid_seasons";
  DROP TYPE "public"."enum_locations_accommodation_tags";
  DROP TYPE "public"."enum_locations_transport_tags";
  DROP TYPE "public"."enum_locations_location_kind";
  DROP TYPE "public"."enum_locations_destination_scope";
  DROP TYPE "public"."enum_locations_content_completeness";`)
}
