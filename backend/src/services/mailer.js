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
      <p style="color:#6b7280;font-size:12px">If you didn't create this account, ignore this email.</p>
    </div>
  `;
  return resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendGiftCardEmail({ to, name, giftCardCode, amount, provider, redemptionId }) {
  const subject = `🎁 Your ${provider} Gift Card - ₹${amount}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif">
        <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#f3f4f6">
          <tr>
            <td align="center" style="padding:40px 0">
              <table role="presentation" style="width:600px;border-collapse:collapse;border:1px solid #e5e7eb;border-spacing:0;background:#ffffff;border-radius:16px;overflow:hidden">
                <!-- Header -->
                <tr>
                  <td style="padding:40px 30px;background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
                    <h1 style="margin:0;font-size:28px;line-height:36px;font-weight:700;color:#ffffff;text-align:center">
                      🎉 Gift Card Redemption Successful!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:40px 30px">
                    <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:#374151">
                      Congratulations! Your coin redemption was successful. Here's your <strong>${provider}</strong> gift card:
                    </p>

                    <!-- Gift Card Details -->
                    <div style="background:linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);border:2px solid #f59e0b;border-radius:12px;padding:24px;margin:30px 0">
                      <table role="presentation" style="width:100%;border-collapse:collapse">
                        <tr>
                          <td style="padding:8px 0">
                            <p style="margin:0;font-size:14px;color:#92400e;font-weight:600">Gift Card Provider</p>
                            <p style="margin:4px 0 0 0;font-size:18px;color:#78350f;font-weight:700">${provider}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0">
                            <p style="margin:0;font-size:14px;color:#92400e;font-weight:600">Amount</p>
                            <p style="margin:4px 0 0 0;font-size:24px;color:#78350f;font-weight:700">₹${amount}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0 8px 0">
                            <p style="margin:0;font-size:14px;color:#92400e;font-weight:600">Your Gift Card Code</p>
                            <div style="background:#ffffff;border:2px dashed #f59e0b;border-radius:8px;padding:16px;margin:8px 0">
                              <code style="font-size:20px;font-weight:700;color:#d97706;letter-spacing:2px;font-family:monospace">${giftCardCode}</code>
                            </div>
                            <p style="margin:8px 0 0 0;font-size:12px;color:#92400e">
                              💡 Click to copy or save this code securely
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Redemption Instructions -->
                    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:24px 0;border-radius:4px">
                      <h3 style="margin:0 0 12px 0;font-size:16px;color:#166534;font-weight:600">📝 How to Redeem</h3>
                      <ol style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:22px">
                        <li>Visit <a href="https://www.amazon.in/gc/redeem" style="color:#2563eb;text-decoration:none">Amazon Gift Card Redemption</a></li>
                        <li>Sign in to your Amazon account</li>
                        <li>Enter the gift card code above</li>
                        <li>Click "Apply to your balance"</li>
                        <li>Start shopping with your new balance!</li>
                      </ol>
                    </div>

                    <!-- Important Notes -->
                    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:24px 0;border-radius:4px">
                      <h3 style="margin:0 0 12px 0;font-size:16px;color:#991b1b;font-weight:600">⚠️ Important Notes</h3>
                      <ul style="margin:0;padding-left:20px;color:#991b1b;font-size:14px;line-height:22px">
                        <li>Keep this code secure and don't share it with anyone</li>
                        <li>This code can only be used once</li>
                        <li>Valid only on Amazon India (amazon.in)</li>
                        <li>No expiration date - use anytime</li>
                        <li>Non-refundable and cannot be exchanged for cash</li>
                      </ul>
                    </div>

                    <!-- Transaction Details -->
                    <div style="border-top:1px solid #e5e7eb;margin-top:30px;padding-top:20px">
                      <p style="margin:0;font-size:12px;color:#6b7280">
                        <strong>Transaction ID:</strong> ${redemptionId}<br>
                        <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align:center;margin:30px 0">
                      <a href="https://www.amazon.in/gc/redeem"
                         style="display:inline-block;background:#f59e0b;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(245,158,11,0.3)">
                        Redeem on Amazon →
                      </a>
                    </div>

                    <p style="margin:20px 0 0 0;font-size:14px;line-height:22px;color:#6b7280">
                      Thank you for being a valued member of EEC!
                    </p>
                    <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#6b7280">
                      Keep earning coins and redeem more rewards! 🎁
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:30px;background:#f9fafb;text-align:center">
                    <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280">
                      Need help? Contact our support team
                    </p>
                    <p style="margin:0;font-size:12px;color:#9ca3af">
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

  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    replyTo: process.env.SUPPORT_EMAIL || FROM
  });
}
