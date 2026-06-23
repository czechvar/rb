import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "discount_code_id" integer;
  ALTER TABLE "orders" ADD COLUMN "referral_id" integer;
  ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "discount_commission" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "referral_commission" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_discount_code_idx" ON "orders" USING btree ("discount_code_id");
  CREATE INDEX "orders_referral_idx" ON "orders" USING btree ("referral_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_discount_code_id_discount_codes_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_referral_id_referrals_id_fk";
  
  DROP INDEX "orders_discount_code_idx";
  DROP INDEX "orders_referral_idx";
  ALTER TABLE "orders" DROP COLUMN "discount_code_id";
  ALTER TABLE "orders" DROP COLUMN "referral_id";
  ALTER TABLE "orders" DROP COLUMN "discount_amount";
  ALTER TABLE "orders" DROP COLUMN "discount_commission";
  ALTER TABLE "orders" DROP COLUMN "referral_commission";`)
}
