// -- Global state
let currentCategory = 'all';
let galleryItems = [];
let currentIndex = -1;
let loadedCount = 0;
const batchSize = 20; // batch size for lazy loading
const maxImages = 100;

const gallery = document.getElementById("gallery");

// ---- IMAGE GENERATION (lazy batch) ----
function loadBatch() {
  const end = Math.min(loadedCount + batchSize, maxImages);
  for (let i = loadedCount + 1; i <= end; i++) {
    const ext = i <= 4 ? "png" : "jpg";
    addImage(i, ext);
  }
  loadedCount = end;
  refreshItems();
}
loadBatch(); // initial load

function addImage(index, ext) {
  const item = document.createElement("div");
  item.classList.add("item");
  item.setAttribute("data-category", "anime");

  const img = document.createElement("img");
  // ✅ Corrected path
  img.src = `imagebg${index}.${ext}`;
  img.alt = `Visual ${index}`;
  img.loading = "lazy";
  img.onclick = () => openLightbox(img);

  // like button
  const like = document.createElement("button");
  like.classList.add("fav-btn");
  like.innerHTML = isLiked(index) ? "❤️" : "🤍";
  like.onclick = (e) => {
    e.stopPropagation();
    toggleLike(index, like);
  };

  // download button
  const download = document.createElement("a");
  download.classList.add("download-btn");
  download.href = img.src;
  download.download = `imagebg${index}.${ext}`;
  download.textContent = "⬇";

  item.appendChild(img);
  item.appendChild(like);
  item.appendChild(download);
  gallery.appendChild(item);
}

// ---- LIKE SYSTEM (localStorage) ----
function getLikes() {
  return JSON.parse(localStorage.getItem("liked") || "[]");
}
function isLiked(id) {
  return getLikes().includes(id);
}
function toggleLike(id, btn) {
  let likes = getLikes();
  if (likes.includes(id)) {
    likes = likes.filter(l => l !== id);
    btn.innerHTML = "🤍";
  } else {
    likes.push(id);
    btn.innerHTML = "❤️";
  }
  localStorage.setItem("liked", JSON.stringify(likes));
}

// ---- FILTER SYSTEM ----
function refreshItems() {
  galleryItems = Array.from(document.querySelectorAll('.gallery .item'));
}
function applyFilter() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  galleryItems.forEach(item => {
    const cat = item.getAttribute('data-category') || '';
    const alt = (item.querySelector('img')?.alt || '').toLowerCase();
    const catMatch = (currentCategory === 'all' || cat === currentCategory);
    const textMatch = !q || alt.includes(q);
    item.style.display = (catMatch && textMatch) ? 'block' : 'none';
  });
}
function selectCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilter();
}
function filterSearch() { applyFilter(); }
function clearSearch() {
  document.getElementById('searchInput').value = '';
  applyFilter();
}

// ---- LIGHTBOX ----
let viewCounts = {};
function openLightbox(imgEl) {
  const src = imgEl.src;
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  lbImg.src = src;

  refreshItems();
  const visibleItems = galleryItems.filter(i => i.style.display !== 'none');
  currentIndex = visibleItems.findIndex(i => i.querySelector('img').src === src);

  const dl = document.getElementById('lightbox-download');
  dl.href = src;

  // Update views
  viewCounts[src] = (viewCounts[src] || 0) + 1;
  document.getElementById('viewCount').textContent = viewCounts[src];

  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e && e.type === 'click') {
    const tgt = e.target;
    if (tgt.classList.contains('lb-prev') || tgt.classList.contains('lb-next') || tgt.classList.contains('lb-close') || tgt.id === 'lightbox-download' || tgt.id === 'shareBtn') {
      return;
    }
  }
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

function prevLightbox(e) {
  if (e) e.stopPropagation();
  navigateLightbox(-1);
}
function nextLightbox(e) {
  if (e) e.stopPropagation();
  navigateLightbox(1);
}
function navigateLightbox(step) {
  refreshItems();
  const visibleItems = galleryItems.filter(i => i.style.display !== 'none');
  if (visibleItems.length === 0) return;
  currentIndex = (currentIndex + step + visibleItems.length) % visibleItems.length;
  const imgEl = visibleItems[currentIndex].querySelector('img');
  document.getElementById('lightbox-img').src = imgEl.src;
  document.getElementById('lightbox-download').href = imgEl.src;
  document.getElementById('viewCount').textContent = (viewCounts[imgEl.src] || 0);
}

// ---- SHARE BUTTON ----
function shareImage() {
  const imgSrc = document.getElementById('lightbox-img').src;
  if (navigator.share) {
    navigator.share({
      title: 'Check out this visual!',
      url: imgSrc
    }).catch(console.error);
  } else {
    prompt('Copy this URL to share:', imgSrc);
  }
}

// ---- KEYBOARD CONTROLS ----
document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('lightbox');
  if (lightbox.style.display === 'flex') {
    if (e.key === 'ArrowLeft') prevLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'Escape') closeLightbox();
  } else {
    if (e.key === 'f' && document.activeElement.tagName !== 'INPUT') {
      document.getElementById('searchInput').focus();
    }
  }
});

// ---- THEME TOGGLE ----
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  if (current === 'dark') {
    root.removeAttribute('data-theme');
    document.getElementById('themeIcon').textContent = '🌙';
  } else {
    root.setAttribute('data-theme', 'dark');
    document.getElementById('themeIcon').textContent = '☀️';
  }
}

// ---- INFINITE SCROLL ----
window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
    if (loadedCount < maxImages) loadBatch();
  }

  // Back to top
  const btn = document.getElementById('backToTop');
  if (window.scrollY > 300) btn.classList.add('show');
  else btn.classList.remove('show');
});

// ---- HERO SLIDESHOW ----
// ✅ Corrected paths
const slides = ["imagebg1.png","imagebg2.png","imagebg3.png","imagebg4.png"];
let slideIndex = 0;
function nextSlide() { slideControl(1); }
function prevSlide() { slideControl(-1); }
function slideControl(step) {
  slideIndex = (slideIndex + step + slides.length) % slides.length;
  const hero = document.querySelector(".hero");
  if (hero) hero.style.backgroundImage = `url('${slides[slideIndex]}')`;
}
setInterval(() => {
  slideControl(1);
}, 5000);

// ---- BACK TO TOP ----
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- INIT ----
window.addEventListener('load', () => {
  refreshItems();
  selectCategory('all', document.querySelector('.cat-btn[data-cat="all"]'));

  // Create Back-to-top button
  if (!document.getElementById('backToTop')) {
    const btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.textContent = '↑ Top';
    btn.onclick = backToTop;
    document.body.appendChild(btn);
  }
});
