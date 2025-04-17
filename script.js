// guestbook functionality

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const guestbookEntries = document.getElementById('guestbook-entries');
    const guestbookForm    = document.getElementById('guestbook-form');
    const guestbookMessage = document.getElementById('guestbook-message');
    const submitLoading    = document.getElementById('submit-loading');
    const guestbookLoading = document.getElementById('guestbook-loading');

    function showMessage(message, isError = false) {
        guestbookMessage.textContent = message;
        guestbookMessage.style.display         = 'block';
        guestbookMessage.style.backgroundColor = isError ? '#ff6666' : '#66ff66';
        guestbookMessage.style.color           = isError ? '#ffffff' : '#000000';
        guestbookMessage.style.border          = isError ? '2px solid #cc0000' : '2px solid #00cc00';
        setTimeout(() => { guestbookMessage.style.display = 'none'; }, 5000);
    }

    function loadGuestbookEntries() {
        if (!guestbookEntries) return;
        guestbookLoading.style.display = 'block';

        fetch(`${API_URL}/guestbook`)
            .then(response => {
                if (!response.ok) throw new Error('Errore nel caricamento del guestbook');
                return response.json();
            })
            .then(entries => {
                guestbookLoading.style.display = 'none';
                guestbookEntries.innerHTML = '';

                if (entries.length === 0) {
                    const noEntries = document.createElement('div');
                    noEntries.style.textAlign = 'center';
                    noEntries.style.padding   = '20px';
                    noEntries.style.color     = '#ffff00';
                    noEntries.textContent     = 'Nessuna firma nel guestbook! Sii il primo a firmarlo!';
                    guestbookEntries.appendChild(noEntries);
                } else {
                    entries.forEach(entry => {
                        const entryElement = document.createElement('div');
                        entryElement.style.borderBottom   = '1px dashed #00ffff';
                        entryElement.style.paddingBottom  = '10px';
                        entryElement.style.marginBottom   = '10px';

                        const nameElement = document.createElement('div');
                        nameElement.style.color   = '#00ffff';
                        nameElement.textContent   = `${entry.name} - ${entry.date}`;

                        const messageElement = document.createElement('div');
                        messageElement.textContent = entry.message;

                        entryElement.appendChild(nameElement);
                        entryElement.appendChild(messageElement);
                        guestbookEntries.appendChild(entryElement);
                    });
                }
            })
            .catch(error => {
                console.error(error);
                guestbookLoading.style.display = 'none';
                guestbookEntries.innerHTML = '<div style="text-align:center;padding:20px;color:#ff6666">Errore nel caricamento del guestbook! Riprova più tardi.</div>';
            });
    }

    if (guestbookForm) {
        guestbookForm.addEventListener('submit', event => {
            event.preventDefault();
            submitLoading.style.display = 'block';
            const submitButton = document.getElementById('guestbook-submit');
            submitButton.disabled = true;

            const formData = {
                name:    event.target.elements.guestName.value.trim(),
                email:   event.target.elements.guestEmail.value.trim(),
                message: event.target.elements.guestMessage.value.trim()
            };

            fetch(`${API_URL}/guestbook`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Errore nell\'invio della firma');
                return response.json();
            })
            .then(data => {
                event.target.reset();
                showMessage('Grazie per aver firmato il guestbook!');
                loadGuestbookEntries();
            })
            .catch(error => {
                console.error(error);
                showMessage('Si è verificato un errore nell\'invio della firma. Riprova più tardi.', true);
            })
            .finally(() => {
                submitLoading.style.display = 'none';
                submitButton.disabled = false;
            });
        });
    }

    window.loadGuestbookEntries = loadGuestbookEntries;

    if (document.getElementById('guestbook-page').style.display !== 'none') {
        loadGuestbookEntries();
    }
});


// main site functionality

document.addEventListener('DOMContentLoaded', () => {
    const pages     = document.querySelectorAll('.page');
    const navLinks  = document.querySelectorAll('.navbar a[data-page-target], #error404-page a[data-page-target]');
    const modal     = document.getElementById('gif-modal');
    const modalImg  = document.getElementById('modal-image');
    const modalTitle= document.getElementById('modal-title');
    const sparkle   = document.getElementById('sparkle');
    const audioPlayer = document.getElementById('audio-player');
    const content   = document.getElementById('content');

    function showPage(pageId) {
        let pageFound = false;
        pages.forEach(page => {
            page.style.display = (page.id === pageId) ? 'block' : 'none';
            if (page.id === pageId) pageFound = true;
        });
        if (!pageFound) {
            document.getElementById('error404-page').style.display = 'block';
        }
        if (pageId === 'guestbook-page') {
            loadGuestbookEntries();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showPage(link.dataset.pageTarget);
        });
    });

    showPage('home-page');

    function openModal(imgSrc, title) {
        modalImg.src        = imgSrc;
        modalImg.alt        = title;
        modalTitle.textContent = title;
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalImg.src        = '';
        modalImg.alt        = '';
        modalTitle.textContent = '';
    }

    content.addEventListener('click', event => {
        const gifItem = event.target.closest('.gif-item');
        if (gifItem) {
            openModal(gifItem.dataset.gifSrc, gifItem.dataset.gifTitle);
        }
        const dl = event.target.closest('.download-button');
        if (dl) {
            event.preventDefault();
            alert(`Inizio download simulato di: ${dl.dataset.downloadItem}`);
        }
    });

    document.getElementById('close-modal-button').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

    function getRandomColor() {
        const colors = ['#ff00ff','#00ffff','#ffff00','#00ff00','#ff0000','#0000ff'];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    document.addEventListener('mousemove', e => {
        sparkle.style.display = 'block';
        sparkle.style.left    = `${e.pageX+5}px`;
        sparkle.style.top     = `${e.pageY+5}px`;
        sparkle.style.backgroundColor = getRandomColor();
        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left     = `${e.pageX + Math.random()*20 - 10}px`;
        temp.style.top      = `${e.pageY + Math.random()*20 - 10}px`;
        temp.style.width    = '8px';
        temp.style.height   = '8px';
        temp.style.backgroundColor = getRandomColor();
        temp.style.borderRadius = '50%';
        temp.style.pointerEvents = 'none';
        temp.style.transition = 'all 0.5s ease-out';
        temp.style.opacity = '1';
        temp.style.zIndex = '999';
        temp.style.transform = 'scale(1)';
        document.body.appendChild(temp);
        setTimeout(() => {
            temp.style.opacity = '0';
            temp.style.transform = 'scale(0)';
            setTimeout(() => document.body.removeChild(temp),500);
        },100);
    });
    document.addEventListener('mouseleave', () => sparkle.style.display = 'none');
    document.addEventListener('mouseenter', () => sparkle.style.display = 'block');

    audioPlayer.addEventListener('click', event => {
        const btn = event.target.closest('button[data-audio-action]');
        if (btn) alert(`Azione audio simulata: ${btn.dataset.audioAction}`);
    });

    let titleSparkle = true;
    setInterval(() => {
        document.title = titleSparkle ? '★★★ Pamsite ★★★' : '✨ Pamsite ✨';
        titleSparkle = !titleSparkle;
    },1000);
});
