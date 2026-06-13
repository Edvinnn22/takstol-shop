let adminPassword = sessionStorage.getItem('adminToken') || '';

function setPassword() {
  const input = document.getElementById('admin-password');
  const status = document.getElementById('auth-status');
  const pw = input.value.trim();
  if (!pw) return;

  fetch('/admin/api/verify', {
    headers: { 'x-admin-token': pw }
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        adminPassword = pw;
        sessionStorage.setItem('adminToken', pw);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        loadProducts();
      } else {
        status.textContent = 'Fel lösenord.';
        status.style.color = '#dc2626';
      }
    })
    .catch(() => {
      status.textContent = 'Kunde inte ansluta.';
      status.style.color = '#dc2626';
    });
}

// Auto-login if token exists
if (adminPassword) {
  fetch('/admin/api/verify', { headers: { 'x-admin-token': adminPassword } })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        loadProducts();
      } else {
        sessionStorage.removeItem('adminToken');
        adminPassword = '';
      }
    });
}

// --- DROP ZONE ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone?.addEventListener('click', () => fileInput?.click());
dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone--over'); });
dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--over'));
dropZone?.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drop-zone--over');
  handleFiles([...e.dataTransfer.files]);
});
fileInput?.addEventListener('change', () => handleFiles([...fileInput.files]));

async function handleFiles(files) {
  const pdfs = files.filter(f => f.type === 'application/pdf');
  if (!pdfs.length) return;

  const resultsSection = document.getElementById('results');
  const resultsList = document.getElementById('results-list');
  const resultsCount = document.getElementById('results-count');

  resultsSection.style.display = 'block';
  resultsCount.textContent = `${pdfs.length} fil${pdfs.length > 1 ? 'er' : ''}`;

  for (const file of pdfs) {
    const row = document.createElement('div');
    row.className = 'result-row result-row--loading';
    row.innerHTML = `
      <div class="result-row__name">${file.name}</div>
      <div class="result-row__status">Extraherar…</div>
    `;
    resultsList.appendChild(row);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/admin/api/extract', {
        method: 'POST',
        headers: { 'x-admin-token': adminPassword },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel vid extrahering');

      // Show confirmation card
      row.className = 'result-row result-row--confirm';
      row.innerHTML = buildConfirmCard(data.extracted, data.stagingKey, file.name);

    } catch (err) {
      row.className = 'result-row result-row--error';
      row.innerHTML = `
        <div class="result-row__name">${file.name}</div>
        <div class="result-row__status result-row__status--error">⚠ ${err.message}</div>
      `;
    }
  }
}

function buildConfirmCard(extracted, stagingKey, fileName) {
  return `
    <div class="confirm-card">
      <div class="confirm-card__header">
        <span class="confirm-card__filename">${fileName}</span>
        <span class="confirm-card__art">${extracted.art_nr}</span>
      </div>
      <div class="confirm-card__specs">
        <span>Spännvidd: <strong>${extracted.spannvidd_mm} mm</strong></span>
        <span>Vikt: <strong>${extracted.vikt_kg} kg</strong></span>
        <span>Takvinkel: <strong>${extracted.takvinkel_grader}°</strong></span>
        <span>Säkerhetsklass: <strong>${extracted.sakerhetsklass}</strong></span>
        <span>Klimatklass: <strong>${extracted.klimatklass}</strong></span>
        <span>Typ: <strong>${extracted.takstol_typ}</strong></span>
      </div>
      <div class="confirm-card__price-row">
        <label class="confirm-card__label" for="price-${extracted.art_nr}">Pris (kr/st)</label>
        <input
          class="admin-input confirm-card__price-input"
          id="price-${extracted.art_nr}"
          type="number"
          placeholder="t.ex. 4 500"
          min="0"
          step="100"
        />
      </div>
      <div class="confirm-card__actions">
        <button
          class="admin-btn admin-btn--primary confirm-save"
          data-extracted='${JSON.stringify(extracted)}'
          data-staging="${stagingKey}"
        >
          Spara produkt
        </button>
        <button class="admin-btn confirm-cancel">Avbryt</button>
      </div>
      <div class="confirm-card__feedback"></div>
    </div>
  `;
}

// Event delegation for confirm/cancel
document.getElementById('results-list')?.addEventListener('click', async (e) => {
  if (e.target.classList.contains('confirm-save')) {
    const btn = e.target;
    const extracted = JSON.parse(btn.dataset.extracted);
    const stagingKey = btn.dataset.staging;
    const card = btn.closest('.confirm-card');
    const priceInput = card.querySelector('.confirm-card__price-input');
    const feedback = card.querySelector('.confirm-card__feedback');
    const pris_kr = priceInput.value ? parseFloat(priceInput.value) : null;

    btn.disabled = true;
    btn.textContent = 'Sparar…';

    try {
      const res = await fetch('/admin/api/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminPassword,
        },
        body: JSON.stringify({ extracted, stagingKey, pris_kr }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      btn.closest('.result-row').className = 'result-row result-row--success';
      btn.closest('.result-row').innerHTML = `
        <div class="result-row__name">${extracted.art_nr}</div>
        <div class="result-row__status result-row__status--success">✓ Sparad${pris_kr ? ` · ${pris_kr.toLocaleString('sv-SE')} kr/st` : ''}</div>
      `;
      loadProducts();
    } catch (err) {
      feedback.textContent = `⚠ ${err.message}`;
      feedback.style.color = '#dc2626';
      btn.disabled = false;
      btn.textContent = 'Spara produkt';
    }
  }

  if (e.target.classList.contains('confirm-cancel')) {
    e.target.closest('.result-row').remove();
  }
});

// --- PRODUCTS LIST ---
async function loadProducts() {
  const res = await fetch('/api/products', { headers: { 'x-admin-token': adminPassword } });
  const products = await res.json();

  const list = document.getElementById('product-list');
  if (!list) return;

  list.innerHTML = products.map(p => `
    <div class="product-row" data-art="${p.art_nr}">
      <span class="product-row__art">${p.art_nr}</span>
      <span class="product-row__name">${p.namn}</span>
      <div class="product-row__price">
        <input
          class="admin-input admin-input--sm"
          type="number"
          value="${p.pris_kr || ''}"
          placeholder="—"
          data-art="${p.art_nr}"
        />
        <button class="admin-btn admin-btn--sm price-save" data-art="${p.art_nr}">Spara</button>
      </div>
      <button class="admin-btn admin-btn--danger admin-btn--sm product-delete" data-art="${p.art_nr}">Ta bort</button>
    </div>
  `).join('');

  list.querySelectorAll('.price-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const art = btn.dataset.art;
      const input = list.querySelector(`input[data-art="${art}"]`);
      const pris_kr = input.value ? parseFloat(input.value) : null;

      await fetch(`/admin/api/product/${art}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminPassword },
        body: JSON.stringify({ pris_kr }),
      });

      btn.textContent = '✓';
      setTimeout(() => btn.textContent = 'Spara', 1500);
    });
  });

  list.querySelectorAll('.product-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Ta bort ${btn.dataset.art}?`)) return;
      await fetch(`/admin/api/product/${btn.dataset.art}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminPassword },
      });
      loadProducts();
    });
  });
}

// Password input enter key
document.getElementById('admin-password')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setPassword();
});