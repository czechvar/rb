import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_pages_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
    ALTER TYPE "public"."enum_programs_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
    ALTER TYPE "public"."enum_events_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
    ALTER TYPE "public"."enum_locations_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
    ALTER TYPE "public"."enum_guides_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
    ALTER TYPE "public"."enum_posts_blocks_stats_variant" ADD VALUE IF NOT EXISTS 'heroBar';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "pages_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';
    UPDATE "programs_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';
    UPDATE "events_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';
    UPDATE "locations_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';
    UPDATE "guides_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';
    UPDATE "posts_blocks_stats" SET "variant" = 'dark' WHERE "variant" = 'heroBar';

    ALTER TABLE "pages_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "pages_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_pages_blocks_stats_variant";
    CREATE TYPE "public"."enum_pages_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "pages_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_pages_blocks_stats_variant";
    ALTER TABLE "pages_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_stats_variant" USING "variant"::"public"."enum_pages_blocks_stats_variant";

    ALTER TABLE "programs_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "programs_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_programs_blocks_stats_variant";
    CREATE TYPE "public"."enum_programs_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "programs_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_programs_blocks_stats_variant";
    ALTER TABLE "programs_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_programs_blocks_stats_variant" USING "variant"::"public"."enum_programs_blocks_stats_variant";

    ALTER TABLE "events_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "events_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_events_blocks_stats_variant";
    CREATE TYPE "public"."enum_events_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "events_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_events_blocks_stats_variant";
    ALTER TABLE "events_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_events_blocks_stats_variant" USING "variant"::"public"."enum_events_blocks_stats_variant";

    ALTER TABLE "locations_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "locations_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_locations_blocks_stats_variant";
    CREATE TYPE "public"."enum_locations_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "locations_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_locations_blocks_stats_variant";
    ALTER TABLE "locations_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_locations_blocks_stats_variant" USING "variant"::"public"."enum_locations_blocks_stats_variant";

    ALTER TABLE "guides_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "guides_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_guides_blocks_stats_variant";
    CREATE TYPE "public"."enum_guides_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "guides_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_guides_blocks_stats_variant";
    ALTER TABLE "guides_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_guides_blocks_stats_variant" USING "variant"::"public"."enum_guides_blocks_stats_variant";

    ALTER TABLE "posts_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "posts_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::text;
    DROP TYPE "public"."enum_posts_blocks_stats_variant";
    CREATE TYPE "public"."enum_posts_blocks_stats_variant" AS ENUM('light', 'dark', 'inlineDark', 'numberedDark');
    ALTER TABLE "posts_blocks_stats" ALTER COLUMN "variant" SET DEFAULT 'light'::"public"."enum_posts_blocks_stats_variant";
    ALTER TABLE "posts_blocks_stats" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_posts_blocks_stats_variant" USING "variant"::"public"."enum_posts_blocks_stats_variant";
  `)
}
