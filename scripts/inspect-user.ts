/**
 * Dev diagnostic — dump the auth-relevant fields of a single user so we can
 * compare what's in the DB against what was emailed.
 *
 *   pnpm tsx scripts/inspect-user.ts <email>
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('usage: tsx scripts/inspect-user.ts <email>')
    process.exit(2)
  }
  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    showHiddenFields: true,
    overrideAccess: true,
  })
  const user = found.docs[0]
  if (!user) {
    console.log('no user with email', email)
    process.exit(0)
  }
  const u = user as unknown as Record<string, unknown>
  console.log({
    id: u.id,
    email: u.email,
    name: u.name,
    _verified: u._verified,
    _verificationToken: u._verificationToken,
    lastVerifyEmailSentAt: u.lastVerifyEmailSentAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
