import nodemailer from "nodemailer";
import { generateInvoicePdf, deleteInvoicePdf } from "./generateInvoicePdf.js";


const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
/**
 * Create transporter ONCE
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Verify transporter safely (NO top-level await)
 */
async function verifyTransporter() {
  try {
    await transporter.verify();
    // console.log("✅ SMTP server ready");
  } catch (err) {
    // console.error("❌ SMTP verification failed:", err.message);
  }
}
verifyTransporter();

// export default async function sendMail({ to, subject, html }) {
//   try {
//     await transporter.sendMail({
//       from: `EEC Learning <${process.env.SMTP_EMAIL}>`,
//       to,
//       subject,
//       html,
//     });
//   } catch (error) {
//     console.log("EMAIL SEND ERROR:", error);
//   }
// }

/**
 * Base mail sender with optional attachments
 */
export default async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `EEC Learning <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR:", error.message);
    throw error; // ⬅️ IMPORTANT
  }
}

/* ✅ ADD THIS FUNCTION */
export async function sendWelcomeEmail({ to, name }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to EEC</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 15px;">
        
        <!-- MAIN CARD -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <!-- HEADER (LOGIN PAGE STYLE) -->
          <tr>
            <td
              style="background:linear-gradient(135deg,#ca8a04,#fde047);padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">
                Electronic Educare (EEC)
              </h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">
                Learn • Practice • Grow
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px 35px;">
              <h2 style="margin:0 0 10px;color:#1e40af;font-size:22px;text-align:center;">
                Welcome to EEC 🎉
              </h2>

              <p style="font-size:16px;color:#374151;margin:10px 0;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="font-size:15px;color:#4b5563;line-height:1.6;">
                We’re excited to have you onboard at
                <strong>Electronic Educare (EEC)</strong>.
                Your account has been successfully created and you’re all set to
                start learning.
              </p>

              <!-- FEATURES -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
                <tr>
                  <td style="background:#f8fafc;border-radius:10px;padding:18px;text-align:left;">
                    <p style="margin:0 0 8px;color:#1e40af;font-weight:600;font-size:14px;">
                      What you can do with EEC:
                    </p>
                    <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.7;">
                      <li>Access study materials</li>
                      <li>Practice quizzes & mock exams</li>
                      <li>Earn points & track your achievements</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <div style="display: flex; justify-content: center;">
              <a href="${CLIENT_ORIGIN}"
                style="display:inline-block;margin-top:10px;background:#eab308;color:#ffffff;
                text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Login to EEC
              </a>
              </div>

              <p style="margin-top:25px;font-size:14px;color:#6b7280; text-align: center;">
                Need help? Our support team is always here for you.
              </p>

              <p style="margin-top:25px;font-size:14px;color:#374151;">
                Warm regards,<br/>
                <strong>EEC Team</strong>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:15px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendMail({
    to,
    subject: "Welcome to EEC 🎓",
    html,
  });
}

export async function sendResetPasswordEmail({ to, name, resetLink }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- MAIN CARD -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;overflow:hidden;
          box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#ca8a04,#fde047);
              padding:28px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                Electronic Educare (EEC)
              </h1>
              <p style="margin:8px 0 0;font-size:14px;">
                Learn • Practice • Grow
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 36px;">

              <h2 style="color:#dc2626;margin-bottom:12px;text-align:center;">
                Reset Your Password 🔐
              </h2>

              <p style="color:#374151;font-size:15px;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                We received a request to reset your EEC account password.
              </p>

              <!-- CTA -->
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  margin:22px 0;
                  padding:12px 26px;
                  background:#facc15;
                  color:#1e3a8a;
                  font-weight:700;
                  text-decoration:none;
                  border-radius:8px;
                  font-size:14px;
                "
              >
                Reset Password
              </a>

              <p style="font-size:13px;color:#6b7280;line-height:1.5;">
                This link is valid for <b>15 minutes</b>.
                If you didn’t request this, you can safely ignore this email.
              </p>

              <p style="margin-top:26px;color:#374151;font-size:14px;">
                Regards,<br/>
                <strong>EEC Team</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:14px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendMail({
    to,
    subject: "Reset your EEC password",
    html,
  });
}

export async function sendPasswordResetSuccessEmail({ to, name }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset Successful</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- MAIN CARD -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;overflow:hidden;
          box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#ca8a04,#fde047);
              padding:28px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                Electronic Educare (EEC)
              </h1>
              <p style="margin:8px 0 0;font-size:14px;">
                Learn • Practice • Grow
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 36px;">

              <h2 style="color:#16a34a;margin-bottom:12px;text-align:center;">
                Password Reset Successful
              </h2>

              <p style="color:#374151;font-size:15px;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="color:#4b5563;font-size:14px;line-height:1.6;">
                Your EEC account password has been successfully reset.
              </p>

              <p style="color:#6b7280;font-size:13px;line-height:1.5;">
                If you did not perform this action, please contact our support team immediately.
              </p>

              <p style="margin-top:26px;color:#374151;font-size:14px;">
                Regards,<br/>
                <strong>EEC Team</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:14px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendMail({
    to,
    subject: "Your EEC password was reset successfully",
    html,
  });
}

export async function sendGiftCardEmail({ to, name, giftCardCode, amount, provider, redemptionId }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Card Redemption</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- MAIN CARD -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
          box-shadow:0 4px 6px rgba(0,0,0,0.1);border:1px solid #e5e7eb;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding:40px 30px;text-align:center;">
              <h1 style="margin:0;font-size:28px;line-height:36px;font-weight:700;color:#ffffff;">
                Gift Card Redemption Successful!
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151;">
                Congratulations! Your coin redemption was successful. Here's your <strong>${provider}</strong> gift card:
              </p>

              <!-- GIFT CARD DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
                border:2px solid #f59e0b;border-radius:12px;margin:30px 0;">
                <tr>
                  <td style="padding:24px;">

                    <!-- Provider -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
                            Gift Card Provider
                          </p>
                          <p style="margin:4px 0 0 0;font-size:18px;color:#78350f;font-weight:700;">
                            ${provider}
                          </p>
                        </td>
                      </tr>

                      <!-- Amount -->
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
                            Amount
                          </p>
                          <p style="margin:4px 0 0 0;font-size:24px;color:#78350f;font-weight:700;">
                            ₹${amount}
                          </p>
                        </td>
                      </tr>

                      <!-- Gift Card Code -->
                      <tr>
                        <td style="padding:16px 0 8px 0;">
                          <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
                            Your Gift Card Code
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0"
                            style="background:#ffffff;border:2px dashed #f59e0b;
                            border-radius:8px;margin:8px 0;">
                            <tr>
                              <td style="padding:16px;text-align:center;">
                                <code style="font-size:20px;font-weight:700;color:#d97706;
                                  letter-spacing:2px;font-family:monospace;">
                                  ${giftCardCode}
                                </code>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:8px 0 0 0;font-size:12px;color:#92400e;">
                            💡 Copy this code and save it securely
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- REDEMPTION INSTRUCTIONS -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0fdf4;border-left:4px solid #22c55e;
                border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;font-size:16px;color:#166534;font-weight:600;">
                      📝 How to Redeem
                    </h3>
                    <ol style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:22px;">
                      <li>Visit <a href="https://www.amazon.in/gc/redeem"
                        style="color:#2563eb;text-decoration:none;">Amazon Gift Card Redemption</a></li>
                      <li>Sign in to your Amazon account</li>
                      <li>Enter the gift card code above</li>
                      <li>Click "Apply to your balance"</li>
                      <li>Start shopping with your new balance!</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- IMPORTANT NOTES -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fef2f2;border-left:4px solid #ef4444;
                border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;font-size:16px;color:#991b1b;font-weight:600;">
                      ⚠️ Important Notes
                    </h3>
                    <ul style="margin:0;padding-left:20px;color:#991b1b;font-size:14px;line-height:22px;">
                      <li>Keep this code secure and don't share it with anyone</li>
                      <li>This code can only be used once</li>
                      <li>Valid only on Amazon India (amazon.in)</li>
                      <li>No expiration date - use anytime</li>
                      <li>Non-refundable and cannot be exchanged for cash</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- TRANSACTION DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border-top:1px solid #e5e7eb;margin-top:30px;">
                <tr>
                  <td style="padding-top:20px;">
                    <p style="margin:0;font-size:12px;color:#6b7280;">
                      <strong>Transaction ID:</strong> ${redemptionId}<br>
                      <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:30px 0;">
                    <a href="https://www.amazon.in/gc/redeem"
                      style="display:inline-block;background:#f59e0b;color:#ffffff;
                      padding:14px 32px;border-radius:8px;text-decoration:none;
                      font-weight:700;font-size:16px;
                      box-shadow:0 4px 6px rgba(245,158,11,0.3);">
                      Redeem on Amazon →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0 0;font-size:14px;line-height:22px;color:#6b7280;">
                Thank you for being a valued member of EEC!
              </p>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#6b7280;">
                Keep earning coins and redeem more rewards! 🎁
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:30px;background:#f9fafb;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280;">
                Need help? Contact our support team
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply.<br>
                © ${new Date().getFullYear()} EEC Learning Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendMail({
    to,
    subject: `🎁 Your ${provider} Gift Card - ₹${amount}`,
    html,
  });
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
  userPhone
}) {
  let invoicePath = null;

  try {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Generate PDF invoice
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
      invoiceNumber
    });
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- MAIN CARD -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
          box-shadow:0 4px 6px rgba(0,0,0,0.1);border:1px solid #e5e7eb;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              padding:40px 30px;text-align:center;">
              <h1 style="margin:0;font-size:28px;line-height:36px;font-weight:700;color:#ffffff;">
                📚 Purchase Successful!
              </h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:#e0e7ff;">
                Thank you for your purchase
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151;">
                Your purchase has been confirmed! You now have access to your study material.
              </p>

              <!-- INVOICE DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin:30px 0;">
                <tr>
                  <td style="padding:24px;">
                    <h2 style="margin:0 0 20px 0;font-size:18px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:10px;">
                      📄 Invoice Details
                    </h2>

                    <!-- Material Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:14px;color:#6b7280;font-weight:600;">
                            Study Material
                          </p>
                          <p style="margin:4px 0 0 0;font-size:16px;color:#111827;font-weight:700;">
                            ${materialTitle}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:14px;color:#6b7280;">
                            <strong>Subject:</strong> ${materialSubject} | <strong>Class:</strong> ${materialClass}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Payment Details -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
                      <tr>
                        <td style="padding:8px 0;">
                          <table width="100%">
                            <tr>
                              <td style="font-size:14px;color:#6b7280;padding:4px 0;">Amount:</td>
                              <td style="font-size:16px;color:#111827;font-weight:700;text-align:right;padding:4px 0;">₹${amount}</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px;color:#6b7280;padding:4px 0;">Payment Method:</td>
                              <td style="font-size:14px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">${paymentMethod}</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px;color:#6b7280;padding:4px 0;">Transaction ID:</td>
                              <td style="font-size:12px;color:#6366f1;font-weight:600;text-align:right;padding:4px 0;font-family:monospace;">${transactionId}</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px;color:#6b7280;padding:4px 0;">Date:</td>
                              <td style="font-size:14px;color:#111827;text-align:right;padding:4px 0;">${purchaseDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Customer Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                          <p style="margin:8px 0 4px 0;font-size:14px;color:#6b7280;font-weight:600;">
                            Customer Details
                          </p>
                          <p style="margin:4px 0;font-size:14px;color:#111827;">
                            <strong>Name:</strong> ${name}
                          </p>
                          <p style="margin:4px 0;font-size:14px;color:#111827;">
                            <strong>Email:</strong> ${userEmail}
                          </p>
                          ${userPhone ? `<p style="margin:4px 0;font-size:14px;color:#111827;"><strong>Phone:</strong> ${userPhone}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ACCESS INFO -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#ecfdf5;border-left:4px solid #10b981;
                border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;font-size:16px;color:#065f46;font-weight:600;">
                      ✅ How to Access Your Material
                    </h3>
                    <ol style="margin:0;padding-left:20px;color:#065f46;font-size:14px;line-height:22px;">
                      <li>Login to your EEC account</li>
                      <li>Go to "Study Materials" section</li>
                      <li>Find your purchased material</li>
                      <li>Click to view or download</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- IMPORTANT NOTES -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fef2f2;border-left:4px solid #ef4444;
                border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;font-size:16px;color:#991b1b;font-weight:600;">
                      ⚠️ Important Notes
                    </h3>
                    <ul style="margin:0;padding-left:20px;color:#991b1b;font-size:14px;line-height:22px;">
                      <li>Keep this email for your records</li>
                      <li>Your purchase is non-refundable</li>
                      <li>Lifetime access to the material</li>
                      <li>Contact support for any issues</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:30px 0;">
                    <a href="${process.env.CLIENT_ORIGIN}/dashboard/study-materials"
                      style="display:inline-block;background:#4f46e5;color:#ffffff;
                      padding:14px 32px;border-radius:8px;text-decoration:none;
                      font-weight:700;font-size:16px;
                      box-shadow:0 4px 6px rgba(79,70,229,0.3);">
                      Access Study Material →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0 0;font-size:14px;line-height:22px;color:#6b7280;">
                Thank you for choosing EEC Learning Platform!
              </p>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#6b7280;">
                Happy Learning! 📖
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:30px;background:#f9fafb;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280;">
                Need help? Contact our support team
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply.<br>
                © ${new Date().getFullYear()} EEC Learning Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    // Send email with PDF attachment
    await sendMail({
      to,
      subject: `📚 Purchase Confirmation - ${materialTitle}`,
      html,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          path: invoicePath,
          contentType: "application/pdf"
        }
      ]
    });

    // Delete the temporary PDF file after sending
    deleteInvoicePdf(invoicePath);

  } catch (error) {
    // Clean up PDF file if it was created
    if (invoicePath) {
      deleteInvoicePdf(invoicePath);
    }
    console.error("Error sending purchase confirmation email:", error);
    throw error;
  }
}
