import nodemailer from "nodemailer";


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
 * Base mail sender
 */
export default async function sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `EEC Learning <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
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
