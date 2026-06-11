const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const dropzone = document.getElementById('dropzone');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['.pdf', '.dwg', '.jpg', '.jpeg', '.png'];

// ── Cycling illustration ──
const svgKeys = Object.keys(svgs);
let currentIndex = 0;

const illustrationEl = document.getElementById('panelIllustration');
const labelEl = document.getElementById('panelLabel');

function formatLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
}

function showIllustration(index) {
  illustrationEl.classList.add('fading');
  labelEl.classList.add('fading');

  setTimeout(() => {
    illustrationEl.innerHTML = svgs[svgKeys[index]];
    labelEl.textContent = formatLabel(svgKeys[index]);
    illustrationEl.classList.remove('fading');
    labelEl.classList.remove('fading');
  }, 600);
}

// Init
illustrationEl.innerHTML = svgs[svgKeys[0]];
labelEl.textContent = formatLabel(svgKeys[0]);

setInterval(() => {
  currentIndex = (currentIndex + 1) % svgKeys.length;
  showIllustration(currentIndex);
}, 3000);

// ── Drag states ──
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('pf-drop--active');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('pf-drop--active'));
dropzone.addEventListener('drop', () => dropzone.classList.remove('pf-drop--active'));

// ── File handling ──
fileInput.addEventListener('change', () => {
  const allFiles = Array.from(fileInput.files);
  const dt = new DataTransfer();
  const errors = [];

  for (const file of allFiles) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      errors.push(`${file.name} — otillåtet filformat`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name} — för stor (max 20 MB)`);
      continue;
    }
    dt.items.add(file);
  }

  fileInput.files = dt.files;
  if (errors.length) showDropError(errors.join('\n'));
  renderFiles();
});

function renderFiles() {
  fileList.innerHTML = '';
  Array.from(fileInput.files).forEach((file, i) => {
    const size = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const row = document.createElement('div');
    row.className = 'pf-file';
    row.innerHTML = `
      <span class="pf-file-dot"></span>
      <span class="pf-file-name">${file.name}</span>
      <span class="pf-file-size">${size}</span>
      <button type="button" class="pf-file-remove" aria-label="Ta bort">×</button>
    `;

    row.querySelector('.pf-file-remove').addEventListener('click', () => {
      const dt = new DataTransfer();
      Array.from(fileInput.files)
        .filter((_, idx) => idx !== i)
        .forEach(f => dt.items.add(f));
      fileInput.files = dt.files;
      renderFiles();
    });

    fileList.appendChild(row);
  });
}

// ── Error helpers ──
function setError(el, msg) {
  el.classList.add('pf-input--error');
  let hint = el.parentElement.querySelector('.pf-error');
  if (!hint) {
    hint = document.createElement('span');
    hint.className = 'pf-error';
    el.parentElement.appendChild(hint);
  }
  hint.textContent = msg;
}

function clearError(el) {
  el.classList.remove('pf-input--error');
  const hint = el.parentElement.querySelector('.pf-error');
  if (hint) hint.remove();
}

function showDropError(msg) {
  dropzone.classList.add('pf-drop--error');
  let hint = dropzone.parentElement.querySelector('.pf-drop-error');
  if (!hint) {
    hint = document.createElement('span');
    hint.className = 'pf-error pf-drop-error';
    dropzone.parentElement.appendChild(hint);
  }
  hint.textContent = msg;

}

['namn', 'epost', 'telefon', 'beskrivning'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => clearError(e.target));
});

// ── Submit ──
document.getElementById('projectForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const namn = document.getElementById('namn');
  const epost = document.getElementById('epost');
  const telefon = document.getElementById('telefon');
  const beskrivning = document.getElementById('beskrivning');
  const files = fileInput.files;

  let valid = true;

  if (!namn.value.trim()) { setError(namn, 'Namn krävs'); valid = false; }

  if (!epost.value.trim()) {
    setError(epost, 'E-post krävs'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.value.trim())) {
    setError(epost, 'Ogiltig e-postadress'); valid = false;
  }

  if (!telefon.value.trim()) { setError(telefon, 'Telefon krävs'); valid = false; }
  if (!beskrivning.value.trim()) { setError(beskrivning, 'Beskriv ditt projekt'); valid = false; }

  if (files.length === 0) {
    showDropError('Minst en fil krävs');
    valid = false;
  }

  if (!valid) return;

  const formData = new FormData();
  formData.append('namn', namn.value);
  formData.append('epost', epost.value);
  formData.append('telefon', telefon.value);
  formData.append('beskrivning', beskrivning.value);
  for (const file of files) formData.append('filer', file);

  const submitBtn = document.querySelector('.pf-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Skickar...';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      document.getElementById('projectForm').reset();
      fileList.innerHTML = '';
      const banner = document.getElementById('successBanner');
      banner.classList.add('pf-success--visible');
    } else {
      const data = await res.json();
      alert(data.error || 'Något gick fel. Försök igen.');
    }
  } catch (err) {
    alert('Något gick fel. Försök igen.');
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Skicka in ansökan';
});