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

  // Detect pointer device (no trailing dot on touch-only devices or photography page)
  const isPhotography = window.location.pathname.includes('photography');
  const hasPointer = !isPhotography && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Trailing dot cursor (page-wide) ----
  let dot = null;
  let mouseX = -100, mouseY = -100;
  let dotX = -100, dotY = -100;
  let onThumb = false;
  let rafId = null;
  const ease = 0.08;

  if (hasPointer) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Hide when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
      mouseX = -100;
      mouseY = -100;
    });

    function tick() {
      dotX += (mouseX - dotX) * ease;
      dotY += (mouseY - dotY) * ease;
      dot.style.left = dotX + 'px';
      dot.style.top = dotY + 'px';
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function expandDot() {
    if (!dot) return;
    onThumb = true;
    dot.style.width = '60px';
    dot.style.height = '60px';
    dot.style.background = 'rgba(0, 0, 0, 0.25)';
    dot.style.border = '1.5px solid rgba(0, 0, 0, 0.6)';
  }

  function shrinkDot() {
    if (!dot) return;
    onThumb = false;
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.background = 'rgba(0, 0, 0, 0.8)';
    dot.style.border = '0px solid rgba(0, 0, 0, 0)';
  }

  if (!cards.length) return;

  // Track all scrubbable thumbnails so we can restore on back-navigation
  const scrubData = [];

  cards.forEach(card => {
    const thumb = card.querySelector('.project-thumb');
    const img = thumb ? thumb.querySelector('img') : null;
    if (!thumb || !img) return;

    // Expand dot on ALL thumbnails (pointer devices only)
    if (hasPointer) {
      thumb.addEventListener('mouseenter', expandDot);
      thumb.addEventListener('mouseleave', shrinkDot);
    }

    // Scrub logic only for thumbnails with frames
    const frameCount = parseInt(thumb.dataset.frames || '0', 10);
    if (frameCount < 2) return;

    const href = card.getAttribute('href') || '';
    const slugMatch = href.match(/projects\/([^.]+)\.html/);
    if (!slugMatch) return;
    const slug = slugMatch[1];

    const originalSrc = img.getAttribute('src');
    const frames = [];
    for (let i = 1; i <= frameCount; i++) {
      frames.push('images/' + slug + '-frame-' + i + '.webp');
    }

    scrubData.push({ img, originalSrc, thumb });

    let preloaded = false;

    const bar = document.createElement('div');
    bar.className = 'scrub-bar';
    thumb.appendChild(bar);

    thumb.addEventListener('mouseenter', () => {
      if (!preloaded) {
        frames.forEach(src => { const im = new Image(); im.src = src; });
        preloaded = true;
      }
    });

    thumb.addEventListener('mousemove', (e) => {
      const rect = thumb.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const idx = Math.min(Math.floor(pct * frames.length), frames.length - 1);

      img.src = frames[idx];
      bar.style.width = (pct * 100) + '%';
      thumb.classList.add('scrubbing');
    });

    thumb.addEventListener('mouseleave', () => {
      img.src = originalSrc;
      thumb.classList.remove('scrubbing');
      bar.style.width = '0%';
    });
  });

  // Restore thumbnails when navigating back (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      shrinkDot();
      scrubData.forEach(({ img, originalSrc, thumb }) => {
        img.src = originalSrc;
        thumb.classList.remove('scrubbing');
        const bar = thumb.querySelector('.scrub-bar');
        if (bar) bar.style.width = '0%';
      });
    }
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
