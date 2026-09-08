import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "programs_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  CREATE TABLE "guides_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  CREATE TABLE "locations_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  CREATE TABLE "events_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  CREATE TABLE "posts_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  CREATE TABLE "pages_blocks_hero_accent_words" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "text" varchar
  );

  ALTER TABLE "programs_blocks_hero_accent_words" ADD CONSTRAINT "programs_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_hero_accent_words" ADD CONSTRAINT "guides_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_hero_accent_words" ADD CONSTRAINT "locations_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_blocks_hero_accent_words" ADD CONSTRAINT "events_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_hero_accent_words" ADD CONSTRAINT "posts_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_accent_words" ADD CONSTRAINT "pages_blocks_hero_accent_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_blocks_hero_accent_words_order_idx" ON "programs_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "programs_blocks_hero_accent_words_parent_id_idx" ON "programs_blocks_hero_accent_words" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_hero_accent_words_order_idx" ON "guides_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "guides_blocks_hero_accent_words_parent_id_idx" ON "guides_blocks_hero_accent_words" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_hero_accent_words_order_idx" ON "locations_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "locations_blocks_hero_accent_words_parent_id_idx" ON "locations_blocks_hero_accent_words" USING btree ("_parent_id");
  CREATE INDEX "events_blocks_hero_accent_words_order_idx" ON "events_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "events_blocks_hero_accent_words_parent_id_idx" ON "events_blocks_hero_accent_words" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_hero_accent_words_order_idx" ON "posts_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "posts_blocks_hero_accent_words_parent_id_idx" ON "posts_blocks_hero_accent_words" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_accent_words_order_idx" ON "pages_blocks_hero_accent_words" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_accent_words_parent_id_idx" ON "pages_blocks_hero_accent_words" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "programs_blocks_hero_accent_words" CASCADE;
  DROP TABLE "guides_blocks_hero_accent_words" CASCADE;
  DROP TABLE "locations_blocks_hero_accent_words" CASCADE;
  DROP TABLE "events_blocks_hero_accent_words" CASCADE;
  DROP TABLE "posts_blocks_hero_accent_words" CASCADE;
  DROP TABLE "pages_blocks_hero_accent_words" CASCADE;`)
}
