document.addEventListener('DOMContentLoaded', () => {
  renderCheckout();

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', handleCheckoutSubmit);
  }
});

function renderCheckout() {
  const container = document.getElementById('checkoutItems');
  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Din kundvagn är tom. <a href="takstolar.html">Gå till takstolar</a>.</p>`;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="checkout-item">
        <div class="checkout-item__thumb">${(window.svgs && (svgs[item.takstol_typ] || svgs['fackverkstakstol'])) || ''}</div>
        <div class="checkout-item__info">
          <div class="checkout-item__name">${item.art_nr}</div>
          <div class="checkout-item__meta">
            <button class="qty-btn" data-art="${item.art_nr}" data-dir="-1">−</button>
            <span>${item.qty} st</span>
            <button class="qty-btn" data-art="${item.art_nr}" data-dir="1">+</button>
          </div>
        </div>
        <div class="checkout-item__price">${item.pris_kr ? formatPrice(item.pris_kr * item.qty) : 'Pris på förfrågan'}</div>
        <button class="cart-item__remove" data-art="${item.art_nr}">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        const item = cart.find(i => i.art_nr === btn.dataset.art);
        if (!item) return;
        updateQty(item.art_nr, item.qty + parseInt(btn.dataset.dir, 10));
        renderCheckout();
      });
    });

    container.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.art);
        renderCheckout();
      });
    });
  }

  const total = cartTotal();
  document.getElementById('checkoutSubtotal').textContent = formatPrice(total);
  document.getElementById('checkoutTotal').textContent = formatPrice(total);
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const order = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
    cart: getCart(),
    total: cartTotal()
  };

  // Placeholder: will POST to /api/checkout once backend route + Stripe are wired up
  console.log('Order ready to submit:', order);
  alert('Betalningsintegration kommer snart. Din beställning har loggats i konsolen för test.');
}