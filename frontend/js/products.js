// svgs is loaded via js/svgs.js — included before this script in HTML

const page = window.location.pathname;
const productsContainer = document.getElementById('products-container');

if (productsContainer) {
  if (page.includes('takstolar-variant.html')) {
    loadVariants();
  } else if (page.includes('index.html') || page === '/' || page === '') {
    loadFamilies(3);
  } else {
    loadFamilies();
  }
}

// --- CART ---
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product, familyTyp) {
  const cart = getCart();
  const existing = cart.find(i => i.art_nr === product.art_nr);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1, takstol_typ: familyTyp || product.takstol_typ });
  }
  saveCart(cart);
}

function removeFromCart(art_nr) {
  saveCart(getCart().filter(i => i.art_nr !== art_nr));
}

function updateQty(art_nr, qty) {
  const cart = getCart();
  const item = cart.find(i => i.art_nr === art_nr);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + ((i.pris_kr || 0) * i.qty), 0);
}

function updateCartUI() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

  const countEl = document.getElementById('cartCount');
  if (countEl) countEl.textContent = totalItems;

  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartPopupTotal');

  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="empty-cart">Inga produkter valda ännu.</p>';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__thumb">${(window.svgs && (svgs[item.takstol_typ] || svgs['fackverkstakstol'])) || ''}</div>
      <div class="cart-item__info">
        <span class="cart-item__name">${item.art_nr}</span>
        <span class="cart-item__meta">${item.spannvidd_mm} mm · ${item.takvinkel_grader}°</span>
        <div class="cart-item__qty-controls">
          <button class="qty-btn" data-art="${item.art_nr}" data-dir="-1">−</button>
          <span>${item.qty} st</span>
          <button class="qty-btn" data-art="${item.art_nr}" data-dir="1">+</button>
        </div>
      </div>
      <div class="cart-item__right">
        ${item.pris_kr ? `<span class="cart-item__price">${formatPrice(item.pris_kr * item.qty)}</span>` : ''}
        <button class="cart-item__remove" data-art="${item.art_nr}">✕</button>
      </div>
    </div>
  `).join('');

  itemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.art));
  });

  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = getCart();
      const item = cart.find(i => i.art_nr === btn.dataset.art);
      if (!item) return;
      const dir = parseInt(btn.dataset.dir, 10);
      updateQty(item.art_nr, item.qty + dir);
    });
  });
}

function formatPrice(n) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

// Init cart UI on load
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();

  const cartBtn = document.getElementById('cartBtn');
  const cartPopup = document.getElementById('cartPopup');
  const closeCart = document.getElementById('closeCart');

  if (cartBtn && cartPopup) {
    cartBtn.addEventListener('click', () => cartPopup.classList.toggle('open'));
    closeCart?.addEventListener('click', () => cartPopup.classList.remove('open'));
    document.addEventListener('click', (e) => {
      if (!cartPopup.contains(e.target) && !cartBtn.contains(e.target)) {
        cartPopup.classList.remove('open');
      }
    });
  }
});

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
        <button class="product-card__btn" data-kod="${family.kod}">Se varianter</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('product-card__btn')) {
      window.location.href = `takstolar-variant.html?family=${e.target.dataset.kod}`;
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

  const title = document.getElementById('family-title');
  if (title) title.textContent = familyKod;

  const res = await fetch(`/api/families/${familyKod}/products`);
  const products = await res.json();

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card product-card--variant';

    const priceHtml = product.pris_kr
      ? `<span class="product-card__price">${formatPrice(product.pris_kr)}<span class="product-card__price-unit">/st</span></span>`
      : `<span class="product-card__price product-card__price--none">Pris på förfrågan</span>`;

    card.innerHTML = `
      <div class="product-card__image">${svgs[familyKod] || svgs['fackverkstakstol']}</div>
      <div class="product-card__body">
        <p class="product-card__name">${product.art_nr}</p>
        <div class="product-card__specs">
          <span>${product.spannvidd_mm} mm</span>
          <span>${product.vikt_kg} kg</span>
          <span>${product.takvinkel_grader}°</span>
        </div>
        ${priceHtml}
      </div>
      <div class="product-card__footer">
        <div class="product-card__footer-left">
          <span class="product-card__tag">${product.sakerhetsklass}</span>
          ${product.pdf_url ? `<button class="product-card__btn--ghost" data-pdf="${product.pdf_url}">Ritning</button>` : ''}
        </div>
        <div class="product-card__footer-right">
          <button class="product-card__btn product-card__btn--offert" data-art="${product.art_nr}">Begär offert</button>
          <button class="product-card__btn product-card__btn--cart" data-art="${product.art_nr}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 11H7L6 8zm3-2a3 3 0 016 0"/></svg>
            Lägg i varukorg
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // PDF modal
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
    // PDF button
    if (e.target.closest('.product-card__btn--ghost')) {
      const btn = e.target.closest('.product-card__btn--ghost');
      document.getElementById('pdf-frame').src = btn.dataset.pdf;
      modal.style.display = 'flex';
      return;
    }

    // Offert button
    if (e.target.closest('.product-card__btn--offert')) {
      const btn = e.target.closest('.product-card__btn--offert');
      const artNr = btn.dataset.art;
      const selected = products.find(p => p.art_nr === artNr);
      if (!selected) return;
      localStorage.setItem('selectedProduct', JSON.stringify(selected));
      window.location.href = 'offert.html';
      return;
    }

    // Cart button
    if (e.target.closest('.product-card__btn--cart')) {
      const btn = e.target.closest('.product-card__btn--cart');
      const artNr = btn.dataset.art;
      const product = products.find(p => p.art_nr === artNr);
      if (!product) return;
      addToCart(product, familyKod);

      btn.textContent = 'Tillagd ✓';
      btn.style.background = 'var(--color-green-600, #008761)';
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 11H7L6 8zm3-2a3 3 0 016 0"/></svg> Lägg i varukorg`;
        btn.style.background = '';
      }, 1200);
    }
  });
}