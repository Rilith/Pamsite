document.addEventListener('DOMContentLoaded', () => {
  // ─── CACHE ROOT ELEMENTS ─────────────────────────────────
  const content      = document.getElementById('content');
  const navbarLinks  = () => document.querySelectorAll('.navbar a');
  const modal        = document.getElementById('gif-modal');
  const modalImg     = document.getElementById('modal-image');
  const modalTitle   = document.getElementById('modal-title');
  const toastRoot    = document.body;
  const sparkle      = document.createElement('div');

  // ─── PAGE CONFIGURATION ────────────────────────────────────
  const pageConfig = {
    'home-page':      { file: '/pages/home-page.html',     path: '/' },
    'about-page':     { file: '/pages/about-page.html',    path: '/about' },
    'anime-page':     { file: '/pages/anime-page.html',    path: '/anime' },
    'videogame-page': { file: '/pages/videogame-page.html',path: '/videogame' },
    'games-page':    { file: '/pages/games-page.html',   path: '/arcade' },
    'guestbook-page': { file: '/pages/guestbook.html',      path: '/guestbook' },
    'download-page':  { file: '/pages/download-page.html',  path: '/download' },
    'setup-page':     { file: '/pages/setup-page.html',     path: '/setup' },
    'login-page':     { file: '/pages/login-page.html',     path: '/login' },
    'register-page':  { file: '/pages/register-page.html',  path: '/register' },
    'profile-page':   { file: '/pages/profile-page.html',   path: '/profile' },
    'blog-page':      { file: '/pages/blog-page.html',      path: '/blog' },
    'post-page':      { file: '/pages/post-page.html',      path: '/post' },
    'error404-page':  { file: '/error404.html',            path: '/404' }
  };

  // ─── UTILITY FUNCTIONS ────────────────────────────────────
  const showToast = msg => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '20px', left: '50%',
      transform: 'translateX(-50%)', padding: '6px 12px',
      background: '#000', color: '#0ff',
      border: '1px solid #f0f', borderRadius: '4px',
      zIndex: 10000, fontSize: '12px'
    });
    toastRoot.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  // basic helpers shared across modules
  window.sanitize = function(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  window.parseFormatting = function(str){
    return str
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi,'<strong>$1<\/strong>')
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi,'<em>$1<\/em>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi,'<blockquote>$1<\/blockquote>')
      .replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi,'<a href="$1" target="_blank">$2<\/a>')
      .replace(/\[url\]([\s\S]*?)\[\/url\]/gi,'<a href="$1" target="_blank">$1<\/a>')
      .replace(/\[img\]([\s\S]*?)\[\/img\]/gi,'<img src="$1" class="blog-inline-img">')
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi,'<pre><code>$1<\/code><\/pre>')
      .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi,'<span style="font-size:$1px">$2<\/span>')
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,'<span style="color:$1">$2<\/span>')
      .replace(/\[left\]([\s\S]*?)\[\/left\]/gi,'<div style="text-align:left">$1<\/div>')
      .replace(/\[center\]([\s\S]*?)\[\/center\]/gi,'<div style="text-align:center">$1<\/div>')
      .replace(/\[right\]([\s\S]*?)\[\/right\]/gi,'<div style="text-align:right">$1<\/div>')
      .replace(/\[justify\]([\s\S]*?)\[\/justify\]/gi,'<div style="text-align:justify">$1<\/div>')
      .replace(/\[p\]([\s\S]*?)\[\/p\]/gi,'<p>$1<\/p>')
      .replace(/\[ul\]([\s\S]*?)\[\/ul\]/gi,'<ul>$1<\/ul>')
      .replace(/\[ol\]([\s\S]*?)\[\/ol\]/gi,'<ol>$1<\/ol>')
      .replace(/\[li\]([\s\S]*?)\[\/li\]/gi,'<li>$1<\/li>')
      .replace(/\[cite\]([\s\S]*?)\[\/cite\]/gi,'<cite>$1<\/cite>');
  };

  window.slugify = function(str){
    return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  };

  window.wrapSelection = function(textarea,before,after){
    const s=textarea.selectionStart;
    const e=textarea.selectionEnd;
    const v=textarea.value;
    textarea.value=v.slice(0,s)+before+v.slice(s,e)+after+v.slice(e);
    textarea.focus();
    textarea.selectionStart=s+before.length;
    textarea.selectionEnd=e+before.length;
  };

  window.insertAtCursor = function(textarea,text){
    const s=textarea.selectionStart;
    const e=textarea.selectionEnd;
    textarea.value=textarea.value.slice(0,s)+text+textarea.value.slice(e);
    textarea.focus();
    textarea.selectionStart=textarea.selectionEnd=s+text.length;
  };

  function openModal(imgSrc, title) {
    modalImg.src = imgSrc;
    modalImg.alt = title;
    modalTitle.textContent = title;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    modalImg.src = '';
    modalImg.alt = '';
    modalTitle.textContent = '';
}

  window.openPost = function(path){
    showPage('post-page', true, `/${path}`, { path });
  };

  const getRandomColor = () => {
    const cols = ['#ff00ff','#00ffff','#ffff00','#00ff00','#ff0000','#0000ff'];
    return cols[Math.floor(Math.random() * cols.length)];
  };

  // ─── RENDER SECTION FOR DOWNLOAD PAGE ──────────────────────
  async function renderSection(cat) {
    const section = content.querySelector(`[data-download-cat="${cat}"]`);
    if (!section) return;
    const items = await fetch(`/api/downloads/${cat}`).then(r => r.json());
    const grid  = document.createElement('div');
    grid.className = 'download-grid';
    items.forEach(it => {
      grid.insertAdjacentHTML('beforeend', `
        <div class="download-item">
          <div class="download-thumb">
            <img src="${it.thumb}" alt="${it.name} thumbnail">
          </div>
          <div class="download-caption">
            <div class="download-title">${it.name}</div>
            <div class="download-info">${it.info}</div>
            <a href="/downloads/${cat}/${it.file}"
               class="download-button"
               data-file="${cat}/${it.file}"
               download>DOWNLOAD</a>
          </div>
        </div>`);
    });
    section.appendChild(grid);
  }

  async function showPage(id, push = true, customPath = null, state = {}) {
    if (window.closeGameView) {
      window.closeGameView();
      window.closeGameView = null;
    }
    /* ------------------------------------------------------------------ */
    /* 0. Pick the config entry (or fall back to “error404-page”)          */
    /* ------------------------------------------------------------------ */
    const cfg = pageConfig[id];
    const key = cfg ? id : 'error404-page';
    const { file, path } = pageConfig[key];
  
    /* ------------------------------------------------------------------ */
    /* 1. Fetch the HTML fragment                                          */
    /* ------------------------------------------------------------------ */
    let html;
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(res.status);
      html = await res.text();
    } catch (err) {
      console.error('❌ fragment fetch failed → 404', err);
      const r404 = await fetch(pageConfig['error404-page'].file);
      html = await r404.text();
      push = false;                         // don’t push /404
    }
  
    content.innerHTML = html;
  
    /* ------------------------------------------------------------------ */
    /* 2. Update the address bar (skip if we’re showing the 404 fragment)  */
    /* ------------------------------------------------------------------ */
    if (push && key !== 'error404-page') {
      history.pushState({ page: key, ...state }, '', customPath || path);
    }
  
    /* ------------------------------------------------------------------ */
    /* 3. Run any page‑specific hooks (isolated so they can’t 404 us)      */
    /* ------------------------------------------------------------------ */
    try {
      switch (key) {
        case 'home-page':
          initChat?.();
          break;
        case 'download-page':
          await Promise.all([
            renderSection('wallpapers'),
            renderSection('midi'),
            renderSection('cursors')
          ]);
          break;
        case 'guestbook-page':
          initGuestbook?.();
          break;
        case 'login-page':
          initLogin?.();
          break;
        case 'register-page':
          initRegister?.();
          break;
        case 'games-page':
          initGames?.();
          break;
        case 'profile-page':
          initProfile?.();
          break;
        case 'blog-page':
          initBlog?.();
          break;
        case 'post-page':
          initPostPage?.();
          break;
        // add more page hooks here if needed
      }
    } catch (hookErr) {
      console.warn('⚠️ hook error in', key, hookErr);
    }
  
    /* ------------------------------------------------------------------ */
    /* 4. Highlight the active navbar link                                 */
    /* ------------------------------------------------------------------ */
    navbarLinks().forEach(a =>
      a.classList.toggle('active', a.dataset.pageTarget === id)
    );
  }
  
  

  // handle back/fwd
  window.addEventListener('popstate', e => {
    showPage(e.state?.page || 'home-page', false, location.pathname + location.search, e.state || {});
  });

  // ─── INITIAL ROUTE ────────────────────────────────────────
  let start = Object.entries(pageConfig)
    .find(([,cfg]) => cfg.path === location.pathname)?.[0];
  const startState = {};
  if (!start && location.pathname.split('/').length >= 3) {
    start = 'post-page';
    startState.path = location.pathname.slice(1);
  } else if (!start && location.pathname.startsWith('/post/')) {
    start = 'post-page';
    startState.path = location.pathname.split('/').pop();
  }
  if (!start) start = 'error404-page';
  showPage(start, false, location.pathname + location.search, startState);

  // ─── GLOBAL EVENT DELEGATION ──────────────────────────────
  document.body.addEventListener('click', e => {
    // SPA nav
    const nav = e.target.closest('[data-page-target]');
    if (nav) {
      e.preventDefault();
      showPage(nav.dataset.pageTarget, true);
      return;
    }

    const postLink = e.target.closest('[data-open-post]');
    if(postLink){
      e.preventDefault();
      openPost(postLink.dataset.openPost);
      return;
    }

    // modal open
    const gif = e.target.closest('.gif-item');
    if (gif) {
      openModal(gif.dataset.gifSrc, gif.dataset.gifTitle);
      return;
    }

    // modal close
    if (e.target.matches('#close-modal-button') || e.target === modal) {
      closeModal();
      return;
    }

    // download toast
    const dl = e.target.closest('.download-button');
    if (dl) {
      showToast(`Download di “${dl.dataset.file}” avviato…`);
      // let browser handle the actual download
    }
  });

  // ─── SPARKLE EFFECT (throttled) ───────────────────────────
  document.addEventListener('mousemove', e => {
    sparkle.style.display = 'block';
    sparkle.style.left    = `${e.pageX+5}px`;
    sparkle.style.top     = `${e.pageY+5}px`;
    sparkle.style.backgroundColor = getRandomColor();
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left     = `${e.pageX + Math.random()*20 - 10}px`;
    temp.style.top      = `${e.pageY + Math.random()*20 - 10}px`;
    temp.style.width    = '8px';
    temp.style.height   = '8px';
    temp.style.backgroundColor = getRandomColor();
    temp.style.borderRadius = '50%';
    temp.style.pointerEvents = 'none';
    temp.style.transition = 'all 0.5s ease-out';
    temp.style.opacity = '1';
    temp.style.zIndex = '999';
    temp.style.transform = 'scale(1)';
    document.body.appendChild(temp);
    setTimeout(() => {
        temp.style.opacity = '0';
        temp.style.transform = 'scale(0)';
        setTimeout(() => document.body.removeChild(temp),500);
    },100);
  });
  document.addEventListener('mouseleave', () => sparkle.style.display = 'none');
  document.addEventListener('mouseenter', () => sparkle.style.display = 'block');

  audioPlayer.addEventListener('click', event => {
      const btn = event.target.closest('button[data-audio-action]');
  });

  let titleSparkle = true;
  setInterval(() => {
      document.title = titleSparkle ? '★★★ Pamsite ★★★' : '✨ Pamsite ✨';
      titleSparkle = !titleSparkle;
  },1000);
  });

  // ─── OPTIONAL: PAGE‐SPECIFIC JS LOADERS ──────────────────
  // If you need to load any third‐party widget scripts (e.g. SoundCloud),
  // you can detect by page ID here and initialize.
  // e.g. if (currentPage === 'setup-page') initSetupTutorial();



// ──── Audio player avanzato ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const widget = SC.Widget(document.getElementById('sc-player'));
  window.audioWidget = widget; // expose for other modules
  const nowPlayingEl = document.getElementById('now-playing');
  const volSlider = document.getElementById('vol');
  const playerBox = document.getElementById('audio-player');
  const progressBar = document.getElementById('progress-bar');
  const progressCurrent = document.getElementById('progress-current');
  const timeDisplay = document.getElementById('time-display');
  const trackList = document.getElementById('track-list');
  const toggleSizeBtn = document.getElementById('toggle-player-size');
  const playlistContainer = document.getElementById('playlist-container');
  
  let tracks = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let progressInterval;
  let isDraggingProgress = false;

  /* ===--- title-refresh helper (retry up to 5×) ---=== */
  const UNTITLED = '(untitled)';
  function refreshTitles(attempt = 1){
    widget.getSounds(list => {
      let missing = 0;

      list.forEach((trk, idx) => {
        if (!trk.title){ missing++; return; }

        const span = document.querySelector(
          `#track-list li[data-index="${idx}"] .track-title`
        );
        if (span && span.textContent === UNTITLED){
          span.textContent = trk.title;
        }
      });

      if (missing && attempt < 5){
        setTimeout(() => refreshTitles(attempt + 1), 1500 * attempt);
      }
    });
  }


  // Espandi/riduci il player
  toggleSizeBtn.addEventListener('click', () => {
    playerBox.classList.toggle('minimized');
    if (playerBox.classList.contains('minimized')) {
      toggleSizeBtn.textContent = '[ ]';
      toggleSizeBtn.classList.add('expand-icon');
    } else {
      toggleSizeBtn.textContent = '_';
      toggleSizeBtn.classList.remove('expand-icon');
    }
  });

  // Inizializza il player quando il widget è caricato
  widget.bind(SC.Widget.Events.READY, () => {
    // Carica la playlist
    widget.getSounds(soundsData => {
      tracks = soundsData;
      
      // Aggiungere il contatore delle tracce se ce ne sono tante
      // ⬇ after tracks.forEach(...)
      if (tracks.length > 5) {
        const trackCount = document.createElement('span');
        trackCount.className = 'track-count';
        trackCount.textContent = `${tracks.length} tracks`;
        document.querySelector('.playlist-header').appendChild(trackCount);   // was playlistContainer
      }

      
      // Popola la lista tracce
      tracks.forEach((track, index) => {
        const li  = document.createElement('li');
        li.dataset.index = index;
      
        const titleSpan = document.createElement('span');   // <<< NEW
        titleSpan.className = 'track-title';
        titleSpan.textContent = track.title || '(untitled)';
        li.appendChild(titleSpan);
      
        li.addEventListener('click', () => {
          widget.skip(index);
          updateActiveTrack(index);
        });
      
        trackList.appendChild(li);
      });
      
      
      tryAutoplay();
      setTimeout(() => refreshTitles(), 200);   // first retry after 0.2 s

    });
  });

  // Aggiorna info brano attualmente in riproduzione
  widget.bind(SC.Widget.Events.PLAY, () => {
    isPlaying = true;
  
    widget.getCurrentSound(snd => {
      currentTrackIndex = tracks.findIndex(t => t.id === snd.id);
      updateActiveTrack(currentTrackIndex);
  
      const titleText = `♫ ${snd.user.username} – ${snd.title} ♫`;
      nowPlayingEl.innerHTML = `<span>${titleText}</span>`;
      
      /* NEW → if the list row still says “(untitled)” replace it now */
      const rowTitle = document.querySelector(`#track-list li[data-index="${currentTrackIndex}"] .track-title`);
      if (rowTitle && rowTitle.textContent === '(untitled)') rowTitle.textContent = snd.title;
      
      /* scroll logic … (unchanged) */
      requestAnimationFrame(() => {
        const span = nowPlayingEl.firstElementChild;
      
        if (span.scrollWidth > nowPlayingEl.clientWidth) {
          const txtW  = span.scrollWidth;          // larghezza titolo
          const boxW  = nowPlayingEl.clientWidth;  // larghezza contenitore
          const speed = 90;                        // px al secondo
      
          const duration = (txtW + boxW) / speed;  // strada totale / velocità
          const offset   = boxW / speed;           // taglia la pausa iniziale
      
          span.style.animation = `scrollText ${duration}s linear infinite`;
          span.style.animationDelay = `-${offset}s`;   // parte già “a filo”
          nowPlayingEl.classList.add('scroll');
        } else {
          nowPlayingEl.classList.remove('scroll');
        }
      });
      
  
      document.querySelector('[data-audio-action="toggle"]').innerHTML = '||';
      startProgressTracking();
    });
  });
  

  // Gestione pausa
  widget.bind(SC.Widget.Events.PAUSE, () => {
    isPlaying = false;
    stopProgressTracking();
    
    // Aggiorna icona play/pause
    const toggleBtn = document.querySelector('[data-audio-action="toggle"]');
    toggleBtn.innerHTML = '►';
  });

  // Gestisce eventi di termine brano
  widget.bind(SC.Widget.Events.FINISH, () => {
    stopProgressTracking();
    progressCurrent.style.width = '0%';
    timeDisplay.textContent = '00:00 / 00:00';
    
    // Auto-play del brano successivo
    if(currentTrackIndex < tracks.length - 1) {
      currentTrackIndex++;
      widget.skip(currentTrackIndex);
      updateActiveTrack(currentTrackIndex);
    } else {
      // Reset to beginning of playlist if at end
      const toggleBtn = document.querySelector('[data-audio-action="toggle"]');
      toggleBtn.innerHTML = '▶️';
    }
  });

  // Cliccando sulla barra di progresso per cambiare la posizione
  progressBar.addEventListener('click', (e) => {
    if (!isPlaying) return;
    
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    
    widget.getDuration(duration => {
      widget.seekTo(Math.floor(duration * position));
    });
  });

  // Comandi player (play/pause, stop, prev, next)
  playerBox.addEventListener('click', e => {
    const btn = e.target.closest('[data-audio-action]');
    if(!btn) return;

    switch(btn.dataset.audioAction) {
      case 'toggle': 
        widget.isPaused(paused => {
          if(paused) {
            widget.play();
            btn.innerHTML = '⏸️';
          } else {
            widget.pause();
            btn.innerHTML = '▶️';
          }
        });
        break;
      case 'stop': 
        widget.pause(); 
        widget.seekTo(0); 
        stopProgressTracking();
        progressCurrent.style.width = '0%';
        timeDisplay.textContent = '00:00 / 00:00';
        document.querySelector('[data-audio-action="toggle"]').innerHTML = '▶️';
        break;
      case 'prev':
        if(currentTrackIndex > 0) {
          currentTrackIndex--;
          widget.skip(currentTrackIndex);
          updateActiveTrack(currentTrackIndex);
        } else {
          // Se siamo alla prima traccia, riavvia da capo
          widget.seekTo(0);
        }
        break;
      case 'next': 
        if(currentTrackIndex < tracks.length - 1) {
          currentTrackIndex++;
          widget.skip(currentTrackIndex);
          updateActiveTrack(currentTrackIndex);
        }
        break;
    }
  });

  // Controllo volume e icon update
  volSlider.addEventListener('input', () => {
    const volume = parseInt(volSlider.value);
    widget.setVolume(volume);
    // Aggiorna icona volume in base al livello
    updateVolumeIcon(volume);
  });
  
  // Funzione per aggiornare l'icona del volume
  function updateVolumeIcon(volume) {
    const volIcon = document.querySelector('.vol-control span');
    if (volIcon) {
      if(volume === 0) volIcon.textContent = '🔇';
      else if(volume < 30) volIcon.textContent = '🔈';
      else if(volume < 70) volIcon.textContent = '🔉';
      else volIcon.textContent = '🔊';
    }
  }
  
  // Aggiungere click sull'icona volume per mute/unmute
  const volIcon = document.querySelector('.vol-control span');
  if (volIcon) {
    let lastVolume = volSlider.value;
    
    volIcon.addEventListener('click', () => {
      if (parseInt(volSlider.value) > 0) {
        lastVolume = volSlider.value;
        volSlider.value = 0;
        widget.setVolume(0);
        updateVolumeIcon(0);
      } else {
        volSlider.value = lastVolume;
        widget.setVolume(lastVolume);
        updateVolumeIcon(lastVolume);
      }
    });
  }

  // Funzione per aggiornare il brano attivo nella playlist
  function updateActiveTrack(index) {
    document.querySelectorAll('#track-list li').forEach(li => {
      li.classList.remove('active');
    });
    const activeTrack = document.querySelector(`#track-list li[data-index="${index}"]`);
    if(activeTrack) {
      activeTrack.classList.add('active');
      // Scroll alla traccia attiva con animazione
      activeTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Funzione per avviare il tracciamento della progressione
  function startProgressTracking() {
    stopProgressTracking(); // Prima ferma eventuali intervalli esistenti
    
    progressInterval = setInterval(() => {
      if (isDraggingProgress) return;
      
      widget.getPosition(position => {
        widget.getDuration(duration => {
          // Aggiorna barra di avanzamento
          const progressPercentage = (position / duration) * 100;
          progressCurrent.style.width = `${progressPercentage}%`;
          
          // Aggiorna display tempo
          const currentMin = Math.floor(position / 60000);
          const currentSec = Math.floor((position % 60000) / 1000);
          const totalMin = Math.floor(duration / 60000);
          const totalSec = Math.floor((duration % 60000) / 1000);
          
          timeDisplay.textContent = `${padZero(currentMin)}:${padZero(currentSec)} / ${padZero(totalMin)}:${padZero(totalSec)}`;
        });
      });
    }, 1000);
  }

  // Ferma il tracciamento della progressione
  function stopProgressTracking() {
    if(progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  // Aggiunge zero iniziale per numeri < 10
  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }

  // ── AUTOPLAY & WORKAROUND ───────────────────────────────
  const TARGET_VOL = volSlider ? volSlider.value : 80;
  let alreadyUnlocked = false;

  function tryAutoplay() {
    widget.setVolume(0);
    widget.play();
    
    // fade-in di 2s
    setTimeout(() => fadeVolumeTo(TARGET_VOL), 2000);
    
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => 
      window.addEventListener(ev, unlockOnce, {once: true, passive: true}));
  }

  function unlockOnce() {
    if(alreadyUnlocked) return;
    alreadyUnlocked = true;
    widget.setVolume(TARGET_VOL);
    widget.play();
    
    // Aggiornare slider e icona del volume
    if (volSlider) {
      volSlider.value = TARGET_VOL;
      updateVolumeIcon(TARGET_VOL);
    }
  }

  function fadeVolumeTo(target) {
    widget.getVolume(v => {
      if(v >= target) return;
      widget.setVolume(Math.min(v+5, target));
      setTimeout(() => fadeVolumeTo(target), 120);
    });
  }
  
  // Inizializza l'icona del volume
  updateVolumeIcon(volSlider ? parseInt(volSlider.value) : 80);
});