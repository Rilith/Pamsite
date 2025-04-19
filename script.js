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
