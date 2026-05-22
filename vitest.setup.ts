// Any setup scripts you might need go here

// Load base env, then test overrides (test database, etc.).
// Integration tests must never run against the dev/prod database.
import { config } from 'dotenv'

config()
config({ path: '.env.test', override: true })
