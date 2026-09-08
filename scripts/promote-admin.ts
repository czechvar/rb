/**
 * Grant a user the `admin` role.
 *
 *   pnpm tsx scripts/promote-admin.ts <email>              # list admins, then promote
 *   pnpm tsx scripts/promote-admin.ts --list               # just list current admins
 *
 * Why this exists: `Users.role` is declared with
 * `access: { update: isAdminField }`, so only an existing admin can change a
 * role through Payload's API or admin UI. If nobody currently has the role —
 * or the only account that does is unreachable — there is no in-app way out of
 * that. This script uses the local API with `overrideAccess: true`, which
 * bypasses field access, so it is the intended escape hatch.
 *
 * It runs against whatever `DATABASE_URL` is in the environment. To promote
 * someone on the live site, pass the production connection string inline
 * rather than putting it in `.env` — see the database-branches warning in
 * CLAUDE.md, which exists because a local env file once pointed at production:
 *
 *   DATABASE_URL='<production connection string>' \
 *     PAYLOAD_DISABLE_DB_PUSH=true \
 *     pnpm tsx scripts/promote-admin.ts you@example.com
 *
 * `PAYLOAD_DISABLE_DB_PUSH=true` matters: without it Payload may try an
 * interactive schema push and hang, or worse, offer to drop columns.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('usage: tsx scripts/promote-admin.ts <email>')
    console.error('       tsx scripts/promote-admin.ts --list')
    process.exit(2)
  }

  const payload = await getPayload({ config })

  // Always report who already has access — often the answer is "an admin
  // exists, you just did not know which account it was".
  const admins = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 50,
    overrideAccess: true,
  })
  console.log(`existing admins (${admins.totalDocs}):`)
  for (const a of admins.docs) {
    const u = a as unknown as Record<string, unknown>
    console.log(`  ${u.email}  (id ${u.id}, verified: ${u._verified === true})`)
  }

  if (arg === '--list') return

  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: arg } },
    limit: 1,
    overrideAccess: true,
  })
  const user = found.docs[0] as unknown as Record<string, unknown> | undefined
  if (!user) {
    console.error(`\nno user with email ${arg} — sign up on the site first, then re-run`)
    process.exit(1)
  }
  if (user.role === 'admin') {
    console.log(`\n${arg} is already an admin; nothing to do`)
    return
  }

  await payload.update({
    collection: 'users',
    id: user.id as number,
    data: { role: 'admin' },
    overrideAccess: true, // the whole point: bypasses the admin-only field access
  })
  console.log(`\npromoted ${arg} from '${String(user.role)}' to 'admin'`)

  if (user._verified !== true) {
    console.log(
      'note: this account is not email-verified, which may block login separately from the role',
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
