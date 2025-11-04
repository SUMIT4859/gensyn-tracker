// script.js (frontend)
const API_BASE = ''; // relative
const API = `${API_BASE}/api/contributions`;

function getToken(){ return localStorage.getItem('token') || null; }
function getAuthHeadersForm(){ const t = getToken(); return t ? { 'Authorization': `Bearer ${t}` } : {}; }
function getAuthHeadersJSON(){ const t = getToken(); return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }; }

function ensureAuth(){ if(!getToken()){ window.location.href = '/login.html'; return false; } return true; }

if(location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')){
  if(!ensureAuth()) throw '';

  const navUser = document.getElementById('navUser');
  if(navUser) navUser.textContent = localStorage.getItem('username') || 'You';

  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=> {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
  });

  document.getElementById('contribForm').addEventListener('submit', async (e)=> {
    e.preventDefault();
    if(!getToken()){ window.location.href = '/login.html'; return; }

    const id = document.getElementById('contribId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('category', document.getElementById('category').value);
    formData.append('link', document.getElementById('link').value.trim());
    formData.append('description', document.getElementById('description').value.trim());
    formData.append('date', document.getElementById('date').value);
    const fileInput = document.getElementById('screenshot');
    if(fileInput && fileInput.files.length) formData.append('screenshot', fileInput.files[0]);

    const url = id ? `${API}/${id}` : API;
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: getAuthHeadersForm(), body: formData });
      const ct = res.headers.get('content-type') || '';
      let payload = {};
      if(ct.includes('application/json')) payload = await res.json();
      if(!res.ok) throw new Error(payload.error || `Save failed (${res.status})`);
      alert('Saved successfully!');
      resetForm();
      fetchList();
    } catch (err) {
      console.error(err);
      alert('Save failed: ' + (err.message || 'Unknown'));
    }
  });

  const resetBtn = document.getElementById('resetBtn');
  if(resetBtn) resetBtn.addEventListener('click', resetForm);

  const exportBtn = document.getElementById('exportBtn');
  if(exportBtn) exportBtn.addEventListener('click', async ()=> {
    const token = getToken();
    if(!token) { alert('Login required'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/contributions/export/csv`, { method:'GET', headers: { Authorization: `Bearer ${token}` }});
      if(!res.ok) { const e = await res.json().catch(()=>({error:'Export failed'})); throw new Error(e.error || 'Export failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'contributions.csv'; document.body.appendChild(a); a.click(); a.remove();
    } catch (err) { console.error(err); alert('Export failed'); }
  });

  fetchList();
}

async function fetchList(){
  try {
    const res = await fetch(API, { headers: getAuthHeadersJSON() });
    if(res.status === 401){ localStorage.removeItem('token'); window.location.href='/login.html'; return; }
    if(!res.ok) { const t = await res.text(); throw new Error(t || `Failed (${res.status})`); }
    const list = await res.json();
    renderTable(list);
  } catch (err) {
    console.error(err);
    alert('Error loading data: ' + (err.message || 'Network'));
  }
}

function renderTable(list){
  const tbody = document.querySelector('#contribTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  list.forEach(item => {
    let screenshotHtml = '—';
    if(item.screenshot) {
      const p = item.screenshot.startsWith('/') ? item.screenshot : `/${item.screenshot}`;
      screenshotHtml = `<a href="${encodeURI(p)}" target="_blank">View Screenshot</a>`;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${item.link ? `<a href="${encodeURI(item.link)}" target="_blank">Open</a>` : ''}</td>
      <td>${screenshotHtml}</td>
      <td>${item.date? escapeHtml(item.date) : ''}</td>
      <td>
        <button onclick='loadEdit("${item._id}")'>Edit</button>
        <button onclick='del("${item._id}")'>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function resetForm(){
  ['contribId','title','category','link','description','date','screenshot'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='';});
  const btn = document.getElementById('saveBtn'); if(btn) btn.textContent='Save';
}

// --- loadEdit: load a single contribution into the form for updating
async function loadEdit(id) {
  try {
    if (!id) return alert('Invalid id');
    // show a small visual while loading (optional)
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Loading...'; }

    const res = await fetch(`${API}/${encodeURIComponent(id)}`, { headers: getAuthHeadersJSON() });
    if (res.status === 401) {
      // token problem
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login.html';
      return;
    }
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      throw new Error(text || `Failed to load (${res.status})`);
    }
    const data = await res.json();

    document.getElementById('contribId').value = data._id || '';
    document.getElementById('title').value = data.title || '';
    document.getElementById('category').value = data.category || '';
    document.getElementById('link').value = data.link || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('date').value = data.date ? new Date(data.date).toISOString().slice(0,10) : '';
    if (saveBtn) saveBtn.textContent = 'Update'; // user sees Update
    if (saveBtn) saveBtn.disabled = false;
  } catch (err) {
    console.error('loadEdit error:', err);
    alert('Could not load contribution: ' + (err.message || 'Unknown'));
    const saveBtn = document.getElementById('saveBtn'); if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
  }
}

// --- del: delete a contribution with confirmation
async function del(id) {
  if (!id) return alert('Invalid id');
  if (!confirm('Delete this contribution?')) return;
  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeadersJSON()
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login.html';
      return;
    }

    if (!res.ok) {
      // try to read JSON body for error message
      let body;
      try { body = await res.json(); } catch(e){ body = await res.text().catch(()=>null); }
      const msg = (body && (body.error || body.message)) || `Delete failed (${res.status})`;
      throw new Error(msg);
    }

    // success -> reload list
    fetchList();
  } catch (err) {
    console.error('delete error:', err);
    alert('Delete failed: ' + (err.message || 'Unknown'));
  }
}
