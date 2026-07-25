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

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const cart = getCart();
  if (cart.length === 0) {
    alert('Din kundvagn är tom.');
    return;
  }

  const formData = new FormData(e.target);
  const order = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
    cart: cart,
    total: cartTotal()
  };

  const submitBtn = e.target.querySelector('.checkout__submit');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Skickar...';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (!res.ok) throw new Error('Server error');

    localStorage.removeItem('cart');
    updateCartUI();

    document.getElementById('checkoutForm').style.display = 'none';
    document.querySelector('.checkout__summary').innerHTML = `
      <h4>Tack, ${order.name.split(' ')[0]}!</h4>
      <p>Din beställning är mottagen. Vi återkommer till dig på <strong>${order.email}</strong> inom kort med en bekräftelse och nästa steg.</p>
    `;
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Något gick fel när beställningen skulle skickas. Försök igen eller kontakta oss direkt.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}