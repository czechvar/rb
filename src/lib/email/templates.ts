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
