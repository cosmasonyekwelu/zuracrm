// server/src/utils/email.js
import nodemailer from "nodemailer";

/**
 * Minimal transport resolver.
 * You can replace this with your DB-backed /email/settings loader later.
 *
 * Required env (fallback):
 *  SMTP_HOST, SMTP_PORT=465, SMTP_SECURE=true, SMTP_USER, SMTP_PASS
 *  FROM_EMAIL=no-reply@zura.local, FROM_NAME="Zura CRM"
 */
let _cachedTransporter = null;
async function getTransport() {
  if (_cachedTransporter) return _cachedTransporter;

  const {
    SMTP_HOST,
    SMTP_PORT = "465",
    SMTP_SECURE = "true",
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL = "no-reply@zura.local",
    FROM_NAME = "Zura CRM",
  } = process.env;

  if (!SMTP_HOST) {
    // Graceful no-op when email isn't configured yet
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE) === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  // simple health check (won’t throw for many SMTPs, but ok)
  try { await transporter.verify(); } catch {}

  transporter._zura_from = { email: FROM_EMAIL, name: FROM_NAME };
  _cachedTransporter = transporter;
  return transporter;
}

function fromHeader(t) {
  const name = t?._zura_from?.name || "Zura CRM";
  const email = t?._zura_from?.email || "no-reply@zura.local";
  return `"${name}" <${email}>`;
}

/**
 * Used by users.controller.js
 * sendInviteEmail(email, link, message)
 */
export async function sendInviteEmail(to, link, message = "") {
  const transporter = await getTransport();
  if (!transporter) {
    console.warn("[email] SMTP not configured; skipped sendInviteEmail");
    return;
  }

  const subject = "You're invited to join Zura CRM";
  const text =
`Hello,

You've been invited to join Zura CRM.
Click the link to get started: ${link}

${message ? `Message from the inviter:\n${message}\n\n` : ""}If you didn't expect this, you can ignore this email.`;

  const html =
`<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#0f172a">
  <p>Hello,</p>
  <p>You've been invited to join <b>Zura CRM</b>.</p>
  <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;display:inline-block">Accept invitation</a></p>
  ${message ? `<p style="margin-top:16px"><i>${message.replace(/</g,"&lt;")}</i></p>` : ""}
  <p style="color:#64748b">If you didn't expect this, you can ignore this email.</p>
</div>`;

  await transporter.sendMail({
    from: fromHeader(transporter),
    to,
    subject,
    text,
    html,
  });
}

/**
 * Used by meetings.controller.js to send ICS invites/updates/cancels
 * sendCalendarEmail({ to, subject, text, ics, method })
 */
export async function sendCalendarEmail({ to, subject, text, ics, method = "REQUEST" }) {
  const transporter = await getTransport();
  if (!transporter) {
    console.warn("[email] SMTP not configured; skipped sendCalendarEmail");
    return;
  }

  const attachments = ics
    ? [{
        filename: "invite.ics",
        content: ics,
        contentType: `text/calendar; charset=UTF-8; method=${method}`,
      }]
    : [];

  await transporter.sendMail({
    from: fromHeader(transporter),
    to,
    subject,
    text,
    attachments,
  });
}
