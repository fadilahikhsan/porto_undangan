const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const body = document.body;
const cover = qs('#cover');
const openingScene = qs('#openingScene');
const invitation = qs('#invitation');
const openButton = qs('#openInvitation');
const musicToggle = qs('#musicToggle');
const toast = qs('#toast');

const guest = new URLSearchParams(location.search).get('to');
if (guest) qs('#guestDisplay').textContent = guest.replace(/\+/g, ' ').slice(0, 70);

let audioContext;
let masterGain;
let musicTimer;
let noteIndex = 0;
let musicPlaying = false;
const notes = [220, 277.18, 329.63, 415.3, 329.63, 277.18];

function playTone(frequency) {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.075, now + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start(now);
  oscillator.stop(now + 2.55);
}

function startMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(audioContext.destination);
  }
  audioContext.resume();
  musicPlaying = true;
  playTone(notes[noteIndex]);
  clearInterval(musicTimer);
  musicTimer = setInterval(() => {
    noteIndex = (noteIndex + 1) % notes.length;
    playTone(notes[noteIndex]);
  }, 1050);
  musicToggle.classList.remove('is-paused');
  musicToggle.setAttribute('aria-label', 'Jeda musik');
}

function pauseMusic() {
  if (!audioContext) return;
  audioContext.suspend();
  clearInterval(musicTimer);
  musicPlaying = false;
  musicToggle.classList.add('is-paused');
  musicToggle.setAttribute('aria-label', 'Putar musik');
}

openButton.addEventListener('click', () => {
  startMusic();
  cover.classList.add('is-hidden');
  openingScene.classList.add('is-active');
  openingScene.setAttribute('aria-hidden', 'false');

  window.setTimeout(() => {
    openingScene.classList.add('is-finished');
    body.classList.remove('is-locked');
    invitation.setAttribute('aria-hidden', 'false');
    musicToggle.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, 4450);

  window.setTimeout(() => {
    openingScene.classList.remove('is-active');
    openingScene.setAttribute('aria-hidden', 'true');
  }, 5300);
});

musicToggle.addEventListener('click', () => {
  if (musicPlaying) pauseMusic();
  else startMusic();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && musicPlaying && audioContext) audioContext.suspend();
  if (!document.hidden && musicPlaying && audioContext) audioContext.resume();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0.24, rootMargin: '0px 0px -5% 0px' });

qsa('.reveal-up,.reveal-left,.reveal-right,.reveal-zoom').forEach((element) => revealObserver.observe(element));

const weddingDate = new Date('2026-12-12T09:00:00+07:00').getTime();
function updateCountdown() {
  const difference = Math.max(0, weddingDate - Date.now());
  const values = {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
  Object.entries(values).forEach(([id, value]) => {
    qs(`#${id}`).textContent = String(value).padStart(2, '0');
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const lightbox = qs('#lightbox');
qsa('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    const source = qs('img', item);
    qs('img', lightbox).src = source.src;
    qs('img', lightbox).alt = source.alt;
    lightbox.hidden = false;
    body.classList.add('is-locked');
  });
});

function closeLightbox() {
  lightbox.hidden = true;
  body.classList.remove('is-locked');
}
qs('button', lightbox).addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

qsa('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast('Nomor rekening berhasil disalin');
    } catch {
      showToast(`Salin nomor: ${button.dataset.copy}`);
    }
  });
});

const defaultWishes = [
  { name: 'Keluarga Besar', status: 'Hadir', message: 'Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.' },
  { name: 'Sahabat Rico & Tiara', status: 'Hadir', message: 'Lancar sampai hari bahagia dan selalu dipenuhi kebahagiaan.' }
];

function getWishes() {
  try { return JSON.parse(localStorage.getItem('rico-tiara-wishes')) || defaultWishes; }
  catch { return defaultWishes; }
}

function renderWishes() {
  qs('#wishes').innerHTML = getWishes().slice(0, 5).map((wish) => `
    <article class="wish">
      <strong>${escapeHtml(wish.name)}</strong><span>${escapeHtml(wish.status)}</span>
      <p>${escapeHtml(wish.message)}</p>
    </article>`).join('');
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

qs('#rsvpForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const wish = {
    name: qs('#guestName').value.trim(),
    message: qs('#guestMessage').value.trim(),
    status: qs('#guestStatus').value
  };
  const wishes = getWishes();
  wishes.unshift(wish);
  localStorage.setItem('rico-tiara-wishes', JSON.stringify(wishes.slice(0, 20)));
  event.currentTarget.reset();
  renderWishes();
  showToast('Ucapan sudah tersimpan');
});

qsa('a[href="#"]').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
renderWishes();
