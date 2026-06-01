import { siteUrl } from '../url'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface TemplateProps {
  token: string
  name: string
}

function shell(title: string, bodyHtml: string, cta: { label: string; href: string }): string {
  return `<!doctype html>
<html><body style="font-family:Lato,system-ui,sans-serif;background:#f7f5f3;margin:0;padding:24px;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;">
    <h1 style="font-family:'Libre Franklin',sans-serif;color:#c8102e;margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
    ${bodyHtml}
    <p style="margin:24px 0;">
      <a href="${cta.href}" style="background:#c8102e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;display:inline-block;font-weight:600;">${escapeHtml(cta.label)}</a>
    </p>
    <p style="font-size:13px;color:#666;">If the button doesn't work, copy this link into your browser:<br/><span style="word-break:break-all;">${cta.href}</span></p>
    <p style="font-size:13px;color:#666;margin-top:32px;">— Rockbusters</p>
  </div>
</body></html>`
}

export function verifyEmailTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/verify-email?token=${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>Welcome to Rockbusters. Please confirm your email address to activate your account.</p>`
  return shell('Verify your email', body, { label: 'Verify email', href })
}

export function resetPasswordTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/reset-password/${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>Someone requested a password reset for your Rockbusters account. If that was you, click below to set a new password. The link expires in 1 hour.</p>`
  return shell('Reset your password', body, { label: 'Reset password', href })
}

export function confirmEmailChangeTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/account/profile/confirm-email?token=${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>You requested to change your Rockbusters sign-in email to this address. Click below to confirm. The link expires in 24 hours.</p>`
  return shell('Confirm your new email', body, { label: 'Confirm email', href })
}

interface BookingCtx {
  name: string
  orderNumber: string
  eventTitle: string
  eventDate: string
  participantCount: number
  totalPrice: number
  currency: string
  accountOrderUrl: string
}

function orderSummary(ctx: BookingCtx): string {
  return `
    <p style="margin:16px 0;">
      <strong>Order:</strong> ${escapeHtml(ctx.orderNumber)}<br/>
      <strong>Trip:</strong> ${escapeHtml(ctx.eventTitle)}<br/>
      <strong>Dates:</strong> ${escapeHtml(ctx.eventDate)}<br/>
      <strong>Participants:</strong> ${ctx.participantCount}<br/>
      <strong>Total:</strong> ${ctx.totalPrice} ${escapeHtml(ctx.currency)}
    </p>
  `
}

export function bookingReceivedToUserTemplate(ctx: BookingCtx): string {
  const body = `
    <p>Hi ${escapeHtml(ctx.name)},</p>
    <p>We've received your booking request. Our team will review and confirm shortly.</p>
    ${orderSummary(ctx)}
  `
  return shell('Booking received', body, { label: 'View in your account', href: ctx.accountOrderUrl })
}

interface AdminBookingCtx {
  orderNumber: string
  userEmail: string
  eventTitle: string
  participantCount: number
  adminOrderUrl: string
}

export function bookingReceivedToAdminTemplate(ctx: AdminBookingCtx): string {
  const body = `
    <p>New booking <strong>${escapeHtml(ctx.orderNumber)}</strong> from
    <strong>${escapeHtml(ctx.userEmail)}</strong> for
    <strong>${escapeHtml(ctx.eventTitle)}</strong>
    (${ctx.participantCount} participants).</p>
  `
  return shell('New booking', body, { label: 'Open in admin', href: ctx.adminOrderUrl })
}

export function bookingConfirmedToUserTemplate(
  ctx: BookingCtx & { bankTransferDetails: string },
): string {
  const detailsHtml = escapeHtml(ctx.bankTransferDetails).replace(/\n/g, '<br/>')
  const body = `
    <p>Hi ${escapeHtml(ctx.name)},</p>
    <p>Your booking is <strong>confirmed</strong>. To complete the booking, please pay by bank transfer using the details below. Use your order number as the variable symbol.</p>
    ${orderSummary(ctx)}
    <p style="background:#f5f1ea;padding:16px;border-radius:6px;font-family:monospace;font-size:13px;line-height:1.6;">
      ${detailsHtml}<br/>
      <strong>Variable symbol:</strong> ${escapeHtml(ctx.orderNumber)}
    </p>
  `
  return shell('Booking confirmed — payment instructions', body, {
    label: 'View order', href: ctx.accountOrderUrl,
  })
}

export function bookingCancelledToUserTemplate(ctx: BookingCtx): string {
  const body = `
    <p>Hi ${escapeHtml(ctx.name)},</p>
    <p>Your booking <strong>${escapeHtml(ctx.orderNumber)}</strong> has been cancelled.</p>
    ${orderSummary(ctx)}
    <p>If you didn't request this cancellation, please contact us.</p>
  `
  return shell('Booking cancelled', body, { label: 'View order', href: ctx.accountOrderUrl })
}
