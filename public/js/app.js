let currentUser = null;

function setupNav(scope) {
  scope.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      scope.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      scope.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const target = document.getElementById(btn.dataset.view);
      if (target) target.classList.add('active');
    });
  });
}

document.querySelectorAll('.back-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const scope = btn.closest('.dashboard');
    scope.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById(btn.dataset.back).classList.add('active');
  });
});

async function bootApp() {
  const token = API.token();
  document.getElementById('authScreen').classList.toggle('hidden', !!token);
  document.getElementById('landing').classList.toggle('hidden', !!token);
  document.getElementById('guestNav').classList.toggle('hidden', !!token);

  if (!token) return;

  try {
    currentUser = await API.get('/auth/me');
  } catch (err) {
    localStorage.removeItem('clinic_token');
    document.getElementById('authScreen').classList.remove('hidden');
    return;
  }

  document.getElementById('userBox').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role;

  document.getElementById('patientScreen').classList.add('hidden');
  document.getElementById('doctorScreen').classList.add('hidden');
  document.getElementById('adminScreen').classList.add('hidden');

  if (currentUser.role === 'patient') {
    document.getElementById('patientScreen').classList.remove('hidden');
    initPatientDashboard();
  } else if (currentUser.role === 'doctor') {
    document.getElementById('doctorScreen').classList.remove('hidden');
    initDoctorDashboard();
  } else if (currentUser.role === 'admin') {
    document.getElementById('adminScreen').classList.remove('hidden');
    initAdminDashboard();
  }
}

document.querySelectorAll('.dashboard').forEach(setupNav);

bootApp();
