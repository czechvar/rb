import { siteUrl } from '@/lib/url'
import type { CheckoutItem } from '@/lib/checkout/types'
import { rockbustersTheme } from '@/lib/theme/themePresets'

export type CheckoutPaymentTiming = 'deposit' | 'full' | 'mixed'

interface TransactionalEmail {
  subject: string
  text: string
  html: string
}

const colors = {
  ink: rockbustersTheme['--theme-color-ink'],
  canvas: rockbustersTheme['--theme-color-canvas'],
  surface: rockbustersTheme['--theme-color-surface-1'],
  paper: rockbustersTheme['--theme-color-paper'],
  muted: rockbustersTheme['--theme-color-paper-80'],
  primary: rockbustersTheme['--theme-color-primary'],
  border: rockbustersTheme['--theme-color-paper-12'],
} as const

// Email clients cannot resolve the site's CSS font variables, so retain the
// Rockbusters Montserrat role with broadly supported fallbacks.
const font = 'Montserrat,Arial,Helvetica,sans-serif'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shell({
  preheader,
  eyebrow,
  title,
  body,
  action,
}: {
  preheader: string
  eyebrow: string
  title: string
  body: string
  action?: { label: string; href: string }
}): string {
  const logo = escapeHtml(siteUrl('/logo-rockbusters.png'))
  const actionHtml = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
          <tr>
            <td bgcolor="${colors.primary}" style="background:${colors.primary};">
              <a href="${escapeHtml(action.href)}" style="display:inline-block;padding:15px 22px;font-family:${font};font-size:13px;line-height:1;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;text-decoration:none;color:${colors.paper};">${escapeHtml(action.label)}</a>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-family:${font};font-size:12px;line-height:1.6;color:${colors.muted};">If the button does not work, copy this link into your browser:<br><span style="word-break:break-all;color:${colors.paper};">${escapeHtml(action.href)}</span></p>`
    : ''

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)} — Rockbusters</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.ink};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${colors.ink};">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${colors.ink};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${colors.surface};">
            <tr>
              <td style="padding:28px 32px;background:${colors.canvas};">
                <img src="${logo}" alt="Rockbusters" width="180" height="27" style="display:block;width:180px;height:27px;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>
            <tr>
              <td height="3" style="height:3px;line-height:3px;font-size:0;background:${colors.primary};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 32px 44px;background:${colors.surface};border-bottom:1px solid ${colors.border};">
                <p style="margin:0 0 10px;font-family:${font};font-size:11px;line-height:1.4;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:${colors.primary};">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0 0 24px;font-family:${font};font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.4px;color:${colors.paper};">${escapeHtml(title)}</h1>
                ${body}
                ${actionHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;background:${colors.canvas};">
                <p style="margin:0;font-family:${font};font-size:12px;line-height:1.6;color:${colors.muted};">Rockbusters · Transactional email</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function checkoutVerificationEmail(input: { code: string }): TransactionalEmail {
  const code = escapeHtml(input.code)
  const text = `Enter this verification code in checkout:\n\n${input.code}\n\nThe code expires in 10 minutes. No places are reserved until the code is accepted. If you did not request this code, you can ignore this email.`
  const body = `<p style="margin:0 0 22px;font-family:${font};font-size:16px;line-height:1.65;color:${colors.muted};">Enter this code in checkout:</p>
    <div style="padding:22px 20px;border:1px solid ${colors.primary};background:${colors.canvas};font-family:Consolas,'Roboto Mono',monospace;font-size:34px;line-height:1;font-weight:800;letter-spacing:7px;text-align:center;color:${colors.paper};">${code}</div>
    <p style="margin:22px 0 0;font-family:${font};font-size:14px;line-height:1.65;color:${colors.muted};">The code expires in 10 minutes. No places are reserved until the code is accepted.</p>
    <p style="margin:14px 0 0;font-family:${font};font-size:13px;line-height:1.65;color:${colors.muted};">If you did not request this code, you can ignore this email.</p>`

  return {
    subject: 'Your Rockbusters verification code',
    text,
    html: shell({
      preheader: `Your verification code is ${input.code}`,
      eyebrow: 'Email verification',
      title: 'Confirm your email',
      body,
    }),
  }
}

const paymentCopy: Record<CheckoutPaymentTiming, { html: string; text: string }> = {
  deposit: {
    html: `After signing in, pay the <strong style="color:${colors.paper};">25% deposit</strong> to continue. The remaining balance is due 30 days before departure.`,
    text: 'After signing in, pay the 25% deposit to continue. The remaining balance is due 30 days before departure.',
  },
  full: {
    html: `Because departure is within 30 days, the <strong style="color:${colors.paper};">full amount</strong> is due after signing in.`,
    text: 'Because departure is within 30 days, the full amount is due after signing in.',
  },
  mixed: {
    html: `After signing in, pay the amount due now: a <strong style="color:${colors.paper};">25% deposit for later departures</strong> and the <strong style="color:${colors.paper};">full amount for departures within 30 days</strong>.`,
    text: 'After signing in, pay the amount due now: a 25% deposit for later departures and the full amount for departures within 30 days.',
  },
}

export function checkoutInvitationEmail(input: {
  url: string
  reference: string
  items: CheckoutItem[]
  paymentTiming: CheckoutPaymentTiming
}): TransactionalEmail {
  const payment = paymentCopy[input.paymentTiming]
  const summary = checkoutInvitationSummary(input.reference, input.items)
  const text = `Your reservation is approved. Create your account or sign in to continue. ${payment.text}\n\n${summary.text}\n\nThe invitation link expires in 24 hours.\n\n${input.url}`
  const body = `<p style="margin:0 0 16px;font-family:${font};font-size:16px;line-height:1.65;color:${colors.muted};">Your reservation is approved. Create your account or sign in to continue.</p>
    <p style="margin:0;font-family:${font};font-size:16px;line-height:1.65;color:${colors.muted};">${payment.html}</p>
    ${summary.html}
    <p style="margin:18px 0 0;font-family:${font};font-size:13px;line-height:1.65;color:${colors.muted};">This invitation link expires in 24 hours.</p>`

  return {
    subject: 'Your Rockbusters reservation is approved',
    text,
    html: shell({
      preheader: 'Your reservation is approved. Continue to account setup and payment.',
      eyebrow: 'Reservation approved',
      title: 'Continue to payment',
      body,
      action: { label: 'Continue to account and payment', href: input.url },
    }),
  }
}

function checkoutInvitationSummary(reference: string, items: CheckoutItem[]) {
  const activeItems = items.filter((item) => !item.cancelledAt)
  const currency = activeItems[0]?.currency || 'EUR'
  const total = activeItems.reduce((sum, item) => sum + item.totalMinor, 0)
  const textItems = activeItems.map(
    (item, index) =>
      `${activeItems.length > 1 ? `Trip ${index + 1}: ` : 'Trip: '}${item.title}\nLocation: ${item.location || 'To be confirmed'}\nDates: ${formatDateRange(item.dateFrom, item.dateTo)}\nParticipants: ${item.quantity}\nTrip total: ${formatMoney(item.totalMinor, item.currency)}`,
  )
  const htmlItems = activeItems
    .map(
      (item) => `<tr>
        <td style="padding:16px 0;border-top:1px solid ${colors.border};font-family:${font};font-size:14px;line-height:1.6;color:${colors.muted};">
          <strong style="display:block;font-size:16px;color:${colors.paper};">${escapeHtml(item.title)}</strong>
          ${escapeHtml(item.location || 'To be confirmed')}<br>
          ${escapeHtml(formatDateRange(item.dateFrom, item.dateTo))}<br>
          ${item.quantity} ${item.quantity === 1 ? 'participant' : 'participants'} · ${escapeHtml(formatMoney(item.totalMinor, item.currency))}
        </td>
      </tr>`,
    )
    .join('')
  return {
    text: `Reservation details\nReference: ${reference}\n\n${textItems.join('\n\n')}\n\nReservation total: ${formatMoney(total, currency)}`,
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:28px 0 0;border-bottom:1px solid ${colors.border};">
      <tr>
        <td style="padding:0 0 12px;font-family:${font};font-size:11px;line-height:1.4;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${colors.primary};">Reservation details</td>
      </tr>
      <tr>
        <td style="padding:0 0 16px;font-family:${font};font-size:13px;line-height:1.5;color:${colors.muted};">Reference: <strong style="color:${colors.paper};">${escapeHtml(reference)}</strong></td>
      </tr>
      ${htmlItems}
      <tr>
        <td style="padding:16px 0;font-family:${font};font-size:16px;line-height:1.5;font-weight:800;color:${colors.paper};">Reservation total: ${escapeHtml(formatMoney(total, currency))}</td>
      </tr>
    </table>`,
  }
}

function formatDateRange(from: string, to: string): string {
  const format = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${format.format(new Date(from))} – ${format.format(new Date(to))}`
}

function formatMoney(minor: number, currency: CheckoutItem['currency']): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100)
}

export function checkoutPaymentTiming(
  items: CheckoutItem[],
  now = new Date(),
): CheckoutPaymentTiming {
  const dueStates = items
    .filter((item) => !item.cancelledAt)
    .map((item) => new Date(item.balanceDueAt) <= now)
  if (!dueStates.length) return 'deposit'
  if (dueStates.every(Boolean)) return 'full'
  if (dueStates.some(Boolean)) return 'mixed'
  return 'deposit'
}
