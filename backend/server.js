// server.js - Backend per il Guestbook di Pamsite
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { fileToEntry } = require('./utils/mediaInfo');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Abilita CORS per permettere richieste dal frontend

// Percorsi per i file JSON
const GUESTBOOK_FILE = path.join(__dirname, 'data/guestbook.json');
const REACTIONS_FILE = path.join(__dirname, 'data/reactions.json');

// Assicuriamoci che la directory data esista
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Inizializza il file guestbook.json se non esiste
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
            },
        ],
        totalEntries: 1
    };
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(initialData, null, 2));
}

// Inizializza il file reactions.json se non esiste
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

// Funzione per leggere le firme del guestbook
function readGuestbook() {
    const data = fs.readFileSync(GUESTBOOK_FILE, 'utf8');
    return JSON.parse(data);
}

// Funzione per leggere le reazioni
function readReactions() {
    const data = fs.readFileSync(REACTIONS_FILE, 'utf8');
    return JSON.parse(data);
}

// Funzione per salvare una nuova firma
function saveGuestbookEntry(entry) {
    const guestbook = readGuestbook();
    const newId = guestbook.entries.length > 0
        ? Math.max(...guestbook.entries.map(e => e.id)) + 1
        : 1;
   
    // Formatta la data e l'ora
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
   
    const newEntry = {
        id: newId,
        name: entry.name,
        email: entry.email,
        message: entry.message,
        avatar: entry.avatar || "default",
        date: `${day}/${month}/${year}`,
        time: `${hours}:${minutes}`,
        approved: true // Auto-approva i messaggi (cambia a false se vuoi moderazione)
    };
   
    guestbook.entries.unshift(newEntry); // Aggiungi in cima alla lista
    guestbook.totalEntries = (guestbook.totalEntries || 0) + 1;
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(guestbook, null, 2));
    
    // Inizializza le reazioni per questa entry
    const reactions = readReactions();
    reactions.reactions[newId] = {};
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));
    
    return newEntry;
}

// Funzione per aggiornare una reazione
function updateReaction(entryId, emoji, increment = true) {
    const reactions = readReactions();
    
    if (!reactions.reactions[entryId]) {
        reactions.reactions[entryId] = {};
    }
    
    if (!reactions.reactions[entryId][emoji]) {
        reactions.reactions[entryId][emoji] = 0;
    }
    
    if (increment) {
        reactions.reactions[entryId][emoji]++;
    } else if (reactions.reactions[entryId][emoji] > 0) {
        reactions.reactions[entryId][emoji]--;
    }
    
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));
    return reactions.reactions[entryId];
}

// Endpoint per ottenere le firme con paginazione
app.get('/api/guestbook', (req, res) => {
    try {
        const guestbook = readGuestbook();
        const reactions = readReactions();
        
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 5;
        const approved = req.query.approved === 'true';
        
        let entries = guestbook.entries;
        
        // Filtra per approvati se richiesto
        if (req.query.approved !== undefined) {
            entries = entries.filter(entry => entry.approved === approved);
        }
        
        // Calcola il totale delle pagine
        const totalPages = Math.ceil(entries.length / perPage);
        
        // Estrai solo gli elementi per la pagina corrente
        const startIndex = (page - 1) * perPage;
        const paginatedEntries = entries.slice(startIndex, startIndex + perPage);
        
        // Aggiungi le reazioni a ciascuna entry
        const entriesWithReactions = paginatedEntries.map(entry => {
            return {
                ...entry,
                reactions: reactions.reactions[entry.id] || {}
            };
        });
        
        res.json({
            entries: entriesWithReactions,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalEntries: guestbook.totalEntries || entries.length
            }
        });
    } catch (error) {
        console.error('Errore nel caricamento del guestbook:', error);
        res.status(500).json({ error: 'Errore nel caricamento del guestbook' });
    }
});

// Endpoint per aggiungere una nuova firma
app.post('/api/guestbook', (req, res) => {
    try {
        const { name, email, message, avatar } = req.body;
       
        // Validazione base
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
        }
       
        const newEntry = saveGuestbookEntry({ name, email, message, avatar });
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Errore nel salvare la firma:', error);
        res.status(500).json({ error: 'Errore nel salvare la firma' });
    }
});

// Endpoint per aggiornare una reazione a un messaggio
app.post('/api/guestbook/:id/reaction', (req, res) => {
    try {
        const entryId = parseInt(req.params.id);
        const { emoji, add } = req.body;
        
        if (!emoji) {
            return res.status(400).json({ error: 'Emoji richiesta' });
        }
        
        const updatedReactions = updateReaction(entryId, emoji, add !== false);
        res.json({ reactions: updatedReactions });
    } catch (error) {
        console.error('Errore nell\'aggiornamento della reazione:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento della reazione' });
    }
});

// Endpoint per l'amministrazione - Cambiare lo stato di approvazione
app.put('/api/admin/guestbook/:id/approve', (req, res) => {
    try {
        const entryId = parseInt(req.params.id);
        const { approved, adminKey } = req.body;
        
        // Semplice controllo amministratore - in produzione usare un sistema più sicuro
        if (adminKey !== 'tuaChiaveSegreta') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }
        
        const guestbook = readGuestbook();
        const entryIndex = guestbook.entries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Messaggio non trovato' });
        }
        
        guestbook.entries[entryIndex].approved = approved;
        fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(guestbook, null, 2));
        
        res.json({ success: true, entry: guestbook.entries[entryIndex] });
    } catch (error) {
        console.error('Errore nella modifica dell\'approvazione:', error);
        res.status(500).json({ error: 'Errore nella modifica dell\'approvazione' });
    }
});

// Endpoint per ottenere statistiche del guestbook
app.get('/api/guestbook/stats', (req, res) => {
    try {
        const guestbook = readGuestbook();
        const reactions = readReactions();
        
        let totalReactions = 0;
        Object.values(reactions.reactions).forEach(entryReactions => {
            Object.values(entryReactions).forEach(count => {
                totalReactions += count;
            });
        });
        
        const stats = {
            totalEntries: guestbook.totalEntries || guestbook.entries.length,
            approvedEntries: guestbook.entries.filter(entry => entry.approved).length,
            pendingEntries: guestbook.entries.filter(entry => !entry.approved).length,
            totalReactions: totalReactions,
            lastEntry: guestbook.entries[0] ? {
                date: guestbook.entries[0].date,
                time: guestbook.entries[0].time
            } : null
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
        res.status(500).json({ error: 'Errore nel caricamento delle statistiche' });
    }
});

// Endpoint per ricerca nel guestbook
app.get('/api/guestbook/search', (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Parametro di ricerca mancante' });
        }
        
        const guestbook = readGuestbook();
        const searchLower = query.toLowerCase();
        
        const results = guestbook.entries
            .filter(entry => entry.approved) // Solo messaggi approvati
            .filter(entry => 
                entry.name.toLowerCase().includes(searchLower) || 
                entry.message.toLowerCase().includes(searchLower)
            );
            
        res.json(results);
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        res.status(500).json({ error: 'Errore nella ricerca' });
    }
});

// Servi i file statici dalla directory public
app.use(express.static(path.join(__dirname, 'public')));

// Ritorna la lista file presenti in public/images/avatars
app.get('/api/avatars', (req, res) => {
    const dir = path.join(__dirname, 'images/avatars');
    fs.readdir(dir, (err, files) => {
      if (err) return res.status(500).json({ error: 'Impossibile leggere gli avatar' });
      res.json(
        files.filter(f => /\.(png|jpe?g|gif)$/i.test(f)).map(f => ({ id: f, name: path.parse(f).name }))
      );
    });
  });
  

  app.get('/api/emotes', (req, res) => {
    const baseDir = path.join(__dirname, 'images/emotes');
    
    try {
      // First check if base directory exists
      if (!fs.existsSync(baseDir)) {
        console.error('Emotes directory does not exist:', baseDir);
        // Return empty structure instead of error to prevent frontend crash
        return res.json({
          root: []
        });
      }
      
      // Get all directories in the emotes folder
      const items = fs.readdirSync(baseDir, { withFileTypes: true });
      const folders = items
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      // Create result object with folders and their emotes
      const result = {};
      
      // Add root emotes first (if any)
      const rootEmotes = items
        .filter(dirent => !dirent.isDirectory())
        .filter(dirent => /\.(png|jpe?g|gif)$/i.test(dirent.name))
        .map(dirent => ({
          code: `:${path.parse(dirent.name).name}:`,
          file: dirent.name,
          folder: null
        }));
      
      if (rootEmotes.length > 0) {
        result.root = rootEmotes;
      }
      
      // Add each folder's emotes
      folders.forEach(folder => {
        const folderPath = path.join(baseDir, folder);
        try {
          const emotes = fs.readdirSync(folderPath)
            .filter(file => /\.(png|jpe?g|gif)$/i.test(file))
            .map(file => ({
              code: `:${path.parse(file).name}:`,
              file: `${folder}/${file}`,
              folder: folder
            }));
          
          if (emotes.length > 0) {
            result[folder] = emotes;
          }
        } catch (folderErr) {
          console.error(`Error reading folder ${folder}:`, folderErr);
          // Continue with other folders
        }
      });
      
      // If no emotes found at all, create a default entry to avoid completely empty response
      if (Object.keys(result).length === 0) {
        result.default = [];
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error reading emotes directory:', error);
      // Return minimal structure to prevent frontend crash
      res.json({
        default: []
      });
    }
  });
  
app.use(
  '/images/avatars',
  express.static(path.join(__dirname, 'images', 'avatars'))
);

app.use('/images/emotes', express.static(path.join(__dirname, 'images', 'emotes')));

/* ------------------------------------------------------------------
 *  AUTOGENERATED DOWNLOAD SECTIONS
 * -----------------------------------------------------------------*/


// map URL-segments → real folders  (downloads is now inside backend/)
const DL_MAP = {
  wallpapers : path.join(__dirname, 'downloads', 'wallpapers'),
  midi       : path.join(__dirname, 'downloads', 'midi'),
  cursors    : path.join(__dirname, 'downloads', 'cursors')
};

//  REST endpoint – /client calls  /api/downloads/<category>
app.get('/api/downloads/:cat', async (req, res) => {
  const cat  = req.params.cat;
  const root = DL_MAP[cat];
  if (!root || !fs.existsSync(root)) {
    // unknown category OR folder not created yet → empty list
    return res.json([]);
    }

  // recursive walker (sync) -> list of files relative to <root>
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
                        .flatMap(d => d.isDirectory()
                          ? walk(path.join(dir, d.name)).map(p => path.join(d.name, p))
                          : path.relative(root, path.join(dir, d.name)));

  try {
    const entries = await Promise.all(
      walk(root).map(rel => fileToEntry(root, rel))
    );
    res.json(entries);
  } catch (err) {
    console.error('Errore scansione downloads:', err);
    res.status(500).json({ error: 'Errore scansione cartella' });
  }
});

// 4️⃣  Serve the raw files (so <img src="/downloads/…"> works)
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));


// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});
