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
