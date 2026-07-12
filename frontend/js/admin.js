let adminPassword = sessionStorage.getItem('adminToken') || '';

function showSection(name) {
  document.getElementById('section-upload').style.display = name === 'upload' ? 'block' : 'none';
  document.getElementById('section-products').style.display = name === 'products' ? 'block' : 'none';
  document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('sidebar__link--active'));
  document.getElementById(`nav-${name}`).classList.add('sidebar__link--active');
}

function setPassword() {
  const input = document.getElementById('admin-password');
  const status = document.getElementById('auth-status');
  const pw = input.value.trim();
  if (!pw) return;

  fetch('/admin/api/verify', {
    method: 'POST',
    headers: { 'x-admin-token': pw }
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        adminPassword = pw;
        sessionStorage.setItem('adminToken', pw);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        showSection('upload');
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
  fetch('/admin/api/verify', {
    method: 'POST',
    headers: { 'x-admin-token': adminPassword }
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        showSection('upload');
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

      row.className = 'result-row result-row--confirm';
      row.innerHTML = await buildConfirmCard(data.extracted, data.stagingKey, file.name);

    } catch (err) {
      row.className = 'result-row result-row--error';
      row.innerHTML = `
        <div class="result-row__name">${file.name}</div>
        <div class="result-row__status result-row__status--error">⚠ ${err.message}</div>
      `;
    }
  }
}

async function buildConfirmCard(extracted, stagingKey, fileName) {
  // Check if product already exists
  const existsRes = await fetch('/api/products');
  const allProducts = await existsRes.json();
  const exists = allProducts.find(p => p.art_nr === extracted.art_nr);

  const warningHtml = exists ? `
    <div class="confirm-card__warning">
      ⚠ <strong>${extracted.art_nr}</strong> finns redan i databasen — du skriver över befintlig produkt
    </div>
  ` : '';

  return `
    <div class="confirm-card">
      <div class="confirm-card__header">
        <span class="confirm-card__filename">${fileName}</span>
        <span class="confirm-card__art">${extracted.art_nr}</span>
      </div>
      ${warningHtml}
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
          value="${exists?.pris_kr || ''}"
        />
      </div>
      <div class="confirm-card__actions">
        <button
          class="admin-btn admin-btn--primary confirm-save"
          data-extracted='${JSON.stringify(extracted)}'
          data-staging="${stagingKey}"
          data-confirm="false"
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
    const card = btn.closest('.confirm-card');
    const feedback = card.querySelector('.confirm-card__feedback');

    // First click — ask for confirmation
    if (btn.dataset.confirm === 'false') {
      btn.dataset.confirm = 'true';
      btn.textContent = 'Är du säker? Klicka igen för att bekräfta';
      btn.style.background = '#dc2626';

      setTimeout(() => {
        if (btn.dataset.confirm === 'true') {
          btn.dataset.confirm = 'false';
          btn.textContent = 'Spara produkt';
          btn.style.background = '';
        }
      }, 3000);

      return;
    }

    // Second click — actually save
    const extracted = JSON.parse(btn.dataset.extracted);
    const stagingKey = btn.dataset.staging;
    const priceInput = card.querySelector('.confirm-card__price-input');
    const pris_kr = priceInput.value ? parseFloat(priceInput.value) : null;

    btn.disabled = true;
    btn.textContent = 'Sparar…';
    btn.style.background = '';

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
      btn.dataset.confirm = 'false';
      btn.textContent = 'Spara produkt';
      btn.style.background = '';
    }
  }

  if (e.target.classList.contains('confirm-cancel')) {
    e.target.closest('.result-row').remove();
  }
});

// --- PRODUCTS: FAMILY GRID + DRILL-DOWN ---

const FAMILY_DISPLAY = {
  'fackverkstakstol': 'Fackverkstakstol',
  'saxtakstol': 'Saxtakstol',
  'pulpettakstol': 'Pulpettakstol',
  'atakstol': 'A-takstol',
  'a-takstol': 'A-takstol',
  'ramverkstakstol': 'Ramverkstakstol',
  'mansardtakstol': 'Mansardtakstol',
  'lantbrukstakstol': 'Lantbrukstakstol',
  'bagtakstol': 'Bågtakstol',
  'bågtakstol': 'Bågtakstol',
  'specialtakstol': 'Specialtakstol',
};

function familyDisplayName(key) {
  return FAMILY_DISPLAY[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

function familyIcon(key) {
  return (svgs && (svgs[key] || svgs[key?.replace('-', '')])) || '';
}

let allProducts = [];

async function loadProducts() {
  const res = await fetch('/api/products');
  allProducts = await res.json();
  renderFamilyGrid();
}

function renderFamilyGrid() {
  const list = document.getElementById('product-list');
  if (!list) return;

  // Group products by takstol_typ
  const groups = {};
  allProducts.forEach(p => {
    const key = p.takstol_typ || 'okänd';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  // Sort alphabetically by display name
  const sortedKeys = Object.keys(groups).sort((a, b) =>
    familyDisplayName(a).localeCompare(familyDisplayName(b), 'sv')
  );

  list.innerHTML = `
    <div class="family-grid" id="family-grid">
      ${sortedKeys.map(key => `
        <button class="family-card" data-family="${key}">
          <span class="family-card__icon">${familyIcon(key)}</span>
          <span class="family-card__name">${familyDisplayName(key)}</span>
          <span class="family-card__count">${groups[key].length} produkt${groups[key].length === 1 ? '' : 'er'}</span>
        </button>
      `).join('')}
    </div>
  `;

  list.querySelectorAll('.family-card').forEach(card => {
    card.addEventListener('click', () => renderFamilyDetail(card.dataset.family, groups[card.dataset.family]));
  });
}

function renderFamilyDetail(familyKey, products) {
  const list = document.getElementById('product-list');
  if (!list) return;

  list.innerHTML = `
    <button class="family-detail__back" id="back-to-families">← Alla kategorier</button>
    <h2 class="family-detail__title">${familyDisplayName(familyKey)}</h2>
    <div id="family-products"></div>
  `;

  document.getElementById('back-to-families').addEventListener('click', renderFamilyGrid);

  const container = document.getElementById('family-products');
  container.innerHTML = products.map(p => `
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

  container.querySelectorAll('.price-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const art = btn.dataset.art;
      const input = container.querySelector(`input[data-art="${art}"]`);
      const pris_kr = input.value ? parseFloat(input.value) : null;

      await fetch(`/admin/api/product/${art}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminPassword },
        body: JSON.stringify({ pris_kr }),
      });

      // update local cache so the count/detail stays correct without a refetch
      const prod = allProducts.find(p => p.art_nr === art);
      if (prod) prod.pris_kr = pris_kr;

      btn.textContent = '✓';
      setTimeout(() => btn.textContent = 'Spara', 1500);
    });
  });

  container.querySelectorAll('.product-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Ta bort ${btn.dataset.art}?`)) return;
      await fetch(`/admin/api/product/${btn.dataset.art}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminPassword },
      });
      await loadProducts(); // refetch and drop back to the grid
    });
  });
}

// Password input enter key
document.getElementById('admin-password')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setPassword();
});