const API_BASE = 'http://localhost:4000';
const API = `${API_BASE}/api/contributions`;

function getToken() { return localStorage.getItem('token') || null; }
function getAuthHeadersForm() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}
function getAuthHeadersJSON() {
  const t = getToken();
  return t
    ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function ensureAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

if (
  location.pathname.endsWith('index.html') ||
  location.pathname === '/' ||
  location.pathname.endsWith('/')
) {
  if (!ensureAuth()) throw '';

  document.getElementById('navUser').textContent = localStorage.getItem('username') || 'You';
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
  });

  document.getElementById('contribForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value.trim());
  formData.append('category', document.getElementById('category').value);
  formData.append('link', document.getElementById('link').value.trim());
  formData.append('description', document.getElementById('description').value.trim());
  formData.append('date', document.getElementById('date').value);
  const fileInput = document.getElementById('screenshot');
  if (fileInput.files.length > 0) {
    formData.append('screenshot', fileInput.files[0]);
  }

  // Check if editing
  const id = document.getElementById('contribId').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API}/${id}` : API;

  try {
    const res = await fetch(url, {
      method: method,
      headers: getAuthHeadersForm(),
      body: formData,
    });
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = {};
    }
    if (!res.ok) throw new Error(data.error || 'Failed to save');
    alert('✅ Saved successfully!');
    resetForm();
    fetchList();
  } catch (err) {
    alert('❌ Save failed: ' + err.message);
  }
});

  document.getElementById('resetBtn').addEventListener('click', resetForm);

  document.getElementById('exportBtn').addEventListener('click', async () => {
    const token = getToken();
    if (!token) {
      alert('You must be logged in to export data.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/contributions/export/csv`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        alert('Error: ' + (err.error || 'Failed to export CSV'));
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contributions.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('CSV export failed.');
    }
  });

  fetchList();
}

async function fetchList() {
  try {
    const res = await fetch(API, { headers: getAuthHeadersJSON() });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    const list = await res.json();
    renderTable(list);
  } catch (err) {
    alert('⚠️ Error loading data: ' + err.message);
  }
}

function renderTable(list) {
  const tbody = document.querySelector('#contribTable tbody');
  tbody.innerHTML = '';
  list.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${item.link ? `<a class="link" href="${item.link}" target="_blank">Open</a>` : ''}</td>
      <td>${
        item.screenshot
          ? `<a href="${API_BASE}${item.screenshot}" target="_blank">View Screenshot</a>`
          : '—'
      }</td>
      <td>${item.date ? new Date(item.date).toISOString().slice(0, 10) : ''}</td>
      <td>
        <button class="action-btn action-edit" onclick='loadEdit("${item._id}")'>Edit</button>
        <button class="action-btn action-delete" onclick='del("${item._id}")'>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

function resetForm() {
  document.getElementById('contribId').value = '';
  document.getElementById('title').value = '';
  document.getElementById('category').value = '';
  document.getElementById('link').value = '';
  document.getElementById('description').value = '';
  document.getElementById('date').value = '';
  document.getElementById('screenshot').value = '';
  document.getElementById('saveBtn').textContent = 'Save';
}

async function loadEdit(id) {
  const res = await fetch(`${API}/${id}`, { headers: getAuthHeadersJSON() });
  const data = await res.json();
  if (!data) return alert('Not found');
  document.getElementById('contribId').value = data._id;
  document.getElementById('title').value = data.title;
  document.getElementById('category').value = data.category;
  document.getElementById('link').value = data.link;
  document.getElementById('description').value = data.description;
  document.getElementById('date').value = data.date
    ? new Date(data.date).toISOString().slice(0, 10)
    : '';
  document.getElementById('saveBtn').textContent = 'Update';
}

async function del(id) {
  if (!confirm('Delete this contribution?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeadersJSON() });
  fetchList();
}
