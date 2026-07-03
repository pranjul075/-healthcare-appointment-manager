const express = require('express');
const db = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateSlots } = require('../services/booking');
const { generatePreVisitSummary } = require('../services/llm');
const { sendMail } = require('../services/email');
const calendarService = require('../services/calendar');

const router = express.Router();
router.use(requireAuth, requireRole('patient'));

router.get('/doctors', (req, res) => {
  const { specialisation } = req.query;
  let rows;
  if (specialisation) {
    rows = db
      .prepare(
        `SELECT d.id, d.specialisation, d.work_start, d.work_end, d.slot_minutes, u.name
         FROM doctors d JOIN users u ON u.id = d.user_id
         WHERE d.specialisation LIKE ? ORDER BY u.name`
      )
      .all(`%${specialisation}%`);
  } else {
    rows = db
      .prepare(
        `SELECT d.id, d.specialisation, d.work_start, d.work_end, d.slot_minutes, u.name
         FROM doctors d JOIN users u ON u.id = d.user_id ORDER BY u.name`
      )
      .all();
  }
  res.json(rows);
});

router.get('/doctors/:id/slots', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query parameter is required' });

  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const onLeave = db
    .prepare('SELECT id FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?')
    .get(req.params.id, date);
  if (onLeave) return res.json({ slots: [], onLeave: true });

  const booked = db
    .prepare(
      `SELECT appt_time FROM appointments WHERE doctor_id = ? AND appt_date = ? AND status = 'confirmed'`
    )
    .all(req.params.id, date)
    .map((r) => r.appt_time);

  res.json({ slots: generateSlots(doctor, booked), onLeave: false });
});

router.post('/appointments', async (req, res) => {
  const { doctorId, date, time, symptoms } = req.body;
  if (!doctorId || !date || !time || !symptoms) {
    return res.status(400).json({ error: 'doctorId, date, time and symptoms are required' });
  }

  const doctor = db
    .prepare(
      `SELECT d.*, u.name AS doctor_name, u.email AS doctor_email, u.id AS doctor_user_id
       FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const onLeave = db
    .prepare('SELECT id FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?')
    .get(doctorId, date);
  if (onLeave) return res.status(409).json({ error: 'Doctor is on leave for this date' });

  let appointmentId;
  try {
    const info = db
      .prepare(
        `INSERT INTO appointments (patient_id, doctor_id, appt_date, appt_time, symptoms, status)
         VALUES (?, ?, ?, ?, ?, 'confirmed')`
      )
      .run(req.user.id, doctorId, date, time, symptoms);
    appointmentId = info.lastInsertRowid;
  } catch (err) {
    return res.status(409).json({ error: 'This slot has just been booked, please choose another one' });
  }

  const aiSummary = await generatePreVisitSummary(symptoms);
  db.prepare(
    'UPDATE appointments SET urgency_level = ?, chief_complaint = ?, suggested_questions = ? WHERE id = ?'
  ).run(aiSummary.urgency, aiSummary.chiefComplaint, JSON.stringify(aiSummary.questions), appointmentId);

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const startDateTime = `${date}T${time}:00`;
  const endMinutes =
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + doctor.slot_minutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
    endMinutes % 60
  ).padStart(2, '0')}`;
  const endDateTime = `${date}T${endTime}:00`;

  const patientEventId = await calendarService.createEvent(patient.id, {
    summary: `Appointment with Dr. ${doctor.doctor_name}`,
    description: `Chief complaint: ${aiSummary.chiefComplaint}`,
    startDateTime,
    endDateTime
  });
  const doctorEventId = await calendarService.createEvent(doctor.doctor_user_id, {
    summary: `Appointment with ${patient.name}`,
    description: `Urgency: ${aiSummary.urgency}. Chief complaint: ${aiSummary.chiefComplaint}`,
    startDateTime,
    endDateTime
  });

  db.prepare(
    'UPDATE appointments SET patient_google_event_id = ?, doctor_google_event_id = ? WHERE id = ?'
  ).run(patientEventId, doctorEventId, appointmentId);

  await sendMail(
    patient.email,
    'Appointment confirmed',
    `<p>Hello ${patient.name},</p><p>Your appointment with Dr. ${doctor.doctor_name} is confirmed for ${date} at ${time}.</p>`
  );
  await sendMail(
    doctor.doctor_email,
    'New appointment booked',
    `<p>You have a new appointment with ${patient.name} on ${date} at ${time}. Urgency: ${aiSummary.urgency}.</p>`
  );

  res.status(201).json({ id: appointmentId, aiSummary });
});

router.get('/appointments', (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, u.name AS doctor_name, d.specialisation
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users u ON u.id = d.user_id
       WHERE a.patient_id = ?
       ORDER BY a.appt_date DESC, a.appt_time DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

router.put('/appointments/:id/cancel', async (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND patient_id = ?').get(
    req.params.id,
    req.user.id
  );
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(appt.doctor_id);

  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(appt.id);
  await calendarService.deleteEvent(req.user.id, appt.patient_google_event_id);
  await calendarService.deleteEvent(doctor.user_id, appt.doctor_google_event_id);

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  await sendMail(
    patient.email,
    'Appointment cancelled',
    `<p>Your appointment on ${appt.appt_date} at ${appt.appt_time} has been cancelled.</p>`
  );

  res.json({ message: 'Appointment cancelled' });
});

router.put('/appointments/:id/reschedule', async (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ error: 'date and time are required' });

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND patient_id = ?').get(
    req.params.id,
    req.user.id
  );
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const conflict = db
    .prepare(
      `SELECT id FROM appointments WHERE doctor_id = ? AND appt_date = ? AND appt_time = ? AND status = 'confirmed' AND id != ?`
    )
    .get(appt.doctor_id, date, time, appt.id);
  if (conflict) return res.status(409).json({ error: 'That slot is already booked' });

  db.prepare('UPDATE appointments SET appt_date = ?, appt_time = ?, reminder_sent = 0 WHERE id = ?').run(
    date,
    time,
    appt.id
  );

  const doctor = db
    .prepare(
      `SELECT d.*, u.id AS doctor_user_id FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(appt.doctor_id);

  const startDateTime = `${date}T${time}:00`;
  const endMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + doctor.slot_minutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
    endMinutes % 60
  ).padStart(2, '0')}`;
  const endDateTime = `${date}T${endTime}:00`;

  await calendarService.updateEvent(req.user.id, appt.patient_google_event_id, {
    start: { dateTime: startDateTime },
    end: { dateTime: endDateTime }
  });
  await calendarService.updateEvent(doctor.doctor_user_id, appt.doctor_google_event_id, {
    start: { dateTime: startDateTime },
    end: { dateTime: endDateTime }
  });

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  await sendMail(
    patient.email,
    'Appointment rescheduled',
    `<p>Your appointment has been moved to ${date} at ${time}.</p>`
  );

  res.json({ message: 'Appointment rescheduled' });
});

module.exports = router;
