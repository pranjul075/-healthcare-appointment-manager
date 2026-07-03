let selectedDoctor = null;
let selectedSlot = null;

function initPatientDashboard() {
  loadDoctors();
  loadPatientAppointments();

  document.getElementById('searchDoctorsBtn').onclick = () => {
    loadDoctors(document.getElementById('specSearch').value);
  };
}

async function loadDoctors(spec = '') {
  const list = document.getElementById('doctorList');
  list.innerHTML = 'Loading...';
  try {
    const query = spec ? `?specialisation=${encodeURIComponent(spec)}` : '';
    const doctors = await API.get('/patient/doctors' + query);
    if (doctors.length === 0) {
      list.innerHTML = '<p>No doctors found.</p>';
      return;
    }
    list.innerHTML = '';
    doctors.forEach((doc) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>Dr. ${doc.name}</h3>
        <p>${doc.specialisation}</p>
        <p>Hours: ${doc.work_start} - ${doc.work_end}</p>
        <div class="card-actions"><button>Book appointment</button></div>
      `;
      card.querySelector('button').onclick = () => openBooking(doc);
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}

function openBooking(doctor) {
  selectedDoctor = doctor;
  selectedSlot = null;
  document.getElementById('bookingDoctorName').textContent = `Book with Dr. ${doctor.name}`;
  document.getElementById('slotList').innerHTML = '';
  document.getElementById('symptomForm').classList.add('hidden');
  document.getElementById('bookingMsg').textContent = '';

  document.querySelectorAll('.dashboard.hidden, .dashboard').forEach(() => {});
  document.querySelectorAll('#patientScreen .view').forEach((v) => v.classList.remove('active'));
  document.getElementById('bookingPanel').classList.add('active');

  const dateInput = document.getElementById('bookingDate');
  dateInput.value = new Date().toISOString().slice(0, 10);
  dateInput.min = new Date().toISOString().slice(0, 10);
  dateInput.onchange = loadSlots;
  loadSlots();
}

async function loadSlots() {
  const date = document.getElementById('bookingDate').value;
  const slotList = document.getElementById('slotList');
  slotList.innerHTML = 'Loading slots...';
  try {
    const data = await API.get(`/patient/doctors/${selectedDoctor.id}/slots?date=${date}`);
    if (data.onLeave) {
      slotList.innerHTML = '<p>Doctor is on leave this day.</p>';
      return;
    }
    if (data.slots.length === 0) {
      slotList.innerHTML = '<p>No slots available for this day.</p>';
      return;
    }
    slotList.innerHTML = '';
    data.slots.forEach((slot) => {
      const b = document.createElement('button');
      b.className = 'slot-btn';
      b.textContent = slot;
      b.onclick = () => {
        selectedSlot = slot;
        document.querySelectorAll('.slot-btn').forEach((s) => s.classList.remove('selected'));
        b.classList.add('selected');
        document.getElementById('symptomForm').classList.remove('hidden');
      };
      slotList.appendChild(b);
    });
  } catch (err) {
    slotList.innerHTML = `<p>${err.message}</p>`;
  }
}

document.getElementById('symptomForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const symptoms = document.getElementById('symptomInput').value;
  const msg = document.getElementById('bookingMsg');
  try {
    await API.post('/patient/appointments', {
      doctorId: selectedDoctor.id,
      date: document.getElementById('bookingDate').value,
      time: selectedSlot,
      symptoms
    });
    msg.style.color = 'green';
    msg.textContent = 'Appointment booked. A confirmation email has been sent.';
    document.getElementById('symptomInput').value = '';
    loadPatientAppointments();
  } catch (err) {
    msg.style.color = '';
    msg.textContent = err.message;
  }
});

async function loadPatientAppointments() {
  const list = document.getElementById('patientApptList');
  list.innerHTML = 'Loading...';
  try {
    const appts = await API.get('/patient/appointments');
    if (appts.length === 0) {
      list.innerHTML = '<p>You have no appointments yet.</p>';
      return;
    }
    list.innerHTML = '';
    appts.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'card';
      const questions = a.suggested_questions ? JSON.parse(a.suggested_questions) : [];
      card.innerHTML = `
        <h3>Dr. ${a.doctor_name} - ${a.specialisation}</h3>
        <p>${a.appt_date} at ${a.appt_time} <span class="badge ${a.status}">${a.status}</span></p>
        ${a.urgency_level ? `<p>Urgency: <span class="badge ${a.urgency_level}">${a.urgency_level}</span></p>` : ''}
        ${questions.length ? `<p>Suggested questions: ${questions.join(' | ')}</p>` : ''}
        ${a.post_visit_summary ? `<p><strong>Visit summary:</strong> ${a.post_visit_summary}</p>` : ''}
        <div class="card-actions"></div>
      `;
      if (a.status === 'confirmed') {
        const actions = card.querySelector('.card-actions');
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = async () => {
          try {
            await API.put(`/patient/appointments/${a.id}/cancel`);
            showToast('Appointment cancelled');
            loadPatientAppointments();
          } catch (err) {
            showToast(err.message, true);
          }
        };
        actions.appendChild(cancelBtn);
      }
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}
