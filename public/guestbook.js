// guestbook.js – frontend logic
/* global sanitize */

function initGuestbook() {
/* ------------------------------------------------------------------
     * ELEMENT REFERENCES
     * ----------------------------------------------------------------*/
const API_BASE        = '/api';
const AVATAR_PATH     = '/images/avatars/';
const EMOTE_PATH      = '/images/emotes/';

const guestbookForm   = document.getElementById('guestbook-form');
const guestbookEntries= document.getElementById('guestbook-entries');
const guestbookMessage= document.getElementById('guestbook-message');
const guestbookLoading= document.getElementById('guestbook-loading');
const submitLoading   = document.getElementById('submit-loading');
const guestbookStats  = document.getElementById('guestbook-stats');
const guestbookSearch = document.getElementById('guestbook-search');
const guestbookPagination = document.getElementById('guestbook-pagination');

const msgInput        = document.getElementById('message');       // <textarea>
const previewPane     = document.getElementById('gb-preview');
const previewBtn      = document.getElementById('preview-toggle');

/* ------------------------------------------------------------------
* EMOTICON LIST - Will be populated dynamically
* ----------------------------------------------------------------*/
let EMOTES = [];

/* ------------------------------------------------------------------
 * TEXT FORMATTERS
 * ----------------------------------------------------------------*/
const FORMATTERS = [
  { tag: 'b',     label: 'B'   },
  { tag: 'i',     label: 'I'   },
  { tag: 'quote', label: '❝'   },
];

function parseFormatting(str) {
  return str
    .replace(/\[b\](.*?)\[\/b\]/gis,     '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/gis,     '<em>$1</em>')
    .replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote>$1</blockquote>');
}

/* ------------------------------------------------------------------
 * STATE
 * ----------------------------------------------------------------*/
let currentPage = 1;
const perPage   = 5;
let previewOpen = false;

/* ------------------------------------------------------------------
 * INITIALISATION
 * ----------------------------------------------------------------*/
buildToolbar();
loadEmotes().then(() => {
    loadGuestbookEntries(currentPage);
    loadStats();
    mountSearch();
    mountFormSubmit();
  });


    /* ------------------------------------------------------------------
   * LOAD EMOTES FROM SERVER
   * ----------------------------------------------------------------*/

async function loadEmotes() {
try {
  const res = await fetch(`${API_BASE}/emotes`);
  if (!res.ok) throw new Error(`Failed to load emotes: ${res.status}`);
  
  const emoteData = await res.json();
  console.log('Loaded emote data:', emoteData); // Debug log
  
  // Check if we got valid data
  if (!emoteData || typeof emoteData !== 'object' || Object.keys(emoteData).length === 0) {
    console.error('Empty or invalid emote data received');
    fallbackToDefaultEmotes();
    return {};
  }
  
  // Store the categories for reference
  emoteCategories = emoteData;
  
  // Flatten the structure to populate the global EMOTES array
  EMOTES = [];
  Object.keys(emoteData).forEach(folder => {
    if (Array.isArray(emoteData[folder])) {
      EMOTES = EMOTES.concat(emoteData[folder]);
    }
  });
  
  // Build the emote picker with the data
  buildEmotePicker(emoteData);
  
  return emoteData;
} catch (err) {
  console.error('Error loading emotes:', err);
  fallbackToDefaultEmotes();
  return {};
}
}

// Fallback function to use if API fails
function fallbackToDefaultEmotes() {
console.log('Using fallback emotes');

// Define some basic default emotes
const defaultEmotes = {
  'default': [
    { code: ':smile:', file: 'smile.gif', folder: null },
    { code: ':sad:', file: 'sad.gif', folder: null },
    { code: ':cool:', file: 'cool.gif', folder: null }
  ]
};

// Use these defaults
emoteCategories = defaultEmotes;
EMOTES = defaultEmotes.default;

// Let the user know there was an issue
const wrapper = document.getElementById('emote-picker-wrapper');
if (wrapper) {
  wrapper.innerHTML = `
    <div class="emote-error-notice">
      <p>Impossibile caricare gli emoticon.</p>
      <small>Verifica che la cartella images/emotes esista sul server.</small>
    </div>
  `;
}
}


/* ------------------------------------------------------------------
 * TOOLBAR (FORMAT + EMOTES)
 * ----------------------------------------------------------------*/
function buildToolbar() {
  // Ottieni il wrapper
  const wrapper = document.getElementById('emote-picker-wrapper');
  
  // Crea il contenitore per i pulsanti di formattazione
  const formatGroup = document.createElement('div');
  formatGroup.className = 'toolbar-group format-group';
  
  // Crea il contenitore per i pulsanti
  const formatBox = document.createElement('div');
  formatBox.id = 'format-buttons';
  formatBox.className = 'format-buttons';
  
  // Genera i pulsanti
formatBox.innerHTML = `
<button type="button" class="toolbar-btn" data-tag="b">B</button>
<button type="button" class="toolbar-btn" data-tag="i">I</button>
<button type="button" class="toolbar-btn" data-tag="quote">"</button>
`;
  
// Add buttons to the group
formatGroup.appendChild(formatBox);

// Insert the group at the beginning of the wrapper
if (wrapper.firstChild) {
wrapper.insertBefore(formatGroup, wrapper.firstChild);
} else {
wrapper.appendChild(formatGroup);
}

// Add event listeners to buttons
formatBox.querySelectorAll('.toolbar-btn').forEach(btn => {
btn.addEventListener('click', () => wrapSelection(
msgInput,
`[${btn.dataset.tag}]`,
`[/${btn.dataset.tag}]`
));
});
}

/* ------------------------------------------------------------------
* EMOTICON PICKER
* ----------------------------------------------------------------*/
function buildEmotePicker(emoteData) {
  const wrapper = document.getElementById('emote-picker-wrapper');
  
  // Clear any existing content except the format toolbar
  const existingTabs = wrapper.querySelector('.emote-tabs');
  const existingContent = wrapper.querySelector('.emote-content');
  
  if (existingTabs) existingTabs.remove();
  if (existingContent) existingContent.remove();

  // Create the tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'emote-tabs';

  // Create the content container
  const contentContainer = document.createElement('div');
  contentContainer.id = 'emote-picker';
  contentContainer.className = 'emote-content';

  // Add both containers to the wrapper
  // Make sure they're appended after the format-group if it exists
  wrapper.appendChild(tabsContainer);
  wrapper.appendChild(contentContainer);

  // Get all category names
  const categories = Object.keys(emoteData);

  // Skip if no categories found
  if (categories.length === 0) {
    contentContainer.innerHTML = '<div class="error">Nessun emoticon trovato</div>';
    return;
  }
  
  // Create the tabs
  categories.forEach((category, index) => {
    const tabButton = document.createElement('button');
    tabButton.type = 'button';
    tabButton.className = 'emote-tab-btn' + (index === 0 ? ' active' : '');
    tabButton.dataset.category = category;
    tabButton.textContent = category === 'root' ? 'General' : category.charAt(0).toUpperCase() + category.slice(1);

    tabButton.addEventListener('click', (e) => {
      // Remove active class from all tabs
      document.querySelectorAll('.emote-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to clicked tab
      e.target.classList.add('active');

      // Show the corresponding content
      showEmoteCategory(category);
    });

    tabsContainer.appendChild(tabButton);
  });

  // Show the first category by default
  showEmoteCategory(categories[0]);
}

  function showEmoteCategory(category) {
    const contentContainer = document.getElementById('emote-picker');
    contentContainer.innerHTML = '';
    
    if (!emoteCategories[category] || emoteCategories[category].length === 0) {
      contentContainer.innerHTML = '<div class="emote-empty">Nessun emoticon in questa categoria</div>';
      return;
    }
    
    // Create a container for the emotes
    const emoteGrid = document.createElement('div');
    emoteGrid.className = 'emote-grid';
    
    // Add all emotes from this category
    emoteGrid.innerHTML = emoteCategories[category].map(
      e => `<img src="${EMOTE_PATH}${e.file}" alt="${e.code}" title="${e.code}" class="emote-btn">`
    ).join('');
    
    contentContainer.appendChild(emoteGrid);
    
    // Add click event listeners
    contentContainer.querySelectorAll('.emote-btn').forEach(img => {
      img.addEventListener('click', () => insertAtCursor(msgInput, img.alt));
    });
  }

/* ------------------------------------------------------------------
* TEXT FORMATTERS
* ----------------------------------------------------------------*/
function wrapSelection(textarea, before, after) {
  const { selectionStart:s, selectionEnd:e, value:v } = textarea;
  textarea.value = v.slice(0, s) + before + v.slice(s, e) + after + v.slice(e);
  textarea.focus();
  textarea.selectionStart = s + before.length;
  textarea.selectionEnd   = e + before.length;
  refreshPreviewIfOpen();
}

function insertAtCursor(textarea, text) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  refreshPreviewIfOpen();
}

/* ------------------------------------------------------------------
 * PREVIEW
 * ----------------------------------------------------------------*/
previewBtn.addEventListener('click', togglePreview);
msgInput.addEventListener('input', refreshPreviewIfOpen);

function togglePreview() {
    previewOpen = !previewOpen;
    if (previewOpen) {
      previewPane.innerHTML = renderMessage(msgInput.value);
      previewPane.style.display = 'block';
      previewBtn.textContent = 'Nascondi anteprima';
    } else {
      previewPane.style.display = 'none';
      previewBtn.textContent = 'Anteprima';
    }
  }

function refreshPreviewIfOpen() {
    if (previewOpen) previewPane.innerHTML = renderMessage(msgInput.value);
  }

  function renderMessage(raw) {
    const safe   = sanitize(raw);
    const parsed = parseFormatting(safe);
    const withEm = replaceEmotes(parsed);
    return withEm.replace(/\n/g, '<br>');
  }

function replaceEmotes(str) {
    let out = str;
    EMOTES.forEach(({ code, file }) => {
      const regex = new RegExp(code.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
      out = out.replace(
        regex,
        `<img src="${EMOTE_PATH}${file}" alt="${code}" class="emote-in-msg">`
      );
    });
    return out;
  }

/* ------------------------------------------------------------------
 * AVATARS
 * ----------------------------------------------------------------*/

/* ------------------------------------------------------------------
 * GUESTBOOK ENTRIES
 * ----------------------------------------------------------------*/
async function loadGuestbookEntries(page = 1) {
  guestbookLoading.style.display = 'block';
  guestbookEntries.style.display = 'none';
  try {
    const res = await fetch(
      `${API_BASE}/guestbook?page=${page}&perPage=${perPage}&approved=true`
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderEntries(data.entries);
    renderPagination(data.pagination);
  } catch (err) {
    console.error(err);
    guestbookEntries.innerHTML =
      '<div class="error">Impossibile caricare le firme 🙁</div>';
  } finally {
    guestbookLoading.style.display = 'none';
    guestbookEntries.style.display = 'block';
  }
}

function makeAvatarSrc(v = '') {
  const file = v || '05MISAT.JPG';
  if (/^https?:\/\//i.test(file)) return file;
  if (file.startsWith('/'))      return file;
  return `${AVATAR_PATH}${encodeURIComponent(file)}`;
}

function renderEntries(entries) {
  guestbookEntries.innerHTML = entries.map(e => {
    const avatarSrc = makeAvatarSrc(e.avatar);
    const finalMsg  = renderMessage(e.message);
    return `
      <div class="guestbook-entry">
        <div class="entry-header">
          <img src="${avatarSrc}" alt="Avatar" class="entry-avatar">
          <div class="entry-info">
            <div class="entry-name">${sanitize(e.name)}</div>
            <div class="entry-date">${e.date} ${e.time || ''}</div>
          </div>
        </div>
        <div class="entry-message">${finalMsg}</div>
      </div>`;
  }).join('');
}

/* ------------------------------------------------------------------
 * PAGINATION
 * ----------------------------------------------------------------*/
function renderPagination({ currentPage, totalPages }) {
  if (totalPages <= 1) return guestbookPagination.innerHTML = '';

  guestbookPagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    return `<div class="page-button ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</div>`;
  }).join('');

  guestbookPagination.querySelectorAll('.page-button').forEach(btn =>
    btn.addEventListener('click', () => loadGuestbookEntries(+btn.dataset.page))
  );
}

/* ------------------------------------------------------------------
 * SEARCH
 * ----------------------------------------------------------------*/
function mountSearch() {
  const searchInput  = document.createElement('input');
  const searchButton = document.createElement('button');
  searchInput.id     = 'search-input';
  searchInput.placeholder = 'Cerca nelle firme…';
  searchButton.id    = 'search-button';
  searchButton.textContent = 'Cerca';
  guestbookSearch.append(searchInput, searchButton);

  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) return loadGuestbookEntries(1);

    guestbookLoading.style.display = 'block';
    guestbookEntries.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/guestbook/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const results = await res.json();
      renderEntries(results);
      renderPagination({ currentPage: 1, totalPages: 1 });
    } catch (err) {
      console.error(err);
      guestbookEntries.innerHTML = `
        <div style="text-align:center;padding:20px;color:#ffff00;">
          <div style="font-size:24px;margin-bottom:10px;">⊙﹏⊙</div>
          <div>Nessun risultato trovato per "${sanitize(query)}"</div>
        </div>`;
      guestbookPagination.innerHTML = '';
    } finally {
      guestbookLoading.style.display = 'none';
      guestbookEntries.style.display = 'block';
    }
  });
}

/* ------------------------------------------------------------------
 * FORM SUBMISSION
 * ----------------------------------------------------------------*/
function mountFormSubmit() {
  const username = localStorage.getItem('username');
  if(!username){
    guestbookForm.innerHTML = '<p style="text-align:center;color:#ffff00">Devi effettuare il login per firmare il guestbook.</p>';
    return;
  }
  guestbookForm.addEventListener('submit', async e => {
    e.preventDefault();

    const fd = new FormData(guestbookForm);
    const payload = {
      username,
      message: fd.get('message')
    };

    submitLoading.style.display = 'block';

    try {
      const res = await fetch(`${API_BASE}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      showMessage('Grazie per aver firmato il mio guestbook! Il tuo messaggio apparirà dopo l\'approvazione! ✨', 'success');
      guestbookForm.reset();
      loadGuestbookEntries(1);
      if (previewOpen) togglePreview();
    } catch (err) {
      console.error(err);
      showMessage('Impossibile inviare il messaggio 😢', 'error');
    } finally {
      submitLoading.style.display = 'none';
    }
  });
}

/* ------------------------------------------------------------------
 * STATS
 * ----------------------------------------------------------------*/
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/guestbook/stats`);
    if (!res.ok) throw new Error();
    const s = await res.json();
    guestbookStats.innerHTML = `
      <div style="display:flex;justify-content:space-around;flex-wrap:wrap;">
        <div><div style="font-size:18px;color:#ffff00;">✨ ${s.totalEntries} ✨</div><div>Firme totali</div></div>
        <div><div style="font-size:18px;color:#ffff00;">✨ ${s.approvedEntries} ✨</div><div>Messaggi approvati</div></div>
        <div><div style="font-size:18px;color:#ffff00;">✨ ${s.pendingEntries} ✨</div><div>In attesa</div></div>
      </div>`;
  } catch (err) {
    console.error('stats', err);
  }
}

/* ------------------------------------------------------------------
 * UTILITIES
 * ----------------------------------------------------------------*/
function showMessage(message, type) {
  guestbookMessage.textContent = message;
  guestbookMessage.className = `message-${type}`;
  guestbookMessage.style.display = 'block';
  setTimeout(() => (guestbookMessage.style.display = 'none'), 5000);
}

// very small helper to avoid XSS; you can replace it with DOMPurify if you prefer
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


}


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('guestbook-form')) {
    initGuestbook();
  }
  });
  