const svgs = {
  fackverkstakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="60" x2="190" y2="60" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="60" x2="100" y2="20" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="60" x2="100" y2="20" stroke="currentColor" stroke-width="2.5"/>
    <line x1="55" y1="60" x2="77" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="100" y1="60" x2="100" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="145" y1="60" x2="123" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="55" y1="60" x2="100" y2="20" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="3,2"/>
    <line x1="145" y1="60" x2="100" y2="20" stroke="currentColor" stroke-width="1" opacity="0.3" stroke-dasharray="3,2"/>
  </svg>`,
  saxtakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="100" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="65" x2="100" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="30" y1="65" x2="150" y2="38" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="170" y1="65" x2="50" y2="38" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`,
  mansardtakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="45" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="30" x2="100" y2="18" stroke="currentColor" stroke-width="2.5"/>
    <line x1="100" y1="18" x2="155" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="155" y1="30" x2="190" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="30" x2="45" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="155" y1="30" x2="155" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="45" y1="30" x2="155" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`,
};

const page = window.location.pathname;

if (page.includes('takstolar-variant.html')) {
  loadVariants();
} else if (page.includes('index.html') || page === '/' || page === '') {
  loadFamilies(3);
} else {
  loadFamilies();
}

// --- LEVEL 1: Family cards ---
async function loadFamilies(limit = null) {
  const container = document.getElementById('products-container');
  if (!container) return;

  const res = await fetch('/api/families');
  const families = await res.json();

  const toRender = limit ? families.slice(0, limit) : families;

  toRender.forEach(family => {
    const svg = svgs[family.takstol_typ] || svgs['fackverkstakstol'];

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__image">${svg}</div>
      <div class="product-card__body">
        <p class="product-card__name">${family.takstol_typ.charAt(0).toUpperCase() + family.takstol_typ.slice(1)}</p>
        <p class="product-card__desc">${family.beskrivning}</p>
      </div>
      <div class="product-card__footer">
        <span class="product-card__tag">${family.kod}</span>
        <button class="product-card__btn" data-kod="${family.kod}">
          Se varianter
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('product-card__btn')) {
      const kod = e.target.dataset.kod;
      window.location.href = `takstolar-variant.html?family=${kod}`;
    }
  });
}

// --- LEVEL 2: Variant cards ---
async function loadVariants() {
  const container = document.getElementById('products-container');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const familyKod = params.get('family');
  if (!familyKod) return;

  // Set page title dynamically
  const title = document.getElementById('family-title');
  if (title) title.textContent = familyKod;

  const res = await fetch(`/api/families/${familyKod}/products`);
  const products = await res.json();

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__image">${svgs['fackverkstakstol']}</div>
      <div class="product-card__body">
        <p class="product-card__name">${product.art_nr}</p>
        <p class="product-card__desc">
          Spännvidd: ${product.spannvidd_mm} mm &nbsp;·&nbsp;
          Vikt: ${product.vikt_kg} kg &nbsp;·&nbsp;
          Takvinkel: ${product.takvinkel_grader}°
        </p>
      </div>
      <div class="product-card__footer">
        <span class="product-card__tag">${product.sakerhetsklass}</span>
        <button class="product-card__btn" data-art="${product.art_nr}">
          Begär offert 
        </button>
        ${product.pdf_url ? `<button class="product-card__btn--ghost" data-pdf="${product.pdf_url}">Visa ritning</button>` : ''}
      </div>
    `;
    container.appendChild(card);
  });


  
// Modal
const modal = document.createElement('div');
modal.id = 'pdf-modal';
modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;justify-content:center;align-items:center;';
modal.innerHTML = `
  <div style="background:#fff;width:90%;height:90%;border-radius:8px;overflow:hidden;position:relative;">
    <button id="close-pdf" style="position:absolute;top:12px;right:16px;font-size:1.5rem;background:none;border:none;cursor:pointer;">✕</button>
    <iframe id="pdf-frame" src="" style="width:100%;height:100%;border:none;"></iframe>
  </div>
`;
document.body.appendChild(modal);

document.getElementById('close-pdf').addEventListener('click', () => {
  modal.style.display = 'none';
  document.getElementById('pdf-frame').src = '';
});

container.addEventListener('click', (e) => {
  if (e.target.classList.contains('product-card__btn--ghost')) {
    const pdfUrl = e.target.dataset.pdf;
    document.getElementById('pdf-frame').src = pdfUrl;
    modal.style.display = 'flex';
  }
});

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('product-card__btn')) {
      const artNr = e.target.dataset.art;
      const selected = products.find(p => p.art_nr === artNr);
      if (!selected) return;
      localStorage.setItem('selectedProduct', JSON.stringify(selected));
      window.location.href = 'offert.html';
    }
  });
}

