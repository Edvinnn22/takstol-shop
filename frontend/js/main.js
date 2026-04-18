const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });

const toggle = document.querySelector('.nav__toggle');
const menu = document.querySelector('.nav__center');

if (toggle) {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}




const products = [
  { namn: "Takstol typ A", pris: 1200, beskrivning: "Standard 8m spännvidd" },
  { namn: "Takstol typ B", pris: 1800, beskrivning: "Förstärkt 10m spännvidd" },
  { namn: "Takstol typ C", pris: 2400, beskrivning: "Specialanpassad 12m" },
  { namn: "Takstol typ A", pris: 1200, beskrivning: "Standard 8m spännvidd" },
  { namn: "Takstol typ B", pris: 1800, beskrivning: "Förstärkt 10m spännvidd" },
  { namn: "Takstol typ C", pris: 2400, beskrivning: "Specialanpassad 12m" }
]

const container = document.getElementById('products-container')

products.forEach(product => {
  const card = document.createElement('div')
  card.className = 'product-card'
  
  card.innerHTML = `
    <h2>${product.namn}</h2>
    <p>${product.beskrivning}</p>
    <p class="price">${product.pris} kr</p>
    <button>Köp nu</button>
  `
  
  container.appendChild(card)
})