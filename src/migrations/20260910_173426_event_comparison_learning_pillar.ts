import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_what_you_learn_box3_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "events_comparison_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"left" varchar NOT NULL,
  	"right" varchar NOT NULL
  );
  
  ALTER TABLE "events" ADD COLUMN "what_you_learn_box3_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "comparison_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "comparison_intro" varchar;
  ALTER TABLE "events" ADD COLUMN "comparison_left_heading" varchar;
  ALTER TABLE "events" ADD COLUMN "comparison_right_heading" varchar;
  ALTER TABLE "events_what_you_learn_box3_bullets" ADD CONSTRAINT "events_what_you_learn_box3_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_comparison_rows" ADD CONSTRAINT "events_comparison_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_what_you_learn_box3_bullets_order_idx" ON "events_what_you_learn_box3_bullets" USING btree ("_order");
  CREATE INDEX "events_what_you_learn_box3_bullets_parent_id_idx" ON "events_what_you_learn_box3_bullets" USING btree ("_parent_id");
  CREATE INDEX "events_comparison_rows_order_idx" ON "events_comparison_rows" USING btree ("_order");
  CREATE INDEX "events_comparison_rows_parent_id_idx" ON "events_comparison_rows" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_what_you_learn_box3_bullets" CASCADE;
  DROP TABLE "events_comparison_rows" CASCADE;
  ALTER TABLE "events" DROP COLUMN "what_you_learn_box3_heading";
  ALTER TABLE "events" DROP COLUMN "comparison_heading";
  ALTER TABLE "events" DROP COLUMN "comparison_intro";
  ALTER TABLE "events" DROP COLUMN "comparison_left_heading";
  ALTER TABLE "events" DROP COLUMN "comparison_right_heading";`)
}
