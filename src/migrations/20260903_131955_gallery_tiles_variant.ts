import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_programs_blocks_gallery_variant" ADD VALUE 'tiles';
  ALTER TYPE "public"."enum_guides_blocks_gallery_variant" ADD VALUE 'tiles';
  ALTER TYPE "public"."enum_locations_blocks_gallery_variant" ADD VALUE 'tiles';
  ALTER TYPE "public"."enum_events_blocks_gallery_variant" ADD VALUE 'tiles';
  ALTER TYPE "public"."enum_posts_blocks_gallery_variant" ADD VALUE 'tiles';
  ALTER TYPE "public"."enum_pages_blocks_gallery_variant" ADD VALUE 'tiles';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "programs_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  UPDATE "guides_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  UPDATE "locations_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  UPDATE "events_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  UPDATE "posts_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  UPDATE "pages_blocks_gallery" SET "variant" = 'grid' WHERE "variant" = 'tiles';
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_programs_blocks_gallery_variant";
  CREATE TYPE "public"."enum_programs_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_programs_blocks_gallery_variant";
  ALTER TABLE "programs_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_programs_blocks_gallery_variant" USING "variant"::"public"."enum_programs_blocks_gallery_variant";
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_guides_blocks_gallery_variant";
  CREATE TYPE "public"."enum_guides_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_guides_blocks_gallery_variant";
  ALTER TABLE "guides_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_guides_blocks_gallery_variant" USING "variant"::"public"."enum_guides_blocks_gallery_variant";
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_locations_blocks_gallery_variant";
  CREATE TYPE "public"."enum_locations_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_locations_blocks_gallery_variant";
  ALTER TABLE "locations_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_locations_blocks_gallery_variant" USING "variant"::"public"."enum_locations_blocks_gallery_variant";
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_events_blocks_gallery_variant";
  CREATE TYPE "public"."enum_events_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_events_blocks_gallery_variant";
  ALTER TABLE "events_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_events_blocks_gallery_variant" USING "variant"::"public"."enum_events_blocks_gallery_variant";
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_posts_blocks_gallery_variant";
  CREATE TYPE "public"."enum_posts_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_posts_blocks_gallery_variant";
  ALTER TABLE "posts_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_posts_blocks_gallery_variant" USING "variant"::"public"."enum_posts_blocks_gallery_variant";
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_pages_blocks_gallery_variant";
  CREATE TYPE "public"."enum_pages_blocks_gallery_variant" AS ENUM('grid', 'masonry');
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DEFAULT 'grid'::"public"."enum_pages_blocks_gallery_variant";
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_gallery_variant" USING "variant"::"public"."enum_pages_blocks_gallery_variant";`)
}
