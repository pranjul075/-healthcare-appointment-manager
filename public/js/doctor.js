function initDoctorDashboard() {
  loadDoctorAppointments();
  loadDoctorLeaves();

  document.getElementById('doctorDateFilter').onchange = () => {
    loadDoctorAppointments(document.getElementById('doctorDateFilter').value);
  };

  document.getElementById('markLeaveBtn').onclick = async () => {
    const date = document.getElementById('leaveDate').value;
    const reason = document.getElementById('leaveReason').value;
    const msg = document.getElementById('leaveMsg');
    if (!date) {
      msg.textContent = 'Please choose a date';
      return;
    }
    try {
      const res = await API.post('/doctor/leave', { date, reason });
      msg.style.color = 'green';
      msg.textContent = `Leave recorded. ${res.affectedAppointments} appointment(s) cancelled and patients notified.`;
      loadDoctorLeaves();
    } catch (err) {
      msg.style.color = '';
      msg.textContent = err.message;
    }
  };
}

async function loadDoctorAppointments(date = '') {
  const list = document.getElementById('doctorApptList');
  list.innerHTML = 'Loading...';
  try {
    const query = date ? `?date=${date}` : '';
    const appts = await API.get('/doctor/appointments' + query);
    if (appts.length === 0) {
      list.innerHTML = '<p>No appointments found.</p>';
      return;
    }
    list.innerHTML = '';
    appts.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${a.patient_name}</h3>
        <p>${a.appt_date} at ${a.appt_time} <span class="badge ${a.status}">${a.status}</span></p>
        ${a.urgency_level ? `<p>Urgency: <span class="badge ${a.urgency_level}">${a.urgency_level}</span></p>` : ''}
        <p>Symptoms: ${a.symptoms || '-'}</p>
        ${a.chief_complaint ? `<p>Chief complaint: ${a.chief_complaint}</p>` : ''}
        ${a.suggested_questions && a.suggested_questions.length ? `<p>Suggested questions: ${a.suggested_questions.join(' | ')}</p>` : ''}
        <div class="card-actions"></div>
      `;
      if (a.status === 'confirmed') {
        const actions = card.querySelector('.card-actions');
        const completeBtn = document.createElement('button');
        completeBtn.textContent = 'Complete visit';
        completeBtn.onclick = () => openCompleteForm(a, card);
        actions.appendChild(completeBtn);
      }
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}

function openCompleteForm(appt, card) {
  const existingForm = card.querySelector('.complete-form');
  if (existingForm) {
    existingForm.remove();
    return;
  }
  const form = document.createElement('form');
  form.className = 'complete-form';
  form.style.marginTop = '12px';
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '10px';
  form.innerHTML = `
    <label>Clinical notes<textarea rows="3" required></textarea></label>
    <label>Prescription (one per line: medicine, times per day, duration in days)
      <textarea rows="3" placeholder="Paracetamol, 2, 5"></textarea>
    </label>
    <button type="submit">Save and send summary</button>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const notes = form.querySelectorAll('textarea')[0].value;
    const rawPrescription = form.querySelectorAll('textarea')[1].value;
    const prescription = rawPrescription
      .split('\n')
      .map((line) => line.split(',').map((p) => p.trim()))
      .filter((parts) => parts[0])
      .map((parts) => ({
        medicine_name: parts[0],
        times_per_day: parts[1] || 1,
        duration_days: parts[2] || 3
      }));

    try {
      await API.put(`/doctor/appointments/${appt.id}/complete`, { notes, prescription });
      showToast('Visit completed and summary sent to patient');
      loadDoctorAppointments(document.getElementById('doctorDateFilter').value);
    } catch (err) {
      showToast(err.message, true);
    }
  });
  card.appendChild(form);
}

async function loadDoctorLeaves() {
  const list = document.getElementById('leaveList');
  list.innerHTML = 'Loading...';
  try {
    const leaves = await API.get('/doctor/leaves');
    if (leaves.length === 0) {
      list.innerHTML = '<p>No leave recorded.</p>';
      return;
    }
    list.innerHTML = '';
    leaves.forEach((l) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h3>${l.leave_date}</h3><p>${l.reason || ''}</p>`;
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p>${err.message}</p>`;
  }
}
