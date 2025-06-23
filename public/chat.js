function initChat(){
  const API_BASE = '/api';
  const EMOTE_PATH = '/images/emotes/';

  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const wrapper = document.getElementById('chat-picker-wrapper');
  if(!messagesEl || !form) return;

  let EMOTES = [];
  let emoteCategories = {};

  buildToolbar();
  loadEmotes().then(loadMessages);
  mountForm();

  async function loadMessages(){
    try{
      const res = await fetch(`${API_BASE}/chat`);
      if(!res.ok) throw new Error();
      const data = await res.json();
      renderMessages(data);
    }catch(err){ console.error('chat load', err); }
  }

  function renderMessages(list){
    messagesEl.innerHTML = list.map(m => {
      const msg = renderMessage(m.message);
      const time = `${m.date} ${m.time}`;
      return `<div class="chat-message"><span class="time">${sanitize(time)}</span> <span class="name">${sanitize(m.username)}</span>: <span class="msg">${msg}</span></div>`;
    }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function mountForm(){
    const user = localStorage.getItem('username');
    if(!user){
      form.innerHTML = '<p style="text-align:center;color:#ffff00">Devi effettuare il login per scrivere.</p>';
      return;
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = input.value.trim();
      if(!text) return;
      const res = await fetch(`${API_BASE}/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username: user, message: text })
      });
      const data = await res.json();
      if(res.ok){
        input.value='';
        loadMessages();
      }else{
        alert(data.error || 'Errore');
      }
    });
  }

  function buildToolbar(){
    const formatGroup = document.createElement('div');
    formatGroup.className = 'toolbar-group format-group';

    const box = document.createElement('div');
    box.className = 'format-buttons';
    box.innerHTML = `<button class="toolbar-btn" data-tag="b">B</button>
                     <button class="toolbar-btn" data-tag="i">I</button>
                     <button class="toolbar-btn" data-tag="quote">"</button>
                     <button class="toolbar-btn" id="chat-emoji-btn">😊</button>`;
    formatGroup.appendChild(box);
    wrapper.appendChild(formatGroup);

    const picker = document.createElement('div');
    picker.id = 'chat-emoji-picker';
    picker.className = 'emote-content';
    picker.style.display = 'none';
    wrapper.appendChild(picker);

    box.querySelectorAll('.toolbar-btn[data-tag]').forEach(btn => {
      btn.addEventListener('click', () => wrapSelection(input, `[${btn.dataset.tag}]`, `[/${btn.dataset.tag}]`));
    });
    document.getElementById('chat-emoji-btn').addEventListener('click', () => {
      picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });
  }

  async function loadEmotes(){
    try{
      const res = await fetch(`${API_BASE}/emotes`);
      if(!res.ok) throw new Error();
      const data = await res.json();
      emoteCategories = data;
      EMOTES = [];
      Object.values(data).forEach(arr => { if(Array.isArray(arr)) EMOTES = EMOTES.concat(arr); });
      buildEmotePicker(data);
    }catch(err){ console.error('emotes', err); }
  }

  function buildEmotePicker(data){
    const picker = document.getElementById('chat-emoji-picker');
    picker.innerHTML = '';
    Object.keys(data).forEach(cat => {
      const title = document.createElement('div');
      title.className = 'emote-category-title';
      title.textContent = cat === 'root' ? 'General' : cat.charAt(0).toUpperCase()+cat.slice(1);
      picker.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'emote-grid';
      grid.innerHTML = data[cat].map(e => `<img src="${EMOTE_PATH}${e.file}" alt="${e.code}" class="emote-btn">`).join('');
      picker.appendChild(grid);
    });
    picker.querySelectorAll('.emote-btn').forEach(img => {
      img.addEventListener('click', () => insertAtCursor(input, img.alt));
    });
  }

  function parseFormatting(str){
    return str
      .replace(/\[b\](.*?)\[\/b\]/gis,'<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/gis,'<em>$1</em>')
      .replace(/\[quote\](.*?)\[\/quote\]/gis,'<blockquote>$1</blockquote>');
  }

  function wrapSelection(textarea,before,after){
    const s = textarea.selectionStart;
    const e = textarea.selectionEnd;
    const v = textarea.value;
    textarea.value = v.slice(0,s)+before+v.slice(s,e)+after+v.slice(e);
    textarea.focus();
    textarea.selectionStart = s + before.length;
    textarea.selectionEnd = e + before.length;
  }

  function insertAtCursor(textarea,text){
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0,start)+text+textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  function replaceEmotes(str){
    let out = str;
    EMOTES.forEach(({code,file}) => {
      const regex = new RegExp(code.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'),'g');
      out = out.replace(regex, `<img src="${EMOTE_PATH}${file}" alt="${code}" class="emote-in-msg">`);
    });
    return out;
  }

  function renderMessage(raw){
    const safe = sanitize(raw);
    const parsed = parseFormatting(safe);
    const withEm = replaceEmotes(parsed);
    return withEm.replace(/\n/g,'<br>');
  }

  function sanitize(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('home-page')) initChat();
});
