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
        const card=document.createElement('div');
        card.className='blog-card';
        const path=`${sanitize(p.blogSlug||slugify(p.blogName||p.username))}/${sanitize(p.slug)}`;
        const img=p.thumb?`<img src="${sanitize(p.thumb)}" alt="thumb" class="blog-card-thumb">`:'';
        card.innerHTML=`${img}<div class="blog-card-title">${sanitize(p.title)}</div>
          <div class="blog-card-meta">${sanitize(p.blogName||p.username)} - ${p.date} ${p.time} - 👁️${p.views||0}</div>`;
        card.dataset.openPost=path;
        postsBox.appendChild(card);
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
