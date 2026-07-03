const nodemailer = require('nodemailer');

let transporter = null;
let transporterVerified = false;

function getTransporter() {
  if (transporter && transporterVerified) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('SMTP not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD required).');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    // Increase timeouts for Render's network
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
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
    // Verify connection on first attempt
    if (!transporterVerified) {
      await t.verify();
      transporterVerified = true;
      console.log('SMTP connection verified successfully.');
    }

    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`Email attempt ${attempt} failed for ${to}: [${err.code}] ${err.message}`);
    if (attempt < 2) {
      // Reset transporter so it tries to reconnect on retry
      transporter = null;
      transporterVerified = false;
      return sendMail(to, subject, html, attempt + 1);
    }
    return false;
  }
}

module.exports = { sendMail };
