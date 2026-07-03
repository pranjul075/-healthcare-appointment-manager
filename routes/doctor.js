const express = require('express');
const db = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generatePostVisitSummary } = require('../services/llm');
const { sendMail } = require('../services/email');
const calendarService = require('../services/calendar');

const router = express.Router();
router.use(requireAuth, requireRole('doctor'));

function getOwnDoctorProfile(userId) {
  return db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(userId);
}

router.get('/appointments', (req, res) => {
  const doctor = getOwnDoctorProfile(req.user.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  const { date } = req.query;
  let rows;
  if (date) {
    rows = db
      .prepare(
        `SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
         FROM appointments a JOIN users p ON p.id = a.patient_id
         WHERE a.doctor_id = ? AND a.appt_date = ? ORDER BY a.appt_time`
      )
      .all(doctor.id, date);
  } else {
    rows = db
      .prepare(
        `SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
         FROM appointments a JOIN users p ON p.id = a.patient_id
         WHERE a.doctor_id = ? ORDER BY a.appt_date DESC, a.appt_time DESC`
      )
      .all(doctor.id);
  }

  rows.forEach((r) => {
    r.suggested_questions = r.suggested_questions ? JSON.parse(r.suggested_questions) : [];
  });

  res.json(rows);
});

router.put('/appointments/:id/complete', async (req, res) => {
  const { notes, prescription } = req.body;
  if (!notes) return res.status(400).json({ error: 'Clinical notes are required' });

  const doctor = getOwnDoctorProfile(req.user.id);
  const appt = db
    .prepare('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?')
    .get(req.params.id, doctor.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const prescriptionList = Array.isArray(prescription) ? prescription : [];
  const summary = await generatePostVisitSummary(notes, prescriptionList);

  db.prepare(
    `UPDATE appointments SET status = 'completed', doctor_notes = ?, prescription = ?, post_visit_summary = ? WHERE id = ?`
  ).run(notes, JSON.stringify(prescriptionList), summary.summary, appt.id);

  prescriptionList.forEach((item) => {
    if (!item.medicine_name) return;
    db.prepare(
      `INSERT INTO medications (appointment_id, medicine_name, times_per_day, duration_days, start_date)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      appt.id,
      item.medicine_name,
      Number(item.times_per_day) || 1,
      Number(item.duration_days) || 1,
      appt.appt_date
    );
  });

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(appt.patient_id);
  await sendMail(
    patient.email,
    'Your visit summary is ready',
    `<p>Hello ${patient.name},</p>
     <p>${summary.summary}</p>
     <p><strong>Medication schedule:</strong><br>${summary.medicationSchedule.replace(/\n/g, '<br>')}</p>
     <p><strong>Follow-up steps:</strong><br>${summary.followUpSteps}</p>`
  );

  res.json({ message: 'Visit completed', summary });
});

router.post('/leave', async (req, res) => {
  const { date, reason } = req.body;
  if (!date) return res.status(400).json({ error: 'Leave date is required' });

  const doctor = db
    .prepare(
      `SELECT d.*, u.name AS doctor_name FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.user_id = ?`
    )
    .get(req.user.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

  try {
    db.prepare('INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (?, ?, ?)').run(
      doctor.id,
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
    .all(doctor.id, date);

  for (const appt of affected) {
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(appt.id);
    await calendarService.deleteEvent(appt.patient_id, appt.patient_google_event_id);
    await calendarService.deleteEvent(req.user.id, appt.doctor_google_event_id);
    await sendMail(
      appt.patient_email,
      'Your appointment has been cancelled',
      `<p>Hello ${appt.patient_name},</p><p>Dr. ${doctor.doctor_name} is unavailable on ${date} and your appointment has been cancelled. Please book a new slot.</p>`
    );
  }

  res.status(201).json({ message: 'Leave recorded', affectedAppointments: affected.length });
});

router.get('/leaves', (req, res) => {
  const doctor = getOwnDoctorProfile(req.user.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
  const leaves = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? ORDER BY leave_date').all(
    doctor.id
  );
  res.json(leaves);
});

module.exports = router;
