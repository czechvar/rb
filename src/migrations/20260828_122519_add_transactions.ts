import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_transactions_currency" AS ENUM('EUR', 'CZK');
  CREATE TYPE "public"."enum_transactions_state" AS ENUM('created', 'begun', 'pending-payment', 'paid', 'cancelled', 'failed');
  CREATE TYPE "public"."enum_transactions_payment_method" AS ENUM('paypal', 'muzapay', 'comgate-card', 'comgate-transfer', 'bank-transfer');
  CREATE TABLE "transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"uuid" varchar NOT NULL,
  	"order_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"amount_without_vat" numeric NOT NULL,
  	"currency" "enum_transactions_currency" NOT NULL,
  	"label" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"state" "enum_transactions_state" DEFAULT 'created' NOT NULL,
  	"payment_method" "enum_transactions_payment_method" NOT NULL,
  	"payload" jsonb,
  	"callback_payload" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "transactions_id" integer;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "transactions_uuid_idx" ON "transactions" USING btree ("uuid");
  CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");
  CREATE INDEX "transactions_updated_at_idx" ON "transactions" USING btree ("updated_at");
  CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("transactions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "transactions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_transactions_fk";
  
  DROP INDEX "payload_locked_documents_rels_transactions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "transactions_id";
  DROP TYPE "public"."enum_transactions_currency";
  DROP TYPE "public"."enum_transactions_state";
  DROP TYPE "public"."enum_transactions_payment_method";`)
}
