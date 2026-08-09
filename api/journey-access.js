const nodemailer = require("nodemailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUNTRY_CODE_PATTERN = /^\+\d{1,4}$/;
const PHONE_PATTERN = /^\d{10}$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const email = clean(request.body && request.body.email).toLowerCase();
  const countryCode = clean(request.body && request.body.countryCode);
  const phone = clean(request.body && request.body.phone).replace(/\D/g, "");

  if (!EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ error: "A valid email address is required." });
  }
  if (!COUNTRY_CODE_PATTERN.test(countryCode) || !PHONE_PATTERN.test(phone)) {
    return response.status(400).json({ error: "A country code and 10-digit phone number are required." });
  }

  const requiredEnvironment = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SMTP_TO",
  ];
  const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
  if (missingEnvironment.length) {
    console.error("Journey SMTP is not configured:", missingEnvironment.join(", "));
    return response.status(503).json({ error: "Email service is temporarily unavailable." });
  }

  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(countryCode + " " + phone);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      replyTo: email,
      subject: "New EB-5 journey access request",
      text: [
        "A visitor requested access to the EB-5 journey.",
        "",
        `Email: ${email}`,
        `Phone: ${countryCode} ${phone}`,
        `Submitted: ${new Date().toISOString()}`,
      ].join("\n"),
      html: `
        <h2>New EB-5 journey access request</h2>
        <p>A visitor shared their details to view the EB-5 journey.</p>
        <table cellpadding="6" cellspacing="0" border="0">
          <tr><td><strong>Email</strong></td><td>${safeEmail}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${safePhone}</td></tr>
          <tr><td><strong>Submitted</strong></td><td>${new Date().toISOString()}</td></tr>
        </table>
      `,
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Journey access email failed:", error);
    return response.status(502).json({ error: "Unable to send access details." });
  }
};
