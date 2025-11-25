// src/services/mailer.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM || "no-reply@yourdomain.com";

export async function sendWelcomeEmail({ to, name }) {
  const subject = `Welcome to EEC, ${name}!`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif">
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully. You can log in and start learning.</p>
      <p><a href="${process.env.APP_URL || "http://localhost:5173"}"
            style="background:#facc15;color:#0b2450;padding:10px 16px;border-radius:10px;
                   text-decoration:none;border:1px solid #f4d85d;font-weight:700">Open EEC</a></p>
      <p style="color:#6b7280;font-size:12px">If you didn’t create this account, ignore this email.</p>
    </div>
  `;
  return resend.emails.send({ from: FROM, to, subject, html });
}
