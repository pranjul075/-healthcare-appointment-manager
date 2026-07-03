require('dotenv').config();
const express = require('express');
const path = require('path');

// Catch unhandled promise rejections so the server logs them instead of crashing silently
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const calendarRoutes = require('./routes/calendar');
const reminders = require('./services/reminders');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Healthcare appointment manager running on port ${port}`);

  // Log SMTP config status so it's easy to diagnose email issues in Render logs
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  if (smtpHost && smtpUser && smtpPass) {
    console.log(`✅ SMTP configured: ${smtpHost} as ${smtpUser}`);
  } else {
    console.warn('⚠️  SMTP NOT configured. Email/OTP will not be sent.');
    if (!smtpHost) console.warn('   Missing: SMTP_HOST');
    if (!smtpUser) console.warn('   Missing: SMTP_USER');
    if (!smtpPass) console.warn('   Missing: SMTP_PASSWORD');
    console.warn('   → Set these in the Render dashboard under Environment Variables.');
  }

  reminders.start();
});
