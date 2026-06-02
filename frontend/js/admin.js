let password = sessionStorage.getItem('admin-token') || '';
let uploadCount = 0;

// ── INIT ON LOAD ──────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  if (password) showDashboard();
});

// ── AUTH ──────────────────────────────────────────────────

async function setPassword() {
  password = document.getElementById('admin-password').value;
  const statusEl = document.getElementById('auth-status');

  const res = await fetch('/admin/api/verify', {
    method: 'POST',
    headers: { 'x-admin-token': password }
  });

  if (res.ok) {
    sessionStorage.setItem('admin-token', password);
    showDashboard();
  } else {
    password = '';
    statusEl.textContent = 'Fel lösenord';
    statusEl.style.color = 'var(--color-error)';
    document.getElementById('admin-password').value = '';
  }
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
}

document.getElementById('admin-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setPassword();
});

// ── DROP ZONE ─────────────────────────────────────────────

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer.files));
});

fileInput.addEventListener('change', () => {
  handleFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

function handleFiles(files) {
  files.filter(f => f.name.endsWith('.pdf')).forEach(uploadFile);
}

// ── UPLOAD ────────────────────────────────────────────────

function updateCount(delta) {
  uploadCount += delta;
  const el = document.getElementById('results-count');
  if (el) el.textContent = `${uploadCount} fil${uploadCount !== 1 ? 'er' : ''}`;
}

async function uploadFile(file) {
  const resultsList = document.getElementById('results-list');
  document.getElementById('results').style.display = 'flex';

  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-card__left">
      <div class="result-card__file-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="result-card__info">
        <div class="result-card__name">${file.name}</div>
        <div class="result-card__meta">Bearbetar…</div>
      </div>
    </div>
    <div class="result-card__right">
      <span class="result-card__status result-card__status--loading">Laddar upp</span>
    </div>
  `;
  resultsList.prepend(card);
  updateCount(1);

  try {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch('/admin/api/upload', {
      method: 'POST',
      headers: { 'x-admin-token': password },
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      card.querySelector('.result-card__meta').textContent =
        `${data.product.art_nr} · ${data.product.spannvidd_mm} mm · ${data.product.vikt_kg} kg`;

      const statusEl = card.querySelector('.result-card__status');
      statusEl.className = 'result-card__status result-card__status--success';
      statusEl.textContent = 'Tillagd';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'admin-btn admin-btn--danger';
      deleteBtn.textContent = 'Ta bort';
      deleteBtn.onclick = async () => {
        if (!confirm(`Ta bort ${data.product.art_nr}?`)) return;
        const delRes = await fetch(`/admin/api/product/${data.product.art_nr}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': password }
        });
        if ((await delRes.json()).success) {
          card.remove();
          updateCount(-1);
        }
      };
      card.querySelector('.result-card__right').appendChild(deleteBtn);

    } else {
      throw new Error(data.error);
    }

  } catch (err) {
    card.querySelector('.result-card__meta').textContent = err.message;
    const statusEl = card.querySelector('.result-card__status');
    statusEl.className = 'result-card__status result-card__status--error';
    statusEl.textContent = 'Fel';
  }
}