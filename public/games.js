function initGames(){
  const grid = document.getElementById('game-grid');
  const view = document.getElementById('game-view');
  const iframe = document.getElementById('game-frame');
  const titleEl = document.getElementById('game-title');
  const scoreList = document.getElementById('score-list');
  const closeBtn = document.getElementById('close-game');

  let resumeMusic = false;

  window.closeGameView = closeGame;
  
  loadList();

  async function loadList(){
    const games = await fetch('/api/games').then(r=>r.json());
    grid.innerHTML = games.map(g=>`<div class="game-item" data-game="${g.name}" data-scores="${g.scores}">
        <div class="game-thumb"><img src="${g.thumb}" alt="${g.name}"></div>
        <div class="game-title">${g.name}</div>
      </div>`).join('');
    grid.querySelectorAll('.game-item').forEach(it=>{
      it.addEventListener('click', ()=>openGame(it.dataset.game));
    });
  }

  async function openGame(name){
    if(window.audioWidget){
      window.audioWidget.isPaused(paused => {
        resumeMusic = !paused;
        if(resumeMusic) window.audioWidget.pause();
      });
    }
    titleEl.textContent = name;
    iframe.src = `/games/${name}/index.html`;
    view.style.display = 'block';
    grid.style.display = 'none';
    await loadScores(name);
    closeBtn.onclick = closeGame;
    iframe.focus();
  }

  function closeGame(){
    view.style.display='none';
    grid.style.display='flex';
    iframe.src='';
    if(resumeMusic && window.audioWidget){
      window.audioWidget.play();
      resumeMusic = false;
    }
  }

  async function loadScores(game){
    const hasScores = grid.querySelector(`[data-game="${game}"]`).dataset.scores === 'true';
    if(!hasScores){ scoreList.innerHTML = '<li>Nessun punteggio disponibile</li>'; return; }
    const list = await fetch(`/api/games/${game}/scores`).then(r=>r.json());
    scoreList.innerHTML = list.sort((a,b)=>b.score-a.score).slice(0,10)
      .map(s=>`<li>${s.username}: ${s.score}</li>`).join('');
  }
}

