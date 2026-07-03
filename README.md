# Healthcare Appointment & Follow-up Manager

A clinic platform with separate portals for patients, doctors and an admin. Patients book appointments and describe symptoms in advance, doctors get an AI-generated pre-visit summary, and both sides get email and Google Calendar updates automatically.

## Stack

- Node.js + Express (backend API)
- SQLite via better-sqlite3 (database, single file, no server needed)
- Vanilla HTML/CSS/JS (frontend, no build step)
- JWT for auth, bcrypt for password hashing
- Anthropic API for pre-visit and post-visit summaries
- Nodemailer for email
- Google Calendar API (OAuth 2.0) for calendar events
- node-cron for medication and appointment reminders

## Project layout

```
healthcare-appointment-manager/
  server.js
  db/
    schema.sql
    database.js
  middleware/
    auth.js
  services/
    llm.js
    email.js
    calendar.js
    booking.js
    reminders.js
  routes/
    auth.js
    admin.js
    patient.js
    doctor.js
    calendar.js
  public/
    index.html
    css/style.css
    js/
```

## Setup

1. Install dependencies

```
npm install
```

2. Copy the environment file and fill in your own values

```
cp .env.example .env
```

Required for the app to run at all:
- `JWT_SECRET` - any random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - the first admin account is created automatically on first start

Optional but recommended for the full feature set:
- `ANTHROPIC_API_KEY` - enables the AI pre-visit and post-visit summaries. Without it, the app falls back to a simple templated summary so nothing breaks.
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` - enables booking confirmations, cancellations, and reminder emails. Without it, emails are skipped and logged to the console instead of failing the request.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` - enables Google Calendar sync. Without it, calendar events are simply skipped.

3. Start the app

```
npm start
```

The app serves both the API and the frontend on `http://localhost:4000` (or whatever `PORT` you set).

4. Log in

- Open the app in a browser.
- Log in with the admin credentials from your `.env` file.
- As admin, add doctor accounts under "Doctors" (set their specialisation, working hours and slot length).
- Patients can self-register from the "Register" tab.

## Google Calendar setup

1. In the Google Cloud Console, create a project and enable the Google Calendar API.
2. Create an OAuth 2.0 Client ID (type: Web application).
3. Add `http://localhost:4000/api/calendar/callback` (or your deployed URL + `/api/calendar/callback`) as an authorized redirect URI.
4. Put the client ID, client secret and redirect URI in `.env`.
5. Each user (patient or doctor) connects their own calendar by calling `GET /api/calendar/connect` while logged in, which returns a Google consent URL to open in the browser. After granting access, their calendar is linked and future appointments will create/update/delete events automatically.

## API overview

All endpoints except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

**Auth**
- `POST /api/auth/register/request-otp` - `{ name, email, phone, password }`, sends a 6-digit code to the email and holds the registration pending for 10 minutes. If SMTP isn't configured, the response includes a `devCode` field so you can still test locally.
- `POST /api/auth/register/verify-otp` - `{ email, code }`, creates the patient account and returns a token once the code matches
- `POST /api/auth/login`
- `GET /api/auth/me`

**Admin**
- `POST /api/admin/doctors` - create a doctor account and profile
- `GET /api/admin/doctors`
- `PUT /api/admin/doctors/:id`
- `POST /api/admin/doctors/:id/leave` - mark a doctor unavailable on a date, cancels existing bookings and notifies affected patients
- `GET /api/admin/doctors/:id/leaves`
- `GET /api/admin/appointments`

**Patient**
- `GET /api/patient/doctors?specialisation=`
- `GET /api/patient/doctors/:id/slots?date=YYYY-MM-DD`
- `POST /api/patient/appointments` - `{ doctorId, date, time, symptoms }`
- `GET /api/patient/appointments`
- `PUT /api/patient/appointments/:id/cancel`
- `PUT /api/patient/appointments/:id/reschedule` - `{ date, time }`

**Doctor**
- `GET /api/doctor/appointments?date=`
- `PUT /api/doctor/appointments/:id/complete` - `{ notes, prescription: [{ medicine_name, times_per_day, duration_days }] }`
- `POST /api/doctor/leave` - `{ date, reason }`
- `GET /api/doctor/leaves`

**Calendar**
- `GET /api/calendar/connect`
- `GET /api/calendar/callback`

## Database schema

See `db/schema.sql`. The database file is created automatically on first run at the path set by `DB_PATH` (default `./data/app.db`), along with the tables and the initial admin user.

## LLM prompts used

**Pre-visit summary**, run when a patient books an appointment:

> Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: `<symptoms>`

**Post-visit summary**, run when a doctor completes a visit:

> Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: `<notes>`

Both prompts ask for a JSON response and the app falls back to a plain templated summary if the LLM call fails or the API key is not set, so the rest of the flow keeps working.

## Notes on design choices

- Double booking is prevented at two levels: the UI only shows free slots, and the database has a unique constraint on `(doctor_id, appt_date, appt_time)` for active appointments, so a race between two simultaneous booking requests is caught by SQLite itself rather than relying only on a prior check.
- Medication reminders are computed by spreading `times_per_day` evenly between 8am and 8pm and a background job checks every 10 minutes whether a reminder slot is due, logging each sent reminder so it is never sent twice.
- Appointment reminder emails go out the morning before the appointment date.
