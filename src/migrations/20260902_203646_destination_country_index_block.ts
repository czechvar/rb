import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_destination_country_index_source" AS ENUM('all', 'featured');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_destination_country_index_variant" AS ENUM('photoCards', 'flagCards');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    CREATE TABLE IF NOT EXISTS "pages_blocks_destination_country_index" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "eyebrow" varchar,
      "heading" varchar,
      "intro" varchar,
      "source" "enum_pages_blocks_destination_country_index_source" DEFAULT 'all' NOT NULL,
      "variant" "enum_pages_blocks_destination_country_index_variant" DEFAULT 'photoCards' NOT NULL,
      "show_jump_bar" boolean DEFAULT true,
      "block_name" varchar
    );
    DO $$ BEGIN
      ALTER TABLE "pages_blocks_destination_country_index"
        ADD CONSTRAINT "pages_blocks_destination_country_index_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."pages"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    CREATE INDEX IF NOT EXISTS "pages_blocks_destination_country_index_order_idx"
      ON "pages_blocks_destination_country_index" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_destination_country_index_parent_id_idx"
      ON "pages_blocks_destination_country_index" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_destination_country_index_path_idx"
      ON "pages_blocks_destination_country_index" USING btree ("_path");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_destination_country_index" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "pages_blocks_destination_country_index" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_destination_country_index_source";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_destination_country_index_variant";
  `)
}
