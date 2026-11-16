'use strict';

// The supplied originals, in the same visual order as the recording.
const images = [
  { id: 'lady', src: 'assets/lady.jpg', alt: 'Lady Macbeth graphic design', width: 409, height: 1024 },
  { id: 'bio', src: 'assets/bio.jpg', alt: 'Guy de Maupassant biography design', width: 800, height: 2000 },
  { id: 'exam', src: 'assets/exam.png', alt: 'Exam preparation graphic design', width: 537, height: 599 },
  { id: 'model1', src: 'assets/model1.jpg', alt: 'Architectural model, kitchen and dining area', width: 3293, height: 1816 },
  { id: 'board', src: 'assets/board.jpg', alt: 'Handmade Trailblazer board game', width: 2622, height: 3100 },
  { id: 'model2', src: 'assets/model2.jpg', alt: 'Architectural model kitchen', width: 3671, height: 1653 },
  { id: 'model3', src: 'assets/model3.jpg', alt: 'Architectural model dining room', width: 4032, height: 1816 },
  { id: 'coast', src: 'assets/coast.jpg', alt: 'Coastal landscape', width: 3840, height: 2160 },
  { id: 'fountain', src: 'assets/fountain.jpg', alt: 'Stone fountain and sculpture', width: 7985, height: 3768 },
  { id: 'bridge', src: 'assets/bridge.jpg', alt: 'Bridge on the river', width: 3459, height: 1732 },
  { id: 'iceberg', src: 'assets/iceberg.jpg', alt: 'Iceberg on the water', width: 4000, height: 1848 },
  { id: 'iceberg2', src: 'assets/iceberg2.jpg', alt: 'Close-up of a blue iceberg', width: 4000, height: 1848 },
  // The uploaded shore file has EXIF orientation 6 and displays as a portrait.
  { id: 'shore', src: 'assets/shore.jpg', alt: 'Rocky ocean shoreline', width: 1848, height: 4000 },
  { id: 'sunset', src: 'assets/sunset.jpg', alt: 'Waterfront sunset', width: 4000, height: 1848 }
];
const byId = new Map(images.map(item => [item.id, item]));
const galleryArrangement = {
  left: ['shore', 'iceberg2', 'model2', 'board'],
  right: ['fountain', 'bridge', 'iceberg', 'coast', 'sunset', 'model1', 'model3', 'exam']
};
const gallerySequence = [
  'shore','fountain','bridge','iceberg','coast','iceberg2','sunset',
  'model2','model1','board','model3','exam'
];

const galleryColumns = document.getElementById('gallery-columns');
for (const side of ['left', 'right']) {
  const column = document.createElement('div');
  column.className = `gallery-column gallery-column--${side}`;
  galleryArrangement[side].forEach((id, index) => {
    const item = byId.get(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'art gallery-art scroll-reveal';
    button.dataset.image = id;
    button.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 55}ms`);
    button.setAttribute('aria-label', `Enlarge ${item.alt}`);
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt;
    img.width = item.width;
    img.height = item.height;
    img.loading = index < 2 ? 'eager' : 'lazy';
    img.decoding = 'async';
    button.append(img);
    column.append(button);
  });
  galleryColumns.append(column);
}

// Accessible page links. Keep URL hashes so pages are bookmarkable.
const pages = ['home','gallery','contact'];
let revealObserver;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupReveals() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  document.body.classList.add('motion-ready');
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -35px 0px', threshold: 0.08 });
  document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));
}

function navigate() {
  const requested = location.hash.replace('#','');
  const page = pages.includes(requested) ? requested : 'home';
  document.querySelectorAll('.page').forEach(section => {
    section.hidden = section.id !== page;
  });
  document.querySelectorAll('.site-header nav a').forEach(link => {
    const active = link.dataset.page === page;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  // Recheck observed elements since hidden pages do not intersect the viewport.
  if (revealObserver) {
    document.querySelectorAll(`#${page} .scroll-reveal:not(.is-visible)`)
      .forEach(el => revealObserver.observe(el));
  }
  updateProgress();
}

function updateProgress() {
  const doc = document.documentElement;
  const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  document.getElementById('scroll-progress').style.transform = `scaleX(${progress})`;
}
window.addEventListener('hashchange', navigate);
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
setupReveals();
navigate();

// Modal image viewer: gallery browsing follows the recording's image order.
const lightbox = document.getElementById('lightbox');
const largeImage = document.getElementById('lightbox-image');
const lightboxCount = document.getElementById('lightbox-count');
const lightboxCaption = document.getElementById('lightbox-caption');
let viewingList = gallerySequence;
let currentIndex = 0;
let lastFocused = null;

function updateImage() {
  const id = viewingList[currentIndex];
  const item = byId.get(id);
  if (!item) return;
  largeImage.src = item.src;
  largeImage.alt = item.alt;
  lightboxCaption.textContent = item.alt;
  lightboxCount.textContent = `${currentIndex + 1} / ${viewingList.length}`;
}
function openImage(id, button) {
  if (!byId.has(id)) return;
  lastFocused = button;
  const isGallery = !document.getElementById('gallery').hidden;
  viewingList = isGallery ? gallerySequence : images.map(x => x.id);
  currentIndex = viewingList.indexOf(id);
  updateImage();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lightbox-close').focus();
}
function closeImage() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  largeImage.removeAttribute('src');
  if (lastFocused?.isConnected) lastFocused.focus();
}
function moveImage(step) {
  currentIndex = (currentIndex + step + viewingList.length) % viewingList.length;
  updateImage();
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-image]');
  if (button) openImage(button.dataset.image, button);
});
document.getElementById('lightbox-close').addEventListener('click', closeImage);
document.getElementById('lightbox-prev').addEventListener('click', () => moveImage(-1));
document.getElementById('lightbox-next').addEventListener('click', () => moveImage(1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeImage(); });
let touchStart = null;
lightbox.addEventListener('touchstart', event => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
lightbox.addEventListener('touchend', event => {
  if (touchStart === null) return;
  const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
  if (Math.abs(distance) > 55) moveImage(distance > 0 ? -1 : 1);
  touchStart = null;
}, { passive: true });
document.addEventListener('keydown', event => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeImage();
  if (event.key === 'ArrowRight') moveImage(1);
  if (event.key === 'ArrowLeft') moveImage(-1);
  if (event.key === 'Tab') {
    const actions = [...lightbox.querySelectorAll('button')];
    const first = actions[0], last = actions[actions.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

// A static portfolio has no mail server; launch a pre-addressed message instead.
document.getElementById('contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(event.currentTarget);
  const name = `${fields.get('firstName')} ${fields.get('lastName')}`.trim();
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const message = encodeURIComponent(`Name: ${name}\nEmail: ${fields.get('email')}\n\n${fields.get('message')}`);
  document.getElementById('form-note').textContent = 'Opening your email application with the message ready to send.';
  window.location.href = `mailto:keziah.ramessar@gmail.com?subject=${subject}&body=${message}`;
});
