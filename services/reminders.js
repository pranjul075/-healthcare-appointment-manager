const cron = require('node-cron');
const db = require('../db/database');
const { sendMail } = require('./email');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function medicationSlotTimes(timesPerDay) {
  const windowStart = 8 * 60;
  const windowEnd = 20 * 60;
  const span = windowEnd - windowStart;
  const times = [];
  for (let i = 0; i < timesPerDay; i++) {
    const minutes = windowStart + Math.round((span / (timesPerDay + 1)) * (i + 1));
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return times;
}

async function sendAppointmentReminders() {
  const target = addDays(todayStr(), 1);
  const rows = db.prepare(
    `SELECT a.*, p.email AS patient_email, p.name AS patient_name,
            du.name AS doctor_name, du.email AS doctor_email
     FROM appointments a
     JOIN users p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users du ON du.id = d.user_id
     WHERE a.appt_date = ? AND a.status = 'confirmed' AND a.reminder_sent = 0`
  ).all(target);

  for (const row of rows) {
    const html = `<p>Hello ${row.patient_name},</p>
      <p>This is a reminder of your appointment with Dr. ${row.doctor_name} on ${row.appt_date} at ${row.appt_time}.</p>`;
    await sendMail(row.patient_email, 'Appointment reminder', html);
    await sendMail(
      row.doctor_email,
      'Upcoming appointment reminder',
      `<p>You have an appointment with ${row.patient_name} on ${row.appt_date} at ${row.appt_time}.</p>`
    );
    db.prepare('UPDATE appointments SET reminder_sent = 1 WHERE id = ?').run(row.id);
  }
}

async function sendMedicationReminders() {
  const today = todayStr();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const meds = db.prepare(
    `SELECT m.*, a.patient_id, u.email AS patient_email, u.name AS patient_name
     FROM medications m
     JOIN appointments a ON a.id = m.appointment_id
     JOIN users u ON u.id = a.patient_id
     WHERE date(m.start_date) <= date(?)
       AND date(m.start_date, '+' || m.duration_days || ' days') >= date(?)`
  ).all(today, today);

  for (const med of meds) {
    const slots = medicationSlotTimes(med.times_per_day);
    slots.forEach((slotTime, index) => {
      const slotMinutes = Number(slotTime.slice(0, 2)) * 60 + Number(slotTime.slice(3, 5));
      if (Math.abs(currentMinutes - slotMinutes) > 10) return;

      const already = db.prepare(
        'SELECT id FROM medication_reminder_log WHERE medication_id = ? AND reminder_date = ? AND slot_index = ?'
      ).get(med.id, today, index);
      if (already) return;

      sendMail(
        med.patient_email,
        'Medication reminder',
        `<p>Hello ${med.patient_name}, it is time to take your dose of ${med.medicine_name}.</p>`
      ).then(() => {
        db.prepare(
          'INSERT INTO medication_reminder_log (medication_id, reminder_date, slot_index) VALUES (?, ?, ?)'
        ).run(med.id, today, index);
      });
    });
  }
}

function start() {
  cron.schedule('*/10 * * * *', () => {
    sendMedicationReminders().catch((err) => console.error('Medication reminder job failed:', err.message));
  });

  cron.schedule('0 9 * * *', () => {
    sendAppointmentReminders().catch((err) => console.error('Appointment reminder job failed:', err.message));
  });

  console.log('Background reminder jobs scheduled');
}

module.exports = { start };
