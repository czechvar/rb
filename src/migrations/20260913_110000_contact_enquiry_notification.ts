import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Notification audit only. This migration never sends or replays historical enquiries. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_contact_enquiries_notification_status" AS ENUM ('pending', 'sent', 'failed', 'notConfigured');
    ALTER TABLE "contact_enquiries"
      ADD COLUMN "notification_status" "enum_contact_enquiries_notification_status" DEFAULT 'pending' NOT NULL,
      ADD COLUMN "notified_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "contact_enquiries" DROP COLUMN "notification_status", DROP COLUMN "notified_at";
    DROP TYPE "public"."enum_contact_enquiries_notification_status";
  `)
}
