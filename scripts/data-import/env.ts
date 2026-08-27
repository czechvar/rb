/**
 * Env preload for the data-import scripts. Import this FIRST — before
 * anything that reads process.env at module init (payload.config, etc.) —
 * so ESM hoisting doesn't evaluate those modules with an empty environment.
 *
 * Loads .env.local first (Next.js precedence: highest, gitignored, holds
 * OLD_DB_URL), then .env fills in what's missing. dotenv.config does not
 * overwrite already-set keys, so this order is right.
 */
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })
