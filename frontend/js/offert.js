document.addEventListener("DOMContentLoaded", () => {
  const savedProduct = localStorage.getItem("selectedProduct");

  if (!savedProduct) {
    window.location.href = "takstolar.html";
    return;
  }

  const product = JSON.parse(savedProduct);

  const preview = document.getElementById("productPreview");

  preview.innerHTML = `
    <div class="quote-product-card">

      <div class="quote-product-svg">
        ${product.svg}
      </div>

      <h2>${product.namn}</h2>

      <p>${product.beskrivning}</p>

      <span class="product-card__tag">
        ${product.tag}
      </span>

    </div>
  `;
});