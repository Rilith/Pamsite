/* global sanitize, parseFormatting */
function initBlog(){
  const postsBox=document.getElementById('blog-posts');
  const popularBtn=document.getElementById('blog-popular');
  const recentBtn=document.getElementById('blog-recent');
  const searchBtn=document.getElementById('blog-search-btn');
  const searchInput=document.getElementById('blog-search-input');

  async function load(url){
    const res=await fetch(url);
    const list=await res.json();
    postsBox.innerHTML='';
    list.forEach(p=>{
      const div=document.createElement('div');
      div.className='blog-post';
      div.innerHTML=`<h3>${sanitize(p.title)}</h3>
        <div class="blog-meta">${p.username} - ${p.date} ${p.time} - 👁️${p.views||0}</div>
        <div class="blog-content">${parseFormatting(sanitize(p.content))}</div>`;
      postsBox.appendChild(div);
    });
  }

  popularBtn?.addEventListener('click',()=>load('/api/posts/popular'));
  recentBtn?.addEventListener('click',()=>load('/api/posts/chronological'));
  searchBtn?.addEventListener('click',()=>{
    const q=searchInput.value.trim();
    if(q) load('/api/posts/search?query='+encodeURIComponent(q));
  });

  load('/api/posts/chronological');
}
