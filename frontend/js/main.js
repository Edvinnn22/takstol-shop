// require('dotenv').config()

// console.log(process.env.API_KEY)




// nav scroll
const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });


  // hamburger
const toggle = document.querySelector('.nav__toggle');
const menu = document.querySelector('.nav__center');

if (toggle) {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}



const cartBtn = document.getElementById("cartBtn");
const cartPopup = document.getElementById("cartPopup");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");

let cart = [];

// open cart
cartBtn.addEventListener("click", () => {
  cartPopup.classList.toggle("open");
});

// close cart
closeCart.addEventListener("click", () => {
  cartPopup.classList.remove("open");
});

// close when clicking outside
document.addEventListener("click", (e) => {
  if (
    !cartPopup.contains(e.target) &&
    !cartBtn.contains(e.target)
  ) {
    cartPopup.classList.remove("open");
  }
});

// example function to add products
function addToCart(productName) {
  cart.push(productName);

  cartCount.textContent = cart.length;

  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p class="empty-cart">Inga produkter valda ännu.</p>
    `;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      item => `
        <div class="cart-item">
          ${item}
        </div>
      `
    )
    .join("");
}