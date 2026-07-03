const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// ── Resend (HTTP-based, works on Render free plan) ──────────────────────────
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Nodemailer / SMTP (works locally, blocked by Render free plan) ──────────
let smtpTransporter = null;
let smtpVerified = false;

function getSmtpTransporter() {
  if (smtpTransporter && smtpVerified) return smtpTransporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  return smtpTransporter;
}

// ── Main sendMail — tries Resend first, falls back to SMTP ──────────────────
async function sendMail(to, subject, html) {
  if (!to) {
    console.log('Email skipped: no recipient provided.');
    return false;
  }

  // 1. Try Resend (HTTP API — works on Render)
  const resend = getResendClient();
  if (resend) {
    try {
      const from = process.env.MAIL_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        console.error('Resend error:', error.message || JSON.stringify(error));
      } else {
        console.log(`Email sent via Resend to ${to}: ${subject}`);
        return true;
      }
    } catch (err) {
      console.error('Resend exception:', err.message);
    }
  }

  // 2. Fall back to SMTP (works locally, blocked on Render free plan)
  const t = getSmtpTransporter();
  if (t) {
    try {
      if (!smtpVerified) {
        await t.verify();
        smtpVerified = true;
        console.log('SMTP connection verified.');
      }
      const from = process.env.MAIL_FROM || process.env.SMTP_USER;
      await t.sendMail({ from, to, subject, html });
      console.log(`Email sent via SMTP to ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error(`SMTP failed for ${to}: [${err.code}] ${err.message}`);
      smtpTransporter = null;
      smtpVerified = false;
    }
  }

  console.warn('No email provider available (Resend API key or SMTP credentials required).');
  return false;
}

module.exports = { sendMail };
