/* Carousel - Photo gallery slider */
(function () {
    'use strict';

    const TOTAL_PHOTOS = 31;
    const PHOTO_PATH = 'assets/images/carousel/photo_';

    const track = document.querySelector('.carousel__track');
    const dotsContainer = document.querySelector('.carousel__dots');
    const prevBtn = document.querySelector('.carousel__btn--prev');
    const nextBtn = document.querySelector('.carousel__btn--next');

    let currentIndex = 0;
    let photosPerView = getPhotosPerView();
    const totalPages = Math.ceil(TOTAL_PHOTOS / photosPerView);

    // Load images
    function loadImages() {
        for (let i = 1; i <= TOTAL_PHOTOS; i++) {
            const img = document.createElement('img');
            img.src = PHOTO_PATH + String(i).padStart(2, '0') + '.jpg';
            img.alt = 'Analice e Cristiano - Foto ' + i;
            img.loading = i <= 6 ? 'eager' : 'lazy';
            track.appendChild(img);
        }
    }

    function getPhotosPerView() {
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        return 3;
    }

    // Create dots
    function createDots() {
        dotsContainer.innerHTML = '';
        const pages = Math.ceil(TOTAL_PHOTOS / photosPerView);
        for (let i = 0; i < Math.min(pages, 12); i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel__dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Página ' + (i + 1));
            dot.addEventListener('click', function () {
                goToSlide(i);
            });
            dotsContainer.appendChild(dot);
        }
    }

    function goToSlide(index) {
        const pages = Math.ceil(TOTAL_PHOTOS / photosPerView);
        currentIndex = Math.max(0, Math.min(index, pages - 1));

        const imgWidth = track.querySelector('img') ? track.querySelector('img').offsetWidth : 280;
        const gap = 12; // 0.75rem
        const offset = currentIndex * photosPerView * (imgWidth + gap);
        track.style.transform = 'translateX(-' + offset + 'px)';

        // Update dots
        const dots = dotsContainer.querySelectorAll('.carousel__dot');
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function next() {
        const pages = Math.ceil(TOTAL_PHOTOS / photosPerView);
        goToSlide((currentIndex + 1) % pages);
    }

    function prev() {
        const pages = Math.ceil(TOTAL_PHOTOS / photosPerView);
        goToSlide((currentIndex - 1 + pages) % pages);
    }

    // Auto-advance
    let autoPlay = setInterval(next, 5000);

    function resetAutoPlay() {
        clearInterval(autoPlay);
        autoPlay = setInterval(next, 5000);
    }

    // Events
    prevBtn.addEventListener('click', function () {
        prev();
        resetAutoPlay();
    });

    nextBtn.addEventListener('click', function () {
        next();
        resetAutoPlay();
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) next();
            else prev();
            resetAutoPlay();
        }
    }, { passive: true });

    // Resize handler
    window.addEventListener('resize', function () {
        photosPerView = getPhotosPerView();
        createDots();
        goToSlide(Math.min(currentIndex, Math.ceil(TOTAL_PHOTOS / photosPerView) - 1));
    });

    // Init
    loadImages();
    createDots();
})();
