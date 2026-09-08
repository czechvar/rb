import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// The accompanying snapshot establishes the generator baseline after the
// earlier hand-authored migrations. The SQL below is deliberately limited to
// the new Catalogue Results block; those earlier migrations own their changes.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pages_blocks_catalogue_results_enabled_facets" AS ENUM('category', 'difficulty', 'location', 'month', 'guide');
    CREATE TYPE "public"."enum_pages_blocks_catalogue_results_default_sort" AS ENUM('date', 'priceAsc', 'priceDesc', 'title');
    CREATE TYPE "public"."enum_pages_blocks_catalogue_results_pagination_mode" AS ENUM('showMore', 'all');
    CREATE TYPE "public"."enum_pages_blocks_catalogue_results_presentation" AS ENUM('calendar', 'compact');

    CREATE TABLE "pages_blocks_catalogue_results" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "eyebrow" varchar,
      "heading" varchar,
      "intro" varchar,
      "default_sort" "enum_pages_blocks_catalogue_results_default_sort" DEFAULT 'date' NOT NULL,
      "result_limit" numeric DEFAULT 12,
      "pagination_mode" "enum_pages_blocks_catalogue_results_pagination_mode" DEFAULT 'showMore' NOT NULL,
      "presentation" "enum_pages_blocks_catalogue_results_presentation" DEFAULT 'calendar' NOT NULL,
      "sticky_filters" boolean DEFAULT false,
      "block_name" varchar
    );

    CREATE TABLE "pages_blocks_catalogue_results_enabled_facets" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_pages_blocks_catalogue_results_enabled_facets",
      "id" serial PRIMARY KEY NOT NULL
    );

    ALTER TABLE "pages_blocks_catalogue_results" ADD CONSTRAINT "pages_blocks_catalogue_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "pages_blocks_catalogue_results_enabled_facets" ADD CONSTRAINT "pages_blocks_catalogue_results_enabled_facets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_catalogue_results"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "pages_blocks_catalogue_results_order_idx" ON "pages_blocks_catalogue_results" USING btree ("_order");
    CREATE INDEX "pages_blocks_catalogue_results_parent_id_idx" ON "pages_blocks_catalogue_results" USING btree ("_parent_id");
    CREATE INDEX "pages_blocks_catalogue_results_path_idx" ON "pages_blocks_catalogue_results" USING btree ("_path");
    CREATE INDEX "pages_blocks_catalogue_results_enabled_facets_order_idx" ON "pages_blocks_catalogue_results_enabled_facets" USING btree ("order");
    CREATE INDEX "pages_blocks_catalogue_results_enabled_facets_parent_idx" ON "pages_blocks_catalogue_results_enabled_facets" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "pages_blocks_catalogue_results_enabled_facets" CASCADE;
    DROP TABLE "pages_blocks_catalogue_results" CASCADE;
    DROP TYPE "public"."enum_pages_blocks_catalogue_results_enabled_facets";
    DROP TYPE "public"."enum_pages_blocks_catalogue_results_default_sort";
    DROP TYPE "public"."enum_pages_blocks_catalogue_results_pagination_mode";
    DROP TYPE "public"."enum_pages_blocks_catalogue_results_presentation";
  `)
}
