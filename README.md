# Healthcare Appointment & Follow-up Manager

## Overview

Healthcare Appointment & Follow-up Manager is a role-based web application developed to simplify the appointment booking process between patients and doctors. The system provides separate portals for administrators, doctors, and patients, allowing each user to perform tasks according to their responsibilities.

Patients can create an account, browse available doctors, book appointments, and manage their bookings. Doctors can access their appointment schedule, review patient information, and record consultation notes and prescriptions. Administrators are responsible for managing doctor accounts, monitoring appointments, and maintaining the overall system.

The project is built using **Node.js**, **Express.js**, **SQLite**, and **Vanilla JavaScript**, making it lightweight, easy to deploy, and suitable for small healthcare organizations or academic demonstrations.

---

## Features

### Admin Module

- Secure administrator login
- Add, update, and manage doctor accounts
- View all appointments
- Manage doctor availability and leave requests
- Monitor system activities

### Patient Module

- User registration and secure login
- Browse doctors by specialization
- View available appointment slots
- Book appointments
- Cancel or reschedule appointments
- View appointment history

### Doctor Module

- Secure doctor login
- View daily appointment schedule
- Access patient information before consultation
- Add consultation notes
- Generate prescriptions
- Mark appointments as completed

### Additional Features

- JWT-based authentication
- Password encryption using bcrypt
- Email notification support
- AI-generated appointment summaries (when API key is configured)
- Background reminder service using cron jobs
- Double booking prevention
- Role-based authorization
- RESTful API architecture

---

## Technology Stack

### Backend

- Node.js
- Express.js

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

### Database

- SQLite
- better-sqlite3

### Authentication

- JSON Web Token (JWT)
- bcryptjs

### Additional Packages

- Nodemailer
- node-cron
- dotenv
- better-sqlite3
- jsonwebtoken

---

## Project Structure

```
healthcare-appointment-manager
│
├── db
│   ├── database.js
│   └── schema.sql
│
├── middleware
│   └── auth.js
│
├── public
│   ├── css
│   ├── js
│   └── index.html
│
├── routes
│   ├── admin.js
│   ├── auth.js
│   ├── doctor.js
│   ├── patient.js
│   └── calendar.js
│
├── services
│   ├── booking.js
│   ├── calendar.js
│   ├── email.js
│   ├── llm.js
│   └── reminders.js
│
├── server.js
├── package.json
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/pranjul075/-healthcare-appointment-manager.git
```

### Navigate to the project folder

```bash
cd -healthcare-appointment-manager
```

### Install dependencies

```bash
npm install
```

### Create the environment file

Create a `.env` file in the project root and configure the required environment variables.

Example:

```env
PORT=4000

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

DB_PATH=./data/app.db

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@clinic.com
ADMIN_PASSWORD=your_password

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=

ANTHROPIC_API_KEY=
```

### Start the application

```bash
npm start
```

Open the application in your browser:

```
http://localhost:4000
```

---

## User Workflow

### Administrator

1. Login using admin credentials.
2. Add doctor accounts.
3. Manage doctor information.
4. Monitor appointments.

### Patient

1. Register a new account.
2. Login securely.
3. Browse doctors.
4. Select an available time slot.
5. Book an appointment.
6. View or manage appointments.

### Doctor

1. Login to the doctor dashboard.
2. View upcoming appointments.
3. Review patient information.
4. Add consultation notes.
5. Update prescriptions.
6. Complete appointments.

---

## API Overview

### Authentication

- Register User
- Login User
- Get Current User

### Admin

- Add Doctor
- Update Doctor
- View Doctors
- View Appointments

### Patient

- List Doctors
- View Available Slots
- Book Appointment
- Cancel Appointment
- Reschedule Appointment

### Doctor

- View Appointments
- Complete Consultation
- Manage Leave

---

## Database

The project uses SQLite as the database. The database file is automatically created during the first application startup, and all required tables are generated automatically.

---

## Security Features

- JWT Authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- Input validation
- Prevention of duplicate appointment bookings

---

## Design Highlights

- Clean and modular folder structure
- RESTful API design
- Lightweight architecture
- Easy deployment
- Scalable backend structure
- Separation of business logic and routes

---

## Future Improvements

- Online payment gateway
- Video consultation
- Medical record upload
- Doctor search and advanced filtering
- SMS notifications
- Multi-clinic support
- Analytics dashboard

---

## Author

**Pranjul Katiyar**

Bachelor of Technology (Computer Science)

Healthcare Appointment & Follow-up Manager was developed as an academic full-stack web development project to demonstrate practical implementation of authentication, role-based access control, appointment scheduling, database management, and REST API development using the Node.js ecosystem.
