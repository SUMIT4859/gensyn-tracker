// auth.js (frontend) - place at repo root next to login.html/register.html
const API_BASE = ''; // keep empty so fetches are relative

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, payload: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, payloadText: text }; }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') || {}).value?.trim();
      const password = (document.getElementById('password') || {}).value;
      if (!email || !password) return alert('Please enter email and password');

      const { ok, payload, payloadText, status } = await postJSON('/api/auth/login', { email, password });
      if (!ok) {
        const msg = (payload && payload.error) || payloadText || `Login failed (${status})`;
        return alert(msg);
      }

      localStorage.setItem('token', payload.token);
      localStorage.setItem('username', payload.username || email.split('@')[0]);
      window.location.href = '/index.html';
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('username') || {}).value?.trim();
      const email = (document.getElementById('email') || {}).value?.trim();
      const password = (document.getElementById('password') || {}).value;
      if (!username || !email || !password) return alert('Please fill all fields');

      const { ok, payload, payloadText, status } = await postJSON('/api/auth/register', { username, email, password });
      if (!ok) {
        const msg = (payload && payload.error) || payloadText || `Register failed (${status})`;
        return alert(msg);
      }

      if (payload && payload.token) {
        localStorage.setItem('token', payload.token);
        localStorage.setItem('username', payload.username || username);
        window.location.href = '/index.html';
      } else {
        alert('Registered successfully — please login');
        window.location.href = '/login.html';
      }
    });
  }
});
