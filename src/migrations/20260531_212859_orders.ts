import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_currency" AS ENUM('EUR', 'CZK');
  CREATE TYPE "public"."enum_orders_state" AS ENUM('pending', 'confirmed', 'paid', 'completed', 'cancelled');
  CREATE TABLE "orders_participants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL
  );
  
  CREATE TABLE "orders_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author_id" integer NOT NULL,
  	"created_at" timestamp(3) with time zone NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"user_id" integer NOT NULL,
  	"event_date_id" integer NOT NULL,
  	"participant_count" numeric NOT NULL,
  	"billing_address_first_name" varchar NOT NULL,
  	"billing_address_last_name" varchar NOT NULL,
  	"billing_address_street" varchar NOT NULL,
  	"billing_address_city" varchar NOT NULL,
  	"billing_address_postal_code" varchar NOT NULL,
  	"billing_address_country" varchar NOT NULL,
  	"billing_address_company_company_name" varchar,
  	"billing_address_company_ico" varchar,
  	"billing_address_company_dic" varchar,
  	"unit_price" numeric NOT NULL,
  	"vat" numeric NOT NULL,
  	"currency" "enum_orders_currency" NOT NULL,
  	"total_price" numeric NOT NULL,
  	"state" "enum_orders_state" DEFAULT 'pending' NOT NULL,
  	"customer_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "orders_participants" ADD CONSTRAINT "orders_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_notes" ADD CONSTRAINT "orders_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_notes" ADD CONSTRAINT "orders_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_event_date_id_event_dates_id_fk" FOREIGN KEY ("event_date_id") REFERENCES "public"."event_dates"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_participants_order_idx" ON "orders_participants" USING btree ("_order");
  CREATE INDEX "orders_participants_parent_id_idx" ON "orders_participants" USING btree ("_parent_id");
  CREATE INDEX "orders_notes_order_idx" ON "orders_notes" USING btree ("_order");
  CREATE INDEX "orders_notes_parent_id_idx" ON "orders_notes" USING btree ("_parent_id");
  CREATE INDEX "orders_notes_author_idx" ON "orders_notes" USING btree ("author_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
  CREATE INDEX "orders_event_date_idx" ON "orders" USING btree ("event_date_id");
  CREATE INDEX "orders_participant_count_idx" ON "orders" USING btree ("participant_count");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_participants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_participants" CASCADE;
  DROP TABLE "orders_notes" CASCADE;
  DROP TABLE "orders" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  DROP TYPE "public"."enum_orders_currency";
  DROP TYPE "public"."enum_orders_state";`)
}
