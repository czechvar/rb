import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guides_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "guides" ADD COLUMN "tagline" varchar;
  ALTER TABLE "guides_tags" ADD CONSTRAINT "guides_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_tags_order_idx" ON "guides_tags" USING btree ("_order");
  CREATE INDEX "guides_tags_parent_id_idx" ON "guides_tags" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guides_tags" CASCADE;
  ALTER TABLE "guides" DROP COLUMN "tagline";`)
}
