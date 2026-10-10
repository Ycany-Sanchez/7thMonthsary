// Kirsten & Ycany - Dedicated Photobooth Studio Engine

// IndexedDB Helper (Shared with main website)
const DB_NAME = 'MonthsaryMemoriesDB';
const STORE_NAME = 'photos';
let dbInstance = null;

function initDB() {
  return new Promise((resolve) => {
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

// Particle Engine for background ambiance
class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 22;
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 0.8 + 0.4,
      speedX: Math.random() * 0.6 - 0.3,
      opacity: Math.random() * 0.4 + 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      type: Math.random() > 0.4 ? 'petal' : 'heart'
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y > this.canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * this.canvas.width;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.opacity;

      if (p.type === 'heart') {
        this.ctx.fillStyle = '#ff85a2';
        this.ctx.beginPath();
        const topCurveHeight = p.size * 0.3;
        this.ctx.moveTo(0, topCurveHeight);
        this.ctx.bezierCurveTo(0, 0, -p.size / 2, 0, -p.size / 2, topCurveHeight);
        this.ctx.bezierCurveTo(-p.size / 2, (p.size + topCurveHeight) / 2, 0, p.size, 0, p.size * 1.3);
        this.ctx.bezierCurveTo(0, p.size, p.size / 2, (p.size + topCurveHeight) / 2, p.size / 2, topCurveHeight);
        this.ctx.bezierCurveTo(p.size / 2, 0, 0, 0, 0, topCurveHeight);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#ffccd5';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.35, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// BOLD & NOTICEABLE Filter CSS definitions
const FILTER_DEFINITIONS = {
  none: {
    css: 'none',
    label: 'NORMAL'
  },
  warm: {
    css: 'sepia(0.65) saturate(2.0) contrast(1.18) brightness(1.08) hue-rotate(-12deg)',
    label: 'GOLDEN WARM'
  },
  rose: {
    css: 'hue-rotate(-35deg) saturate(2.2) contrast(1.22) brightness(1.12)',
    label: 'ROSÉ PINK'
  },
  vintage: {
    css: 'sepia(0.55) contrast(1.4) saturate(0.85) brightness(0.92)',
    label: '90s VINTAGE'
  },
  bw: {
    css: 'grayscale(1) contrast(1.8) brightness(1.02)',
    label: 'NOIR B&W'
  },
  bloom: {
    css: 'brightness(1.25) contrast(1.15) saturate(1.5)',
    label: 'DREAMY BLOOM'
  },
  cyber: {
    css: 'contrast(1.35) saturate(2.4) brightness(1.08) hue-rotate(18deg)',
    label: 'CYBER POP'
  },
  sunset: {
    css: 'sepia(0.4) saturate(2.2) contrast(1.25) hue-rotate(-22deg) brightness(1.06)',
    label: 'SUNSET GLOW'
  }
};

// Dedicated Photobooth Controller
class PhotoboothApp {
  constructor() {
    this.video = document.getElementById('booth-video');
    this.stream = null;
    this.isMirrored = true;
    this.audioEnabled = true;
    this.timerSeconds = 3;
    this.isCapturing = false;

    // Slots & Photos (up to 4 shots)
    this.shots = [null, null, null, null];
    this.currentFilter = 'none';
    this.currentLayout = 'strip4'; // 'strip4', 'grid4', 'polaroid'
    
    // Themes
    this.currentTheme = 'hearts'; // 'hearts', 'pastel_rose', 'checkerboard', 'coquette_bows', 'sakura', 'film_negative', 'haru_white', 'midnight', 'custom'
    this.customThemeHex = '#ffe4e6';

    // Draggable Stickers with Selection & Deletion
    this.stickers = [];
    this.selectedSticker = null;

    // Doodle Pen with Accurate Coordinates & History
    this.isDoodling = false;
    this.doodleModeEnabled = false;
    this.doodleCanvas = document.getElementById('doodle-canvas');
    this.doodleCtx = this.doodleCanvas ? this.doodleCanvas.getContext('2d') : null;
    this.brushSize = 5;
    this.doodleHistory = [];

    this.init();
  }

  init() {
    this.setupDoodleCanvas();
    this.setupKeyboardListeners();
    this.updateStripFooter();
    this.setThemeFrame('hearts');
    this.setFilter('none');
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

      this.video.srcObject = this.stream;
      await this.video.play();

      document.getElementById('camera-prompt').classList.add('hidden');
      document.getElementById('camera-status-text').textContent = 'Live Camera';
      document.getElementById('camera-status-dot').className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';

      showToast('📷 Camera connected! Ready to snap cute poses!');
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access webcam. Please check browser camera permissions or upload photos directly.');
    }
  }

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
    this.video.style.transform = this.isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    const btn = document.getElementById('mirror-btn');
    if (this.isMirrored) {
      btn.classList.add('bg-pink-100', 'text-pink-600');
    } else {
      btn.classList.remove('bg-pink-100', 'text-pink-600');
    }
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    const btn = document.getElementById('audio-btn');
    btn.innerHTML = this.audioEnabled 
      ? '<i data-lucide="volume-2" class="w-4 h-4"></i>' 
      : '<i data-lucide="volume-x" class="w-4 h-4 text-gray-400"></i>';
    if (window.lucide) lucide.createIcons();
    showToast(this.audioEnabled ? 'Sound cues enabled' : 'Sound cues muted');
  }

  setTimer(sec) {
    this.timerSeconds = sec;
    [3, 5, 10].forEach(s => {
      const btn = document.getElementById(`timer-btn-${s}`);
      if (btn) {
        if (s === sec) {
          btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500 text-white shadow-sm transition-all';
        } else {
          btn.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 hover:bg-pink-100 transition-all';
        }
      }
    });
  }

  // BOLD Color Filter Selector
  setFilter(filterName) {
    this.currentFilter = filterName;
    const filterDef = FILTER_DEFINITIONS[filterName] || FILTER_DEFINITIONS.none;

    Object.keys(FILTER_DEFINITIONS).forEach(f => {
      const btn = document.getElementById(`filter-${f}`);
      if (btn) {
        if (f === filterName) {
          btn.classList.add('ring-2', 'ring-pink-500', 'border-pink-500', 'scale-105');
        } else {
          btn.classList.remove('ring-2', 'ring-pink-500', 'border-pink-500', 'scale-105');
        }
      }
    });

    // Apply Noticeable CSS Filter to Live Webcam Viewfinder
    this.video.style.filter = filterDef.css;
    document.getElementById('active-effect-label').textContent = filterDef.label;
    showToast(`Filter: ${filterDef.label}`);
  }

  // Capture Sequence (4 shots or single shot)
  async startCaptureSequence() {
    if (this.isCapturing) return;
    if (!this.stream) {
      await this.startCamera();
      if (!this.stream) return;
    }

    this.isCapturing = true;
    document.getElementById('start-sequence-btn').classList.add('opacity-50', 'pointer-events-none');

    const totalShots = this.currentLayout === 'polaroid' ? 1 : 4;
    for (let i = 0; i < totalShots; i++) {
      await this.runCountdown(this.timerSeconds);
      const snapshotUrl = await this.captureFrame();
      this.setShotSlot(i, snapshotUrl);
      await sleep(900); // brief pause between shots
    }

    this.isCapturing = false;
    document.getElementById('start-sequence-btn').classList.remove('opacity-50', 'pointer-events-none');
    showToast('✨ All shots captured! Customize your strip & download!');
  }

  async captureSingleShot() {
    if (this.isCapturing) return;
    if (!this.stream) {
      await this.startCamera();
      if (!this.stream) return;
    }

    let targetIndex = this.shots.findIndex(s => !s);
    if (targetIndex === -1) targetIndex = 0;

    this.isCapturing = true;
    await this.runCountdown(this.timerSeconds);
    const snapshotUrl = await this.captureFrame();
    this.setShotSlot(targetIndex, snapshotUrl);
    this.isCapturing = false;
    showToast(`📸 Shot #${targetIndex + 1} captured!`);
  }

  retakeSlot(index) {
    if (this.isCapturing) return;
    if (!this.stream) {
      this.startCamera();
      return;
    }

    this.isCapturing = true;
    showToast(`Retaking pose #${index + 1}... Get ready!`);
    this.runCountdown(this.timerSeconds).then(async () => {
      const snapshotUrl = await this.captureFrame();
      this.setShotSlot(index, snapshotUrl);
      this.isCapturing = false;
      showToast(`📸 Shot #${index + 1} updated!`);
    });
  }

  setShotSlot(index, dataUrl) {
    this.shots[index] = dataUrl;
    const imgElem = document.getElementById(`shot-preview-${index + 1}`);
    const placeholder = document.getElementById(`slot-placeholder-${index + 1}`);

    if (imgElem && placeholder) {
      imgElem.src = dataUrl;
      imgElem.classList.remove('hidden');
      placeholder.classList.add('hidden');
    }
  }

  async captureFrame() {
    // Flash Animation & Sound
    this.triggerFlash();
    if (this.audioEnabled) playBeep(880, 0.2);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');

    // Draw with BOLD Noticeable Filter
    const filterDef = FILTER_DEFINITIONS[this.currentFilter] || FILTER_DEFINITIONS.none;
    ctx.filter = filterDef.css;

    // Draw Video (mirrored if selfie mode)
    if (this.isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.94);
  }

  runCountdown(seconds) {
    return new Promise(resolve => {
      const overlay = document.getElementById('countdown-overlay');
      const numElem = document.getElementById('countdown-number');
      overlay.classList.remove('hidden');

      let current = seconds;
      numElem.textContent = current;
      if (this.audioEnabled) playBeep(520, 0.1);

      const interval = setInterval(() => {
        current--;
        if (current > 0) {
          numElem.textContent = current;
          if (this.audioEnabled) playBeep(520, 0.1);
        } else {
          clearInterval(interval);
          overlay.classList.add('hidden');
          resolve();
        }
      }, 1000);
    });
  }

  triggerFlash() {
    const flash = document.getElementById('camera-flash');
    if (flash) {
      flash.classList.remove('opacity-0');
      flash.classList.add('opacity-100');
      setTimeout(() => {
        flash.classList.remove('opacity-100');
        flash.classList.add('opacity-0');
      }, 180);
    }
  }

  // Bulk Upload
  handleBulkUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setShotSlot(index, e.target.result);
      };
      reader.readAsDataURL(file);
    });

    showToast('📸 Photos loaded into your strip!');
  }

  // Layouts & Themes
  setLayout(layoutName) {
    this.currentLayout = layoutName;
    ['strip4', 'grid4', 'polaroid'].forEach(l => {
      const btn = document.getElementById(`layout-${l}`);
      if (btn) {
        if (l === layoutName) {
          btn.className = 'p-2 rounded-xl border-2 border-pink-400 bg-pink-100/80 font-bold text-xs text-gray-800 transition-all text-center';
        } else {
          btn.className = 'p-2 rounded-xl border border-gray-200 hover:bg-pink-50 font-medium text-xs text-gray-800 transition-all text-center';
        }
      }
    });

    const card = document.getElementById('strip-card-container');
    card.classList.remove('layout-grid4', 'layout-polaroid');
    if (layoutName === 'grid4') card.classList.add('layout-grid4');
    if (layoutName === 'polaroid') card.classList.add('layout-polaroid');

    // Recalibrate doodle canvas dimensions
    setTimeout(() => this.recalibrateDoodleCanvas(), 50);
  }

  setThemeFrame(themeName) {
    this.currentTheme = themeName;
    const card = document.getElementById('strip-card-container');
    
    // Clear theme classes
    card.className = 'relative max-w-xs w-full shadow-2xl rounded-2xl p-4 transition-all duration-300 ' + `theme-${themeName}`;
    if (this.currentLayout === 'grid4') card.classList.add('layout-grid4');
    if (this.currentLayout === 'polaroid') card.classList.add('layout-polaroid');

    // Button active highlight
    ['hearts', 'pastel_rose', 'checkerboard', 'coquette_bows', 'sakura', 'film_negative', 'haru_white', 'midnight'].forEach(t => {
      const btn = document.getElementById(`theme-${t}`);
      if (btn) {
        if (t === themeName) {
          btn.classList.add('ring-2', 'ring-pink-500', 'scale-105');
        } else {
          btn.classList.remove('ring-2', 'ring-pink-500', 'scale-105');
        }
      }
    });
  }

  setCustomThemeColor(hex) {
    this.customThemeHex = hex;
    this.currentTheme = 'custom';
    const card = document.getElementById('strip-card-container');
    card.className = 'relative max-w-xs w-full shadow-2xl rounded-2xl p-4 transition-all duration-300';
    if (this.currentLayout === 'grid4') card.classList.add('layout-grid4');
    if (this.currentLayout === 'polaroid') card.classList.add('layout-polaroid');
    card.style.backgroundColor = hex;
    card.style.border = '6px solid #ffffff';
  }

  updateStripFooter() {
    const names = document.getElementById('stamp-names').value || 'Kirsten & Ycany';
    const date = document.getElementById('stamp-date').value || 'September 19, 2026';
    const quote = document.getElementById('stamp-quote').value || '7 Months of Magic • Forever & Always';

    document.getElementById('footer-display-names').textContent = names;
    document.getElementById('footer-display-date').textContent = date;
    document.getElementById('footer-display-quote').textContent = quote;
  }

  // ========================================================
  // INTERACTIVE STICKERS WITH BULLETPROOF REMOVAL
  // ========================================================
  addSticker(stickerContent) {
    const container = document.getElementById('stickers-overlay-container');
    const elem = document.createElement('div');
    elem.className = 'booth-sticker text-2xl is-selected';
    elem.style.left = '38%';
    elem.style.top = '35%';

    const contentSpan = document.createElement('span');
    contentSpan.textContent = stickerContent;
    if (stickerContent.length > 4) {
      elem.className = 'booth-sticker text-xs px-2.5 py-1 bg-white/95 rounded-full border border-pink-300 shadow-md font-bold text-gray-800 is-selected';
    }

    // Prominent Delete Button ✕
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-handle';
    deleteBtn.innerHTML = '✕';
    deleteBtn.title = 'Remove this sticker';

    // Direct removal on click or pointerdown
    const removeThisSticker = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.removeStickerElement(elem);
    };

    deleteBtn.addEventListener('click', removeThisSticker);
    deleteBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    elem.appendChild(contentSpan);
    elem.appendChild(deleteBtn);
    container.appendChild(elem);

    const stickerObj = {
      element: elem,
      content: stickerContent,
      x: 38,
      y: 35
    };
    this.stickers.push(stickerObj);

    // Select this sticker
    this.selectSticker(stickerObj);

    // Make Draggable
    this.makeDraggable(elem, stickerObj);
    showToast('Sticker added! Click ✕ or press Delete to remove.');
  }

  selectSticker(stickerObj) {
    // Deselect previous
    this.stickers.forEach(s => s.element.classList.remove('is-selected'));
    if (stickerObj) {
      stickerObj.element.classList.add('is-selected');
      this.selectedSticker = stickerObj;
    } else {
      this.selectedSticker = null;
    }
  }

  deleteSelectedSticker() {
    if (this.selectedSticker) {
      this.removeStickerElement(this.selectedSticker.element);
      showToast('Sticker removed');
    } else if (this.stickers.length > 0) {
      // Remove last sticker if none specifically selected
      const last = this.stickers[this.stickers.length - 1];
      this.removeStickerElement(last.element);
      showToast('Sticker removed');
    } else {
      showToast('No sticker to delete');
    }
  }

  removeStickerElement(elem) {
    elem.remove();
    this.stickers = this.stickers.filter(s => s.element !== elem);
    if (this.selectedSticker && this.selectedSticker.element === elem) {
      this.selectedSticker = null;
    }
  }

  makeDraggable(elem, stickerObj) {
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let elemStartX = 0;
    let elemStartY = 0;

    elem.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('delete-handle')) return;
      this.selectSticker(stickerObj);
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      elemStartX = elem.offsetLeft;
      elemStartY = elem.offsetTop;
      elem.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    elem.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      elem.style.left = `${elemStartX + dx}px`;
      elem.style.top = `${elemStartY + dy}px`;
    });

    elem.addEventListener('pointerup', (e) => {
      isDown = false;
      try { elem.releasePointerCapture(e.pointerId); } catch(err){}
    });
  }

  clearAllStickers() {
    const container = document.getElementById('stickers-overlay-container');
    container.innerHTML = '';
    this.stickers = [];
    this.selectedSticker = null;
    showToast('All stickers cleared');
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not focused on text input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (this.selectedSticker) {
          this.deleteSelectedSticker();
        }
      }
    });

    // Deselect stickers when clicking outside strip
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.booth-sticker') && !e.target.closest('#delete-selected-sticker-btn')) {
        this.selectSticker(null);
      }
    });
  }

  // ========================================================
  // ACCURATE DOODLE DRAWING (100% MOUSE & TOUCH TRACKING)
  // ========================================================
  setupDoodleCanvas() {
    if (!this.doodleCanvas) return;
    this.recalibrateDoodleCanvas();
    window.addEventListener('resize', () => this.recalibrateDoodleCanvas());

    let drawing = false;

    const getCanvasCoordinates = (e) => {
      const rect = this.doodleCanvas.getBoundingClientRect();
      const scaleX = this.doodleCanvas.width / rect.width;
      const scaleY = this.doodleCanvas.height / rect.height;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      if (!this.doodleModeEnabled) return;
      drawing = true;
      const pos = getCanvasCoordinates(e);

      // Save history snapshot before new stroke
      this.saveDoodleState();

      this.doodleCtx.beginPath();
      this.doodleCtx.moveTo(pos.x, pos.y);
      e.preventDefault();
    };

    const draw = (e) => {
      if (!drawing || !this.doodleModeEnabled) return;
      const pos = getCanvasCoordinates(e);

      const color = document.getElementById('doodle-color').value || '#e05780';
      this.doodleCtx.strokeStyle = color;
      this.doodleCtx.lineWidth = this.brushSize;
      this.doodleCtx.lineCap = 'round';
      this.doodleCtx.lineJoin = 'round';
      this.doodleCtx.lineTo(pos.x, pos.y);
      this.doodleCtx.stroke();
      e.preventDefault();
    };

    const stopDraw = () => {
      if (drawing) {
        drawing = false;
        this.doodleCtx.closePath();
      }
    };

    this.doodleCanvas.addEventListener('mousedown', startDraw);
    this.doodleCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    this.doodleCanvas.addEventListener('touchstart', startDraw, { passive: false });
    this.doodleCanvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  recalibrateDoodleCanvas() {
    if (!this.doodleCanvas) return;
    const parent = document.getElementById('strip-card-container');
    if (!parent) return;

    // Preserve existing drawing if any
    let backup = null;
    if (this.doodleCanvas.width > 0 && this.doodleCanvas.height > 0) {
      backup = this.doodleCanvas.toDataURL();
    }

    this.doodleCanvas.width = parent.offsetWidth;
    this.doodleCanvas.height = parent.offsetHeight;

    if (backup) {
      const img = new Image();
      img.onload = () => this.doodleCtx.drawImage(img, 0, 0);
      img.src = backup;
    }
  }

  saveDoodleState() {
    if (this.doodleCanvas) {
      if (this.doodleHistory.length > 15) this.doodleHistory.shift();
      this.doodleHistory.push(this.doodleCtx.getImageData(0, 0, this.doodleCanvas.width, this.doodleCanvas.height));
    }
  }

  undoDoodle() {
    if (this.doodleHistory.length > 0) {
      const prev = this.doodleHistory.pop();
      this.doodleCtx.putImageData(prev, 0, 0);
      showToast('Undone');
    }
  }

  setBrushSize(size) {
    this.brushSize = size;
    [2, 5, 10].forEach(s => {
      const btn = document.getElementById(`brush-size-${s}`);
      if (btn) {
        if (s === size) {
          btn.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500 text-white';
        } else {
          btn.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700';
        }
      }
    });
  }

  toggleDoodleMode() {
    this.doodleModeEnabled = !this.doodleModeEnabled;
    const btn = document.getElementById('doodle-btn');
    const text = document.getElementById('doodle-status-text');

    if (this.doodleModeEnabled) {
      this.doodleCanvas.classList.remove('pointer-events-none');
      btn.className = 'px-3 py-1.5 rounded-xl border border-pink-400 bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow';
      text.textContent = 'Doodle Pen Active';
      showToast('✏️ Pen active! Cursor is aligned for accurate drawing.');
    } else {
      this.doodleCanvas.classList.add('pointer-events-none');
      btn.className = 'px-3 py-1.5 rounded-xl border border-pink-300 bg-pink-50 hover:bg-pink-100 text-xs font-semibold text-pink-700 flex items-center gap-1.5';
      text.textContent = 'Enable Doodle Pen';
    }
  }

  clearDoodles() {
    if (this.doodleCtx && this.doodleCanvas) {
      this.saveDoodleState();
      this.doodleCtx.clearRect(0, 0, this.doodleCanvas.width, this.doodleCanvas.height);
      showToast('Doodles cleared');
    }
  }

  // ========================================================
  // HIGH-RESOLUTION CANVAS COMPOSITOR WITH UNIQUE CARD THEMES
  // ========================================================
  async renderExportCanvas() {
    const validShots = this.shots.filter(Boolean);
    if (validShots.length === 0) {
      alert('Please take or upload at least one photo first!');
      return null;
    }

    const canvas = document.getElementById('booth-export-canvas');
    const isPolaroid = this.currentLayout === 'polaroid';
    const isGrid = this.currentLayout === 'grid4';

    let width = 640;
    let height = 2000;

    if (isPolaroid) {
      width = 720;
      height = 920;
    } else if (isGrid) {
      width = 900;
      height = 1100;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. RENDER UNIQUE THEME BACKGROUND & PATTERNS
    this.drawThemeOnCanvas(ctx, width, height, this.currentTheme);

    // 2. RENDER PHOTOS INTO SLOTS
    if (isPolaroid) {
      const shotUrl = this.shots[0] || this.shots.find(Boolean);
      const shotW = width - 80;
      const shotH = shotW;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 46, shotW + 8, shotH + 8);
      const img = await loadImage(shotUrl);
      ctx.drawImage(img, 40, 50, shotW, shotH);
    } else if (isGrid) {
      const padX = 50;
      const padTop = 60;
      const shotW = 380;
      const shotH = 285;
      const gap = 30;

      for (let i = 0; i < 4; i++) {
        const shotUrl = this.shots[i];
        if (!shotUrl) continue;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = padX + col * (shotW + gap);
        const y = padTop + row * (shotH + gap);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, y - 4, shotW + 8, shotH + 8);
        const img = await loadImage(shotUrl);
        ctx.drawImage(img, x, y, shotW, shotH);
      }
    } else {
      // Classic 4-Shot Strip
      const padX = 50;
      const padTop = 60;
      const shotW = width - (padX * 2);
      const shotH = Math.round(shotW * 0.75); // 4:3
      const gap = 30;

      for (let i = 0; i < 4; i++) {
        const shotUrl = this.shots[i];
        if (!shotUrl) continue;
        const y = padTop + i * (shotH + gap);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX - 4, y - 4, shotW + 8, shotH + 8);
        const img = await loadImage(shotUrl);
        ctx.drawImage(img, padX, y, shotW, shotH);
      }
    }

    // 3. RENDER STICKERS
    const previewContainer = document.getElementById('strip-card-container');
    const scaleFactorX = width / previewContainer.offsetWidth;
    const scaleFactorY = height / previewContainer.offsetHeight;

    this.stickers.forEach(s => {
      const elem = s.element;
      const x = elem.offsetLeft * scaleFactorX;
      const y = elem.offsetTop * scaleFactorY;
      
      ctx.save();
      ctx.font = `${Math.round(28 * scaleFactorX)}px "Outfit", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      if (s.content.length > 4) {
        // Text Badge
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        const txtWidth = ctx.measureText(s.content).width + 20;
        ctx.fillRect(x, y, txtWidth, 36 * scaleFactorY);
        ctx.strokeRect(x, y, txtWidth, 36 * scaleFactorY);
        ctx.fillStyle = '#1f2937';
        ctx.font = `bold ${Math.round(16 * scaleFactorX)}px "Outfit", sans-serif`;
        ctx.fillText(s.content, x + 10, y + 8 * scaleFactorY);
      } else {
        // Emoji Sticker
        ctx.fillText(s.content, x, y);
      }
      ctx.restore();
    });

    // 4. RENDER ACCURATE DOODLE DRAWINGS
    if (this.doodleCanvas) {
      ctx.drawImage(this.doodleCanvas, 0, 0, width, height);
    }

    // 5. RENDER CARD FOOTER TEXT DEDICATION
    const names = document.getElementById('stamp-names').value || 'Kirsten & Ycany';
    const date = document.getElementById('stamp-date').value || 'September 19, 2026';
    const quote = document.getElementById('stamp-quote').value || '7 Months of Magic • Forever & Always';
    const isDark = this.currentTheme === 'midnight' || this.currentTheme === 'film_negative';

    const footerY = height - 120;
    ctx.textAlign = 'center';

    ctx.font = 'bold 32px "Playfair Display", serif';
    ctx.fillStyle = isDark ? '#ffffff' : '#374151';
    ctx.fillText('♥ OUR 7TH MONTHSARY ♥', width / 2, footerY);

    ctx.font = 'italic 24px "Dancing Script", cursive';
    ctx.fillStyle = isDark ? '#ff758f' : '#e11d48';
    ctx.fillText(`${names} • ${quote}`, width / 2, footerY + 40);

    ctx.font = '500 18px "Outfit", sans-serif';
    ctx.fillStyle = isDark ? '#a1a1aa' : '#6b7280';
    ctx.fillText(date, width / 2, footerY + 75);

    return canvas;
  }

  // Draw theme graphics onto export canvas
  drawThemeOnCanvas(ctx, width, height, theme) {
    if (theme === 'hearts') {
      // Pink Hearts Theme
      ctx.fillStyle = '#fff0f3';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#ff758f';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Mini repeating hearts pattern
      ctx.fillStyle = 'rgba(255, 117, 143, 0.22)';
      for (let y = 30; y < height - 100; y += 70) {
        for (let x = 20; x < width; x += 70) {
          ctx.font = '22px sans-serif';
          ctx.fillText('♥', x, y);
        }
      }

    } else if (theme === 'pastel_rose') {
      // Pastel Rose with Botanical Rose Bouquets
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Draw Roses in corners
      this.drawCanvasRose(ctx, 45, 45, 1.2);
      this.drawCanvasRose(ctx, width - 45, 45, 1.2);
      this.drawCanvasRose(ctx, 45, height - 70, 1.2);
      this.drawCanvasRose(ctx, width - 45, height - 70, 1.2);

    } else if (theme === 'checkerboard') {
      // Pastel Pink & White Checkered Pattern
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffccd5';
      const tileSize = 40;
      for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
            ctx.fillRect(x, y, tileSize, tileSize);
          }
        }
      }
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

    } else if (theme === 'coquette_bows') {
      // Coquette Pink Bows Theme
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Bow stamps
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎀', 45, 45);
      ctx.fillText('🎀', width - 45, 45);
      ctx.fillText('🎀', 45, height - 60);
      ctx.fillText('🎀', width - 45, height - 60);

    } else if (theme === 'sakura') {
      // Sakura Blossoms
      ctx.fillStyle = '#fdf2f8';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);
      ctx.font = '30px sans-serif';
      ctx.fillText('🌸', 45, 45);
      ctx.fillText('🌸', width - 45, 45);

    } else if (theme === 'film_negative') {
      // Vintage 35mm Film Roll
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Film sprockets
      ctx.fillStyle = '#18181b';
      for (let y = 30; y < height - 30; y += 45) {
        ctx.fillRect(14, y, 16, 26);
        ctx.fillRect(width - 30, y, 16, 26);
      }

    } else if (theme === 'midnight') {
      // Starry Midnight
      ctx.fillStyle = '#0f0715';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#701a75';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '24px sans-serif';
      ctx.fillText('✨', 45, 45);
      ctx.fillText('✨', width - 45, 45);

    } else if (theme === 'custom') {
      ctx.fillStyle = this.customThemeHex;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

    } else {
      // Haru White
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#fce7f3';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);
    }
  }

  drawCanvasRose(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Green leaves
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(-14, 14, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -14, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Rose petals
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  async downloadStripPNG() {
    const canvas = await this.renderExportCanvas();
    if (!canvas) return;

    const filename = `kirsten_ycany_photobooth_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.png`;

    // Try modern File System Access API
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
        if (err.name !== 'AbortError') console.warn('File picker fallback:', err);
        else return;
      }
    }

    // Standard download fallback
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Photobooth strip saved to your computer!');
  }

  async saveStripToVault() {
    const canvas = await this.renderExportCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newMemory = {
      id: 'booth_' + Date.now(),
      url: dataUrl,
      caption: '📸 7th Monthsary Photobooth Strip (Kirsten & Ycany) 💕',
      location: 'Photobooth Studio',
      date: 'September 19, 2026',
      rotation: -1,
      createdAt: Date.now()
    };

    await saveUserPhoto(newMemory);
    showToast('💖 Saved to Memory Vault! It will now show on your main page marquee & gallery!');
  }

  printStrip() {
    window.print();
  }

  resetAllShots() {
    if (!confirm('Are you sure you want to clear all shots?')) return;
    this.shots = [null, null, null, null];
    for (let i = 1; i <= 4; i++) {
      const img = document.getElementById(`shot-preview-${i}`);
      const placeholder = document.getElementById(`slot-placeholder-${i}`);
      if (img) img.classList.add('hidden');
      if (placeholder) placeholder.classList.remove('hidden');
    }
    this.clearAllStickers();
    this.clearDoodles();
    showToast('Strip reset to empty');
  }
}

const boothApp = new PhotoboothApp();

// Helpers
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
  } catch (e) {}
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'glass-pill px-4 py-2.5 rounded-full text-xs font-semibold text-gray-800 shadow-xl border border-pink-200 bg-white/95 flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('monthsary_theme', themeName);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('monthsary_theme') || 'default';
  setTheme(savedTheme);
  new ParticleEngine('particles-canvas');
  if (window.lucide) lucide.createIcons();
});
