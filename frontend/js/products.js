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

  pulpettakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="10" y2="25" stroke="currentColor" stroke-width="2.5"/>
    <line x1="10" y1="25" x2="190" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="45" x2="190" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="70" y1="65" x2="70" y2="37" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="130" y1="65" x2="130" y2="41" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`,

  atakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="100" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="65" x2="100" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="30" y1="65" x2="170" y2="65" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    <line x1="100" y1="15" x2="100" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`,

  ramverkstakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="100" y2="20" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="65" x2="100" y2="20" stroke="currentColor" stroke-width="2.5"/>
    <rect x="70" y="38" width="60" height="27" stroke="currentColor" stroke-width="1.5" opacity="0.6" fill="none"/>
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

  lantbrukstakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="100" y2="18" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="65" x2="100" y2="18" stroke="currentColor" stroke-width="2.5"/>
    <line x1="100" y1="18" x2="100" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="55" y1="65" x2="100" y2="42" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="145" y1="65" x2="100" y2="42" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`,

  bagtakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <path d="M10,65 Q100,-10 190,65" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <line x1="55" y1="65" x2="63" y2="37" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
    <line x1="100" y1="65" x2="100" y2="25" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
    <line x1="145" y1="65" x2="137" y2="37" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
  </svg>`,

  specialtakstol: `<svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
    <line x1="10" y1="65" x2="70" y2="18" stroke="currentColor" stroke-width="2.5"/>
    <line x1="70" y1="18" x2="130" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="130" y1="30" x2="190" y2="18" stroke="currentColor" stroke-width="2.5"/>
    <line x1="190" y1="18" x2="190" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="70" y1="18" x2="70" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <line x1="130" y1="30" x2="130" y2="65" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  </svg>`
};

const products = [
  {
    id: "fackverkstakstol",
    namn: "Fackverkstakstol",
    beskrivning: "Klassisk fackverk med diagonalstänger. Lämplig för stora spännvidder och industribyggnader.",
    tag: "Vanligast"
  },
  {
    id: "saxtakstol",
    namn: "Saxtakstol",
    beskrivning: "Korsande underspänn ger högt inre utrymme. Används ofta vid öppen planlösning.",
    tag: "Populär"
  },
  {
    id: "pulpettakstol",
    namn: "Pulpettakstol",
    beskrivning: "Enkel lutning med ett tak-plan. Enkel konstruktion, lämplig för tillbyggnader.",
    tag: "Enkel"
  },
  {
    id: "atakstol",
    namn: "A-takstol",
    beskrivning: "Symmetrisk form med mittupplag. Standard för bostäder med sadeltak.",
    tag: "Standard"
  },
  {
    id: "ramverkstakstol",
    namn: "Ramverkstakstol",
    beskrivning: "Integrerat ramverk ger extra styvhet. Passar vid höga vindlaster.",
    tag: "Robust"
  },
  {
    id: "mansardtakstol",
    namn: "Mansardtakstol",
    beskrivning: "Bruten takform med brant nederdel. Möjliggör bostadsyta under takfallet.",
    tag: "Platseffektiv"
  },
  {
    id: "lantbrukstakstol",
    namn: "Lantbrukstakstol",
    beskrivning: "Förstärkt konstruktion för tunga laster. Anpassad för lantbruksbyggnader.",
    tag: "Industri"
  },
  {
    id: "bagtakstol",
    namn: "Bågtakstol",
    beskrivning: "Böjd överkant för estetisk profil och effektiv lastfördelning.",
    tag: "Design"
  },
  {
    id: "specialtakstol",
    namn: "Specialtakstol",
    beskrivning: "Kundanpassad konstruktion för unika krav. Projekteras efter behov.",
    tag: "Anpassad"
  }
];

const container = document.getElementById('products-container');

products.forEach(product => {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="product-card__image">
      ${svgs[product.id]}
    </div>
    <div class="product-card__body">
      <p class="product-card__name">${product.namn}</p>
      <p class="product-card__desc">${product.beskrivning}</p>
    </div>
    <div class="product-card__footer">
      <span class="product-card__tag">${product.tag}</span>
      <button class="product-card__btn">Begär offert</button>
    </div>
  `;

  container.appendChild(card);
});