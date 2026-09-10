import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The snapshot includes previously migrated CZK columns; this migration owns only trip sections.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_trip_sections_kind" AS ENUM('overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes');
  CREATE TABLE "event_trip_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_event_trip_sections_kind" NOT NULL,
    "heading" varchar NOT NULL,
    "body" jsonb NOT NULL
  );

  ALTER TABLE "event_trip_sections" ADD CONSTRAINT "event_trip_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_trip_sections_order_idx" ON "event_trip_sections" USING btree ("_order");
  CREATE INDEX "event_trip_sections_parent_id_idx" ON "event_trip_sections" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "event_trip_sections" CASCADE;
  DROP TYPE "public"."enum_event_trip_sections_kind";`)
}
