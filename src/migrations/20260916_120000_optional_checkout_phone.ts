import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "checkouts" ALTER COLUMN "contact_phone" DROP NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "checkouts" WHERE "contact_phone" IS NULL)
        OR EXISTS (SELECT 1 FROM "users" WHERE "phone" IS NULL)
      THEN
        RAISE EXCEPTION 'Missing phone data exists; rollback requires explicit reconciliation';
      END IF;
    END
    $$;
    ALTER TABLE "checkouts" ALTER COLUMN "contact_phone" SET NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
  `)
}
