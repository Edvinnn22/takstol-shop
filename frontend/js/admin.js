 let password = '';

    function setPassword() {
      password = document.getElementById('admin-password').value;
      document.getElementById('auth-status').textContent = '✓ Lösenord inställt';
    }

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const results = document.getElementById('results');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFiles(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener('change', () => {
      handleFiles(Array.from(fileInput.files));
    });

    function handleFiles(files) {
      if (!password) {
        alert('Ange adminlösenord först.');
        return;
      }
      files.filter(f => f.name.endsWith('.pdf')).forEach(uploadFile);
    }

    async function uploadFile(file) {
      // Add result card
      const card = document.createElement('div');
      card.className = 'result-card';
      card.id = `result-${file.name}`;
      card.innerHTML = `
        <div class="result-card__info">
          <h3>${file.name}</h3>
          <p>Bearbetar...</p>
        </div>
        <span class="result-card__status result-card__status--loading">Laddar upp...</span>
      `;
      results.prepend(card);

      try {
        const formData = new FormData();
        formData.append('pdf', file);

        const res = await fetch('/admin/api/upload', {
          method: 'POST',
          headers: { 'x-admin-token': password },
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          card.querySelector('.result-card__info p').textContent =
            `${data.product.art_nr} · ${data.product.spannvidd_mm}mm · ${data.product.vikt_kg}kg`;
          card.querySelector('.result-card__status').className = 'result-card__status result-card__status--success';
          card.querySelector('.result-card__status').textContent = '✓ Tillagd';
        } else {
          throw new Error(data.error);
        }

      } catch (err) {
        card.querySelector('.result-card__info p').textContent = err.message;
        card.querySelector('.result-card__status').className = 'result-card__status result-card__status--error';
        card.querySelector('.result-card__status').textContent = '✗ Fel';
      }
    }