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
import { Types } from './collections/Types'
import { Categories } from './collections/Categories'
import { Guides } from './collections/Guides'
import { Locations } from './collections/Locations'
import { Airports } from './collections/Airports'
import { Partners } from './collections/Partners'
import { Events } from './collections/Events'
import { EventDates } from './collections/EventDates'
import { FAQs } from './collections/FAQs'
import { Reviews } from './collections/Reviews'
import { buildEmailAdapter } from './lib/email/adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Difficulties, Types, Categories, Guides, Locations, Airports, Partners, Events, EventDates, FAQs, Reviews],
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
      connectionString: process.env.DATABASE_URL || '',
    },
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
