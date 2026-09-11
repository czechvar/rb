import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Retain unused legacy nullable image/airport columns, indexes and constraints (ADR-0011).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_editorial_dates_mode" AS ENUM('list', 'notice');
  CREATE TYPE "public"."enum_event_dates_editorial_dates_mode" AS ENUM('list', 'notice');
  CREATE TABLE "event_ed_editorial_facts_strip_adc3993f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "event_ed_editorial_summary_row_f87389cd" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "event_ed_editorial_companion_c_d9e77b3f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar
  );

  CREATE TABLE "event_ed_editorial_companion_r_21fbc092" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "event_ed_editorial_companion_r_5d4fe449" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "event_ed_editorial_companion_l_1f347525" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "href" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_facts_strip_adc3993f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_summary_row_f87389cd" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "description" varchar
  );

  CREATE TABLE "date_ed_editorial_companion_c_d9e77b3f" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar
  );

  CREATE TABLE "date_ed_editorial_companion_r_21fbc092" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "date_ed_editorial_companion_r_5d4fe449" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "date_ed_editorial_companion_l_1f347525" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "href" varchar,
    "description" varchar
  );










  ALTER TABLE "events" ADD COLUMN "editorial_actions_overview_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_actions_summary_label" varchar;
  ALTER TABLE "events" ADD COLUMN "editorial_dates_mode" "enum_events_editorial_dates_mode";
  ALTER TABLE "event_dates" ADD COLUMN "editorial_actions_overview_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_actions_summary_label" varchar;
  ALTER TABLE "event_dates" ADD COLUMN "editorial_dates_mode" "enum_event_dates_editorial_dates_mode";
  ALTER TABLE "event_ed_editorial_facts_strip_adc3993f" ADD CONSTRAINT "event_ed_editorial_facts_strip_adc3993f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_summary_row_f87389cd" ADD CONSTRAINT "event_ed_editorial_summary_row_f87389cd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_companion_c_d9e77b3f" ADD CONSTRAINT "event_ed_editorial_companion_c_d9e77b3f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_companion_r_21fbc092" ADD CONSTRAINT "event_ed_editorial_companion_r_21fbc092_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_ed_editorial_companion_r_5d4fe449"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_companion_r_5d4fe449" ADD CONSTRAINT "event_ed_editorial_companion_r_5d4fe449_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_ed_editorial_companion_l_1f347525" ADD CONSTRAINT "event_ed_editorial_companion_l_1f347525_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_facts_strip_adc3993f" ADD CONSTRAINT "date_ed_editorial_facts_strip_adc3993f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_summary_row_f87389cd" ADD CONSTRAINT "date_ed_editorial_summary_row_f87389cd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_companion_c_d9e77b3f" ADD CONSTRAINT "date_ed_editorial_companion_c_d9e77b3f_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_companion_r_21fbc092" ADD CONSTRAINT "date_ed_editorial_companion_r_21fbc092_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."date_ed_editorial_companion_r_5d4fe449"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_companion_r_5d4fe449" ADD CONSTRAINT "date_ed_editorial_companion_r_5d4fe449_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "date_ed_editorial_companion_l_1f347525" ADD CONSTRAINT "date_ed_editorial_companion_l_1f347525_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_dates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_ed_editorial_facts_strip_adc3993f_order_idx" ON "event_ed_editorial_facts_strip_adc3993f" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_facts_strip_adc3993f_parent_id_idx" ON "event_ed_editorial_facts_strip_adc3993f" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_summary_row_f87389cd_order_idx" ON "event_ed_editorial_summary_row_f87389cd" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_summary_row_f87389cd_parent_id_idx" ON "event_ed_editorial_summary_row_f87389cd" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_companion_c_d9e77b3f_order_idx" ON "event_ed_editorial_companion_c_d9e77b3f" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_companion_c_d9e77b3f_parent_id_idx" ON "event_ed_editorial_companion_c_d9e77b3f" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_companion_r_21fbc092_order_idx" ON "event_ed_editorial_companion_r_21fbc092" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_companion_r_21fbc092_parent_id_idx" ON "event_ed_editorial_companion_r_21fbc092" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_companion_r_5d4fe449_order_idx" ON "event_ed_editorial_companion_r_5d4fe449" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_companion_r_5d4fe449_parent_id_idx" ON "event_ed_editorial_companion_r_5d4fe449" USING btree ("_parent_id");
  CREATE INDEX "event_ed_editorial_companion_l_1f347525_order_idx" ON "event_ed_editorial_companion_l_1f347525" USING btree ("_order");
  CREATE INDEX "event_ed_editorial_companion_l_1f347525_parent_id_idx" ON "event_ed_editorial_companion_l_1f347525" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_facts_strip_adc3993f_order_idx" ON "date_ed_editorial_facts_strip_adc3993f" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_facts_strip_adc3993f_parent_id_idx" ON "date_ed_editorial_facts_strip_adc3993f" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_summary_row_f87389cd_order_idx" ON "date_ed_editorial_summary_row_f87389cd" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_summary_row_f87389cd_parent_id_idx" ON "date_ed_editorial_summary_row_f87389cd" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_companion_c_d9e77b3f_order_idx" ON "date_ed_editorial_companion_c_d9e77b3f" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_companion_c_d9e77b3f_parent_id_idx" ON "date_ed_editorial_companion_c_d9e77b3f" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_companion_r_21fbc092_order_idx" ON "date_ed_editorial_companion_r_21fbc092" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_companion_r_21fbc092_parent_id_idx" ON "date_ed_editorial_companion_r_21fbc092" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_companion_r_5d4fe449_order_idx" ON "date_ed_editorial_companion_r_5d4fe449" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_companion_r_5d4fe449_parent_id_idx" ON "date_ed_editorial_companion_r_5d4fe449" USING btree ("_parent_id");
  CREATE INDEX "date_ed_editorial_companion_l_1f347525_order_idx" ON "date_ed_editorial_companion_l_1f347525" USING btree ("_order");
  CREATE INDEX "date_ed_editorial_companion_l_1f347525_parent_id_idx" ON "date_ed_editorial_companion_l_1f347525" USING btree ("_parent_id");


`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_ed_editorial_facts_strip_adc3993f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_summary_row_f87389cd" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_companion_c_d9e77b3f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_companion_r_21fbc092" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_companion_r_5d4fe449" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_ed_editorial_companion_l_1f347525" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_facts_strip_adc3993f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_summary_row_f87389cd" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_companion_c_d9e77b3f" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_companion_r_21fbc092" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_companion_r_5d4fe449" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "date_ed_editorial_companion_l_1f347525" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_ed_editorial_facts_strip_adc3993f" CASCADE;
  DROP TABLE "event_ed_editorial_summary_row_f87389cd" CASCADE;
  DROP TABLE "event_ed_editorial_companion_c_d9e77b3f" CASCADE;
  DROP TABLE "event_ed_editorial_companion_r_21fbc092" CASCADE;
  DROP TABLE "event_ed_editorial_companion_r_5d4fe449" CASCADE;
  DROP TABLE "event_ed_editorial_companion_l_1f347525" CASCADE;
  DROP TABLE "date_ed_editorial_facts_strip_adc3993f" CASCADE;
  DROP TABLE "date_ed_editorial_summary_row_f87389cd" CASCADE;
  DROP TABLE "date_ed_editorial_companion_c_d9e77b3f" CASCADE;
  DROP TABLE "date_ed_editorial_companion_r_21fbc092" CASCADE;
  DROP TABLE "date_ed_editorial_companion_r_5d4fe449" CASCADE;
  DROP TABLE "date_ed_editorial_companion_l_1f347525" CASCADE;
  ALTER TABLE "events" DROP COLUMN "editorial_actions_overview_label";
  ALTER TABLE "events" DROP COLUMN "editorial_actions_summary_label";
  ALTER TABLE "events" DROP COLUMN "editorial_dates_mode";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_actions_overview_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_actions_summary_label";
  ALTER TABLE "event_dates" DROP COLUMN "editorial_dates_mode";
  DROP TYPE "public"."enum_events_editorial_dates_mode";
  DROP TYPE "public"."enum_event_dates_editorial_dates_mode";`)
}
