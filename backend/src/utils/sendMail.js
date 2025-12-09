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
