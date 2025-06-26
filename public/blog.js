/* global sanitize, parseFormatting */
function initBlog(){
  const postsBox=document.getElementById('blog-posts');
  const popularBtn=document.getElementById('blog-popular');
  const recentBtn=document.getElementById('blog-recent');
  const searchBtn=document.getElementById('blog-search-btn');
  const searchInput=document.getElementById('blog-search-input');

  async function load(url){
    try{
      const res=await fetch(url);
      if(!res.ok) throw new Error('bad response');
      const list=await res.json();
      postsBox.innerHTML='';
      list.forEach(p=>{
        const div=document.createElement('div');
        div.className='blog-post';
        const body=parseFormatting(sanitize(p.content)).replace(/\n/g,'<br>');
        const img=p.thumb?`<div class="blog-image"><img src="${sanitize(p.thumb)}" alt="thumb"></div>`:'';
        const path=`${sanitize(p.blogSlug||slugify(p.blogName||p.username))}/${sanitize(p.slug)}`;
        div.innerHTML=`<h3>${sanitize(p.title)}</h3>
          <div class="blog-meta">${p.username} - ${p.date} ${p.time} - 👁️${p.views||0}</div>
          ${img}
          <div class="blog-content">${body}</div>
          <a href="/${path}" data-open-post="${path}">Leggi tutto…</a>`;
        postsBox.appendChild(div);
      });
    }catch(err){
      console.error('blog load',err);
    }
  }

  popularBtn?.addEventListener('click',()=>load('/api/posts/popular'));
  recentBtn?.addEventListener('click',()=>load('/api/posts/chronological'));
  searchBtn?.addEventListener('click',()=>{
    const q=searchInput.value.trim();
    if(q) load('/api/posts/search?query='+encodeURIComponent(q));
  });

  load('/api/posts/chronological');
}
