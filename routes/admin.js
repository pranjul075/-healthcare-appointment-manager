const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail } = require('../services/email');
const calendarService = require('../services/calendar');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.post('/doctors', (req, res) => {
  const { name, email, password, phone, specialisation, workStart, workEnd, slotMinutes } = req.body;
  if (!name || !email || !password || !specialisation || !workStart || !workEnd) {
    return res.status(400).json({ error: 'Missing required doctor fields' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userInfo = db
    .prepare('INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)')
    .run(email, hash, name, phone || null, 'doctor');

  const doctorInfo = db
    .prepare(
      'INSERT INTO doctors (user_id, specialisation, work_start, work_end, slot_minutes) VALUES (?, ?, ?, ?, ?)'
    )
    .run(userInfo.lastInsertRowid, specialisation, workStart, workEnd, slotMinutes || 30);

  sendMail(
    email,
    'Your clinic account has been created',
    `<p>Hello Dr. ${name},</p><p>An account has been created for you. Login email: ${email}</p>`
  );

  res.status(201).json({ id: doctorInfo.lastInsertRowid, userId: userInfo.lastInsertRowid });
});

router.get('/doctors', (req, res) => {
  const doctors = db
    .prepare(
      `SELECT d.id, d.specialisation, d.work_start, d.work_end, d.slot_minutes,
              u.id AS user_id, u.name, u.email, u.phone
       FROM doctors d JOIN users u ON u.id = d.user_id
       ORDER BY u.name`
    )
    .all();
  res.json(doctors);
});

router.put('/doctors/:id', (req, res) => {
  const { specialisation, workStart, workEnd, slotMinutes } = req.body;
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  db.prepare(
    `UPDATE doctors SET specialisation = ?, work_start = ?, work_end = ?, slot_minutes = ? WHERE id = ?`
  ).run(
    specialisation || doctor.specialisation,
    workStart || doctor.work_start,
    workEnd || doctor.work_end,
    slotMinutes || doctor.slot_minutes,
    req.params.id
  );

  res.json({ message: 'Doctor profile updated' });
});

router.post('/doctors/:id/leave', async (req, res) => {
  const { date, reason } = req.body;
  const doctorId = req.params.id;
  if (!date) return res.status(400).json({ error: 'Leave date is required' });

  const doctor = db
    .prepare(
      `SELECT d.*, u.name AS doctor_name FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  try {
    db.prepare('INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (?, ?, ?)').run(
      doctorId,
      date,
      reason || null
    );
  } catch (err) {
    return res.status(409).json({ error: 'Leave already recorded for this date' });
  }

  const affected = db
    .prepare(
      `SELECT a.*, u.email AS patient_email, u.name AS patient_name
       FROM appointments a JOIN users u ON u.id = a.patient_id
       WHERE a.doctor_id = ? AND a.appt_date = ? AND a.status = 'confirmed'`
    )
    .all(doctorId, date);

  for (const appt of affected) {
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(appt.id);
    await calendarService.deleteEvent(appt.patient_id, appt.patient_google_event_id);
    await calendarService.deleteEvent(doctor.user_id, appt.doctor_google_event_id);
    await sendMail(
      appt.patient_email,
      'Your appointment has been cancelled',
      `<p>Hello ${appt.patient_name},</p><p>Dr. ${doctor.doctor_name} is unavailable on ${date} and your appointment has been cancelled. Please book a new slot.</p>`
    );
  }

  res.status(201).json({ message: 'Leave recorded', affectedAppointments: affected.length });
});

router.get('/doctors/:id/leaves', (req, res) => {
  const leaves = db
    .prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? ORDER BY leave_date')
    .all(req.params.id);
  res.json(leaves);
});

router.get('/appointments', (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, p.name AS patient_name, du.name AS doctor_name, d.specialisation
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       ORDER BY a.appt_date DESC, a.appt_time DESC`
    )
    .all();
  res.json(rows);
});

module.exports = router;
