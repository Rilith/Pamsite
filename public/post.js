/* global sanitize, parseFormatting */
function initPostPage(){
  const box=document.getElementById('single-post');
  if(!box) return;
  const id=(history.state && history.state.id) || new URLSearchParams(location.search).get('id') || location.pathname.split('/').pop();
  if(!id){ box.textContent='Post non trovato'; return; }
  fetch('/api/posts/'+id).then(async res=>{
    if(!res.ok){ box.textContent='Post non trovato'; return; }
    const p=await res.json();
    const body=parseFormatting(sanitize(p.content)).replace(/\n/g,'<br>');
    box.innerHTML=`<h2>${sanitize(p.title)}</h2>
      <div class="blog-meta">${p.username} - ${p.date} ${p.time} - 👁️${p.views||0}</div>
      ${p.image?`<div class="blog-image"><img src="${sanitize(p.image)}" alt="image"></div>`:''}
      <div class="blog-content">${body}</div>`;
  }).catch(err=>{
    console.error('load post',err);
    box.textContent='Errore caricamento post';
  });
}
