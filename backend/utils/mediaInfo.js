// utils/mediaInfo.js
const fs       = require('fs');
const path     = require('path');
const { imageSize } = require('image-size');
const mm       = require('music-metadata');
const { Midi } = require('@tonejs/midi');
const mime     = require('mime-types');

function fmtBytes(b)   { return `${Math.round(b/1024)} KB`; }
function fmtRes(dim)   { return `${dim.width}×${dim.height}`; }
function pad(n){return n<10?`0${n}`:n}
function fmtDur(sec){ 
  const m = Math.floor(sec/60), s = Math.round(sec%60);
  return `${pad(m)}:${pad(s)}`;
}

async function fileToEntry(root, relPath){
  const abs  = path.join(root, relPath);
  const stat = fs.statSync(abs);
  const kind = (mime.lookup(abs) || '').toLowerCase();

  const entry = {
    file : relPath.replace(/\\/g,'/'),
    name : path.parse(relPath).name,
    size : fmtBytes(stat.size)
  };

  // ─── Images ────────────────────────────────────────────────
  if (kind.startsWith('image/')) {
    try {
      const buf = fs.readFileSync(abs);
      const dim = imageSize(buf);
      entry.info  = `${fmtRes(dim)} – ${entry.size}`;
    } catch {
      entry.info  = entry.size;
    }
    entry.thumb = `/downloads/${path.basename(root)}/${entry.file}`;

  // ─── MIDI files ────────────────────────────────────────────
  } else if (relPath.toLowerCase().endsWith('.mid')) {
    try {
      const data = fs.readFileSync(abs);
      const midi = new Midi(data);
      entry.info = `${fmtDur(midi.duration)} – ${entry.size}`;
    } catch {
      entry.info = entry.size;
    }
    entry.thumb = '/downloads/midi-icon.png';  // your placeholder

  // ─── Other audio (mp3, wav, flac, etc.) ────────────────────
  } else if (kind.startsWith('audio/')) {
    try {
      const { format } = await mm.parseFile(abs, { duration: true });
      entry.info = `${fmtDur(format.duration)} – ${entry.size}`;
    } catch {
      entry.info = entry.size;
    }
    entry.thumb = '/downloads/music-icon.png';
    
  // ─── Everything else (zips, cursors, etc.) ──────────────────
  } else {
    entry.info  = entry.size;
    entry.thumb = '/downloads/zipped-icon.png';
  }

  return entry;
}

module.exports = { fileToEntry };
