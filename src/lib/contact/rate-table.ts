import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

/** Managed schema for operational counters; deliberately not a public CMS collection. */
export const contactIntakeRateLimits = pgTable('contact_intake_rate_limits', {
  key: varchar('key').primaryKey().notNull(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [index('contact_intake_rate_limits_expires_at_idx').on(table.expiresAt)])
