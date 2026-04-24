const items = document.querySelectorAll('.accordion__item');

items.forEach(item => {
  const header = item.querySelector('.accordion__header');

  header.addEventListener('click', () => {
    const isOpen = item.classList.contains('active');

    // close all (optional - for single open accordion)
    items.forEach(i => i.classList.remove('active'));

    if (!isOpen) {
      item.classList.add('active');
    }
  });
});


