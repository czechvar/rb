import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Private operational intake only; neither enquiries nor rate buckets belong in content seeds. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_contact_enquiries_preferred_contact" AS ENUM ('email', 'phone', 'whatsapp');
    CREATE TYPE "public"."enum_contact_enquiries_source" AS ENUM ('contact-page');
    CREATE TYPE "public"."enum_contact_enquiries_status" AS ENUM ('new', 'handled');
    CREATE TABLE "contact_enquiries" (
      "id" serial PRIMARY KEY NOT NULL,
      "submission_id" varchar NOT NULL,
      "payload_digest" varchar NOT NULL,
      "name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "level" varchar,
      "interest" varchar,
      "message" varchar NOT NULL,
      "preferred_contact" "enum_contact_enquiries_preferred_contact" NOT NULL,
      "phone" varchar,
      "source" "enum_contact_enquiries_source" DEFAULT 'contact-page' NOT NULL,
      "status" "enum_contact_enquiries_status" DEFAULT 'new' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "contact_enquiries_submission_id_idx" ON "contact_enquiries" USING btree ("submission_id");
    CREATE INDEX "contact_enquiries_updated_at_idx" ON "contact_enquiries" USING btree ("updated_at");
    CREATE INDEX "contact_enquiries_created_at_idx" ON "contact_enquiries" USING btree ("created_at");
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_enquiries_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_enquiries_fk"
      FOREIGN KEY ("contact_enquiries_id") REFERENCES "public"."contact_enquiries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    CREATE INDEX "payload_locked_documents_rels_contact_enquiries_id_idx"
      ON "payload_locked_documents_rels" USING btree ("contact_enquiries_id");
    CREATE TABLE "contact_intake_rate_limits" (
      "key" varchar PRIMARY KEY NOT NULL,
      "count" integer NOT NULL,
      "expires_at" timestamp with time zone NOT NULL
    );
    CREATE INDEX "contact_intake_rate_limits_expires_at_idx" ON "contact_intake_rate_limits" USING btree ("expires_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_enquiries_fk";
    DROP INDEX "payload_locked_documents_rels_contact_enquiries_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_enquiries_id";
    DROP TABLE "contact_intake_rate_limits";
    DROP TABLE "contact_enquiries";
    DROP TYPE "public"."enum_contact_enquiries_preferred_contact";
    DROP TYPE "public"."enum_contact_enquiries_source";
    DROP TYPE "public"."enum_contact_enquiries_status";
  `)
}
