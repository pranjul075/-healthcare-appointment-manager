const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');
const calendarService = require('../services/calendar');

const router = express.Router();

router.get('/connect', requireAuth, (req, res) => {
  const state = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const url = calendarService.getAuthUrl(state);
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing code or state');

  try {
    const payload = jwt.verify(state, process.env.JWT_SECRET);
    await calendarService.saveTokensFromCode(code, payload.userId);
    res.send('<html><body>Google Calendar connected. You can close this tab.</body></html>');
  } catch (err) {
    res.status(400).send('Could not connect Google Calendar: ' + err.message);
  }
});

module.exports = router;
