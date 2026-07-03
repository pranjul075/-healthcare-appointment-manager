const { google } = require('googleapis');
const db = require('../db/database');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl(state) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state
  });
}

async function saveTokensFromCode(code, userId) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    const existing = db.prepare('SELECT refresh_token FROM google_tokens WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE user_id = ?')
        .run(tokens.access_token || '', tokens.expiry_date || 0, userId);
      return;
    }
  }
  db.prepare(
    `INSERT INTO google_tokens (user_id, refresh_token, access_token, expiry_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       refresh_token = excluded.refresh_token,
       access_token = excluded.access_token,
       expiry_date = excluded.expiry_date`
  ).run(userId, tokens.refresh_token || '', tokens.access_token || '', tokens.expiry_date || 0);
}

function getClientForUser(userId) {
  const row = db.prepare('SELECT * FROM google_tokens WHERE user_id = ?').get(userId);
  if (!row || !row.refresh_token) return null;
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: row.refresh_token });
  return client;
}

async function createEvent(userId, { summary, description, startDateTime, endDateTime }) {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  try {
    const client = getClientForUser(userId);
    if (!client) return null;
    const calendar = google.calendar({ version: 'v3', auth: client });
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime }
      }
    });
    return res.data.id;
  } catch (err) {
    console.error('Calendar event creation failed:', err.message);
    return null;
  }
}

async function updateEvent(userId, eventId, patch) {
  if (!eventId) return;
  try {
    const client = getClientForUser(userId);
    if (!client) return;
    const calendar = google.calendar({ version: 'v3', auth: client });
    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: patch
    });
  } catch (err) {
    console.error('Calendar event update failed:', err.message);
  }
}

async function deleteEvent(userId, eventId) {
  if (!eventId) return;
  try {
    const client = getClientForUser(userId);
    if (!client) return;
    const calendar = google.calendar({ version: 'v3', auth: client });
    await calendar.events.delete({ calendarId: 'primary', eventId });
  } catch (err) {
    console.error('Calendar event deletion failed:', err.message);
  }
}

module.exports = { getAuthUrl, saveTokensFromCode, createEvent, updateEvent, deleteEvent };
