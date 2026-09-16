import { cookies } from 'next/headers'

export async function setPayloadSession(token: string): Promise<void> {
  const cookieJar = await cookies()
  cookieJar.set('payload-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
