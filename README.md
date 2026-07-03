# 🏥 Healthcare Appointment & Follow-up Manager

A full-stack role-based healthcare management system that enables patients to book appointments, doctors to manage consultations, and administrators to oversee the entire platform efficiently.

🌐 **Live Demo:**  
https://healthcare-appointment-manager-p6m6.onrender.com

📂 **GitHub Repository:**  
https://github.com/pranjul075/-healthcare-appointment-manager

---

## 📖 Overview

Healthcare Appointment & Follow-up Manager is a role-based web application developed to simplify appointment scheduling and follow-up management between patients and doctors.

The platform provides dedicated dashboards for:

- **Administrators** to manage doctors and appointments.
- **Doctors** to view schedules and maintain consultation records.
- **Patients** to book, reschedule, and track appointments.

The project demonstrates practical implementation of authentication, role-based access control, database management, RESTful APIs, background jobs, and email notification services.

---

## ✨ Features

### 🔹 Admin Module

- Secure administrator login
- Add, update, and manage doctor accounts
- View all appointments
- Monitor doctor availability
- Manage leave requests
- System-wide activity monitoring

### 🔹 Patient Module

- User registration and secure login
- Browse doctors by specialization
- View available appointment slots
- Book appointments
- Cancel or reschedule appointments
- View appointment history

### 🔹 Doctor Module

- Secure doctor login
- View daily schedules
- Access patient information
- Add consultation notes
- Generate prescriptions
- Mark appointments as completed

### 🔹 Additional Features

- JWT Authentication
- Password hashing with bcrypt
- Role-Based Access Control (RBAC)
- Email notification support
- AI-generated appointment summaries
- Background reminder jobs using Cron
- Prevention of double bookings
- RESTful API architecture
- Modular service-based backend structure

---

## 🛠 Technology Stack

### Backend

- Node.js
- Express.js

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Database

- SQLite
- better-sqlite3

### Authentication

- JSON Web Token (JWT)
- bcryptjs

### Additional Packages

- Nodemailer / Resend
- node-cron
- dotenv
- better-sqlite3
- jsonwebtoken

---

## 📁 Project Structure

```text
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

## 🚀 Installation

### Clone the Repository

```bash
git clone https://github.com/pranjul075/-healthcare-appointment-manager.git
```

### Navigate to the Project Directory

```bash
cd -healthcare-appointment-manager
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

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

RESEND_API_KEY=

ANTHROPIC_API_KEY=
```

### Start the Application

```bash
npm start
```

Open your browser:

```text
http://localhost:4000
```

---

## 🌐 Deployment

The application is deployed on Render.

**Live Application:**

https://healthcare-appointment-manager-p6m6.onrender.com

Deployment includes:

- Backend hosting on Render
- SQLite database support
- Environment variable management
- Background reminder services
- Email notification integration

---

## 👥 User Workflow

### Administrator

1. Login using administrator credentials.
2. Add and manage doctor accounts.
3. Monitor appointments.
4. Handle doctor availability and leave requests.

### Patient

1. Register an account.
2. Login securely.
3. Browse doctors.
4. Select available slots.
5. Book appointments.
6. Manage existing bookings.

### Doctor

1. Login to the doctor dashboard.
2. View daily appointments.
3. Review patient information.
4. Add consultation notes.
5. Generate prescriptions.
6. Complete consultations.

---

## 🔌 API Overview

### Authentication APIs

- Register User
- Login User
- Get Current User

### Admin APIs

- Add Doctor
- Update Doctor
- View Doctors
- View Appointments

### Patient APIs

- List Doctors
- View Available Slots
- Book Appointment
- Cancel Appointment
- Reschedule Appointment

### Doctor APIs

- View Appointments
- Complete Consultation
- Manage Leave Requests

---

## 🗄 Database

The project uses SQLite as its primary database.

Features include:

- Automatic database creation
- Automatic table initialization
- Lightweight storage solution
- Easy deployment without external database dependencies

---

## 🔒 Security Features

- JWT Authentication
- Password Hashing with bcrypt
- Protected API Routes
- Role-Based Authorization
- Input Validation
- Duplicate Appointment Prevention
- Secure Session Management

---

## 🎨 Design Highlights

- Clean and modular folder structure
- Service-oriented architecture
- RESTful API design principles
- Lightweight deployment
- Easy maintenance
- Separation of concerns
- Scalable backend organization

---

## 🚀 Future Improvements

Planned enhancements include:

- Online payment gateway integration
- Video consultation support
- Medical record uploads
- Advanced doctor search filters
- SMS notifications
- Multi-clinic support
- Analytics and reporting dashboard
- Mobile application support
- Real-time appointment notifications

---

## 📸 Screenshots

Add screenshots here:

```text
/public/screenshots/home.png
/public/screenshots/admin-dashboard.png
/public/screenshots/doctor-dashboard.png
/public/screenshots/patient-dashboard.png
```

---

## 👨‍💻 Author

### Pranjul Katiyar

Bachelor of Technology (Computer Science)

Healthcare Appointment & Follow-up Manager was developed as an academic full-stack project to demonstrate practical implementation of:

- Authentication and Authorization
- Role-Based Access Control (RBAC)
- REST API Development
- Database Management
- Appointment Scheduling Systems
- Background Task Processing
- Email Notification Services
- Secure Application Design

---

## 🔗 Project Links

### 🌐 Live Demo

https://healthcare-appointment-manager-p6m6.onrender.com

### 📂 GitHub Repository

https://github.com/pranjul075/-healthcare-appointment-manager

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

Contributions, suggestions, and feedback are always welcome.

---