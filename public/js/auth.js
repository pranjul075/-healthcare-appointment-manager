document.querySelectorAll('[data-open-auth]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.openAuth;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
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

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const msg = document.getElementById('regMsg');
  try {
    const data = await API.post('/auth/register', { name, email, phone, password });
    localStorage.setItem('clinic_token', data.token);
    await bootApp();
  } catch (err) {
    msg.style.color = '';
    msg.textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('clinic_token');
  location.reload();
});
