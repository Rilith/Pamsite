// server.js - Backend per il Guestbook di Pamsite

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { fileToEntry } = require('./utils/mediaInfo');

const app = express();
const PORT = process.env.PORT || 3000;

// Percorsi per i file JSON
const DATA_DIR = path.join(__dirname, 'data');
const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook.json');
const REACTIONS_FILE = path.join(DATA_DIR, 'reactions.json');

// ─── INIT DATA ────────────────────────────────────────────────────────────────
// Assicuriamoci che la directory data esista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Inizializza guestbook.json
if (!fs.existsSync(GUESTBOOK_FILE)) {
  const initialData = {
    entries: [
      {
        id: 2,
        name: "Five",
        email: "five@example.com",
        message: "Con grande onore, lascierò la prima firma non bottata di questo forum :cheesy::bang::windows:",
        avatar: "05MISAT.JPG",
        date: "20/04/2025",
        time: "10:05",
        approved: true
      },
      {
        id: 1,
        name: "Pam",
        email: "animefan2000@example.com",
        message: "Funziona!",
        avatar: "misato.gif",
        date: "14/04/2025",
        time: "15:23",
        approved: true
      }
    ],
    totalEntries: 2
  };
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(initialData, null, 2));
}

// Inizializza reactions.json
if (!fs.existsSync(REACTIONS_FILE)) {
  const initialReactions = {
    reactions: {
      "1": { "❤️": 5, "👍": 2, "🌟": 1 },
      "2": { "👍": 3 },
      "3": { "❤️": 1, "👍": 4, "🌟": 2 }
    }
  };
  fs.writeFileSync(REACTIONS_FILE, JSON.stringify(initialReactions, null, 2));
}

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Abilita CORS per permettere richieste dal frontend

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function readGuestbook() {
  return JSON.parse(fs.readFileSync(GUESTBOOK_FILE, 'utf8'));
}

function readReactions() {
  return JSON.parse(fs.readFileSync(REACTIONS_FILE, 'utf8'));
}

function saveGuestbookEntry({ name, email, message, avatar }) {
  const guestbook = readGuestbook();
  const newId = guestbook.entries.length > 0
    ? Math.max(...guestbook.entries.map(e => e.id)) + 1
    : 1;

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newEntry = {
    id: newId,
    name,
    email,
    message,
    avatar: avatar || 'default',
    date,
    time,
    approved: true
  };

  guestbook.entries.unshift(newEntry);
  guestbook.totalEntries = (guestbook.totalEntries || 0) + 1;
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(guestbook, null, 2));

  const reactions = readReactions();
  reactions.reactions[newId] = {};
  fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));

  return newEntry;
}

function updateReaction(entryId, emoji, increment = true) {
  const reactions = readReactions();
  if (!reactions.reactions[entryId]) reactions.reactions[entryId] = {};
  if (!reactions.reactions[entryId][emoji]) reactions.reactions[entryId][emoji] = 0;
  if (increment) {
    reactions.reactions[entryId][emoji]++;
  } else if (reactions.reactions[entryId][emoji] > 0) {
    reactions.reactions[entryId][emoji]--;
  }
  fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));
  return reactions.reactions[entryId];
}

// ─── ROUTES: GUESTBOOK ───────────────────────────────────────────────────────
// Ottieni firme con paginazione e reazioni
app.get('/api/guestbook', (req, res) => {
  try {
    const { page = 1, perPage = 5, approved } = req.query;
    const guestbook = readGuestbook();
    let entries = guestbook.entries;

    if (approved !== undefined) {
      entries = entries.filter(e => e.approved === (approved === 'true'));
    }

    const totalPages = Math.ceil(entries.length / perPage);
    const start = (page - 1) * perPage;
    const pageEntries = entries.slice(start, start + parseInt(perPage));

    const reactions = readReactions().reactions;
    const result = pageEntries.map(e => ({
      ...e,
      reactions: reactions[e.id] || {}
    }));

    res.json({
      entries: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEntries: guestbook.totalEntries || entries.length
      }
    });
  } catch (err) {
    console.error('Errore caricamento guestbook:', err);
    res.status(500).json({ error: 'Errore nel caricamento del guestbook' });
  }
});

// Aggiungi nuova firma
app.post('/api/guestbook', (req, res) => {
  try {
    const { name, email, message, avatar } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }
    const entry = saveGuestbookEntry({ name, email, message, avatar });
    res.status(201).json(entry);
  } catch (err) {
    console.error('Errore salvataggio firma:', err);
    res.status(500).json({ error: 'Errore nel salvare la firma' });
  }
});

// Reagisci a una firma
app.post('/api/guestbook/:id/reaction', (req, res) => {
  try {
    const entryId = parseInt(req.params.id);
    const { emoji, add } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji richiesta' });
    const updated = updateReaction(entryId, emoji, add !== false);
    res.json({ reactions: updated });
  } catch (err) {
    console.error('Errore aggiornamento reazione:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della reazione' });
  }
});

// Statistiche guestbook
app.get('/api/guestbook/stats', (req, res) => {
  try {
    const gb = readGuestbook();
    const rx = readReactions().reactions;
    let totalRx = 0;
    Object.values(rx).forEach(obj => Object.values(obj).forEach(c => totalRx += c));
    const stats = {
      totalEntries: gb.totalEntries || gb.entries.length,
      approvedEntries: gb.entries.filter(e => e.approved).length,
      pendingEntries: gb.entries.filter(e => !e.approved).length,
      totalReactions: totalRx,
      lastEntry: gb.entries[0] ? { date: gb.entries[0].date, time: gb.entries[0].time } : null
    };
    res.json(stats);
  } catch (err) {
    console.error('Errore stats:', err);
    res.status(500).json({ error: 'Errore nel caricamento delle statistiche' });
  }
});

// Ricerca nel guestbook
app.get('/api/guestbook/search', (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Parametro di ricerca mancante' });
    const results = readGuestbook().entries
      .filter(e => e.approved)
      .filter(e => e.name.toLowerCase().includes(query.toLowerCase()) ||
                   e.message.toLowerCase().includes(query.toLowerCase()));
    res.json(results);
  } catch (err) {
    console.error('Errore ricerca:', err);
    res.status(500).json({ error: 'Errore nella ricerca' });
  }
});

// Approvazione manuale (admin)
app.put('/api/admin/guestbook/:id/approve', (req, res) => {
  try {
    const entryId = parseInt(req.params.id);
    const { approved, adminKey } = req.body;
    if (adminKey !== 'tuaChiaveSegreta') return res.status(403).json({ error: 'Non autorizzato' });
    const gb = readGuestbook();
    const idx = gb.entries.findIndex(e => e.id === entryId);
    if (idx === -1) return res.status(404).json({ error: 'Messaggio non trovato' });
    gb.entries[idx].approved = approved;
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(gb, null, 2));
    res.json({ success: true, entry: gb.entries[idx] });
  } catch (err) {
    console.error('Errore approvazione:', err);
    res.status(500).json({ error: 'Errore nella modifica dell\'approvazione' });
  }
});

// ─── ROUTES: STATIC & MEDIA ─────────────────────────────────────────────────
// Avatar list
app.get('/api/avatars', (req, res) => {
  const dir = path.join(__dirname, 'images/avatars');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Impossibile leggere gli avatar' });
    res.json(
      files.filter(f => /\.(png|jpe?g|gif)$/i.test(f))
           .map(f => ({ id: f, name: path.parse(f).name }))
    );
  });
});

// Emotes structure
app.get('/api/emotes', (req, res) => {
  const base = path.join(__dirname, 'images/emotes');
  if (!fs.existsSync(base)) return res.json({ root: [] });
  const items = fs.readdirSync(base, { withFileTypes: true });
  const result = {};

  // root files
  const root = items.filter(d => !d.isDirectory() && /\.(png|jpe?g|gif)$/i.test(d.name))
    .map(d => ({ code: `:${path.parse(d.name).name}:`, file: d.name, folder: null }));
  if (root.length) result.root = root;

  // subfolders
  items.filter(d => d.isDirectory()).forEach(dirent => {
    const folder = dirent.name;
    const folderPath = path.join(base, folder);
    try {
      const emotes = fs.readdirSync(folderPath)
        .filter(f => /\.(png|jpe?g|gif)$/i.test(f))
        .map(f => ({ code: `:${path.parse(f).name}:`, file: `${folder}/${f}`, folder }));
      if (emotes.length) result[folder] = emotes;
    } catch {};
  });

  if (!Object.keys(result).length) result.default = [];
  res.json(result);
});

// Download endpoints
const DL_MAP = {
  wallpapers: path.join(__dirname, 'downloads', 'wallpapers'),
  midi:       path.join(__dirname, 'downloads', 'midi'),
  cursors:    path.join(__dirname, 'downloads', 'cursors')
};
app.get('/api/downloads/:cat', (req, res) => {
  const root = DL_MAP[req.params.cat];
  if (!root || !fs.existsSync(root)) return res.json([]);

  const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(d => d.isDirectory()
      ? walk(path.join(dir, d.name)).map(p => path.join(d.name, p))
      : path.relative(root, path.join(dir, d.name))
    );

  try {
    Promise.all(walk(root).map(rel => fileToEntry(root, rel)))
      .then(entries => res.json(entries));
  } catch (err) {
    console.error('Errore scansione downloads:', err);
    res.status(500).json({ error: 'Errore scansione cartella' });
  }
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images/avatars', express.static(path.join(__dirname, 'images', 'avatars')));
app.use('/images/emotes', express.static(path.join(__dirname, 'images', 'emotes')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.use(
  '/pages',
  express.static(path.join(__dirname, 'public', 'pages'))
);

app.use('/static', express.static(path.join(__dirname, '../public')));

/* ------------------------------------------------------------------ */
/*  SPA FALLBACK – every unknown GET returns the shell                */
/* ------------------------------------------------------------------ */
app.get('*', (req, res, next) => {
  //  1) only GETs go through (POST/PUT keep falling through);
  //  2) ignore real files (/foo.js , /image.png …)
  if (req.method !== 'GET' || /\.\w{1,8}$/.test(req.path)) return next();

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ------------------------------------------------------------------ */
/*  Real 404 – for assets or APIs that truly don’t exist              */
/* ------------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'error404.html'));
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});
