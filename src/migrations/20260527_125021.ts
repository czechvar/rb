import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_addresses" ALTER COLUMN "street" SET NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "city" SET NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "postal_code" SET NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "country" SET NOT NULL;
  ALTER TABLE "users_addresses" ADD COLUMN "label" varchar;
  ALTER TABLE "users_addresses" ADD COLUMN "is_default" boolean DEFAULT false;
  ALTER TABLE "users_addresses" ADD COLUMN "first_name" varchar NOT NULL;
  ALTER TABLE "users_addresses" ADD COLUMN "last_name" varchar NOT NULL;
  ALTER TABLE "users_addresses" ADD COLUMN "company_company_name" varchar;
  ALTER TABLE "users_addresses" ADD COLUMN "company_ico" varchar;
  ALTER TABLE "users_addresses" ADD COLUMN "company_dic" varchar;
  ALTER TABLE "users" ADD COLUMN "phone" varchar NOT NULL DEFAULT '';
  ALTER TABLE "users" ALTER COLUMN "phone" DROP DEFAULT;
  ALTER TABLE "users" ADD COLUMN "pending_email" varchar;
  ALTER TABLE "users" ADD COLUMN "pending_email_token" varchar;
  ALTER TABLE "users" ADD COLUMN "pending_email_expires_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "last_verify_email_sent_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "_verified" boolean;
  ALTER TABLE "users" ADD COLUMN "_verificationtoken" varchar;
  UPDATE "users" SET "_verified" = true WHERE "_verified" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_addresses" ALTER COLUMN "street" DROP NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "city" DROP NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "postal_code" DROP NOT NULL;
  ALTER TABLE "users_addresses" ALTER COLUMN "country" DROP NOT NULL;
  ALTER TABLE "users_addresses" DROP COLUMN "label";
  ALTER TABLE "users_addresses" DROP COLUMN "is_default";
  ALTER TABLE "users_addresses" DROP COLUMN "first_name";
  ALTER TABLE "users_addresses" DROP COLUMN "last_name";
  ALTER TABLE "users_addresses" DROP COLUMN "company_company_name";
  ALTER TABLE "users_addresses" DROP COLUMN "company_ico";
  ALTER TABLE "users_addresses" DROP COLUMN "company_dic";
  ALTER TABLE "users" DROP COLUMN "phone";
  ALTER TABLE "users" DROP COLUMN "pending_email";
  ALTER TABLE "users" DROP COLUMN "pending_email_token";
  ALTER TABLE "users" DROP COLUMN "pending_email_expires_at";
  ALTER TABLE "users" DROP COLUMN "last_verify_email_sent_at";
  ALTER TABLE "users" DROP COLUMN "_verified";
  ALTER TABLE "users" DROP COLUMN "_verificationtoken";`)
}
