import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_programs_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_guides_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_locations_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_events_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_posts_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_pages_blocks_section_intro_variant" AS ENUM('light', 'darkSplit');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE OR REPLACE FUNCTION section_intro_text_to_lexical(value text) RETURNS jsonb AS $function$
    SELECT CASE
      WHEN value IS NULL OR value = '' THEN NULL
      ELSE jsonb_build_object(
        'root',
        jsonb_build_object(
          'type',
          'root',
          'children',
          jsonb_build_array(
            jsonb_build_object(
              'type',
              'paragraph',
              'version',
              1,
              'children',
              jsonb_build_array(jsonb_build_object('type', 'text', 'version', 1, 'text', value)),
              'direction',
              NULL,
              'format',
              '',
              'indent',
              0
            )
          ),
          'direction',
          NULL,
          'format',
          '',
          'indent',
          0,
          'version',
          1
        )
      )
    END
  $function$ LANGUAGE sql IMMUTABLE;
  CREATE OR REPLACE FUNCTION section_intro_text_to_lexical(value jsonb) RETURNS jsonb AS $function$
    SELECT value
  $function$ LANGUAGE sql IMMUTABLE;
  ALTER TABLE "programs_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_programs_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "guides_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_guides_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "locations_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_locations_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "events_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_events_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "posts_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_posts_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN IF NOT EXISTS "variant" "enum_pages_blocks_section_intro_variant" DEFAULT 'light' NOT NULL;
  ALTER TABLE "programs_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  ALTER TABLE "guides_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  ALTER TABLE "locations_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  ALTER TABLE "events_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  ALTER TABLE "posts_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  ALTER TABLE "pages_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE jsonb USING section_intro_text_to_lexical("body");
  DROP FUNCTION section_intro_text_to_lexical(text);
  DROP FUNCTION section_intro_text_to_lexical(jsonb);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE OR REPLACE FUNCTION section_intro_lexical_to_text(value jsonb) RETURNS text AS $function$
    SELECT value #>> '{root,children,0,children,0,text}'
  $function$ LANGUAGE sql IMMUTABLE;
  ALTER TABLE "programs_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "guides_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "locations_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "events_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "posts_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "pages_blocks_section_intro" ALTER COLUMN "body" SET DATA TYPE varchar USING section_intro_lexical_to_text("body");
  ALTER TABLE "programs_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "guides_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "locations_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "events_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "posts_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN IF EXISTS "variant";
  DROP TYPE IF EXISTS "public"."enum_programs_blocks_section_intro_variant";
  DROP TYPE IF EXISTS "public"."enum_guides_blocks_section_intro_variant";
  DROP TYPE IF EXISTS "public"."enum_locations_blocks_section_intro_variant";
  DROP TYPE IF EXISTS "public"."enum_events_blocks_section_intro_variant";
  DROP TYPE IF EXISTS "public"."enum_posts_blocks_section_intro_variant";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_section_intro_variant";
  DROP FUNCTION section_intro_lexical_to_text(jsonb);`)
}
