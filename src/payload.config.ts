import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Difficulties } from './collections/Difficulties'
import { Programs } from './collections/Programs'
import { Categories } from './collections/Categories'
import { Guides } from './collections/Guides'
import { Locations } from './collections/Locations'
import { Airports } from './collections/Airports'
import { Partners } from './collections/Partners'
import { Events } from './collections/Events'
import { EventDates } from './collections/EventDates'
import { FAQs } from './collections/FAQs'
import { Reviews } from './collections/Reviews'
import { Orders } from './collections/Orders'
import { DiscountCodes } from './collections/DiscountCodes'
import { Referrals } from './collections/Referrals'
import { PostCategories } from './collections/PostCategories'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { buildEmailAdapter } from './lib/email/adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env locally, or in the Vercel project settings for the environment being built.`,
    )
  }
  return value
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Difficulties,
    Programs,
    Categories,
    Guides,
    Locations,
    Airports,
    Partners,
    Events,
    EventDates,
    FAQs,
    Reviews,
    Orders,
    DiscountCodes,
    Referrals,
    PostCategories,
    Posts,
    Pages,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  email: buildEmailAdapter({
    apiKey: process.env.RESEND_API_KEY ?? '',
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? 'noreply@rockbusters.net',
    defaultFromName: process.env.EMAIL_FROM_NAME ?? 'Rockbusters',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // Fail loudly on a missing/blank URL. Left empty, pg-connection-string
      // resolves it to the host "base", surfacing as a baffling
      // "getaddrinfo ENOTFOUND base" instead of "you forgot the env var".
      connectionString: requireEnv('DATABASE_URL'),
    },
    // Disable interactive schema-push during e2e tests (or any non-dev environment)
    // to prevent blocking on data-loss confirmation prompts for orphaned tables.
    push: process.env.NODE_ENV !== 'test' && process.env.PAYLOAD_DISABLE_DB_PUSH !== 'true',
  }),
  sharp,
  plugins: [
    s3Storage({
      // Only enable when the full R2 credential set is present. A partial
      // set (e.g. key but no endpoint) would silently target real AWS S3.
      enabled: Boolean(
        process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_ENDPOINT &&
          process.env.R2_BUCKET,
      ),
      collections: { media: true },
      bucket: process.env.R2_BUCKET ?? '',
      config: {
        endpoint: process.env.R2_ENDPOINT ?? '',
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
      },
    }),
  ],
})
