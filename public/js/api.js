const API = {
  base: '/api',

  token() {
    return localStorage.getItem('clinic_token');
  },

  async request(path, options = {}) {
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = this.token();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(this.base + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
  }
};

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}
