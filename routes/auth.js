const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../services/email');
const otp = require('../services/otp');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  
  const info = db
    .prepare('INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)')
    .run(email, passwordHash, name, phone || null, 'patient');

  const user = { id: info.lastInsertRowid, email, name, role: 'patient' };
  res.status(201).json({ token: issueToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    token: issueToken(user),
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, phone, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'doctor') {
    user.doctorProfile = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(user.id);
  }
  res.json(user);
});

// GET /api/auth/email-status — check if SMTP is configured (no auth needed, safe to expose)
router.get('/email-status', (req, res) => {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  res.json({
    configured,
    host: process.env.SMTP_HOST || null,
    user: process.env.SMTP_USER || null,
    missing: [
      !process.env.SMTP_HOST && 'SMTP_HOST',
      !process.env.SMTP_USER && 'SMTP_USER',
      !process.env.SMTP_PASSWORD && 'SMTP_PASSWORD',
    ].filter(Boolean)
  });
});

// POST /api/auth/test-email — send a test email to verify SMTP works
// Body: { to: "recipient@example.com" }
router.post('/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Provide a "to" email address in the request body' });

  const sent = await sendMail(
    to,
    'Test email from Healthcare App',
    `<p>This is a test email sent at <strong>${new Date().toISOString()}</strong>.</p><p>If you received this, your SMTP configuration is working correctly! ✅</p>`
  ).catch(err => {
    console.error('Test email error:', err);
    return false;
  });

  if (sent) {
    res.json({ success: true, message: `Test email sent to ${to}` });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email. Check server logs and SMTP environment variables.',
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
    });
  }
});

module.exports = router;
