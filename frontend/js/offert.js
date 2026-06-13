document.addEventListener('DOMContentLoaded', () => {
  const product = JSON.parse(localStorage.getItem('selectedProduct') || 'null');
  const preview = document.getElementById('productPreview');

  if (product && preview) {
    
const svg = svgs?.[product.takstol_typ] || svgs?.['fackverkstakstol'] || '';

    preview.innerHTML = `
      <div class="quote-preview">
        <div class="quote-product-card">
          <div class="quote-product-svg">${svg}</div>
          <div class="quote-product-info">
            <h2>${product.art_nr}</h2>
            <div class="quote-specs">
              <span>${product.spannvidd_mm} mm</span>
              <span>${product.vikt_kg} kg</span>
              <span>${product.takvinkel_grader}°</span>
              ${product.sakerhetsklass ? `<span>${product.sakerhetsklass}</span>` : ''}
              ${product.snolast_kn_m2 ? `<span>Snölast ${product.snolast_kn_m2} kN/m²</span>` : ''}
            </div>
            ${product.beskrivning ? `<p class="quote-product-desc">${product.beskrivning}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Form submit
  const form = document.getElementById('quoteForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      company: form.company.value,
      email: form.email.value,
      phone: form.phone.value,
      project: form.project.value,
      message: form.message.value,
      product: product || null,
    };

    const btn = form.querySelector('button[type="submit"]');
btn.disabled = true;
btn.textContent = 'Skickar...';

try {
  const res = await fetch('/api/offert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    btn.textContent = 'Skickat ✓';
    btn.style.background = 'var(--color-green-600)';
    localStorage.removeItem('selectedProduct');
  } else {
    const err = await res.json();
    alert(err.error || 'Något gick fel. Försök igen.');
    btn.disabled = false;
    btn.textContent = 'Skicka förfrågan';
  }
} catch {
  alert('Något gick fel. Försök igen.');
  btn.disabled = false;
  btn.textContent = 'Skicka förfrågan';
}
  });
});