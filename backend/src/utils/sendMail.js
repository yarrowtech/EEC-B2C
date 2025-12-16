import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `EEC Learning <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log("EMAIL SEND ERROR:", error);
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
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" style="background:#ffffff;border-radius:8px;padding:30px;">
          <tr>
            <td align="center">
              <h1 style="color:#1e40af;margin-bottom:10px;">
                Welcome to EEC 🎉
              </h1>
              <p style="font-size:16px;color:#374151;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="font-size:15px;color:#4b5563;">
                We’re excited to welcome you to
                <strong>Electronic Educare (EEC)</strong>.
                Your account has been successfully created.
              </p>

              <div style="margin:20px 0;text-align:left;">
                <ul style="color:#374151;font-size:14px;">
                  <li>📘 Access study materials</li>
                  <li>📝 Practice quizzes & exams</li>
                  <li>📊 Track your learning progress</li>
                </ul>
              </div>

              <p style="font-size:14px;color:#6b7280;">
                If you have any questions, our support team is always here to help.
              </p>

              <p style="margin-top:30px;font-size:14px;color:#374151;">
                Regards,<br/>
                <strong>EEC Team</strong>
              </p>

              <hr style="margin-top:30px;border:none;border-top:1px solid #e5e7eb;" />

              <p style="font-size:12px;color:#9ca3af;">
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
