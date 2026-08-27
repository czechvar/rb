import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_home_hero" CASCADE;
  DROP TABLE "pages_blocks_home_stats" CASCADE;
  DROP TABLE "pages_blocks_home_who_we_are" CASCADE;
  DROP TABLE "pages_blocks_home_featured_trips" CASCADE;
  DROP TABLE "pages_blocks_home_why_rockbusters" CASCADE;
  DROP TABLE "pages_blocks_home_pro_climbers" CASCADE;
  DROP TABLE "pages_blocks_home_pick_your_experience" CASCADE;
  DROP TABLE "pages_blocks_home_destinations" CASCADE;
  DROP TABLE "pages_blocks_home_testimonials" CASCADE;
  DROP TABLE "pages_blocks_home_team" CASCADE;
  DROP TABLE "pages_blocks_home_f_a_q" CASCADE;
  DROP TABLE "pages_blocks_home_partners" CASCADE;
  DROP TABLE "pages_blocks_home_final_c_t_a" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_who_we_are" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_featured_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_why_rockbusters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_pro_climbers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_pick_your_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_f_a_q" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_home_final_c_t_a" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_stats" ADD CONSTRAINT "pages_blocks_home_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_who_we_are" ADD CONSTRAINT "pages_blocks_home_who_we_are_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_featured_trips" ADD CONSTRAINT "pages_blocks_home_featured_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_why_rockbusters" ADD CONSTRAINT "pages_blocks_home_why_rockbusters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_pro_climbers" ADD CONSTRAINT "pages_blocks_home_pro_climbers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_pick_your_experience" ADD CONSTRAINT "pages_blocks_home_pick_your_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_destinations" ADD CONSTRAINT "pages_blocks_home_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_testimonials" ADD CONSTRAINT "pages_blocks_home_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_team" ADD CONSTRAINT "pages_blocks_home_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_f_a_q" ADD CONSTRAINT "pages_blocks_home_f_a_q_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_partners" ADD CONSTRAINT "pages_blocks_home_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_final_c_t_a" ADD CONSTRAINT "pages_blocks_home_final_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_hero_order_idx" ON "pages_blocks_home_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_hero_parent_id_idx" ON "pages_blocks_home_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_hero_path_idx" ON "pages_blocks_home_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_stats_order_idx" ON "pages_blocks_home_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_stats_parent_id_idx" ON "pages_blocks_home_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_stats_path_idx" ON "pages_blocks_home_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_who_we_are_order_idx" ON "pages_blocks_home_who_we_are" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_who_we_are_parent_id_idx" ON "pages_blocks_home_who_we_are" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_who_we_are_path_idx" ON "pages_blocks_home_who_we_are" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_featured_trips_order_idx" ON "pages_blocks_home_featured_trips" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_featured_trips_parent_id_idx" ON "pages_blocks_home_featured_trips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_featured_trips_path_idx" ON "pages_blocks_home_featured_trips" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_why_rockbusters_order_idx" ON "pages_blocks_home_why_rockbusters" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_why_rockbusters_parent_id_idx" ON "pages_blocks_home_why_rockbusters" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_why_rockbusters_path_idx" ON "pages_blocks_home_why_rockbusters" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_pro_climbers_order_idx" ON "pages_blocks_home_pro_climbers" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_pro_climbers_parent_id_idx" ON "pages_blocks_home_pro_climbers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_pro_climbers_path_idx" ON "pages_blocks_home_pro_climbers" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_pick_your_experience_order_idx" ON "pages_blocks_home_pick_your_experience" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_pick_your_experience_parent_id_idx" ON "pages_blocks_home_pick_your_experience" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_pick_your_experience_path_idx" ON "pages_blocks_home_pick_your_experience" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_destinations_order_idx" ON "pages_blocks_home_destinations" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_destinations_parent_id_idx" ON "pages_blocks_home_destinations" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_destinations_path_idx" ON "pages_blocks_home_destinations" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_testimonials_order_idx" ON "pages_blocks_home_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_testimonials_parent_id_idx" ON "pages_blocks_home_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_testimonials_path_idx" ON "pages_blocks_home_testimonials" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_team_order_idx" ON "pages_blocks_home_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_team_parent_id_idx" ON "pages_blocks_home_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_team_path_idx" ON "pages_blocks_home_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_f_a_q_order_idx" ON "pages_blocks_home_f_a_q" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_f_a_q_parent_id_idx" ON "pages_blocks_home_f_a_q" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_f_a_q_path_idx" ON "pages_blocks_home_f_a_q" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_partners_order_idx" ON "pages_blocks_home_partners" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_partners_parent_id_idx" ON "pages_blocks_home_partners" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_partners_path_idx" ON "pages_blocks_home_partners" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_final_c_t_a_order_idx" ON "pages_blocks_home_final_c_t_a" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_final_c_t_a_parent_id_idx" ON "pages_blocks_home_final_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_final_c_t_a_path_idx" ON "pages_blocks_home_final_c_t_a" USING btree ("_path");`)
}
