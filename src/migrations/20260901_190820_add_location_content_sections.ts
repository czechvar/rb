import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_locations_content_sections_status'
      ) THEN
        CREATE TYPE "public"."enum_locations_content_sections_status" AS ENUM(
          'enriched',
          'mixed',
          'legacy',
          'missing',
          'not-applicable'
        );
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "locations_content_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "heading" varchar NOT NULL,
      "status" "enum_locations_content_sections_status" NOT NULL,
      "body" varchar,
      "source_refs" jsonb,
      "warnings" jsonb
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'locations_content_sections_parent_id_fk'
      ) THEN
        ALTER TABLE "locations_content_sections"
          ADD CONSTRAINT "locations_content_sections_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."locations"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "locations_content_sections_order_idx"
      ON "locations_content_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "locations_content_sections_parent_id_idx"
      ON "locations_content_sections" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "locations_content_sections";
    DROP TYPE IF EXISTS "public"."enum_locations_content_sections_status";
  `)
}
