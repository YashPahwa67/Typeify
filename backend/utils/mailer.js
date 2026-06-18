/**
 * Email via Brevo's transactional HTTP API.
 *   BREVO_API_KEY — Brevo → SMTP & API → API Keys (starts with "xkeysib-").
 *   EMAIL_FROM    — a verified sender address (Brevo → Senders & IPs).
 *   EMAIL_FROM_NAME — optional display name (defaults to "Typeify").
 * Unlike Gmail App Passwords, Brevo API keys aren't revoked by Google and
 * are built for sending from cloud IPs (Render, etc.). Uses the built-in
 * fetch (Node 18+), so no extra dependency is needed.
 */
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

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
  const { BREVO_API_KEY, EMAIL_FROM } = process.env;
  if (!BREVO_API_KEY || !EMAIL_FROM) {
    throw new Error(
      "Email is not configured. Set BREVO_API_KEY and EMAIL_FROM (verified Brevo sender) in backend/.env",
    );
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY.trim(),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME || "Typeify", email: EMAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: `${intro.replace(/<[^>]*>/g, "")} Your code is ${code}. It expires in 10 minutes.`,
      htmlContent: otpEmailHtml(intro, code),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${detail}`);
  }
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
