function initChat() {
  const API_BASE    = '/api';
  const EMOTE_PATH  = '/images/emotes/';

  const chatForm    = document.getElementById('chat-form');
  const chatMessages= document.getElementById('chat-messages');
  const msgInput    = document.getElementById('chat-message');
  const emoteWrapper= document.getElementById('chat-emote-wrapper');

  let EMOTES = [];
  let emoteCategories = {};

  buildToolbar();
  loadEmotes().then(loadMessages);
  mountSubmit();

  async function loadMessages() {
    try {
      const res = await fetch(`${API_BASE}/chat`);
      if (!res.ok) throw new Error();
      const msgs = await res.json();
      renderMessages(msgs);
    } catch (err) {
      chatMessages.innerHTML = '<div class="error">Errore caricamento messaggi</div>';
    }
  }

  function renderMessages(list) {
    chatMessages.innerHTML = list.map(m => {
      const txt = renderMessage(m.message);
      return `<div class="chat-entry"><span class="chat-name">${sanitize(m.name)}</span> <span class="chat-text">${txt}</span> <span class="chat-time">${m.time}</span></div>`;
    }).join('');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function mountSubmit() {
    chatForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(chatForm);
      const payload = { name: fd.get('name'), message: fd.get('message') };
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        chatForm.reset();
        loadMessages();
      } catch (err) {
        alert('Errore nell\'invio del messaggio');
      }
    });
  }

  function buildToolbar() {
    const formatBox = document.createElement('div');
    formatBox.className = 'format-buttons';
    formatBox.innerHTML = `
<button class="toolbar-btn" data-tag="b">B</button>
<button class="toolbar-btn" data-tag="i">I</button>
<button class="toolbar-btn" data-tag="quote">"</button>`;
    const group = document.createElement('div');
    group.className = 'toolbar-group format-group';
    group.appendChild(formatBox);
    emoteWrapper.appendChild(group);

    formatBox.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => wrapSelection(
        msgInput,
        `[${btn.dataset.tag}]`,
        `[/${btn.dataset.tag}]`
      ));
    });
  }

  function buildEmotePicker(data) {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'emote-tabs';
    const contentContainer = document.createElement('div');
    contentContainer.id = 'chat-emote-picker';
    contentContainer.className = 'emote-content';
    emoteWrapper.appendChild(tabsContainer);
    emoteWrapper.appendChild(contentContainer);

    const categories = Object.keys(data);
    if (categories.length === 0) {
      contentContainer.innerHTML = '<div class="emote-empty">Nessun emoticon</div>';
      return;
    }

    categories.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.className = 'emote-tab-btn' + (idx===0 ? ' active' : '');
      btn.dataset.category = cat;
      btn.textContent = cat === 'root' ? 'General' : cat.charAt(0).toUpperCase()+cat.slice(1);
      btn.addEventListener('click', e => {
        document.querySelectorAll('#chat-emote-wrapper .emote-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        showCat(cat);
      });
      tabsContainer.appendChild(btn);
    });

    showCat(categories[0]);

    function showCat(category) {
      contentContainer.innerHTML = '';
      if (!data[category]) return;
      const grid = document.createElement('div');
      grid.className = 'emote-grid';
      grid.innerHTML = data[category].map(e => `<img src="${EMOTE_PATH}${e.file}" alt="${e.code}" title="${e.code}" class="emote-btn">`).join('');
      contentContainer.appendChild(grid);
      grid.querySelectorAll('.emote-btn').forEach(img => img.addEventListener('click', () => insertAtCursor(msgInput, img.alt)));
    }
  }

  async function loadEmotes() {
    try {
      const res = await fetch(`${API_BASE}/emotes`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      emoteCategories = data;
      EMOTES = [];
      Object.keys(data).forEach(k => { if (Array.isArray(data[k])) EMOTES = EMOTES.concat(data[k]); });
      buildEmotePicker(data);
    } catch(err) {
      console.error('emotes', err);
    }
  }

  function wrapSelection(textarea, before, after) {
    const { selectionStart:s, selectionEnd:e, value:v } = textarea;
    textarea.value = v.slice(0, s) + before + v.slice(s, e) + after + v.slice(e);
    textarea.focus();
    textarea.selectionStart = s + before.length;
    textarea.selectionEnd   = e + before.length;
  }
  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  function parseFormatting(str) {
    return str
      .replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>')
      .replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote>$1</blockquote>');
  }
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function replaceEmotes(str) {
    let out = str;
    EMOTES.forEach(({ code, file }) => {
      const regex = new RegExp(code.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
      out = out.replace(regex, `<img src="${EMOTE_PATH}${file}" alt="${code}" class="emote-in-msg">`);
    });
    return out;
  }
  function renderMessage(raw) {
    return replaceEmotes(parseFormatting(sanitize(raw))).replace(/\n/g, '<br>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chat-form')) initChat();
});
