function initGames(){
  const grid = document.getElementById('game-grid');
  const view = document.getElementById('game-view');
  const iframe = document.getElementById('game-frame');
  const titleEl = document.getElementById('game-title');
  const scoreList = document.getElementById('score-list');
  const form = document.getElementById('score-form');
  const closeBtn = document.getElementById('close-game');
  const uploadForm = document.getElementById('game-upload-form');

  loadList();

  async function loadList(){
    const games = await fetch('/api/games').then(r=>r.json());
    grid.innerHTML = games.map(g=>`<div class="game-item" data-game="${g.name}">
        <div class="game-thumb"><img src="${g.thumb}" alt="${g.name}"></div>
        <div class="game-title">${g.name}</div>
      </div>`).join('');
    grid.querySelectorAll('.game-item').forEach(it=>{
      it.addEventListener('click', ()=>openGame(it.dataset.game));
    });
  }

  async function openGame(name){
    titleEl.textContent = name;
    iframe.src = `/games/${name}/index.html`;
    view.style.display = 'block';
    grid.style.display = 'none';
    await loadScores(name);
    form.onsubmit = async e => {
      e.preventDefault();
      const user = localStorage.getItem('username');
      if(!user){ alert('Devi effettuare il login'); return; }
      const score = parseInt(form.score.value,10);
      if(isNaN(score)) return;
      const res = await fetch(`/api/games/${name}/scores`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username:user, score })
      });
      const data = await res.json();
      if(res.ok){ form.reset(); loadScores(name); }
      else alert(data.error || 'Errore');
    };
    closeBtn.onclick = ()=>{
      view.style.display='none';
      grid.style.display='flex';
      iframe.src='';
    };
  }

  async function loadScores(game){
    const list = await fetch(`/api/games/${game}/scores`).then(r=>r.json());
    scoreList.innerHTML = list.sort((a,b)=>b.score-a.score).slice(0,10)
      .map(s=>`<li>${s.username}: ${s.score}</li>`).join('');
  }

  uploadForm?.addEventListener('submit', async e=>{
    e.preventDefault();
    const file = uploadForm.gamefile.files[0];
    if(!file) return;
    const fd = new FormData();
    fd.append('game', file);
    const res = await fetch('/api/games/upload',{method:'POST', body:fd});
    const data = await res.json();
    if(res.ok){ alert('Gioco caricato'); loadList(); uploadForm.reset(); }
    else alert(data.error||'Errore');
  });
}

