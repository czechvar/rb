import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const surfaces = ['pages', 'events', 'programs', 'locations', 'guides', 'posts'] as const

/** Additive schema only. The persistent Contact Page is imported separately. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const surface of surfaces) {
    await db.execute(
      sql.raw(`
      ALTER TYPE "public"."enum_${surface}_blocks_section_intro_variant" ADD VALUE IF NOT EXISTS 'lightSplit';
      CREATE TABLE "${surface}_blocks_contact_details" (
        "_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "eyebrow" varchar, "heading" varchar NOT NULL,
        "email_label" varchar DEFAULT 'Email', "email" varchar NOT NULL, "email_note" varchar,
        "phone_label" varchar DEFAULT 'Phone & WhatsApp', "block_name" varchar,
        FOREIGN KEY ("_parent_id") REFERENCES "${surface}"("id") ON DELETE CASCADE
      );
      CREATE TABLE "${surface}_blocks_contact_details_desks" (
        "_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL,
        "label" varchar NOT NULL, "phone" varchar NOT NULL, "whatsapp" boolean DEFAULT true,
        FOREIGN KEY ("_parent_id") REFERENCES "${surface}_blocks_contact_details"("id") ON DELETE CASCADE
      );
      CREATE TABLE "${surface}_blocks_contact_form" (
        "_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "eyebrow" varchar, "heading" varchar NOT NULL, "body" varchar,
        "submit_label" varchar DEFAULT 'Send Message', "privacy_note" varchar, "block_name" varchar,
        FOREIGN KEY ("_parent_id") REFERENCES "${surface}"("id") ON DELETE CASCADE
      );
      CREATE TABLE "${surface}_blocks_contact_form_facts" (
        "_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL,
        FOREIGN KEY ("_parent_id") REFERENCES "${surface}_blocks_contact_form"("id") ON DELETE CASCADE
      );
    `),
    )
    for (const block of [
      'contact_details',
      'contact_form',
      'contact_details_desks',
      'contact_form_facts',
    ]) {
      const table = `${surface}_blocks_${block}`
      await db.execute(
        sql.raw(`
        CREATE INDEX "${table}_order_idx" ON "${table}" USING btree ("_order");
        CREATE INDEX "${table}_parent_id_idx" ON "${table}" USING btree ("_parent_id");
      `),
      )
      if (block === 'contact_details' || block === 'contact_form') {
        await db.execute(
          sql.raw(`CREATE INDEX "${table}_path_idx" ON "${table}" USING btree ("_path")`),
        )
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const surface of surfaces) {
    // PostgreSQL cannot remove one enum label. Keep it inert after reverting rows.
    await db.execute(
      sql.raw(`
      UPDATE "${surface}_blocks_section_intro" SET variant = 'light' WHERE variant = 'lightSplit';
      DROP TABLE "${surface}_blocks_contact_details_desks";
      DROP TABLE "${surface}_blocks_contact_form_facts";
      DROP TABLE "${surface}_blocks_contact_details";
      DROP TABLE "${surface}_blocks_contact_form";
    `),
    )
  }
}
