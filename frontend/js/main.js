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