import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guides_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "guides_about_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "guides_coaching_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "guides_achievements_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"route" varchar NOT NULL,
  	"location" varchar,
  	"grade" varchar
  );
  
  ALTER TABLE "guides" ADD COLUMN "hero_sub" varchar;
  ALTER TABLE "guides" ADD COLUMN "hero_caption" varchar;
  ALTER TABLE "guides" ADD COLUMN "about_headline" varchar;
  ALTER TABLE "guides" ADD COLUMN "about_quote" varchar;
  ALTER TABLE "guides" ADD COLUMN "about_quote_attribution" varchar;
  ALTER TABLE "guides" ADD COLUMN "coaching_intro" varchar;
  ALTER TABLE "guides" ADD COLUMN "achievements_intro" varchar;
  ALTER TABLE "guides" ADD COLUMN "testimonial_quote" varchar;
  ALTER TABLE "guides" ADD COLUMN "testimonial_name" varchar;
  ALTER TABLE "guides" ADD COLUMN "testimonial_trip_line" varchar;
  ALTER TABLE "guides_stats" ADD CONSTRAINT "guides_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_about_facts" ADD CONSTRAINT "guides_about_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_coaching_pillars" ADD CONSTRAINT "guides_coaching_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_achievements_items" ADD CONSTRAINT "guides_achievements_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_stats_order_idx" ON "guides_stats" USING btree ("_order");
  CREATE INDEX "guides_stats_parent_id_idx" ON "guides_stats" USING btree ("_parent_id");
  CREATE INDEX "guides_about_facts_order_idx" ON "guides_about_facts" USING btree ("_order");
  CREATE INDEX "guides_about_facts_parent_id_idx" ON "guides_about_facts" USING btree ("_parent_id");
  CREATE INDEX "guides_coaching_pillars_order_idx" ON "guides_coaching_pillars" USING btree ("_order");
  CREATE INDEX "guides_coaching_pillars_parent_id_idx" ON "guides_coaching_pillars" USING btree ("_parent_id");
  CREATE INDEX "guides_achievements_items_order_idx" ON "guides_achievements_items" USING btree ("_order");
  CREATE INDEX "guides_achievements_items_parent_id_idx" ON "guides_achievements_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guides_stats" CASCADE;
  DROP TABLE "guides_about_facts" CASCADE;
  DROP TABLE "guides_coaching_pillars" CASCADE;
  DROP TABLE "guides_achievements_items" CASCADE;
  ALTER TABLE "guides" DROP COLUMN "hero_sub";
  ALTER TABLE "guides" DROP COLUMN "hero_caption";
  ALTER TABLE "guides" DROP COLUMN "about_headline";
  ALTER TABLE "guides" DROP COLUMN "about_quote";
  ALTER TABLE "guides" DROP COLUMN "about_quote_attribution";
  ALTER TABLE "guides" DROP COLUMN "coaching_intro";
  ALTER TABLE "guides" DROP COLUMN "achievements_intro";
  ALTER TABLE "guides" DROP COLUMN "testimonial_quote";
  ALTER TABLE "guides" DROP COLUMN "testimonial_name";
  ALTER TABLE "guides" DROP COLUMN "testimonial_trip_line";`)
}
