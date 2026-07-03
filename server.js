require('dotenv').config();
const express = require('express');
const path = require('path');

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
  reminders.start();
});
