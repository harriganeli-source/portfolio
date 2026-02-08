/**
 * Portfolio Website - Main JavaScript
 * Clean, minimal vanilla JS with no dependencies
 */

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Initialize mobile hamburger menu
 */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (!hamburger || !navMenu) return;

  // Toggle menu on hamburger click
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when a nav link is clicked
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const isHamburger = hamburger.contains(e.target);
    const isNavMenu = navMenu.contains(e.target);

    if (!isHamburger && !isNavMenu && navMenu.classList.contains('active')) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

/**
 * Set active navigation link based on current page
 */
function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-menu a');
  const currentPage = window.location.pathname;

  navLinks.forEach(link => {
    const href = link.getAttribute('href');

    // Check if link matches current page
    if (
      (currentPage.includes(href) && href !== '/') ||
      (currentPage === '/' && href === 'index.html') ||
      (currentPage.endsWith('/') && href === 'index.html')
    ) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============================================================================
// FADE-IN ANIMATIONS
// ============================================================================

/**
 * Initialize fade-in animations using IntersectionObserver
 */
function initFadeInAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with fade-in class
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach(element => {
    observer.observe(element);
  });
}

// ============================================================================
// HOMEPAGE GRID
// ============================================================================

/**
 * Initialize homepage grid with hover overlays
 */
function initGridOverlays() {
  const gridItems = document.querySelectorAll('.grid-item');

  gridItems.forEach(item => {
    // Create overlay if it doesn't exist
    if (!item.querySelector('.grid-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'grid-overlay';

      // Get project title from data attribute or element
      const title = item.getAttribute('data-title') || item.querySelector('h3')?.textContent || '';

      overlay.innerHTML = `<span class="overlay-title">${title}</span>`;
      item.appendChild(overlay);
    }
  });
}

// ============================================================================
// LIGHTBOX
// ============================================================================

/**
 * Initialize lightbox for photography pages
 */
function initLightbox() {
  const lightboxTriggers = document.querySelectorAll('.lightbox-trigger, [data-lightbox]');

  if (lightboxTriggers.length === 0) return;

  // Create lightbox container if it doesn't exist
  let lightbox = document.querySelector('.lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <img class="lightbox-image" src="" alt="">
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
        <button class="lightbox-next" aria-label="Next image">&#10095;</button>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  let currentIndex = 0;
  const images = Array.from(lightboxTriggers);

  /**
   * Open lightbox with image at given index
   */
  function openLightbox(index) {
    if (index < 0 || index >= images.length) return;

    currentIndex = index;
    const imgElement = images[currentIndex];
    const imgSrc = imgElement.getAttribute('src') || imgElement.getAttribute('data-src');
    const imgAlt = imgElement.getAttribute('alt') || '';

    lightbox.querySelector('.lightbox-image').src = imgSrc;
    lightbox.querySelector('.lightbox-image').alt = imgAlt;
    lightbox.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close lightbox
   */
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Navigate to next image
   */
  function nextImage() {
    openLightbox(currentIndex + 1);
  }

  /**
   * Navigate to previous image
   */
  function prevImage() {
    openLightbox(currentIndex - 1);
  }

  // Click on image to open lightbox
  lightboxTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index);
    });
  });

  // Close button
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

  // Next/Previous buttons
  lightbox.querySelector('.lightbox-next').addEventListener('click', nextImage);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', prevImage);

  // Click outside to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case 'ArrowLeft':
        prevImage();
        break;
    }
  });
}

// ============================================================================
// VIDEO POSTER → IFRAME
// ============================================================================

/**
 * Initialize video poster click-to-play
 * Replaces poster image + play button with autoplay iframe on click
 */
function initVideoPoster() {
  const posters = document.querySelectorAll('.video-container[data-src]');

  posters.forEach(container => {
    container.addEventListener('click', () => {
      const src = container.getAttribute('data-src');
      if (!src) return;

      // Add autoplay param
      const sep = src.includes('?') ? '&' : '?';
      const autoplaySrc = src + sep + 'autoplay=1';

      // Determine allow attribute based on platform
      const isVimeo = src.includes('vimeo');
      const allow = isVimeo
        ? 'autoplay; fullscreen; picture-in-picture'
        : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = autoplaySrc;
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', allow);
      iframe.style.border = 'none';

      // Clear poster and insert iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      container.removeAttribute('data-src');
    });
  });
}

// ============================================================================
// BACK BUTTON
// ============================================================================

/**
 * Initialize back button navigation
 */
function initBackButton() {
  const backButton = document.querySelector('.back-button');

  if (!backButton) return;

  backButton.addEventListener('click', () => {
    // Navigate to homepage
    window.location.href = '/';
  });
}

// ============================================================================
// THUMBNAIL SCRUB ON HOVER
// ============================================================================

/**
 * Scrub through video frames by moving cursor across project thumbnails.
 * Reads data-frames="N" attribute on .project-thumb to know how many frames
 * are available. Frames follow naming convention: images/{slug}-frame-{1..N}.webp
 */
function initThumbnailScrub() {
  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  // Create shared custom cursor element
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.5)" stroke="white" stroke-width="1.5"/>
      <polygon points="20,15 20,33 35,24" fill="white"/>
    </svg>`;
  document.body.appendChild(cursor);

  let cursorActive = false;
  let scrubbing = false;
  let rafId = null;
  let mouseX = 0, mouseY = 0;

  // Smooth cursor follow using requestAnimationFrame
  function updateCursorPos() {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    if (cursorActive) rafId = requestAnimationFrame(updateCursorPos);
  }

  function showCursor(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    cursor.classList.add('visible');
    cursorActive = true;
    scrubbing = false;
    // Show play icon
    cursor.querySelector('circle').setAttribute('fill', 'rgba(0,0,0,0.5)');
    cursor.querySelector('polygon').style.display = '';
    rafId = requestAnimationFrame(updateCursorPos);
  }

  function moveCursor(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!scrubbing) {
      scrubbing = true;
      // Shrink to a small dot while scrubbing
      cursor.querySelector('circle').setAttribute('fill', 'rgba(255,255,255,0.9)');
      cursor.querySelector('polygon').style.display = 'none';
      cursor.querySelector('circle').setAttribute('r', '4');
      cursor.querySelector('circle').setAttribute('stroke', 'none');
      cursor.querySelector('svg').setAttribute('width', '12');
      cursor.querySelector('svg').setAttribute('height', '12');
      cursor.querySelector('svg').setAttribute('viewBox', '20 20 8 8');
    }
  }

  function hideCursor() {
    cursor.classList.remove('visible');
    cursorActive = false;
    scrubbing = false;
    if (rafId) cancelAnimationFrame(rafId);
    // Reset to play icon for next hover
    cursor.querySelector('circle').setAttribute('fill', 'rgba(0,0,0,0.5)');
    cursor.querySelector('circle').setAttribute('r', '22');
    cursor.querySelector('circle').setAttribute('stroke', 'white');
    cursor.querySelector('polygon').style.display = '';
    cursor.querySelector('svg').setAttribute('width', '48');
    cursor.querySelector('svg').setAttribute('height', '48');
    cursor.querySelector('svg').setAttribute('viewBox', '0 0 48 48');
  }

  cards.forEach(card => {
    const thumb = card.querySelector('.project-thumb');
    const img = thumb ? thumb.querySelector('img') : null;
    if (!thumb || !img) return;

    const frameCount = parseInt(thumb.dataset.frames || '0', 10);
    if (frameCount < 2) return;

    // Derive slug from card href: "projects/fc-26.html" → "fc-26"
    const href = card.getAttribute('href') || '';
    const slugMatch = href.match(/projects\/([^.]+)\.html/);
    if (!slugMatch) return;
    const slug = slugMatch[1];

    const originalSrc = img.getAttribute('src');
    const frames = [];
    for (let i = 1; i <= frameCount; i++) {
      frames.push('images/' + slug + '-frame-' + i + '.webp');
    }

    // Preload flag
    let preloaded = false;

    // Create scrub progress bar
    const bar = document.createElement('div');
    bar.className = 'scrub-bar';
    thumb.appendChild(bar);

    thumb.addEventListener('mouseenter', (e) => {
      if (!preloaded) {
        frames.forEach(src => { const im = new Image(); im.src = src; });
        preloaded = true;
      }
      showCursor(e);
    });

    thumb.addEventListener('mousemove', (e) => {
      const rect = thumb.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const idx = Math.min(Math.floor(pct * frames.length), frames.length - 1);

      img.src = frames[idx];
      bar.style.width = (pct * 100) + '%';
      thumb.classList.add('scrubbing');
      moveCursor(e);
    });

    thumb.addEventListener('mouseleave', () => {
      img.src = originalSrc;
      thumb.classList.remove('scrubbing');
      bar.style.width = '0%';
      hideCursor();
    });
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  setActiveNavLink();
  initFadeInAnimations();
  initGridOverlays();
  initLightbox();
  initVideoPoster();
  initBackButton();
  initThumbnailScrub();
});

/**
 * Re-initialize animations on page load (for cached pages)
 */
window.addEventListener('load', () => {
  initFadeInAnimations();
});
