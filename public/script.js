// ──── Player bootstrap avanzato ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const widget = SC.Widget(document.getElementById('sc-player'));
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
      
      /* scroll logic */
      requestAnimationFrame(() => {
        const span = nowPlayingEl.firstElementChild;
      
        if (span.scrollWidth > nowPlayingEl.clientWidth) {
          const txtW  = span.scrollWidth;          // larghezza titolo
          const boxW  = nowPlayingEl.clientWidth;  // larghezza contenitore
          const speed = 60;                        // px al secondo
      
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


// main site functionality

document.addEventListener('DOMContentLoaded', () => {
    const pages     = document.querySelectorAll('.page');
    const navLinks  = document.querySelectorAll('.navbar a[data-page-target], #error404-page a[data-page-target]');
    const modal     = document.getElementById('gif-modal');
    const modalImg  = document.getElementById('modal-image');
    const modalTitle= document.getElementById('modal-title');
    const sparkle   = document.getElementById('sparkle');
    const audioPlayer = document.getElementById('audio-player');
    const content   = document.getElementById('content');
    
    function showPage(pageId) {
        let pageFound = false;
        pages.forEach(page => {
            page.style.display = (page.id === pageId) ? 'block' : 'none';
            if (page.id === pageId) pageFound = true;
        });
        if (!pageFound) {
            document.getElementById('error404-page').style.display = 'block';
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showPage(link.dataset.pageTarget);
        });
    });

    showPage('home-page');

    function openModal(imgSrc, title) {
        modalImg.src        = imgSrc;
        modalImg.alt        = title;
        modalTitle.textContent = title;
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalImg.src        = '';
        modalImg.alt        = '';
        modalTitle.textContent = '';
    }


        content.addEventListener('click', async e => {
          const dl = e.target.closest('.download-button');
          if (!dl) return;
        
          // OPTIONAL analytics: await fetch('/api/logDownload', { … });
        
          // let the browser navigate normally
        });

    document.getElementById('close-modal-button').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

    function getRandomColor() {
        const colors = ['#ff00ff','#00ffff','#ffff00','#00ff00','#ff0000','#0000ff'];
        return colors[Math.floor(Math.random()*colors.length)];
    }

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


