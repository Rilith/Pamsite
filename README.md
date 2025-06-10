# ✨ Pamsite! ✨

Welcome to the source code repository for **Pamsite!** - a lovingly crafted personal website inspired by the golden era of the early 2000s internet (think Geocities, Angelfire, and blinking text!). This site is a nostalgic trip back in time, celebrating anime, gaming, and the unique aesthetic of personal homepages from decades past.

---

## 💖 Features

* **Retro Homepage:** Greeting visitors with a classic `<marquee>` and important "Under Construction" notices.
* **About Me:** Learn about the pam's journey into his hobbies.
* **Anime GIF Gallery:** A curated collection of classic anime GIFs, sorted by series (Evangelion, Studio Ghibli), complete with a full-screen modal viewer.
* **Downloads Area:** Grab *totally free* (and simulated!) goodies:
    * Desktop Wallpapers (multiple resolutions!)
    * MIDI Ringtones (Evangelion theme, Totoro song!)
    * Custom Animated Cursors (Eva Pack, Ghibli Spirits!)
    * Important note: Files *definitely* scanned with Norton Antivirus 2003 and best downloaded with Download Accelerator Plus! 😉
* **My Setup:** A detailed look at pam's authentic early-2000s computer setup (AMD Athlon XP, GeForce FX 5900 Ultra, 19" CRT Monitor, Windows XP SP2!). Also showcases the essential software of the era (Photoshop 7, Winamp 2.91, IE6, mIRC, ICQ 2003b) and the precious anime DVD/VHS collection.
* **Guestbook:** Leave a message for the site owner.
* **Custom 404 Page:** Even errors get the retro treatment!
* **Nostalgic Effects:**
    * ✨ Sparkling mouse trail effect! ✨
    * External visitor counter.
    * Simulated background audio player controls.
    * Blinking text and title bar.

---

## 💾 Tech Stack & Philosophy

This website is built with the classics, intentionally avoiding modern frameworks to maintain the authentic retro feel:

* **HTML5:** Semantic structure (where possible within the retro constraints!).
* **CSS3:** Styling the chaos! (Includes `.blink` effects, neon colors, and layout). Assumes an external `style.css`.
* **Vanilla JavaScript:** For page navigation (SPA-like behavior), modal interactions, simulated downloads/guestbook, and special effects (sparkles, title blink).

---

## 🏃‍♂️ Running the Local Server

Some sections (guestbook, public chat and downloads) require the Node.js backend.

```bash
npm --prefix backend install
npm --prefix backend start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

3.  **Open `index.html`:** Simply open the `index.html` file in your web browser.

---

## 📂 File Structure (Simplified)

```
/
├── index.html      # Main page structure
├── style.css       # All the styling magic!
├── images/
│   └── gifs/       # Animated GIFs for the gallery
└── README.md       # This file
```

---

## 📜 License

This project is primarily a personal creation and demonstration of a retro web aesthetic. Assume standard copyright for personal works. If you adapt ideas, attribution is appreciated!

---

Created with ♥ and a lot of nostalgia by **Pam**.
