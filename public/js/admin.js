function initAdminDashboard() {
  loadDoctorDirectory();
  loadAdminAppointments();

  document.getElementById('createDoctorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('docMsg');
    try {
      await API.post('/admin/doctors', {
        name: document.getElementById('docName').value,
        email: document.getElementById('docEmail').value,
        password: document.getElementById('docPassword').value,
        specialisation: document.getElementById('docSpec').value,
        workStart: document.getElementById('docStart').value,
        workEnd: document.getElementById('docEnd').value,
        slotMinutes: Number(document.getElementById('docSlot').value) || 30
      });
      msg.style.color = 'green';
      msg.textContent = 'Doctor account created';
      e.target.reset();
      loadDoctorDirectory();
    } catch (err) {
      msg.style.color = '';
      msg.textContent = err.message;
    }
  });
}

async function loadDoctorDirectory() {
  const list = document.getElementById('doctorDirectory');
  list.innerHTML = 'Loading...';
  try {
    const doctors = await API.get('/admin/doctors');
    if (doctors.length === 0) {
      list.innerHTML = '<p>No doctors added yet.</p>';
      return;
    }
    list.innerHTML = '';
    doctors.forEach((d) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>Dr. ${d.name}</h3>
        <p>${d.specialisation} - ${d.email}</p>
        <p>Hours: ${d.work_start} - ${d.work_end}, slot ${d.slot_minutes} min</p>
        <div class="row" style="margin-top:10px">
          <input type="date" class="leave-date-input">
          <button class="mark-leave-btn">Mark leave</button>
        </div>
      `;
      card.querySelector('.mark-leave-btn').onclick = async () => {
        const date = card.querySelector('.leave-date-input').value;
        if (!date) return showToast('Choose a date first', true);
        try {
          const res = await API.post(`/admin/doctors/${d.id}/leave`, { date });
          showToast(`Leave marked. ${res.affectedAppointments} appointment(s) cancelled.`);
        } catch (err) {
          showToast(err.message, true);
        }
      };
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}

async function loadAdminAppointments() {
  const list = document.getElementById('adminApptList');
  list.innerHTML = 'Loading...';
  try {
    const appts = await API.get('/admin/appointments');
    if (appts.length === 0) {
      list.innerHTML = '<p>No appointments yet.</p>';
      return;
    }
    list.innerHTML = '';
    appts.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${a.patient_name} with Dr. ${a.doctor_name}</h3>
        <p>${a.appt_date} at ${a.appt_time} <span class="badge ${a.status}">${a.status}</span></p>
        <p>${a.specialisation}</p>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}
