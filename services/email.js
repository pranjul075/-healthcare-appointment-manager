const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  return transporter;
}

async function sendMail(to, subject, html, attempt = 1) {
  const t = getTransporter();
  if (!t || !to) {
    console.log(`Email skipped (no SMTP configured or missing recipient): ${subject}`);
    return false;
  }

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error(`Email attempt ${attempt} failed for ${to}:`, err.message);
    if (attempt < 2) {
      return sendMail(to, subject, html, attempt + 1);
    }
    return false;
  }
}

module.exports = { sendMail };
