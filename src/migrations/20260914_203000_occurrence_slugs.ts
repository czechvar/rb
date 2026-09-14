import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "event_dates" ADD COLUMN "slug" varchar;
    CREATE TABLE "event_dates_slug_aliases" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL
    );
    ALTER TABLE "event_dates_slug_aliases"
      ADD CONSTRAINT "event_dates_slug_aliases_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "event_dates_slug_aliases_order_idx" ON "event_dates_slug_aliases" USING btree ("_order");
    CREATE INDEX "event_dates_slug_aliases_parent_id_idx" ON "event_dates_slug_aliases" USING btree ("_parent_id");
    CREATE INDEX "event_dates_slug_idx" ON "event_dates" USING btree ("slug");
    CREATE UNIQUE INDEX "event_dates_event_slug_unique" ON "event_dates" USING btree ("event_id", "slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "event_dates_event_slug_unique";
    DROP INDEX "event_dates_slug_idx";
    DROP TABLE "event_dates_slug_aliases" CASCADE;
    ALTER TABLE "event_dates" DROP COLUMN "slug";
  `)
}
