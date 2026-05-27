import type { EmailAdapter } from 'payload'
import { resendAdapter } from '@payloadcms/email-resend'

export interface TestInboxEntry {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

const testInbox: TestInboxEntry[] = []

export function getTestInbox(): readonly TestInboxEntry[] {
  return testInbox
}

export function clearTestInbox(): void {
  testInbox.length = 0
}

export type EmailMode = 'test' | 'resend' | 'console'

export function resolveEmailMode(): EmailMode {
  if (process.env.NODE_ENV === 'test') return 'test'
  if (process.env.RESEND_API_KEY) return 'resend'
  return 'console'
}

export interface BuildAdapterOptions {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
  mode?: EmailMode
}

export function buildEmailAdapter(opts: BuildAdapterOptions): EmailAdapter {
  const mode = opts.mode ?? resolveEmailMode()
  if (mode === 'resend') {
    return resendAdapter({
      apiKey: opts.apiKey,
      defaultFromAddress: opts.defaultFromAddress,
      defaultFromName: opts.defaultFromName,
    })
  }
  return () => ({
    name: mode === 'test' ? 'test' : 'console',
    defaultFromAddress: opts.defaultFromAddress,
    defaultFromName: opts.defaultFromName,
    sendEmail: async (message) => {
      const entry: TestInboxEntry = {
        to: message.to as string | string[],
        subject: message.subject ?? '',
        html: typeof message.html === 'string' ? message.html : undefined,
        text: typeof message.text === 'string' ? message.text : undefined,
        from: typeof message.from === 'string' ? message.from : undefined,
      }
      if (mode === 'test') {
        testInbox.push(entry)
      } else {
        console.log('[email:console]', JSON.stringify(entry, null, 2))
      }
      return { id: 'noop' }
    },
  })
}
