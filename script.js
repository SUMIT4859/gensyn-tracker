// script.js (updated)
const API_BASE = 'https://gensyn-tracker.onrender.com';
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

/* ---------- Page init ---------- */
if (
  location.pathname.endsWith('index.html') ||
  location.pathname === '/' ||
  location.pathname.endsWith('/')
) {
  if (!ensureAuth()) return;

  const navUser = document.getElementById('navUser');
  if (navUser) navUser.textContent = localStorage.getItem('username') || 'You';

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
  });

  const form = document.getElementById('contribForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!getToken()) { window.location.href = 'login.html'; return; }

      const formData = new FormData();
      formData.append('title', document.getElementById('title').value.trim());
      formData.append('category', document.getElementById('category').value);
      formData.append('link', document.getElementById('link').value.trim());
      formData.append('description', document.getElementById('description').value.trim());
      formData.append('date', document.getElementById('date').value);

      const fileInput = document.getElementById('screenshot');
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        formData.append('screenshot', fileInput.files[0]);
      }

      const id = document.getElementById('contribId').value;
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API}/${id}` : API;

      try {
        const res = await fetch(url, {
          method,
          headers: getAuthHeadersForm(), // do NOT set Content-Type for FormData
          body: formData
        });

        // If JSON, parse; otherwise keep empty object
        const ct = res.headers.get('content-type') || '';
        let payload = {};
        if (ct.includes('application/json')) payload = await res.json();

        if (!res.ok) {
          const errMsg = payload && payload.error ? payload.error : `Save failed (${res.status})`;
          throw new Error(errMsg);
        }

        alert('✅ Saved successfully!');
        resetForm();
        fetchList();
      } catch (err) {
        console.error('Save error:', err);
        alert('❌ Save failed: ' + (err.message || 'Unknown error'));
      }
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetForm);

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const token = getToken();
      if (!token) { alert('You must be logged in to export data.'); return; }
      try {
        const response = await fetch(`${API_BASE}/api/contributions/export/csv`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          let err;
          try { err = await response.json(); } catch(e) { err = { error: 'Export failed' }; }
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
        console.error('CSV export failed:', err);
        alert('CSV export failed: ' + (err.message || 'Network error'));
      }
    });
  }

  // initial load
  fetchList();
}

/* ---------- fetch & render ---------- */
async function fetchList() {
  try {
    const res = await fetch(API, { headers: getAuthHeadersJSON() });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Failed to load (${res.status})`);
    }
    const list = await res.json();
    renderTable(list);
  } catch (err) {
    console.error('Fetch list error:', err);
    alert('⚠️ Error loading data: ' + (err.message || 'Network error'));
  }
}

function renderTable(list) {
  const tbody = document.querySelector('#contribTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach((item) => {
    // build screenshot URL safely
    let screenshotHtml = '—';
    if (item.screenshot) {
      // ensure there's a leading slash
      const path = item.screenshot.startsWith('/') ? item.screenshot : `/${item.screenshot}`;
      const safeUrl = `${API_BASE}${path}`;
      screenshotHtml = `<a href="${encodeURI(safeUrl)}" target="_blank">View Screenshot</a>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${item.link ? `<a class="link" href="${encodeURI(item.link)}" target="_blank">Open</a>` : ''}</td>
      <td>${screenshotHtml}</td>
      <td>${item.date ? new Date(item.date).toISOString().slice(0,10) : ''}</td>
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
  const ids = ['contribId','title','category','link','description','date','screenshot'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const saveBtn = document.getElementById('saveBtn'); if (saveBtn) saveBtn.textContent = 'Save';
}

async function loadEdit(id) {
  try {
    const res = await fetch(`${API}/${id}`, { headers: getAuthHeadersJSON() });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Fetch failed (${res.status})`);
    }
    const data = await res.json();
    if (!data) return alert('Not found');
    document.getElementById('contribId').value = data._id;
    document.getElementById('title').value = data.title || '';
    document.getElementById('category').value = data.category || '';
    document.getElementById('link').value = data.link || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('date').value = data.date ? new Date(data.date).toISOString().slice(0,10) : '';
    const saveBtn = document.getElementById('saveBtn'); if (saveBtn) saveBtn.textContent = 'Update';
  } catch (err) {
    console.error('Load edit error:', err);
    alert('Could not load contribution: ' + (err.message || 'Unknown'));
  }
}

async function del(id) {
  if (!confirm('Delete this contribution?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeadersJSON() });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Delete failed (${res.status})`);
    }
    fetchList();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Delete failed: ' + (err.message || 'Unknown'));
  }
}
