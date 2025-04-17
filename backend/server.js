// server.js - Backend per il Guestbook di Pamsite
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
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
                id: 1,
                name: "AnimeFan2000",
                email: "animefan2000@example.com",
                message: "Grande sito! Adoro la tua collezione di GIF! Continua così!",
                avatar: "anime1",
                date: "14/04/2025",
                time: "15:23",
                approved: true
            },
            {
                id: 2,
                name: "OtakuMaster",
                email: "otakumaster@example.com",
                message: "Finalmente un sito che celebra la cultura degli anime come si deve! Ricorda i bei tempi!",
                avatar: "anime2",
                date: "10/04/2025",
                time: "09:45",
                approved: true
            },
            {
                id: 3,
                name: "MangaLover",
                email: "mangalover@example.com",
                message: "Ho trovato il tuo sito per caso e mi piace molto il design retrò! Mi ricorda i vecchi tempi di Geocities!",
                avatar: "anime3",
                date: "05/04/2025",
                time: "20:12",
                approved: true
            }
        ],
        totalEntries: 3
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
        const perPage = parseInt(req.query.perPage) || 10;
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

// Servi i file degli avatar
app.use('/avatars', express.static(path.join(__dirname, 'public/images/avatars')));

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});