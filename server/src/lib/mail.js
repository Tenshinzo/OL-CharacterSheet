import { config } from '../config.js';

const outbox = []; // used by tests when no API key is configured
export const testOutbox = outbox;

/**
 * Send a transactional email through Resend. Without an API key the mail is
 * logged and pushed to testOutbox so development and tests work offline.
 */
export async function sendMail({ to, subject, text, html }, log = console) {
  if (!config.mail.resendApiKey) {
    outbox.push({ to, subject, text, html });
    (log.info || log.log).call(log, { to, subject, text }, 'mail (not sent, no RESEND_API_KEY)');
    return { id: 'local-' + outbox.length };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.mail.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Open Legend Sheet <${config.mail.from}>`, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return res.json();
}

const layout = (title, body, cta) => `<!doctype html><html><body style="font-family:Segoe UI,Arial,sans-serif;background:#f4f6fb;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;color:#1e293b">
<h1 style="margin:0 0 16px;font-size:20px;color:#1e3c72">${title}</h1>
<p style="line-height:1.5">${body}</p>
${cta ? `<p style="margin:24px 0"><a href="${cta.url}" style="background:#2a5298;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${cta.label}</a></p>
<p style="font-size:12px;color:#64748b">Or copy this link: ${cta.url}</p>` : ''}
<p style="font-size:12px;color:#64748b;margin-top:32px">Open Legend Character Sheet · ${config.appUrl}</p>
</div></body></html>`;

export function verifyEmailTemplate(url) {
  return {
    subject: 'Confirm your email address',
    text: `Welcome to the Open Legend Character Sheet!\n\nConfirm your email address by opening this link:\n${url}\n\nThe link is valid for 24 hours.`,
    html: layout('Confirm your email address', 'Welcome! Please confirm your email address to finish setting up your account. The link is valid for 24 hours.', { url, label: 'Confirm email' }),
  };
}

export function resetPasswordTemplate(url) {
  return {
    subject: 'Reset your password',
    text: `Someone requested a password reset for your Open Legend Character Sheet account.\n\nSet a new password here:\n${url}\n\nThe link is valid for 1 hour. If you did not request this, ignore this email.`,
    html: layout('Reset your password', 'Someone requested a password reset for your account. The link is valid for 1 hour. If this was not you, you can ignore this email.', { url, label: 'Set new password' }),
  };
}
