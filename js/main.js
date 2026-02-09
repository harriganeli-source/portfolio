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

  // Trailing dot only on the main work page (index / root)
  const path = window.location.pathname;
  const isHomepage = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
  const hasPointer = isHomepage && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Trailing dot cursor (page-wide) ----
  let dot = null;
  let mouseX = -100, mouseY = -100;
  let dotX = -100, dotY = -100;
  let onThumb = false;
  let rafId = null;
  const ease = 0.055;
  let cursorReady = false;

  if (hasPointer) {
    const iDot = document.querySelector('.i-dot');
    let launched = false;

    // Track mouse position from the start
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
      mouseX = -100;
      mouseY = -100;
    });

    // Animate the i-dot off the letter and into the cursor
    let iDotHomeX = 0, iDotHomeY = 0;
    let rippleCooldown = false;

    if (iDot) {
      const dotRect = iDot.getBoundingClientRect();
      const startX = dotRect.left + dotRect.width / 2;
      const startY = dotRect.top + dotRect.height / 2;
      iDotHomeX = startX;
      iDotHomeY = startY;

      // Create the cursor dot, initially placed at the i-dot position
      dot = document.createElement('div');
      dot.className = 'cursor-dot';
      dot.style.left = startX + 'px';
      dot.style.top = startY + 'px';
      dot.style.opacity = '0';        // hidden until animation
      document.body.appendChild(dot);

      dotX = startX;
      dotY = startY;

      // Launch the dot toward the cursor on first mouse move
      function launchOnFirstMove() {
        if (launched) return;
        launched = true;
        document.removeEventListener('mousemove', launchOnFirstMove);

        iDot.style.opacity = '0';
        dot.style.opacity = '1';

        // Animate from the i position toward the current mouse position
        const fromX = startX;
        const fromY = startY;
        const duration = 1400;
        const startTime = performance.now();

        function launchAnim(now) {
          const t = Math.min((now - startTime) / duration, 1);
          // Ease out cubic
          const ec = 1 - Math.pow(1 - t, 3);
          // Animate toward the live mouse position (so it feels alive)
          dotX = fromX + (mouseX - fromX) * ec;
          dotY = fromY + (mouseY - fromY) * ec;
          dot.style.left = dotX + 'px';
          dot.style.top = dotY + 'px';

          if (t < 1) {
            requestAnimationFrame(launchAnim);
          } else {
            // Animation done — switch to mouse-following mode
            cursorReady = true;
            rafId = requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(launchAnim);
      }
      document.addEventListener('mousemove', launchOnFirstMove);
    } else {
      // Fallback: no i-dot found, just create cursor dot normally
      dot = document.createElement('div');
      dot.className = 'cursor-dot';
      document.body.appendChild(dot);
      cursorReady = true;
      rafId = requestAnimationFrame(tick);
    }

    // ---- Easter egg: color ripple when dot returns to the "i" ----
    function spawnRipple() {
      if (rippleCooldown || !iDot) return;
      rippleCooldown = true;

      // Recalculate i-dot position (may have changed due to scroll/resize)
      const rect = iDot.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Create ripple element
      const ripple = document.createElement('div');
      ripple.className = 'i-dot-ripple';
      ripple.style.left = cx + 'px';
      ripple.style.top = cy + 'px';
      document.body.appendChild(ripple);

      // Trigger expansion on next frame
      requestAnimationFrame(() => {
        ripple.classList.add('expanding');
      });

      // Clean up after animation
      setTimeout(() => {
        ripple.remove();
        rippleCooldown = false;
      }, 1200);
    }

    function tick() {
      if (!onNav) {
        dotX += (mouseX - dotX) * ease;
        dotY += (mouseY - dotY) * ease;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
      }

      // Check if dot has returned home to the "i"
      if (cursorReady && iDot && !rippleCooldown) {
        const rect = iDot.getBoundingClientRect();
        const homeX = rect.left + rect.width / 2;
        const homeY = rect.top + rect.height / 2;
        const dist = Math.hypot(dotX - homeX, dotY - homeY);
        if (dist < 18) {
          spawnRipple();
        }
      }

      rafId = requestAnimationFrame(tick);
    }
  }

  function expandDot() {
    if (!dot) return;
    onThumb = true;
    dot.style.width = '60px';
    dot.style.height = '60px';
    dot.style.background = 'rgba(0, 0, 0, 0.25)';
    dot.style.border = '1.5px solid rgba(0, 0, 0, 0.6)';
    dot.style.borderRadius = '50%';
  }

  function shrinkDot() {
    if (!dot) return;
    onThumb = false;
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.background = 'rgba(0, 0, 0, 0.8)';
    dot.style.border = '0px solid rgba(0, 0, 0, 0)';
    dot.style.borderRadius = '50%';
  }

  // ---- Nav link box morph ----
  let onNav = false;
  let navTargetX = 0, navTargetY = 0;

  if (hasPointer) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (!dot) return;
        onNav = true;
        const rect = link.getBoundingClientRect();
        const pad = 8;
        // Snap dot position to center of the link
        navTargetX = rect.left + rect.width / 2;
        navTargetY = rect.top + rect.height / 2;
        dotX = navTargetX;
        dotY = navTargetY;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
        // Morph into a box around the link
        dot.style.width = (rect.width + pad * 2) + 'px';
        dot.style.height = (rect.height + pad * 2) + 'px';
        dot.style.background = 'transparent';
        dot.style.border = '1.5px solid rgba(0, 0, 0, 0.8)';
        dot.style.borderRadius = '6px';
      });
      link.addEventListener('mouseleave', () => {
        onNav = false;
        shrinkDot();
      });
    });
  }

  if (!cards.length) return;

  // Track previews for cleanup on back-navigation
  const previewData = [];

  cards.forEach(card => {
    const thumb = card.querySelector('.project-thumb');
    const img = thumb ? thumb.querySelector('img') : null;
    if (!thumb || !img) return;

    // Expand dot on ALL thumbnails (pointer devices only)
    if (hasPointer) {
      thumb.addEventListener('mouseenter', expandDot);
      thumb.addEventListener('mouseleave', shrinkDot);
    }

    // Video preview on hover
    const previewSrc = thumb.dataset.preview;
    if (!previewSrc) return;

    let video = null;
    let videoReady = false;

    // Preload video element
    function ensureVideo() {
      if (video) return;
      video = document.createElement('video');
      video.className = 'thumb-video-preview';
      video.src = previewSrc;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.addEventListener('canplay', () => { videoReady = true; }, { once: true });
      thumb.appendChild(video);
    }

    previewData.push({ thumb, img, getVideo: () => video });

    thumb.addEventListener('mouseenter', () => {
      ensureVideo();
      if (videoReady) {
        video.style.opacity = '1';
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.addEventListener('canplay', () => {
          videoReady = true;
          video.style.opacity = '1';
          video.currentTime = 0;
          video.play().catch(() => {});
        }, { once: true });
      }
    });

    thumb.addEventListener('mouseleave', () => {
      if (video) {
        video.pause();
        video.style.opacity = '0';
      }
    });
  });

  // Restore thumbnails when navigating back (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      shrinkDot();
      previewData.forEach(({ thumb, getVideo }) => {
        const v = getVideo();
        if (v) {
          v.pause();
          v.style.opacity = '0';
        }
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
