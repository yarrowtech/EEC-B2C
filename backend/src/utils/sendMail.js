import nodemailer from "nodemailer";
import { generateInvoicePdf, deleteInvoicePdf } from "./generateInvoicePdf.js";
import { getWebsiteBranding } from "./websiteBranding.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const SMTP_EMAIL = process.env.SMTP_EMAIL?.trim();
const SMTP_PASSWORD = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
const SMTP_FROM = SMTP_EMAIL ? `Edify Eight <${SMTP_EMAIL}>` : "Edify Eight <no-reply@example.com>";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL?.trim() || SMTP_EMAIL || SMTP_FROM;

// Brand palette — mirrors the website's design system
const BRAND = {
  navy: "#1B1F3B",
  yellow: "#FFD23F",
  coral: "#F4736E",
  teal: "#4ECDC4",
  success: "#22c55e",
  danger: "#ef4444",
  bodyBg: "#f1f5f9",
  cardBg: "#ffffff",
  textPrimary: "#1B1F3B",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  borderLight: "#e2e8f0",
};

function buildEmailHeader({ siteName, siteTagline, logoUrl }) {
  return `
    <tr>
      <td style="background:${BRAND.navy};padding:0;border-bottom:6px solid ${BRAND.yellow};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="max-height:56px;max-width:180px;object-fit:contain;display:block;margin:0 auto 14px;" />` : `<div style="display:inline-block;background:${BRAND.yellow};border-radius:14px;padding:10px 14px;transform:rotate(-2deg);margin-bottom:14px;box-shadow:4px 4px 0 0 rgba(0,0,0,0.15);"><span style="font-size:22px;">📖</span></div>`}
              <h1 style="margin:4px 0 0;font-size:26px;font-weight:800;color:${BRAND.yellow};letter-spacing:-0.5px;font-family:Georgia,'Times New Roman',serif;">
                ${siteName}
              </h1>
              ${siteTagline ? `<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;letter-spacing:0.4px;">${siteTagline}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks = {}, supportEmail, supportPhone }) {
  const websiteHref = websiteUrl || CLIENT_ORIGIN || "#";
  const socialItems = [
    { label: "Facebook", href: socialLinks.facebook },
    { label: "Instagram", href: socialLinks.instagram },
    { label: "LinkedIn", href: socialLinks.linkedin },
    { label: "YouTube", href: socialLinks.youtube },
  ].filter((item) => item.href);

  const socialHtml = socialItems.length
    ? socialItems
        .map(
          (item) =>
            `<a href="${item.href}" style="display:inline-block;color:${BRAND.navy};text-decoration:none;font-weight:700;font-size:12px;background:${BRAND.yellow};padding:4px 10px;border-radius:20px;margin:2px 3px;">${item.label}</a>`
        )
        .join("")
    : "";

  return `
    <tr>
      <td style="background:${BRAND.navy};padding:0;border-top:6px solid ${BRAND.yellow};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:28px 40px 20px;text-align:center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="max-height:46px;max-width:160px;object-fit:contain;display:block;margin:0 auto 10px;" />` : ""}
              <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${BRAND.yellow};font-family:Georgia,'Times New Roman',serif;">${siteName}</p>
              ${socialHtml ? `<div style="margin:10px 0;">${socialHtml}</div>` : ""}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                <tr>
                  <td align="center" style="font-size:12px;color:#94a3b8;line-height:1.7;">
                    ${websiteUrl ? `<a href="${websiteHref}" style="color:#94a3b8;text-decoration:none;">${websiteHref}</a>` : ""}
                    ${supportEmail ? `&nbsp;&middot;&nbsp;<a href="mailto:${supportEmail}" style="color:${BRAND.yellow};text-decoration:none;">${supportEmail}</a>` : ""}
                    ${supportPhone ? `&nbsp;&middot;&nbsp;${supportPhone}` : ""}
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:11px;color:#475569;">This is an automated message — please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildCtaButton({ href, label }) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td align="center" style="border-radius:12px;background:${BRAND.yellow};box-shadow:4px 4px 0 0 rgba(0,0,0,0.12);">
          <a href="${href}"
            style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:800;color:${BRAND.navy};text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function buildInfoRow(label, value, mono = false) {
  return `
    <tr>
      <td style="padding:7px 0;font-size:13px;color:${BRAND.textMuted};border-bottom:1px solid ${BRAND.borderLight};">${label}</td>
      <td style="padding:7px 0;font-size:13px;color:${BRAND.textPrimary};font-weight:600;text-align:right;border-bottom:1px solid ${BRAND.borderLight};${mono ? "font-family:monospace;" : ""}">${value}</td>
    </tr>
  `;
}

function wrapEmail(innerRows) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${BRAND.bodyBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bodyBg};">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:${BRAND.cardBg};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.10);max-width:600px;width:100%;">
          ${innerRows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Create SMTP transporter only if SMTP credentials exist.
 */
const transporter =
  SMTP_EMAIL && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: SMTP_EMAIL,
          pass: SMTP_PASSWORD,
        },
      })
    : null;

async function verifyTransporter() {
  if (!transporter) return;
  try {
    await transporter.verify();
  } catch (err) {
    console.warn("⚠️ SMTP verification failed:", err.message);
  }
}
verifyTransporter();

export default async function sendMail({ to, subject, html, attachments = [] }) {
  const normalizedAttachments = Array.isArray(attachments) ? attachments : [];

  if (!transporter) {
    throw new Error("No email transport configured. Set SMTP_EMAIL and SMTP_PASSWORD.");
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      replyTo: SUPPORT_EMAIL,
      attachments: normalizedAttachments,
    });
    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR:", error.message);
    throw error;
  }
}

export async function sendWelcomeEmail({ to, name }) {
  const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
    await getWebsiteBranding();

  const html = wrapEmail(`
    ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

    <!-- BODY -->
    <tr>
      <td style="padding:36px 40px 28px;">

        <!-- Welcome badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#fff7ed;border:2px solid ${BRAND.yellow};border-radius:50px;padding:8px 20px;">
                <span style="font-size:13px;font-weight:700;color:${BRAND.navy};">🎉 Welcome Aboard!</span>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
          Hello, ${name}!
        </h2>

        <p style="margin:0 0 16px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;text-align:center;">
          Your account on <strong style="color:${BRAND.navy};">${siteName}</strong> is now active.<br/>
          You're all set to explore, learn, and grow.
        </p>

        <!-- Feature list card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f8fafc;border-radius:14px;border:1px solid ${BRAND.borderLight};margin:24px 0;">
          <tr>
            <td style="padding:22px 26px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.navy};text-transform:uppercase;letter-spacing:0.6px;">
                What's waiting for you
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:${BRAND.textMuted};">
                    <span style="color:${BRAND.coral};font-weight:700;margin-right:8px;">→</span>Access curated study materials
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:${BRAND.textMuted};">
                    <span style="color:${BRAND.coral};font-weight:700;margin-right:8px;">→</span>Practice quizzes &amp; mock exams
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:${BRAND.textMuted};">
                    <span style="color:${BRAND.coral};font-weight:700;margin-right:8px;">→</span>Earn coins &amp; track achievements
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:${BRAND.textMuted};">
                    <span style="color:${BRAND.coral};font-weight:700;margin-right:8px;">→</span>Compete on the leaderboard
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
          <tr>
            <td align="center">
              ${buildCtaButton({ href: CLIENT_ORIGIN || "#", label: "Go to Dashboard &rarr;" })}
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
          Warm regards,<br/>
          <strong style="color:${BRAND.navy};">${siteName} Team</strong>
        </p>
      </td>
    </tr>

    ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
  `);

  await sendMail({ to, subject: `Welcome to ${siteName} — Let's get started!`, html });
}

export async function sendResetPasswordEmail({ to, name, resetLink }) {
  const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
    await getWebsiteBranding();

  const html = wrapEmail(`
    ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

    <!-- BODY -->
    <tr>
      <td style="padding:36px 40px 28px;">

        <!-- Alert badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#fff1f2;border:2px solid ${BRAND.coral};border-radius:50px;padding:8px 20px;">
                <span style="font-size:13px;font-weight:700;color:${BRAND.coral};">🔐 Password Reset Request</span>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
          Reset Your Password
        </h2>

        <p style="margin:0 0 8px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
          Hi <strong style="color:${BRAND.navy};">${name}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
          We received a request to reset the password for your <strong style="color:${BRAND.navy};">${siteName}</strong> account.
          Click the button below to set a new password.
        </p>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr>
            <td align="center">
              ${buildCtaButton({ href: resetLink, label: "Reset My Password &rarr;" })}
            </td>
          </tr>
        </table>

        <!-- Warning box -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fff7ed;border-left:4px solid ${BRAND.yellow};border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>This link expires in 15 minutes.</strong><br/>
              If you did not request a password reset, you can safely ignore this email — your account remains secure.
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
          Regards,<br/>
          <strong style="color:${BRAND.navy};">${siteName} Team</strong>
        </p>
      </td>
    </tr>

    ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
  `);

  await sendMail({ to, subject: `Reset your ${siteName} password`, html });
}

export async function sendPasswordResetSuccessEmail({ to, name }) {
  const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
    await getWebsiteBranding();

  const html = wrapEmail(`
    ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

    <!-- BODY -->
    <tr>
      <td style="padding:36px 40px 28px;">

        <!-- Success badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#f0fdf4;border:2px solid ${BRAND.success};border-radius:50px;padding:8px 20px;">
                <span style="font-size:13px;font-weight:700;color:#16a34a;">✅ Password Updated Successfully</span>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
          You're all set!
        </h2>

        <p style="margin:0 0 8px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
          Hi <strong style="color:${BRAND.navy};">${name}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
          Your <strong style="color:${BRAND.navy};">${siteName}</strong> account password has been reset successfully.
          You can now log in with your new password.
        </p>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr>
            <td align="center">
              ${buildCtaButton({ href: CLIENT_ORIGIN || "#", label: "Log In Now &rarr;" })}
            </td>
          </tr>
        </table>

        <!-- Security notice -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fff1f2;border-left:4px solid ${BRAND.coral};border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:14px 18px;font-size:13px;color:#991b1b;line-height:1.6;">
              <strong>Wasn't you?</strong> If you did not make this change, please contact our support team immediately to secure your account.
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
          Regards,<br/>
          <strong style="color:${BRAND.navy};">${siteName} Team</strong>
        </p>
      </td>
    </tr>

    ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
  `);

  await sendMail({ to, subject: `Your ${siteName} password was updated`, html });
}

export async function sendGiftCardEmail({ to, name, giftCardCode, amount, provider, redemptionId }) {
  const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
    await getWebsiteBranding();

  const html = wrapEmail(`
    ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

    <!-- BODY -->
    <tr>
      <td style="padding:36px 40px 28px;">

        <!-- Badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#fff7ed;border:2px solid ${BRAND.yellow};border-radius:50px;padding:8px 20px;box-shadow:3px 3px 0 0 rgba(0,0,0,0.08);">
                <span style="font-size:13px;font-weight:700;color:${BRAND.navy};">🎁 Gift Card Redeemed!</span>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
          Congratulations, ${name}!
        </h2>

        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;text-align:center;">
          Your coin redemption was successful. Here's your <strong style="color:${BRAND.navy};">${provider}</strong> gift card.
        </p>

        <!-- Gift card box -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:${BRAND.navy};border-radius:16px;margin:24px 0;box-shadow:5px 5px 0 0 rgba(0,0,0,0.12);">
          <tr>
            <td style="padding:28px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${BRAND.yellow};text-transform:uppercase;letter-spacing:1px;">Provider</p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;">${provider}</p>
                  </td>
                  <td style="text-align:right;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${BRAND.yellow};text-transform:uppercase;letter-spacing:1px;">Amount</p>
                    <p style="margin:0;font-size:26px;font-weight:900;color:${BRAND.yellow};">&#8377;${amount}</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px dashed rgba(255,210,63,0.35);margin:18px 0;"></div>

              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${BRAND.yellow};text-transform:uppercase;letter-spacing:1px;">Your Gift Card Code</p>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:rgba(255,255,255,0.07);border:2px dashed rgba(255,210,63,0.5);border-radius:10px;">
                <tr>
                  <td style="padding:16px;text-align:center;">
                    <code style="font-size:22px;font-weight:800;color:${BRAND.yellow};letter-spacing:4px;font-family:'Courier New',Courier,monospace;">${giftCardCode}</code>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;text-align:center;">Copy this code and keep it safe — it can only be used once.</p>
            </td>
          </tr>
        </table>

        <!-- How to Redeem -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f0fdf4;border-left:4px solid ${BRAND.success};border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#166534;">How to Redeem</p>
              <ol style="margin:0;padding-left:18px;font-size:13px;color:#166534;line-height:1.9;">
                <li>Visit the ${provider} Gift Card redemption page</li>
                <li>Sign in to your account</li>
                <li>Enter the code above and apply it to your balance</li>
                <li>Start enjoying your reward!</li>
              </ol>
            </td>
          </tr>
        </table>

        <!-- Important notes -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fff1f2;border-left:4px solid ${BRAND.coral};border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#991b1b;">Important Notes</p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#991b1b;line-height:1.9;">
                <li>Never share this code with anyone</li>
                <li>This code is single-use only</li>
                <li>Non-refundable and cannot be exchanged for cash</li>
              </ul>
            </td>
          </tr>
        </table>

        <!-- Transaction reference -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
          <tr>
            <td style="padding-top:16px;border-top:1px solid ${BRAND.borderLight};font-size:12px;color:${BRAND.textLight};">
              <strong>Transaction ID:</strong> ${redemptionId}&nbsp;&nbsp;
              <strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </td>
          </tr>
        </table>

        <p style="margin:28px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
          Thank you for being a valued member of <strong style="color:${BRAND.navy};">${siteName}</strong>!<br/>
          Keep earning coins and unlock more rewards.
        </p>
      </td>
    </tr>

    ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
  `);

  await sendMail({ to, subject: `Your ${provider} Gift Card — &#8377;${amount}`, html });
}

export async function sendPurchaseConfirmationEmail({
  to,
  name,
  materialTitle,
  materialSubject,
  materialClass,
  amount,
  paymentMethod,
  transactionId,
  purchaseDate,
  userEmail,
  userPhone,
}) {
  let invoicePath = null;

  try {
    const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
      await getWebsiteBranding();
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    invoicePath = await generateInvoicePdf({
      name,
      materialTitle,
      materialSubject,
      materialClass,
      amount,
      paymentMethod,
      transactionId,
      purchaseDate,
      userEmail,
      userPhone,
      invoiceNumber,
    });

    const html = wrapEmail(`
      ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

      <!-- BODY -->
      <tr>
        <td style="padding:36px 40px 28px;">

          <!-- Badge -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td align="center">
                <div style="display:inline-block;background:#f0fdf4;border:2px solid ${BRAND.success};border-radius:50px;padding:8px 20px;box-shadow:3px 3px 0 0 rgba(0,0,0,0.08);">
                  <span style="font-size:13px;font-weight:700;color:#166534;">Purchase Confirmed</span>
                </div>
              </td>
            </tr>
          </table>

          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
            Thank you, ${name}!
          </h2>
          <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;text-align:center;">
            Your purchase is confirmed. Your invoice is attached to this email.
          </p>

          <!-- Order summary card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#f8fafc;border:1px solid ${BRAND.borderLight};border-radius:14px;margin:0 0 24px;">
            <tr>
              <td style="padding:24px 26px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND.navy};text-transform:uppercase;letter-spacing:0.6px;border-bottom:2px solid ${BRAND.yellow};padding-bottom:10px;">
                  Order Summary
                </p>

                <!-- Material info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="padding-bottom:4px;font-size:11px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.6px;">Study Material</td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;font-weight:800;color:${BRAND.navy};">${materialTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;font-size:13px;color:${BRAND.textMuted};">Subject: ${materialSubject} &nbsp;|&nbsp; Class: ${materialClass}</td>
                  </tr>
                </table>

                <!-- Payment details table -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#ffffff;border:1px solid ${BRAND.borderLight};border-radius:10px;padding:4px 12px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${buildInfoRow("Amount", `&#8377;${amount}`)}
                        ${buildInfoRow("Payment Method", paymentMethod)}
                        ${buildInfoRow("Transaction ID", transactionId, true)}
                        ${buildInfoRow("Purchase Date", purchaseDate)}
                        ${buildInfoRow("Customer", name)}
                        ${buildInfoRow("Email", userEmail)}
                        ${userPhone ? buildInfoRow("Phone", userPhone) : ""}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- How to access -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#f0fdf4;border-left:4px solid ${BRAND.success};border-radius:8px;margin:0 0 24px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#166534;">How to Access Your Material</p>
                <ol style="margin:0;padding-left:18px;font-size:13px;color:#166534;line-height:1.9;">
                  <li>Log in to your ${siteName} account</li>
                  <li>Navigate to <strong>Study Materials</strong></li>
                  <li>Find and open your purchased material</li>
                </ol>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
            <tr>
              <td align="center">
                ${buildCtaButton({ href: `${CLIENT_ORIGIN || "#"}/dashboard/study-materials`, label: "Access Study Material &rarr;" })}
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
            Happy Learning!<br/>
            <strong style="color:${BRAND.navy};">${siteName} Team</strong>
          </p>
        </td>
      </tr>

      ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
    `);

    await sendMail({
      to,
      subject: `Purchase Confirmed — ${materialTitle}`,
      html,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          path: invoicePath,
          contentType: "application/pdf",
        },
      ],
    });

    deleteInvoicePdf(invoicePath);
  } catch (error) {
    if (invoicePath) deleteInvoicePdf(invoicePath);
    console.error("Error sending purchase confirmation email:", error);
    throw error;
  }
}

export async function sendSubscriptionInvoiceEmail({
  to,
  name,
  packageName,
  packageDisplayName,
  duration,
  unlockedStages,
  studyMaterialsAccess,
  amount,
  paymentMethod,
  transactionId,
  purchaseDate,
  userEmail,
  userPhone,
  startDate,
  endDate,
}) {
  let invoicePath = null;

  try {
    const { siteName, siteTagline, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone } =
      await getWebsiteBranding();
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const displayName = packageDisplayName || packageName || "Subscription";
    const stagesLabel =
      Array.isArray(unlockedStages) && unlockedStages.length ? unlockedStages.join(", ") : "N/A";
    const materialsLabel = studyMaterialsAccess || "None";
    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })
        : "N/A";
    const endDateLabel = fmt(endDate);
    const startDateLabel = fmt(startDate);
    const daysLeft =
      endDate
        ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    invoicePath = await generateInvoicePdf({
      name,
      amount,
      paymentMethod,
      transactionId,
      purchaseDate,
      userEmail,
      userPhone,
      invoiceNumber,
      itemTypeLabel: "Subscription",
      itemTitle: displayName,
      itemMeta: [
        `Duration: ${duration || "N/A"} days`,
        `Stages: ${stagesLabel}`,
        `Materials: ${materialsLabel}`,
      ],
    });

    const html = wrapEmail(`
      ${buildEmailHeader({ siteName, siteTagline, logoUrl })}

      <!-- BODY -->
      <tr>
        <td style="padding:36px 40px 28px;">

          <!-- Badge -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td align="center">
                <div style="display:inline-block;background:#f0fdf4;border:2px solid ${BRAND.success};border-radius:50px;padding:8px 20px;box-shadow:3px 3px 0 0 rgba(0,0,0,0.08);">
                  <span style="font-size:13px;font-weight:700;color:#166534;">✅ Subscription Activated</span>
                </div>
              </td>
            </tr>
          </table>

          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.navy};text-align:center;">
            Welcome to ${displayName}!
          </h2>
          <p style="margin:0 0 8px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
            Hi <strong style="color:${BRAND.navy};">${name}</strong>,
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textMuted};line-height:1.7;">
            Your subscription to <strong style="color:${BRAND.navy};">${siteName}</strong> is now active. Your invoice is attached to this email.
          </p>

          <!-- Subscription details card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#f8fafc;border:1px solid ${BRAND.borderLight};border-radius:14px;margin:0 0 24px;">
            <tr>
              <td style="padding:24px 26px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND.navy};text-transform:uppercase;letter-spacing:0.6px;border-bottom:2px solid ${BRAND.yellow};padding-bottom:10px;">
                  Subscription Details
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#ffffff;border:1px solid ${BRAND.borderLight};border-radius:10px;padding:4px 12px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${buildInfoRow("Plan", displayName)}
                        ${buildInfoRow("Start Date", startDateLabel)}
                        ${buildInfoRow("End Date", endDateLabel)}
                        ${daysLeft !== null ? buildInfoRow("Days Remaining", `${daysLeft} days`) : ""}
                        ${buildInfoRow("Stages Unlocked", stagesLabel)}
                        ${buildInfoRow("Study Materials", materialsLabel)}
                        ${buildInfoRow("Amount", `&#8377;${amount}`)}
                        ${buildInfoRow("Payment Method", paymentMethod)}
                        ${buildInfoRow("Transaction ID", transactionId, true)}
                        ${buildInfoRow("Customer", name)}
                        ${buildInfoRow("Email", userEmail)}
                        ${userPhone ? buildInfoRow("Phone", userPhone) : ""}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
            <tr>
              <td align="center">
                ${buildCtaButton({ href: `${CLIENT_ORIGIN || "#"}/dashboard/packages`, label: "View Subscription &rarr;" })}
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
            Thank you for choosing ${siteName}!<br/>
            <strong style="color:${BRAND.navy};">${siteName} Team</strong>
          </p>
        </td>
      </tr>

      ${buildEmailFooter({ siteName, logoUrl, websiteUrl, socialLinks, supportEmail, supportPhone })}
    `);

    await sendMail({
      to,
      subject: `Subscription Activated — ${displayName}`,
      html,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          path: invoicePath,
          contentType: "application/pdf",
        },
      ],
    });

    deleteInvoicePdf(invoicePath);
  } catch (error) {
    if (invoicePath) deleteInvoicePdf(invoicePath);
    console.error("Error sending subscription invoice email:", error);
    throw error;
  }
}
