/* global sanitize, parseFormatting */
function initPostPage(){
  const box=document.getElementById('single-post');
  if(!box) return;
  const path=(history.state && history.state.path) || location.pathname.slice(1);
  let apiUrl;
  if(path.startsWith('post/')){
    const id=path.split('/').pop();
    apiUrl='/api/posts/id/'+id;
  }else{
    const parts=path.split('/');
    if(parts.length<2){ box.textContent='Post non trovato'; return; }
    apiUrl=`/api/posts/${parts[0]}/${parts[1]}`;
  }
  fetch(apiUrl).then(async res=>{
    if(!res.ok){ box.textContent='Post non trovato'; return; }
    const p=await res.json();
    const body=parseFormatting(sanitize(p.content)).replace(/\n/g,'<br>');
    const img=p.thumb?`<div class="blog-image"><img src="${sanitize(p.thumb)}" alt="thumb"></div>`:'';
    box.innerHTML=`<h2>${sanitize(p.title)}</h2>
      <div class="blog-meta">${p.username} - ${p.date} ${p.time} - 👁️${p.views||0}</div>
      ${img}
      <div class="blog-content">${body}</div>`;
  }).catch(err=>{
    console.error('load post',err);
    box.textContent='Errore caricamento post';
  });
}
