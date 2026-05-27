'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction(): Promise<void> {
  const c = await cookies()
  c.delete('payload-token')
  redirect('/')
}
