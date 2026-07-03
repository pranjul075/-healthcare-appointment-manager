CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  specialisation TEXT NOT NULL,
  work_start TEXT NOT NULL,
  work_end TEXT NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctor_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  leave_date TEXT NOT NULL,
  reason TEXT,
  UNIQUE(doctor_id, leave_date)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES users(id),
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  appt_date TEXT NOT NULL,
  appt_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  symptoms TEXT,
  urgency_level TEXT,
  chief_complaint TEXT,
  suggested_questions TEXT,
  doctor_notes TEXT,
  prescription TEXT,
  post_visit_summary TEXT,
  patient_google_event_id TEXT,
  doctor_google_event_id TEXT,
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(doctor_id, appt_date, appt_time)
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  medicine_name TEXT NOT NULL,
  times_per_day INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_reminder_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL REFERENCES medications(id),
  reminder_date TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  sent_at TEXT DEFAULT (datetime('now')),
  UNIQUE(medication_id, reminder_date, slot_index)
);

CREATE TABLE IF NOT EXISTS google_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expiry_date INTEGER
);

CREATE TABLE IF NOT EXISTS pending_registrations (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

