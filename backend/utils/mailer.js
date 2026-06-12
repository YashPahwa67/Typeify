import nodemailer from "nodemailer";

let transporter = null;

/**
 * Lazily build a Gmail SMTP transporter from env credentials.
 *   EMAIL_USER — the sending Gmail address
 *   EMAIL_PASS — a Gmail App Password (NOT the normal account password;
 *                requires 2-Step Verification — https://myaccount.google.com/apppasswords)
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      "Email is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env",
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    // Gmail App Passwords are shown in 4-char groups; strip spaces for SMTP auth.
    auth: { user: EMAIL_USER, pass: EMAIL_PASS.replace(/\s+/g, "") },
  });

  return transporter;
};

const otpEmailHtml = (intro, code) => `
  <div style="background:#0e1116;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif">
    <div style="max-width:460px;margin:0 auto;background:#161b24;border:1px solid #262e3b;border-radius:16px;padding:32px;color:#c9d1dc">
      <h1 style="margin:0 0 8px;font-size:24px;color:#c9d1dc">
        type<span style="color:#e2b714">ify</span>
      </h1>
      <p style="color:#6b7688;margin:0 0 24px;font-size:14px">${intro}</p>
      <div style="background:#1d2430;border:1px solid #262e3b;border-radius:12px;text-align:center;padding:20px;margin-bottom:24px">
        <div style="font-size:13px;color:#6b7688;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Your code</div>
        <div style="font-size:38px;font-weight:700;letter-spacing:10px;color:#e2b714;font-family:monospace">${code}</div>
      </div>
      <p style="color:#6b7688;font-size:13px;margin:0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
    </div>
  </div>`;

const send = async ({ to, subject, intro, code }) => {
  const from = process.env.EMAIL_USER;
  await getTransporter().sendMail({
    from: `"Typeify" <${from}>`,
    to,
    subject,
    text: `${intro.replace(/<[^>]*>/g, "")} Your code is ${code}. It expires in 10 minutes.`,
    html: otpEmailHtml(intro, code),
  });
};

export const sendOtpEmail = (to, code) =>
  send({
    to,
    code,
    subject: `${code} is your Typeify verification code`,
    intro: "Verify your email to finish signing up.",
  });

export const sendResetEmail = (to, code) =>
  send({
    to,
    code,
    subject: `${code} is your Typeify password reset code`,
    intro: "Use this code to reset your Typeify password.",
  });
