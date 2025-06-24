function initLogin(){
  const form=document.getElementById('login-form');
  if(!form) return;
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const res=await fetch('/api/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})
    });
    const data=await res.json();
    if(res.ok){
      alert('Login effettuato');
      localStorage.setItem('username',data.username);
      updateAuthUI();
      location.href='/';
    }else alert(data.error||'Errore login');
  });
}

function initRegister(){
  const form=document.getElementById('register-form');
  if(!form) return;
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const res=await fetch('/api/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})
    });
    const data=await res.json();
    if(res.ok){
      alert('Registrazione completata');
    }else alert(data.error||'Errore registrazione');
  });
}

function updateAuthUI(){
  const box=document.getElementById('auth-container');
  if(!box) return;
  const user=localStorage.getItem('username');
  if(!user){
    box.innerHTML='<a href="/login" data-page-target="login-page">Login</a> <a href="/register" data-page-target="register-page">Registrati</a>';
    return;
  }
  box.innerHTML=`<div class="profile-menu"><button id="profile-menu-btn"><img id="profile-menu-avatar" src="/images/avatars/05MISAT.JPG" alt="avatar"> <span id="profile-menu-name"></span> ▾</button><div class="profile-dropdown"><a href="/profile" data-page-target="profile-page">Profilo</a><a href="#" id="logout-link">Logout</a></div></div>`;
  document.getElementById('profile-menu-name').textContent=user;
  fetch('/api/users/'+user)
    .then(r=>r.ok?r.json():null)
    .then(d=>{ if(d && d.avatar){ document.getElementById('profile-menu-avatar').src='/images/avatars/'+d.avatar; }});
  const menu=document.querySelector('.profile-menu');

  const toggleBtn=document.getElementById('profile-menu-btn');
  toggleBtn.addEventListener('click',e=>{
    e.preventDefault();
    menu.classList.toggle('open');
  });
  const logout=document.getElementById('logout-link');
  logout.addEventListener('click',e=>{
    e.preventDefault();
    menu.classList.remove('open');

    localStorage.removeItem('username');
    updateAuthUI();
    location.href='/';
  });
  menu.querySelectorAll('.profile-dropdown a').forEach(a=>{
    a.addEventListener('click',()=>menu.classList.remove('open'));
  });
  document.addEventListener('click',e=>{
    if(menu.classList.contains('open') && !menu.contains(e.target)){
      menu.classList.remove('open');
    }
  });

}

function initProfile(){
  const page=document.getElementById('profile-page');
  if(!page) return;
  const user=localStorage.getItem('username');
  if(!user){ page.innerHTML='<p>Devi effettuare il login.</p>'; return; }
  document.getElementById('profile-username').textContent=user;
  fetch('/api/users/'+user).then(r=>r.json()).then(d=>{
    const avatar = d.avatar || '05MISAT.JPG';
    document.getElementById('profile-avatar').src='/images/avatars/'+avatar;
    document.getElementById('profile-count').textContent=d.guestbookEntries||0;
  });
  const editBtn=document.getElementById('edit-profile-btn');
  const editSec=document.getElementById('edit-profile-section');
  editBtn.addEventListener('click',()=>{
    editSec.classList.toggle('open');
  });
  document.getElementById('avatar-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const res=await fetch('/api/users/'+user+'/avatar',{method:'PUT',body:fd});
    const data=await res.json();
    if(res.ok){ alert('Avatar aggiornato'); updateAuthUI(); initProfile(); }
    else alert(data.error||'Errore');
  });
  document.getElementById('password-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const pwd=e.target.querySelector('input[name="password"]').value;
    const res=await fetch('/api/users/'+user+'/password',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})});
    const data=await res.json();
    if(res.ok){ alert('Password aggiornata'); e.target.reset(); }
    else alert(data.error||'Errore');
  });
  document.getElementById('delete-account-btn').addEventListener('click',async()=>{
    if(!confirm('Eliminare l\'account?')) return;
    const res=await fetch('/api/users/'+user,{method:'DELETE'});
    const data=await res.json();
    if(res.ok){ alert('Account eliminato'); localStorage.removeItem('username'); updateAuthUI(); location.href='/'; }
    else alert(data.error||'Errore');
  });
}

document.addEventListener('DOMContentLoaded',updateAuthUI);
