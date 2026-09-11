import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const surfaces = ['pages', 'events', 'programs', 'locations', 'guides', 'posts'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const surface of surfaces) {
    await db.execute(
      sql.raw(
        `ALTER TYPE "public"."enum_${surface}_blocks_post_grid_variant" ADD VALUE IF NOT EXISTS 'index'`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot remove one enum label. Keep it inert after reverting rows.
  for (const surface of surfaces) {
    await db.execute(
      sql.raw(`UPDATE "${surface}_blocks_post_grid" SET variant = 'cards' WHERE variant = 'index'`),
    )
  }
}
