// Kirsten & Ycany - Shared Romantic Audio Engine (Seamless Multi-Page Playback)

const LOCAL_PLAYLIST = {
  risk_it_all: {
    src: 'songs/risk_it_all.mp3',
    fallbackSrc: 'songs/Bruno%20Mars%20-%20Risk%20It%20All%20[Official%20Music%20Video].mp3',
    title: 'Bruno Mars - Risk It All',
    artist: 'Bruno Mars',
    subtitle: 'Risk It All',
    icon: '💖'
  },
  soft_spot: {
    src: 'songs/soft_spot.mp3',
    fallbackSrc: 'songs/keshi%20-%20Soft%20Spot%20(Official%20Music%20Video).mp3',
    title: 'keshi - Soft Spot',
    artist: 'keshi',
    subtitle: 'Soft Spot',
    icon: '🌸'
  },
  kabisado: {
    src: 'songs/kabisado.mp3',
    fallbackSrc: 'songs/IV%20OF%20SPADES%20-%20Kabisado%20(Official%20Lyric%20Video).mp3',
    title: 'IV of Spades - Kabisado',
    artist: 'IV of Spades',
    subtitle: 'Kabisado',
    icon: '✨'
  }
};
const PLAYLIST_KEYS = ['risk_it_all', 'soft_spot', 'kabisado'];

class RomanticAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.isPlaying = false;
    this.isDockOpen = false;
    this.currentTrackKey = 'risk_it_all';
    this.currentTitle = 'Bruno Mars - Risk It All';
    this.initAudioEvents();
    this.restoreState();
    this.initDomBindings();
  }

  initAudioEvents() {
    // Time update listener & continuous state saving
    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio.duration) return;
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      const slider = document.getElementById('audio-progress');
      if (slider) slider.value = progress || 0;

      const currentElem = document.getElementById('audio-current-time');
      if (currentElem) currentElem.textContent = this.formatTime(this.audio.currentTime);

      const durationElem = document.getElementById('audio-duration');
      if (durationElem) durationElem.textContent = this.formatTime(this.audio.duration);

      // Save playback timestamp every second while playing
      if (this.isPlaying) {
        localStorage.setItem('monthsary_music_time', this.audio.currentTime);
      }
    });

    // Metadata loaded
    this.audio.addEventListener('loadedmetadata', () => {
      const durationElem = document.getElementById('audio-duration');
      if (durationElem) durationElem.textContent = this.formatTime(this.audio.duration);
    });

    // Autoplay next track on end
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });

    // Fallback on error (try original file name)
    this.audio.addEventListener('error', () => {
      const track = LOCAL_PLAYLIST[this.currentTrackKey];
      if (track && track.fallbackSrc && this.audio.src !== track.fallbackSrc) {
        this.audio.src = track.fallbackSrc;
        if (this.isPlaying) this.audio.play().catch(() => {});
      }
    });

    // Save exact position on page exit
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('monthsary_music_time', this.audio.currentTime || 0);
      localStorage.setItem('monthsary_music_playing', this.isPlaying ? 'true' : 'false');
      localStorage.setItem('monthsary_music_track', this.currentTrackKey);
      localStorage.setItem('monthsary_music_volume', this.audio.volume);
    });

    // Instant save when clicking any page navigation link
    document.addEventListener('click', (e) => {
      const link = e.target.closest && e.target.closest('a');
      if (link && link.href && !link.href.includes('#')) {
        localStorage.setItem('monthsary_music_time', this.audio.currentTime || 0);
        localStorage.setItem('monthsary_music_playing', this.isPlaying ? 'true' : 'false');
        localStorage.setItem('monthsary_music_track', this.currentTrackKey);
        localStorage.setItem('monthsary_music_volume', this.audio.volume);
      }
    });

    // Handle browser autoplay policy: if music was playing on prior page, resume on first user interaction if blocked
    const resumeOnGesture = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#play-music-btn, #dock-main-play-btn')) {
        return; // User clicked the play button directly, let button handler run
      }
      if (localStorage.getItem('monthsary_music_playing') === 'true' && !this.isPlaying) {
        const savedTime = parseFloat(localStorage.getItem('monthsary_music_time') || '0');
        if (savedTime > 0 && Math.abs(this.audio.currentTime - savedTime) > 2) {
          try { this.audio.currentTime = savedTime; } catch (_) {}
        }
        this.audio.play().then(() => {
          this.isPlaying = true;
          localStorage.setItem('monthsary_music_playing', 'true');
          updateMusicUI(true);
        }).catch(() => {});
      }
      window.removeEventListener('pointerdown', resumeOnGesture);
      window.removeEventListener('click', resumeOnGesture);
      window.removeEventListener('keydown', resumeOnGesture);
    };
    window.addEventListener('pointerdown', resumeOnGesture, { passive: true });
    window.addEventListener('click', resumeOnGesture, { passive: true });
    window.addEventListener('keydown', resumeOnGesture, { passive: true });
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  restoreState() {
    const savedTrack = localStorage.getItem('monthsary_music_track') || 'risk_it_all';
    const savedTime = parseFloat(localStorage.getItem('monthsary_music_time') || '0');
    const wasPlaying = localStorage.getItem('monthsary_music_playing') === 'true';
    const savedVol = parseFloat(localStorage.getItem('monthsary_music_volume') || '0.8');

    this.currentTrackKey = savedTrack;
    const track = LOCAL_PLAYLIST[savedTrack] || LOCAL_PLAYLIST.risk_it_all;
    this.currentTitle = track.title;
    this.audio.src = track.src;
    this.audio.volume = savedVol;

    // Apply saved timestamp once metadata or audio can play
    if (savedTime > 0) {
      const applyTimestamp = () => {
        try {
          if (savedTime < (this.audio.duration || Infinity)) {
            this.audio.currentTime = savedTime;
          }
        } catch (_) {}
      };
      if (this.audio.readyState >= 1) {
        applyTimestamp();
      } else {
        this.audio.addEventListener('loadedmetadata', applyTimestamp, { once: true });
      }
    }

    // If was playing on previous page, resume seamlessly!
    if (wasPlaying) {
      const resumeAudio = () => {
        if (savedTime > 0 && (!this.audio.currentTime || Math.abs(this.audio.currentTime - savedTime) > 2)) {
          try { this.audio.currentTime = savedTime; } catch (_) {}
        }
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.isPlaying = true;
            updateMusicUI(true);
          }).catch((err) => {
            console.log('Autoplay waiting for user gesture:', err);
            // Will resume immediately on first click or touch
            this.isPlaying = false;
            updateMusicUI(false);
          });
        }
      };

      if (this.audio.readyState >= 2) {
        resumeAudio();
      } else {
        this.audio.addEventListener('canplay', resumeAudio, { once: true });
      }
    }
  }

  initDomBindings() {
    const bindElements = () => {
      const volSlider = document.getElementById('audio-volume');
      if (volSlider) volSlider.value = this.audio.volume;

      const track = LOCAL_PLAYLIST[this.currentTrackKey] || LOCAL_PLAYLIST.risk_it_all;
      this.updateTrackDisplays(track);
      updateMusicUI(this.isPlaying);

      // Bind custom upload input
      const songFileInput = document.getElementById('song-file-input');
      if (songFileInput) {
        songFileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            this.loadUserAudio(e.target.files[0]);
          }
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindElements);
    } else {
      bindElements();
    }
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
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      localStorage.setItem('monthsary_music_playing', 'false');
      updateMusicUI(false);
    } else {
      const track = LOCAL_PLAYLIST[this.currentTrackKey];
      if (!this.audio.src || this.audio.src === '' || this.audio.src === window.location.href) {
        this.selectTrack(this.currentTrackKey);
      } else {
        this.audio.play().then(() => {
          this.isPlaying = true;
          localStorage.setItem('monthsary_music_playing', 'true');
          updateMusicUI(true);
        }).catch(err => {
          console.warn('Playback error, trying fallback:', err);
          if (track && track.fallbackSrc) {
            this.audio.src = track.fallbackSrc;
            this.audio.play().then(() => {
              this.isPlaying = true;
              localStorage.setItem('monthsary_music_playing', 'true');
              updateMusicUI(true);
            }).catch(() => {});
          }
        });
      }
    }
  }

  selectTrack(key) {
    if (!LOCAL_PLAYLIST[key]) return;
    this.currentTrackKey = key;
    const track = LOCAL_PLAYLIST[key];
    this.currentTitle = track.title;

    this.audio.src = track.src;
    this.audio.play().then(() => {
      this.isPlaying = true;
      localStorage.setItem('monthsary_music_playing', 'true');
      localStorage.setItem('monthsary_music_track', key);
      localStorage.setItem('monthsary_music_time', 0);
      updateMusicUI(true);
    }).catch(() => {
      if (track.fallbackSrc) {
        this.audio.src = track.fallbackSrc;
        this.audio.play().then(() => {
          this.isPlaying = true;
          localStorage.setItem('monthsary_music_playing', 'true');
          localStorage.setItem('monthsary_music_track', key);
          localStorage.setItem('monthsary_music_time', 0);
          updateMusicUI(true);
        }).catch(() => {});
      }
    });

    this.updateTrackDisplays(track);
    if (typeof showToast === 'function') {
      showToast(`Playing: ${track.title}`);
    }
  }

  updateTrackDisplays(track) {
    // Highlight active song button
    PLAYLIST_KEYS.forEach(k => {
      const btn = document.getElementById(`dock-btn-${k}`);
      if (btn) {
        if (k === this.currentTrackKey) {
          btn.className = 'p-2 rounded-xl text-center border border-pink-400 bg-pink-100/90 shadow-sm transition-all';
        } else {
          btn.className = 'p-2 rounded-xl text-center border border-gray-200 hover:bg-pink-50 transition-all';
        }
      }
    });

    const dockTitle = document.getElementById('dock-song-title');
    if (dockTitle) dockTitle.textContent = track.title;

    const artistElem = document.getElementById('dock-song-artist');
    if (artistElem) artistElem.textContent = track.artist;

    const subElem = document.getElementById('dock-song-subtitle');
    if (subElem) subElem.textContent = track.subtitle;

    const iconElem = document.getElementById('dock-album-icon');
    if (iconElem) iconElem.textContent = track.icon;

    const statusText = document.getElementById('music-status-text');
    if (statusText) statusText.textContent = track.title;
  }

  nextTrack() {
    const currentIndex = PLAYLIST_KEYS.indexOf(this.currentTrackKey);
    const nextIndex = (currentIndex + 1) % PLAYLIST_KEYS.length;
    this.selectTrack(PLAYLIST_KEYS[nextIndex]);
  }

  prevTrack() {
    const currentIndex = PLAYLIST_KEYS.indexOf(this.currentTrackKey);
    const prevIndex = (currentIndex - 1 + PLAYLIST_KEYS.length) % PLAYLIST_KEYS.length;
    this.selectTrack(PLAYLIST_KEYS[prevIndex]);
  }

  seekAudio(val) {
    if (!this.audio.duration) return;
    this.audio.currentTime = (val / 100) * this.audio.duration;
    localStorage.setItem('monthsary_music_time', this.audio.currentTime);
  }

  setVolume(val) {
    this.audio.volume = parseFloat(val);
    localStorage.setItem('monthsary_music_volume', val);
  }

  loadUserAudio(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.audio.src = e.target.result;
      this.currentTitle = file.name.replace(/\.[^/.]+$/, "") || 'Custom Song';

      const dockTitle = document.getElementById('dock-song-title');
      if (dockTitle) dockTitle.textContent = this.currentTitle;

      const artistElem = document.getElementById('dock-song-artist');
      if (artistElem) artistElem.textContent = 'Custom Song';

      const subElem = document.getElementById('dock-song-subtitle');
      if (subElem) subElem.textContent = file.name;

      this.audio.play().then(() => {
        this.isPlaying = true;
        localStorage.setItem('monthsary_music_playing', 'true');
        updateMusicUI(true);
        if (typeof showToast === 'function') showToast('Custom song loaded & playing');
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
  }
}

const musicPlayer = new RomanticAudioPlayer();

function updateMusicUI(playing) {
  const bottomDisc = document.getElementById('vinyl-disc');
  const dockDisc = document.getElementById('dock-vinyl-disc');
  const bottomBtn = document.getElementById('play-music-btn');
  const dockBtn = document.getElementById('dock-main-play-btn');
  const text = document.getElementById('music-status-text');

  if (playing) {
    if (bottomDisc) bottomDisc.classList.add('playing');
    if (dockDisc) dockDisc.classList.add('playing');
    if (bottomBtn) bottomBtn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 text-white"></i>';
    if (dockBtn) dockBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4 fill-white"></i>';
    if (text) text.textContent = musicPlayer.currentTitle;
  } else {
    if (bottomDisc) bottomDisc.classList.remove('playing');
    if (dockDisc) dockDisc.classList.remove('playing');
    if (bottomBtn) bottomBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 text-white"></i>';
    if (dockBtn) dockBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-white ml-0.5"></i>';
    if (text) text.textContent = musicPlayer.currentTitle;
  }
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}
