import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_locations_blocks_destination_logistics_variant" AS ENUM('cards', 'list');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "locations_blocks_destination_logistics"
      ADD COLUMN IF NOT EXISTS "variant" "public"."enum_locations_blocks_destination_logistics_variant" DEFAULT 'cards';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "locations_blocks_destination_logistics" DROP COLUMN IF EXISTS "variant";
    DROP TYPE IF EXISTS "public"."enum_locations_blocks_destination_logistics_variant";
  `)
}
