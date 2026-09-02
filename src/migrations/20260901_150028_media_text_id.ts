import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const mediaReferenceColumns = [
  ['events', 'main_picture_id'],
  ['events_blocks_hero', 'background_media_id'],
  ['events_blocks_media_block', 'media_id'],
  ['events_itinerary_days', 'image_id'],
  ['guides', 'photo_id'],
  ['guides_blocks_hero', 'background_media_id'],
  ['guides_blocks_media_block', 'media_id'],
  ['locations', 'main_picture_id'],
  ['locations_blocks_hero', 'background_media_id'],
  ['locations_blocks_media_block', 'media_id'],
  ['pages_blocks_hero', 'background_media_id'],
  ['pages_blocks_media_block', 'media_id'],
  ['partners', 'logo_id'],
  ['posts', 'hero_image_id'],
  ['posts_blocks_hero', 'background_media_id'],
  ['posts_blocks_media_block', 'media_id'],
  ['programs', 'main_picture_id'],
  ['programs_blocks_hero', 'background_media_id'],
  ['programs_blocks_media_block', 'media_id'],
] as const

const mediaRelsColumns = [
  ['events_rels', 'media_id'],
  ['guides_rels', 'media_id'],
  ['locations_rels', 'media_id'],
  ['pages_rels', 'media_id'],
  ['payload_locked_documents_rels', 'media_id'],
  ['posts_rels', 'media_id'],
  ['programs_rels', 'media_id'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_main_picture_id_media_id_fk";
    ALTER TABLE "events_blocks_hero" DROP CONSTRAINT IF EXISTS "events_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "events_blocks_media_block" DROP CONSTRAINT IF EXISTS "events_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "events_itinerary_days" DROP CONSTRAINT IF EXISTS "events_itinerary_days_image_id_media_id_fk";
    ALTER TABLE "events_rels" DROP CONSTRAINT IF EXISTS "events_rels_media_fk";
    ALTER TABLE "guides" DROP CONSTRAINT IF EXISTS "guides_photo_id_media_id_fk";
    ALTER TABLE "guides_blocks_hero" DROP CONSTRAINT IF EXISTS "guides_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "guides_blocks_media_block" DROP CONSTRAINT IF EXISTS "guides_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "guides_rels" DROP CONSTRAINT IF EXISTS "guides_rels_media_fk";
    ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "locations_main_picture_id_media_id_fk";
    ALTER TABLE "locations_blocks_hero" DROP CONSTRAINT IF EXISTS "locations_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "locations_blocks_media_block" DROP CONSTRAINT IF EXISTS "locations_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "locations_rels" DROP CONSTRAINT IF EXISTS "locations_rels_media_fk";
    ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "pages_blocks_media_block" DROP CONSTRAINT IF EXISTS "pages_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_media_fk";
    ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "partners_logo_id_media_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_fk";
    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_hero_image_id_media_id_fk";
    ALTER TABLE "posts_blocks_hero" DROP CONSTRAINT IF EXISTS "posts_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "posts_blocks_media_block" DROP CONSTRAINT IF EXISTS "posts_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_media_fk";
    ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_main_picture_id_media_id_fk";
    ALTER TABLE "programs_blocks_hero" DROP CONSTRAINT IF EXISTS "programs_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "programs_blocks_media_block" DROP CONSTRAINT IF EXISTS "programs_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "programs_rels" DROP CONSTRAINT IF EXISTS "programs_rels_media_fk";
  `)

  for (const [table, column] of [...mediaReferenceColumns, ...mediaRelsColumns]) {
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE varchar USING "${column}"::varchar;`,
      ),
    )
  }

  await db.execute(sql`
    ALTER TABLE "media" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "media" ALTER COLUMN "id" TYPE varchar USING "id"::varchar;

    ALTER TABLE "events" ADD CONSTRAINT "events_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_blocks_hero" ADD CONSTRAINT "events_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_blocks_media_block" ADD CONSTRAINT "events_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_itinerary_days" ADD CONSTRAINT "events_itinerary_days_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "guides" ADD CONSTRAINT "guides_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_blocks_hero" ADD CONSTRAINT "guides_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_blocks_media_block" ADD CONSTRAINT "guides_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "locations" ADD CONSTRAINT "locations_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_blocks_hero" ADD CONSTRAINT "locations_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_blocks_media_block" ADD CONSTRAINT "locations_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_blocks_hero" ADD CONSTRAINT "posts_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_blocks_media_block" ADD CONSTRAINT "posts_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "programs" ADD CONSTRAINT "programs_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_blocks_hero" ADD CONSTRAINT "programs_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_blocks_media_block" ADD CONSTRAINT "programs_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "media" WHERE "id" !~ '^[0-9]+$') THEN
        RAISE EXCEPTION 'Cannot roll media.id back to integer while non-numeric media IDs exist.';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_main_picture_id_media_id_fk";
    ALTER TABLE "events_blocks_hero" DROP CONSTRAINT IF EXISTS "events_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "events_blocks_media_block" DROP CONSTRAINT IF EXISTS "events_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "events_itinerary_days" DROP CONSTRAINT IF EXISTS "events_itinerary_days_image_id_media_id_fk";
    ALTER TABLE "events_rels" DROP CONSTRAINT IF EXISTS "events_rels_media_fk";
    ALTER TABLE "guides" DROP CONSTRAINT IF EXISTS "guides_photo_id_media_id_fk";
    ALTER TABLE "guides_blocks_hero" DROP CONSTRAINT IF EXISTS "guides_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "guides_blocks_media_block" DROP CONSTRAINT IF EXISTS "guides_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "guides_rels" DROP CONSTRAINT IF EXISTS "guides_rels_media_fk";
    ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "locations_main_picture_id_media_id_fk";
    ALTER TABLE "locations_blocks_hero" DROP CONSTRAINT IF EXISTS "locations_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "locations_blocks_media_block" DROP CONSTRAINT IF EXISTS "locations_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "locations_rels" DROP CONSTRAINT IF EXISTS "locations_rels_media_fk";
    ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "pages_blocks_media_block" DROP CONSTRAINT IF EXISTS "pages_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_media_fk";
    ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "partners_logo_id_media_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_fk";
    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_hero_image_id_media_id_fk";
    ALTER TABLE "posts_blocks_hero" DROP CONSTRAINT IF EXISTS "posts_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "posts_blocks_media_block" DROP CONSTRAINT IF EXISTS "posts_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_media_fk";
    ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_main_picture_id_media_id_fk";
    ALTER TABLE "programs_blocks_hero" DROP CONSTRAINT IF EXISTS "programs_blocks_hero_background_media_id_media_id_fk";
    ALTER TABLE "programs_blocks_media_block" DROP CONSTRAINT IF EXISTS "programs_blocks_media_block_media_id_media_id_fk";
    ALTER TABLE "programs_rels" DROP CONSTRAINT IF EXISTS "programs_rels_media_fk";
  `)

  await db.execute(sql`
    ALTER TABLE "media" ALTER COLUMN "id" TYPE integer USING "id"::integer;
    ALTER TABLE "media" ALTER COLUMN "id" SET DEFAULT nextval('media_id_seq'::regclass);
  `)

  for (const [table, column] of [...mediaReferenceColumns, ...mediaRelsColumns]) {
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE integer USING "${column}"::integer;`,
      ),
    )
  }

  await db.execute(sql`
    ALTER TABLE "events" ADD CONSTRAINT "events_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_blocks_hero" ADD CONSTRAINT "events_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_blocks_media_block" ADD CONSTRAINT "events_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_itinerary_days" ADD CONSTRAINT "events_itinerary_days_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "guides" ADD CONSTRAINT "guides_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_blocks_hero" ADD CONSTRAINT "guides_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_blocks_media_block" ADD CONSTRAINT "guides_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "locations" ADD CONSTRAINT "locations_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_blocks_hero" ADD CONSTRAINT "locations_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_blocks_media_block" ADD CONSTRAINT "locations_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_blocks_hero" ADD CONSTRAINT "posts_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_blocks_media_block" ADD CONSTRAINT "posts_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "programs" ADD CONSTRAINT "programs_main_picture_id_media_id_fk" FOREIGN KEY ("main_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_blocks_hero" ADD CONSTRAINT "programs_blocks_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_blocks_media_block" ADD CONSTRAINT "programs_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  `)
}
