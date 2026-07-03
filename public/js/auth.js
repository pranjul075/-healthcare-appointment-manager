document.querySelectorAll('[data-open-auth]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.openAuth;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('authScreen').scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('otpForm').classList.add('hidden');
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await API.post('/auth/login', { email, password });
    localStorage.setItem('clinic_token', data.token);
    await bootApp();
  } catch (err) {
    document.getElementById('loginMsg').textContent = err.message;
  }
});

let pendingRegEmail = null;
let pendingRegPassword = null;

function showOtpStep(email) {
  pendingRegEmail = email;
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('otpForm').classList.remove('hidden');
  document.getElementById('otpEmailLabel').textContent = email;
  document.getElementById('otpCode').value = '';
  document.getElementById('otpMsg').textContent = '';
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const msg = document.getElementById('regMsg');
  try {
    const data = await API.post('/auth/register/request-otp', { name, email, phone, password });
    msg.style.color = 'green';
    msg.textContent = data.devCode
      ? `Code sent. No email configured yet, so here it is for testing: ${data.devCode}`
      : 'Verification code sent to your email.';
    pendingRegPassword = password;
    showOtpStep(email);
  } catch (err) {
    msg.style.color = '';
    msg.textContent = err.message;
  }
});

document.getElementById('otpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('otpCode').value;
  const msg = document.getElementById('otpMsg');
  try {
    const data = await API.post('/auth/register/verify-otp', { email: pendingRegEmail, code });
    localStorage.setItem('clinic_token', data.token);
    await bootApp();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.getElementById('resendOtpBtn').addEventListener('click', async () => {
  const msg = document.getElementById('otpMsg');
  try {
    const data = await API.post('/auth/register/request-otp', {
      name: document.getElementById('regName').value,
      email: pendingRegEmail,
      phone: document.getElementById('regPhone').value,
      password: pendingRegPassword
    });
    msg.style.color = 'green';
    msg.textContent = data.devCode ? `New code: ${data.devCode}` : 'A new code has been sent.';
  } catch (err) {
    msg.style.color = '';
    msg.textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('clinic_token');
  location.reload();
});
