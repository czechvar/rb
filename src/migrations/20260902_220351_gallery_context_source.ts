import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_programs_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  CREATE TYPE "public"."enum_guides_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  CREATE TYPE "public"."enum_locations_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  CREATE TYPE "public"."enum_events_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  CREATE TYPE "public"."enum_posts_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  CREATE TYPE "public"."enum_pages_blocks_gallery_source" AS ENUM('manual', 'currentEvent', 'currentLocation');
  ALTER TABLE "programs_blocks_gallery" ADD COLUMN "source" "enum_programs_blocks_gallery_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "guides_blocks_gallery" ADD COLUMN "source" "enum_guides_blocks_gallery_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "locations_blocks_gallery" ADD COLUMN "source" "enum_locations_blocks_gallery_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "events_blocks_gallery" ADD COLUMN "source" "enum_events_blocks_gallery_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "posts_blocks_gallery" ADD COLUMN "source" "enum_posts_blocks_gallery_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ADD COLUMN "source" "enum_pages_blocks_gallery_source" DEFAULT 'manual' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs_blocks_gallery" DROP COLUMN "source";
  ALTER TABLE "guides_blocks_gallery" DROP COLUMN "source";
  ALTER TABLE "locations_blocks_gallery" DROP COLUMN "source";
  ALTER TABLE "events_blocks_gallery" DROP COLUMN "source";
  ALTER TABLE "posts_blocks_gallery" DROP COLUMN "source";
  ALTER TABLE "pages_blocks_gallery" DROP COLUMN "source";
  DROP TYPE "public"."enum_programs_blocks_gallery_source";
  DROP TYPE "public"."enum_guides_blocks_gallery_source";
  DROP TYPE "public"."enum_locations_blocks_gallery_source";
  DROP TYPE "public"."enum_events_blocks_gallery_source";
  DROP TYPE "public"."enum_posts_blocks_gallery_source";
  DROP TYPE "public"."enum_pages_blocks_gallery_source";`)
}
