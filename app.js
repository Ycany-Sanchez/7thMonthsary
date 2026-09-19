// 7th Monthsary Interactive Application Engine

// Empty default memories (user will upload their own photos & photobooth strips)
const DEFAULT_MEMORIES = [];

// 50+ Romantic & Cute Reasons
const LOVE_REASONS = [
  "The way your eyes sparkle whenever you smile genuinely.",
  "How safe and peaceful I feel whenever I am with you.",
  "Your sweet laugh that instantly brightens my gloomiest days.",
  "The way you remember tiny details about the things I like.",
  "Your warm, gentle hugs that feel like coming home.",
  "How we can talk for hours about everything and nothing at all.",
  "The adorable faces you make when you are concentrated or excited.",
  "How supportive you are with all my dreams and aspirations.",
  "Your kindness and gentle heart toward everyone around you.",
  "The cute little voice notes and messages you send me randomly.",
  "How you make ordinary grocery runs and walks feel magical.",
  "The way you hold my hand a little tighter when crossing streets.",
  "Your patience and understanding even when things get tough.",
  "The way you look at me when you think I'm not looking.",
  "How we always end up laughing until our stomachs hurt.",
  "Because loving you is the easiest and most natural thing in the world.",
  "How you inspire me every single day to be a better person.",
  "The cute little nickname you only call me.",
  "The warm forehead kisses that make my heart melt.",
  "Just being by your side makes every problem feel so small.",
  "The way your presence fills my world with so much calm and joy."
];

// IndexedDB Helper for Photo Storage
const DB_NAME = 'MonthsaryMemoriesDB';
const STORE_NAME = 'photos';
let dbInstance = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => {
      console.error('IndexedDB error:', e);
      resolve(null);
    };
  });
}

async function getAllUserPhotos() {
  if (!dbInstance) await initDB();
  return new Promise((resolve) => {
    if (!dbInstance) return resolve([]);
    const tx = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function saveUserPhoto(photoData) {
  if (!dbInstance) await initDB();
  return new Promise((resolve) => {
    if (!dbInstance) return resolve(false);
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(photoData);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
}

async function deleteUserPhoto(id) {
  if (!dbInstance) await initDB();
  return new Promise((resolve) => {
    if (!dbInstance) return resolve(false);
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
}

// App State
let allMemories = [];

// Initialize Memories
async function loadMemories() {
  try {
    const userPhotos = await getAllUserPhotos();
    if (userPhotos && userPhotos.length > 0) {
      allMemories = [...userPhotos];
    } else {
      allMemories = [];
    }
  } catch (err) {
    console.error('Error loading photos:', err);
    allMemories = [];
  }
  renderMarquee();
  renderGridGallery();
}

// Render Left-to-Right Auto-Scrolling Marquee
function renderMarquee() {
  const marqueeTrack = document.getElementById('marquee-track');
  const marqueeContainer = document.querySelector('.marquee-container');
  if (!marqueeTrack) return;

  if (allMemories.length === 0) {
    marqueeTrack.innerHTML = `
      <div class="py-8 px-6 text-center text-pink-400 font-medium font-script text-xl sm:text-2xl flex items-center justify-center gap-3 w-full">
        <span>✨</span> 
        <span>No memories uploaded yet! Click "Add Memory" or snap a strip in the Photobooth below to see your photos float here 💕</span>
        <span>✨</span>
      </div>
    `;
    marqueeTrack.style.animation = 'none';
    return;
  }

  marqueeTrack.style.animation = 'scrollLeftToRight 42s linear infinite';

  // Duplicate items for seamless continuous looping (at least 6-8 items for smooth loop)
  let itemsToRender = [...allMemories];
  while (itemsToRender.length < 8) {
    itemsToRender = [...itemsToRender, ...allMemories];
  }
  itemsToRender = [...itemsToRender, ...itemsToRender];

  marqueeTrack.innerHTML = itemsToRender.map((item, idx) => {
    const rot = item.rotation || ((idx % 7) - 3);
    const loc = item.location || item.date || 'Our Special Place';
    return `
      <div class="polaroid-card" style="transform: rotate(${rot}deg);" onclick="openLightbox('${item.id}')">
        <div class="polaroid-img-wrapper">
          <img src="${item.url}" alt="${item.caption || 'Memory'}" loading="lazy" />
        </div>
        <div class="mt-3 text-center">
          <p class="font-script text-xl font-bold text-gray-800 line-clamp-1">${escapeHtml(item.caption || 'Our Sweet Memory')}</p>
          <span class="text-xs text-pink-500 font-medium tracking-wide block mt-1 truncate">📍 ${escapeHtml(loc)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Render Grid Gallery
function renderGridGallery() {
  const grid = document.getElementById('gallery-grid');
  const countBadge = document.getElementById('photo-count-badge');
  if (countBadge) {
    countBadge.textContent = `${allMemories.length} Memories`;
  }
  if (!grid) return;

  if (allMemories.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center">
        <div class="w-16 h-16 rounded-full bg-pink-100 text-pink-400 flex items-center justify-center mb-3">
          <i data-lucide="images" class="w-8 h-8"></i>
        </div>
        <h4 class="font-semibold text-base text-[var(--text-main)]">Your Memory Vault is Ready</h4>
        <p class="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-4">
          Start adding your photos using the button above or take adorable strips in our Photobooth!
        </p>
        <button onclick="openUploadModal()" class="px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold shadow hover:scale-105 transition-all">
          Upload First Photo
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = allMemories.map((item) => {
    const loc = item.location || item.date || 'Our Special Place';
    return `
      <div class="glass-card p-3 relative group overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
        <div class="aspect-square w-full rounded-xl overflow-hidden bg-pink-100 relative cursor-pointer" onclick="openLightbox('${item.id}')">
          <img src="${item.url}" alt="${escapeHtml(item.caption)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <span class="text-white text-xs font-medium flex items-center gap-1">
              <i data-lucide="zoom-in" class="w-4 h-4"></i> View Photo
            </span>
          </div>
        </div>
        <div class="mt-3 px-1">
          <h4 class="font-semibold text-sm text-[var(--text-main)] truncate" title="${escapeHtml(item.caption || '')}">${escapeHtml(item.caption || 'Cherished Memory')}</h4>
          <div class="flex items-center justify-between mt-1 text-xs text-[var(--text-muted)]">
            <span class="truncate pr-1 text-pink-500 font-medium">📍 ${escapeHtml(loc)}</span>
            <div class="flex items-center gap-1">
              <button onclick="event.stopPropagation(); openEditMemoryModal('${item.id}')" class="text-pink-400 hover:text-pink-600 transition-colors p-1" title="Edit caption & location">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="event.stopPropagation(); removePhoto('${item.id}')" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Delete memory">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

let activeLightboxMemoryId = null;

// Lightbox Modal
function openLightbox(id) {
  const item = allMemories.find(m => m.id === id);
  if (!item) return;

  activeLightboxMemoryId = id;
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const date = document.getElementById('lightbox-date');

  img.src = item.url;
  caption.textContent = item.caption || 'Our Precious Memory';
  const loc = item.location || item.date || 'Our Special Place';
  date.textContent = `📍 ${loc}`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  activeLightboxMemoryId = null;
}

// Edit Memory Modal Functions
function openEditMemoryModal(id) {
  const item = allMemories.find(m => m.id === id);
  if (!item) return;

  const modal = document.getElementById('edit-memory-modal');
  const preview = document.getElementById('edit-memory-preview');
  const captionInput = document.getElementById('edit-memory-caption');
  const locationInput = document.getElementById('edit-memory-location');
  const idInput = document.getElementById('edit-memory-id');

  if (preview) preview.src = item.url;
  if (captionInput) captionInput.value = item.caption || '';
  if (locationInput) locationInput.value = item.location || item.date || '';
  if (idInput) idInput.value = item.id;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function openEditMemoryFromLightbox() {
  if (activeLightboxMemoryId) {
    openEditMemoryModal(activeLightboxMemoryId);
  }
}

function closeEditMemoryModal() {
  const modal = document.getElementById('edit-memory-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveMemoryEdit() {
  const id = document.getElementById('edit-memory-id').value;
  const caption = document.getElementById('edit-memory-caption').value.trim();
  const location = document.getElementById('edit-memory-location').value.trim();

  const itemIndex = allMemories.findIndex(m => m.id === id);
  if (itemIndex === -1) return;

  allMemories[itemIndex].caption = caption || 'Cherished Memory';
  allMemories[itemIndex].location = location || 'Our Special Place';
  allMemories[itemIndex].date = location || 'Our Special Place';

  // Save to IndexedDB
  await saveUserPhoto(allMemories[itemIndex]);

  // Update UI
  renderMarquee();
  renderGridGallery();

  // If lightbox is open with this memory, update it
  if (activeLightboxMemoryId === id) {
    document.getElementById('lightbox-caption').textContent = allMemories[itemIndex].caption;
    document.getElementById('lightbox-date').textContent = `📍 ${allMemories[itemIndex].location}`;
  }

  closeEditMemoryModal();
  showToast('✨ Memory updated successfully!');
}

// Photo Upload Handling
async function handlePhotoUpload(files) {
  if (!files || files.length === 0) return;
  const captionInput = document.getElementById('upload-caption');
  const locationInput = document.getElementById('upload-location');
  const baseCaption = captionInput ? captionInput.value.trim() : '';
  const baseLocation = locationInput && locationInput.value.trim() ? locationInput.value.trim() : 'Our Special Place';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    const base64 = await readFileAsDataURL(file);
    const newMemory = {
      id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      url: base64,
      caption: baseCaption || file.name.replace(/\.[^/.]+$/, "") || 'Sweet Moment',
      location: baseLocation,
      date: baseLocation,
      rotation: Math.floor(Math.random() * 8) - 4,
      createdAt: Date.now()
    };

    await saveUserPhoto(newMemory);
    allMemories.unshift(newMemory);
  }

  // Clear inputs & close modal
  if (captionInput) captionInput.value = '';
  if (locationInput) locationInput.value = '';
  closeUploadModal();

  renderMarquee();
  renderGridGallery();
  triggerHeartConfetti();
  showToast('✨ New memory added to our collection!');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function removePhoto(id) {
  if (confirm('Are you sure you want to remove this memory from your album?')) {
    await deleteUserPhoto(id);
    allMemories = allMemories.filter(m => m.id !== id);
    renderMarquee();
    renderGridGallery();
    showToast('Memory removed 🗑️');
  }
}

// Upload Modal
function openUploadModal() {
  const modal = document.getElementById('upload-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ==========================================
// PHOTOBOOTH ENGINE
// ==========================================
class PhotoboothController {
  constructor() {
    this.video = null;
    this.stream = null;
    this.shots = []; // stores 4 base64 images
    this.isCapturing = false;
    this.currentFilter = 'none';
    this.currentFrameColor = 'strip-frame-pink';
    this.frameHex = '#ffe3eb';
    this.frameBorderHex = '#ffb3c1';
  }

  init() {
    this.video = document.getElementById('booth-video');
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      if (this.video) {
        this.video.srcObject = this.stream;
        document.getElementById('camera-placeholder')?.classList.add('hidden');
        document.getElementById('camera-active-controls')?.classList.remove('hidden');
        document.getElementById('start-cam-btn')?.classList.add('hidden');
        showToast('📷 Camera connected! Strike a cute pose ✨');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Could not access camera. You can also upload 4 photos to generate your strip!');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      if (this.video) this.video.srcObject = null;
      document.getElementById('camera-placeholder')?.classList.remove('hidden');
      document.getElementById('camera-active-controls')?.classList.add('hidden');
      document.getElementById('start-cam-btn')?.classList.remove('hidden');
    }
  }

  setFilter(filterName) {
    this.currentFilter = filterName;
    if (this.video) {
      this.video.className = 'camera-video';
      if (filterName === 'warm') this.video.classList.add('filter-warm');
      if (filterName === 'rose') this.video.classList.add('filter-rose');
      if (filterName === 'bw') this.video.classList.add('filter-bw');
      if (filterName === 'bloom') this.video.classList.add('filter-bloom');
    }
    // Update active filter pill
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('ring-2', 'ring-pink-500', 'font-bold');
      if (btn.dataset.filter === filterName) {
        btn.classList.add('ring-2', 'ring-pink-500', 'font-bold');
      }
    });
  }

  setFrameColor(colorName, bgHex, borderHex) {
    this.currentFrameColor = colorName;
    this.frameHex = bgHex;
    this.frameBorderHex = borderHex;

    const stripPreview = document.getElementById('photobooth-strip-preview');
    if (stripPreview) {
      stripPreview.className = `photobooth-strip ${colorName}`;
    }
    this.renderStripCanvas();
  }

  async startSequence() {
    if (this.isCapturing) return;
    if (!this.stream && (!this.shots || this.shots.length === 0)) {
      await this.startCamera();
      if (!this.stream) return;
    }

    this.isCapturing = true;
    this.shots = [];
    const countdownEl = document.getElementById('booth-countdown');
    const snapBtn = document.getElementById('snap-strip-btn');
    if (snapBtn) snapBtn.disabled = true;

    for (let shotNum = 1; shotNum <= 4; shotNum++) {
      // 3-second countdown
      for (let sec = 3; sec > 0; sec--) {
        if (countdownEl) {
          countdownEl.textContent = sec;
          countdownEl.classList.remove('hidden', 'scale-50', 'opacity-0');
          countdownEl.classList.add('scale-100', 'opacity-100');
        }
        playBeep(440, 0.1);
        await sleep(900);
      }

      if (countdownEl) {
        countdownEl.textContent = '📸';
      }
      this.triggerFlash();
      playBeep(880, 0.25);

      // Capture single frame
      const shotData = this.captureFrame();
      this.shots.push(shotData);

      // Update slot preview in UI
      const slotImg = document.getElementById(`strip-shot-${shotNum}`);
      if (slotImg) {
        slotImg.src = shotData;
        slotImg.classList.remove('hidden');
      }

      await sleep(1000);
      if (countdownEl) countdownEl.classList.add('hidden');
    }

    this.isCapturing = false;
    if (snapBtn) snapBtn.disabled = false;
    document.getElementById('strip-actions')?.classList.remove('hidden');
    this.renderStripCanvas();
    triggerHeartConfetti();
    showToast('🎉 Gorgeous strip captured! You can now download or save it.');
  }

  triggerFlash() {
    const flash = document.getElementById('camera-flash');
    if (flash) {
      flash.classList.add('flash-active');
      setTimeout(() => flash.classList.remove('flash-active'), 250);
    }
  }

  captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Apply Filter
    if (this.currentFilter === 'warm') {
      ctx.filter = 'sepia(0.28) saturate(1.3) contrast(1.05) brightness(1.03)';
    } else if (this.currentFilter === 'rose') {
      ctx.filter = 'hue-rotate(-15deg) saturate(1.25) contrast(1.08) brightness(1.04)';
    } else if (this.currentFilter === 'bw') {
      ctx.filter = 'grayscale(1) contrast(1.25) brightness(0.95)';
    } else if (this.currentFilter === 'bloom') {
      ctx.filter = 'contrast(0.95) brightness(1.1) saturate(1.15)';
    }

    // Mirror horizontal because of selfie mode
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  loadCustomPhotos(files) {
    if (!files || files.length === 0) return;
    const count = Math.min(files.length, 4);
    this.shots = [];

    Array.from(files).slice(0, 4).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.shots[index] = e.target.result;
        const slotImg = document.getElementById(`strip-shot-${index + 1}`);
        if (slotImg) {
          slotImg.src = e.target.result;
          slotImg.classList.remove('hidden');
        }
        if (this.shots.filter(Boolean).length === count) {
          document.getElementById('strip-actions')?.classList.remove('hidden');
          this.renderStripCanvas();
          showToast('📸 Photos loaded into your strip!');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  async renderStripCanvas() {
    if (!this.shots || this.shots.length === 0) return;

    const canvas = document.getElementById('photobooth-render-canvas') || document.createElement('canvas');
    canvas.id = 'photobooth-render-canvas';
    canvas.width = 600;
    canvas.height = 1900;
    const ctx = canvas.getContext('2d');

    // Background Frame
    ctx.fillStyle = this.frameHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = this.frameBorderHex;
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    const padX = 40;
    const padTop = 45;
    const shotW = canvas.width - (padX * 2);
    const shotH = Math.round(shotW * 0.75); // 4:3 aspect
    const gap = 26;

    // Load and draw all 4 images
    for (let i = 0; i < 4; i++) {
      const shotUrl = this.shots[i];
      if (!shotUrl) continue;
      const y = padTop + i * (shotH + gap);

      // White outline backing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(padX - 4, y - 4, shotW + 8, shotH + 8);

      const img = await loadImage(shotUrl);
      ctx.drawImage(img, padX, y, shotW, shotH);
    }

    // Footer Stamp
    const footerY = padTop + 4 * (shotH + gap) + 30;
    const isDark = this.frameHex === '#18181b';
    ctx.fillStyle = isDark ? '#ffffff' : '#4a2835';
    ctx.textAlign = 'center';

    ctx.font = 'bold 36px "Playfair Display", serif';
    ctx.fillText('♥ OUR 7TH MONTHSARY ♥', canvas.width / 2, footerY);

    ctx.font = 'italic 26px "Dancing Script", cursive';
    ctx.fillStyle = isDark ? '#ff758f' : '#e05780';
    ctx.fillText('Kirsten & Ycany • To forever with youuu', canvas.width / 2, footerY + 45);

    ctx.font = '500 20px "Outfit", sans-serif';
    ctx.fillStyle = isDark ? '#a1a1aa' : '#84596b';
    ctx.fillText('September 19, 2026', canvas.width / 2, footerY + 85);

    return canvas;
  }

  async downloadStrip() {
    const canvas = await this.renderStripCanvas();
    if (!canvas) {
      alert('Please take or upload 4 photos first!');
      return;
    }

    const filename = `photobooth_strip_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.png`;

    // Try modern File System Access API (allows picking photobooth_photos folder directly in Windows)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PNG Image',
            accept: { 'image/png': ['.png'] }
          }]
        });
        const writable = await handle.createWritable();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await writable.write(blob);
        await writable.close();
        showToast('💾 Saved directly to your photobooth folder!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('File picker error:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Fallback standard download
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Photobooth strip saved to your computer!');
  }

  async saveStripToVault() {
    const canvas = await this.renderStripCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newMemory = {
      id: 'booth_' + Date.now(),
      url: dataUrl,
      caption: '📸 7th Monthsary Photobooth Strip 💕',
      date: 'Happy 7th Monthsary',
      rotation: -1,
      createdAt: Date.now()
    };

    await saveUserPhoto(newMemory);
    allMemories.unshift(newMemory);
    renderMarquee();
    renderGridGallery();
    triggerHeartConfetti();
    showToast('💖 Photobooth strip saved to your Memory Vault and scrolling marquee!');
  }
}

const photobooth = new PhotoboothController();

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function playBeep(freq, duration) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { }
}

// Love Letter Envelope Logic
function toggleEnvelope() {
  const wrapper = document.getElementById('envelope-wrapper');
  if (wrapper.classList.contains('open')) {
    wrapper.classList.remove('open');
  } else {
    wrapper.classList.add('open');
    triggerHeartConfetti();
    setTimeout(() => {
      openLetterModal();
    }, 900);
  }
}

function openLetterModal() {
  const modal = document.getElementById('letter-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeLetterModal() {
  const modal = document.getElementById('letter-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function saveCustomLetter() {
  const letterText = document.getElementById('letter-content-input').value;
  localStorage.setItem('monthsary_love_letter', letterText);
  document.getElementById('letter-display-text').textContent = letterText;
  showToast('💌 Your love letter was saved safely!');
  closeLetterModal();
}

function loadSavedLetter() {
  const saved = localStorage.getItem('monthsary_love_letter');
  if (saved) {
    const input = document.getElementById('letter-content-input');
    const display = document.getElementById('letter-display-text');
    if (input) input.value = saved;
    if (display) display.textContent = saved;
  }
}

// Jar of Love Reasons Logic
function drawLoveReason() {
  const card = document.getElementById('reason-display-card');
  const textElem = document.getElementById('reason-text');
  const numElem = document.getElementById('reason-number');

  const randomIdx = Math.floor(Math.random() * LOVE_REASONS.length);
  const selectedReason = LOVE_REASONS[randomIdx];

  card.classList.add('scale-95', 'opacity-50');
  setTimeout(() => {
    textElem.textContent = `"${selectedReason}"`;
    numElem.textContent = `Reason #${randomIdx + 1} of ∞`;
    card.classList.remove('scale-95', 'opacity-50');
    card.classList.add('scale-105');
    setTimeout(() => card.classList.remove('scale-105'), 200);
  }, 180);

  triggerSparkleBurst(window.innerWidth / 2, window.innerHeight / 2);
}

// Our Love Playlist & Romantic Audio Engine (Risk It All, Soft Spot, Kabisado)
const BRUNO_PLAYLIST = {
  risk_it_all: {
    id: 'BF2_ipR1OI0',
    title: 'Bruno Mars - Risk It All',
    icon: '💖'
  },
  soft_spot: {
    id: 'vZ0Iogdip40',
    title: 'keshi - Soft Spot',
    icon: '🌸'
  },
  kabisado: {
    id: 'uyC8mS5MHkk',
    title: 'IV of Spades - Kabisado',
    icon: '✨'
  }
};

class RomanticAudioPlayer {
  constructor() {
    this.isPlaying = false;
    this.isDockOpen = false;
    this.currentTrackKey = 'risk_it_all';
    this.currentTitle = 'Bruno Mars - Risk It All';
    this.customAudio = new Audio();
    this.customAudio.loop = true;
    this.customAudioLoaded = false;
  }

  toggleDock() {
    const card = document.getElementById('music-player-card');
    if (!card) return;

    if (this.isDockOpen) {
      card.classList.add('hidden');
      card.classList.remove('flex');
      this.isDockOpen = false;
    } else {
      card.classList.remove('hidden');
      card.classList.add('flex');
      this.isDockOpen = true;

      // Load initial song into frame if frame is empty
      const frame = document.getElementById('main-yt-frame');
      if (frame && (!frame.src || frame.src === '' || frame.src === window.location.href)) {
        this.selectTrack(this.currentTrackKey);
      }
    }
  }

  selectTrack(key) {
    if (!BRUNO_PLAYLIST[key]) return;
    this.currentTrackKey = key;
    const track = BRUNO_PLAYLIST[key];
    this.currentTitle = track.title;
    this.customAudioLoaded = false;
    this.isPlaying = true;

    // Update dock title
    const dockTitle = document.getElementById('dock-song-title');
    if (dockTitle) dockTitle.textContent = track.title;

    // Update iframe embed with autoplay
    const frame = document.getElementById('main-yt-frame');
    if (frame) {
      frame.src = `https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0`;
    }

    // Update active highlight on dock buttons
    ['risk_it_all', 'soft_spot', 'kabisado'].forEach(k => {
      const btn = document.getElementById(`dock-btn-${k}`);
      if (btn) {
        if (k === key) {
          btn.className = 'p-2 rounded-xl text-center border border-pink-400 bg-pink-100/90 shadow-sm transition-all';
        } else {
          btn.className = 'p-2 rounded-xl text-center border border-gray-200 hover:bg-pink-50 transition-all';
        }
      }
    });

    updateMusicUI(true);
    showToast(`🎵 Playing: ${track.title}`);
  }

  loadUserAudio(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.customAudio.src = e.target.result;
      this.customAudioLoaded = true;
      this.currentTitle = file.name.replace(/\.[^/.]+$/, "") || 'Custom Song';
      
      const frame = document.getElementById('main-yt-frame');
      if (frame) frame.src = '';

      this.customAudio.play();
      this.isPlaying = true;
      updateMusicUI(true);
      showToast('🎵 Custom MP3 loaded & playing!');
    };
    reader.readAsDataURL(file);
  }
}

const musicPlayer = new RomanticAudioPlayer();

function updateMusicUI(playing) {
  const disc = document.getElementById('vinyl-disc');
  const btn = document.getElementById('play-music-btn');
  const text = document.getElementById('music-status-text');

  if (playing) {
    if (disc) disc.classList.add('playing');
    if (btn) btn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 text-white"></i>';
    if (text) text.textContent = `${musicPlayer.currentTitle} 💕`;
  } else {
    if (disc) disc.classList.remove('playing');
    if (btn) btn.innerHTML = '<i data-lucide="play" class="w-4 h-4 text-white"></i>';
    if (text) text.textContent = `${musicPlayer.currentTitle} 🎵`;
  }
  if (window.lucide) lucide.createIcons();
}

// Falling Cherry Blossoms & Heart Particles Engine
class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 35;
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  init() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
    this.animate();
  }

  createParticle(randomY = false) {
    const isHeart = Math.random() > 0.45;
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -20,
      size: Math.random() * 12 + 8,
      speedX: Math.random() * 1.5 - 0.75,
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      opacity: Math.random() * 0.5 + 0.35,
      isHeart: isHeart,
      color: isHeart ? '#ff85a2' : '#ffb7c5'
    };
  }

  drawHeart(x, y, size, opacity) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#ff758f';
    this.ctx.beginPath();
    const d = size / 2;
    this.ctx.moveTo(0, d / 4);
    this.ctx.quadraticCurveTo(0, -d / 2, -d / 2, -d / 2);
    this.ctx.quadraticCurveTo(-d, -d / 2, -d, d / 4);
    this.ctx.quadraticCurveTo(-d, d, 0, size);
    this.ctx.quadraticCurveTo(d, d, d, d / 4);
    this.ctx.quadraticCurveTo(d, -d / 2, d / 2, -d / 2);
    this.ctx.quadraticCurveTo(0, -d / 2, 0, d / 4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPetal(x, y, size, rotation, opacity) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#ffb3c1';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size / 2, size, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.5;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      if (p.isHeart) {
        this.drawHeart(p.x, p.y, p.size, p.opacity);
      } else {
        this.drawPetal(p.x, p.y, p.size, p.rotation, p.opacity);
      }

      if (p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30) {
        this.particles[i] = this.createParticle(false);
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Click Burst Sparkles
function triggerSparkleBurst(x, y) {
  const emojis = ['💖', '✨', '🌸', '💕', '🥰', '⭐'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'heart-burst text-lg';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 80 + 40;
    const tx = `${Math.cos(angle) * dist}px`;
    const ty = `${Math.sin(angle) * dist - 20}px`;
    const rot = `${(Math.random() - 0.5) * 60}deg`;

    el.style.setProperty('--tx', tx);
    el.style.setProperty('--ty', ty);
    el.style.setProperty('--rot', rot);

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function triggerHeartConfetti() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.7);
      triggerSparkleBurst(x, y);
    }, i * 60);
  }
}

// Toast Notification
function showToast(msg) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-8');
  toast.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-8');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3200);
}

// Theme Switcher
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('monthsary_theme', themeName);
  showToast(`Theme changed to ${themeName.replace('-', ' ').toUpperCase()} 🎨`);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  new ParticleEngine('particles-canvas');
  photobooth.init();
  loadMemories();
  loadSavedLetter();

  // Load Saved Theme
  const savedTheme = localStorage.getItem('monthsary_theme') || 'default';
  if (savedTheme !== 'default') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Click sparkles
  window.addEventListener('click', (e) => {
    if (!['INPUT', 'BUTTON', 'TEXTAREA', 'VIDEO'].includes(e.target.tagName)) {
      triggerSparkleBurst(e.clientX, e.clientY);
    }
  });

  // Drag and Drop files for photo upload
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handlePhotoUpload(e.target.files));

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-pink-500', 'bg-pink-50/50');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-pink-500', 'bg-pink-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-pink-500', 'bg-pink-50/50');
      if (e.dataTransfer.files) {
        handlePhotoUpload(e.dataTransfer.files);
      }
    });
  }

  // Photobooth custom file upload
  const boothFilesInput = document.getElementById('booth-file-input');
  if (boothFilesInput) {
    boothFilesInput.addEventListener('change', (e) => {
      if (e.target.files) {
        photobooth.loadCustomPhotos(e.target.files);
      }
    });
  }

  // Custom Music Upload
  const songFileInput = document.getElementById('song-file-input');
  if (songFileInput) {
    songFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        musicPlayer.loadUserAudio(e.target.files[0]);
      }
    });
  }

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
});
