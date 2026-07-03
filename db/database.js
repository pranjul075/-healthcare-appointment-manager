const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || './data/app.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';
  if (!email || !password) return;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
    .run(email, hash, name, 'admin');
  console.log(`Admin account ready: ${email}`);
}

seedAdmin();

module.exports = db;
