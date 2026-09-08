import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_programs_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_guides_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_locations_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_events_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_posts_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_pages_blocks_stats_columns" AS ENUM('auto', '2', '3', '4');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "programs_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_programs_blocks_stats_columns" DEFAULT 'auto' NOT NULL;
  ALTER TABLE "guides_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_guides_blocks_stats_columns" DEFAULT 'auto' NOT NULL;
  ALTER TABLE "locations_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_locations_blocks_stats_columns" DEFAULT 'auto' NOT NULL;
  ALTER TABLE "events_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_events_blocks_stats_columns" DEFAULT 'auto' NOT NULL;
  ALTER TABLE "posts_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_posts_blocks_stats_columns" DEFAULT 'auto' NOT NULL;
  ALTER TABLE "pages_blocks_stats" ADD COLUMN IF NOT EXISTS "columns" "enum_pages_blocks_stats_columns" DEFAULT 'auto' NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs_blocks_stats" DROP COLUMN IF EXISTS "columns";
  ALTER TABLE "guides_blocks_stats" DROP COLUMN IF EXISTS "columns";
  ALTER TABLE "locations_blocks_stats" DROP COLUMN IF EXISTS "columns";
  ALTER TABLE "events_blocks_stats" DROP COLUMN IF EXISTS "columns";
  ALTER TABLE "posts_blocks_stats" DROP COLUMN IF EXISTS "columns";
  ALTER TABLE "pages_blocks_stats" DROP COLUMN IF EXISTS "columns";
  DROP TYPE IF EXISTS "public"."enum_programs_blocks_stats_columns";
  DROP TYPE IF EXISTS "public"."enum_guides_blocks_stats_columns";
  DROP TYPE IF EXISTS "public"."enum_locations_blocks_stats_columns";
  DROP TYPE IF EXISTS "public"."enum_events_blocks_stats_columns";
  DROP TYPE IF EXISTS "public"."enum_posts_blocks_stats_columns";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_stats_columns";`)
}
