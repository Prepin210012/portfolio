/* ═══════════════════════════════════════════════════════════════
   CAROUSEL.JS — Project/Module carousel with touch support
   ═══════════════════════════════════════════════════════════════ */

class Carousel {
  constructor(selector) {
    this.wrapper = document.querySelector(selector);
    if (!this.wrapper) return;

    this.track = this.wrapper.querySelector('.carousel-track');
    this.slides = this.wrapper.querySelectorAll('.carousel-slide');
    this.prevBtn = this.wrapper.querySelector('.carousel-btn.prev');
    this.nextBtn = this.wrapper.querySelector('.carousel-btn.next');
    this.dotsContainer = this.wrapper.querySelector('.carousel-dots');

    this.currentIndex = 0;
    this.slidesPerView = this.getSlidesPerView();
    this.totalPages = Math.ceil(this.slides.length / this.slidesPerView);

    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  getSlidesPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  init() {
    this.createDots();
    this.bindEvents();
    this.update();
  }

  createDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide group ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  bindEvents() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

    // Touch events
    this.track.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newPerView = this.getSlidesPerView();
        if (newPerView !== this.slidesPerView) {
          this.slidesPerView = newPerView;
          this.totalPages = Math.ceil(this.slides.length / this.slidesPerView);
          this.currentIndex = Math.min(this.currentIndex, this.totalPages - 1);
          this.createDots();
          this.update();
        }
      }, 200);
    });

    // Keyboard
    this.wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50;
    if (diff > threshold) this.next();
    if (diff < -threshold) this.prev();
  }

  prev() {
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this.update();
  }

  next() {
    this.currentIndex = Math.min(this.totalPages - 1, this.currentIndex + 1);
    this.update();
  }

  goTo(index) {
    this.currentIndex = index;
    this.update();
  }

  update() {
    // Calculate offset
    const slideWidth = this.slides[0].offsetWidth;
    const gap = parseInt(getComputedStyle(this.track).gap) || 32;
    const offset = this.currentIndex * (slideWidth + gap) * this.slidesPerView;

    this.track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    const dots = this.dotsContainer?.querySelectorAll('.carousel-dot');
    dots?.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });

    // Update buttons
    if (this.prevBtn) {
      this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.3' : '1';
      this.prevBtn.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
    }
    if (this.nextBtn) {
      this.nextBtn.style.opacity = this.currentIndex === this.totalPages - 1 ? '0.3' : '1';
      this.nextBtn.style.pointerEvents = this.currentIndex === this.totalPages - 1 ? 'none' : 'auto';
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    // Add a unique class if needed
    new Carousel('.carousel-wrapper');
  });
});
