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
  const ease = 0.15;
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

      // Launch the dot: first lift off the "i", then fly toward cursor
      function launchOnFirstMove() {
        if (launched) return;
        launched = true;
        document.removeEventListener('mousemove', launchOnFirstMove);

        iDot.style.opacity = '0';
        dot.style.opacity = '1';
        dot.style.transition = 'none'; // control animation manually

        // Phase 1: Lift — grow and rise above the "i"
        const liftDuration = 600;
        const liftHeight = 30;        // pixels to rise
        const liftStart = performance.now();

        function liftAnim(now) {
          const t = Math.min((now - liftStart) / liftDuration, 1);
          // Ease out — decelerates as it lifts
          const e = 1 - Math.pow(1 - t, 2);

          dotX = startX;
          dotY = startY - liftHeight * e;
          dot.style.left = dotX + 'px';
          dot.style.top = dotY + 'px';

          // Grow from i-dot size (~5px) to cursor size (14px)
          const size = 5 + (14 - 5) * e;
          dot.style.width = size + 'px';
          dot.style.height = size + 'px';

          if (t < 1) {
            requestAnimationFrame(liftAnim);
          } else {
            // Phase 2: Fly toward the cursor
            const flyFromX = dotX;
            const flyFromY = dotY;
            const flyDuration = 2400;
            const flyStart = performance.now();

            // Restore CSS transitions for later morphing
            dot.style.transition = '';

            function flyAnim(now) {
              const t2 = Math.min((now - flyStart) / flyDuration, 1);
              // Ease-in-out: slow start, fast middle, gentle arrival
              const ec = t2 < 0.5
                ? 4 * t2 * t2 * t2
                : 1 - Math.pow(-2 * t2 + 2, 3) / 2;
              dotX = flyFromX + (mouseX - flyFromX) * ec;
              dotY = flyFromY + (mouseY - flyFromY) * ec;
              dot.style.left = dotX + 'px';
              dot.style.top = dotY + 'px';

              if (t2 < 1) {
                requestAnimationFrame(flyAnim);
              } else {
                cursorReady = true;
                rafId = requestAnimationFrame(tick);
              }
            }
            requestAnimationFrame(flyAnim);
          }
        }
        requestAnimationFrame(liftAnim);
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

    // ---- Easter egg: dot clicks back into the "i", ripple fires ----
    let docking = false;

    function dockAndRipple() {
      if (rippleCooldown || !iDot || docking) return;
      docking = true;
      rippleCooldown = true;

      const rect = iDot.getBoundingClientRect();
      const homeX = rect.left + rect.width / 2;
      const homeY = rect.top + rect.height / 2;
      // i-dot is 0.18em at 30px font ≈ 5.4px
      const iDotSize = rect.width || 5;

      // Animate cursor dot shrinking and snapping into the i position
      const fromX = dotX, fromY = dotY;
      const dockDuration = 250;
      const dockStart = performance.now();

      // Temporarily disable CSS transition so we control the animation
      dot.style.transition = 'none';

      function dockAnim(now) {
        const t = Math.min((now - dockStart) / dockDuration, 1);
        // Ease in quad — accelerates into place
        const e = t * t;

        dotX = fromX + (homeX - fromX) * e;
        dotY = fromY + (homeY - fromY) * e;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';

        // Shrink from current size toward the i-dot size
        const currentSize = 14 - (14 - iDotSize) * e;
        dot.style.width = currentSize + 'px';
        dot.style.height = currentSize + 'px';

        if (t < 1) {
          requestAnimationFrame(dockAnim);
        } else {
          // Dot has landed — restore filled i-dot, hide the cursor dot
          iDot.style.opacity = '1';
          dot.style.opacity = '0';

          // Restore CSS transition
          dot.style.transition = '';

          // Fire the ripple from the i position
          const ripple = document.createElement('div');
          ripple.className = 'i-dot-ripple';
          ripple.style.left = homeX + 'px';
          ripple.style.top = homeY + 'px';
          document.body.appendChild(ripple);
          requestAnimationFrame(() => { ripple.classList.add('expanding'); });

          // Cascade all preview videos
          playAllPreviews();

          // After a pause, re-launch the dot off the "i"
          setTimeout(() => {
            stopAllPreviews();
            const r2 = iDot.getBoundingClientRect();
            const sx = r2.left + r2.width / 2;
            const sy = r2.top + r2.height / 2;
            dotX = sx;
            dotY = sy;
            dot.style.left = sx + 'px';
            dot.style.top = sy + 'px';
            // Reset dot to normal size
            dot.style.width = '14px';
            dot.style.height = '14px';
            dot.style.background = '#fff';
            dot.style.border = '0px solid rgba(255, 255, 255, 0)';
            dot.style.borderRadius = '50%';

            iDot.style.opacity = '0';
            dot.style.opacity = '1';
            docking = false;

            ripple.remove();
            rippleCooldown = false;
          }, 3500);
        }
      }
      requestAnimationFrame(dockAnim);
    }

    function tick() {
      if (!onNav && !docking) {
        dotX += (mouseX - dotX) * ease;
        dotY += (mouseY - dotY) * ease;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
      }

      // Check if dot has returned home to the "i"
      if (cursorReady && iDot && !rippleCooldown && !docking) {
        const rect = iDot.getBoundingClientRect();
        const homeX = rect.left + rect.width / 2;
        const homeY = rect.top + rect.height / 2;
        const dist = Math.hypot(dotX - homeX, dotY - homeY);
        if (dist < 18) {
          dockAndRipple();
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
    dot.style.background = 'rgba(255, 255, 255, 0.15)';
    dot.style.border = '1.5px solid rgba(255, 255, 255, 0.5)';
    dot.style.borderRadius = '50%';
  }

  function shrinkDot() {
    if (!dot) return;
    onThumb = false;
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.background = '#fff';
    dot.style.border = '0px solid rgba(255, 255, 255, 0)';
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
        dot.style.border = '1.5px solid #fff';
        dot.style.borderRadius = '6px';
      });
      link.addEventListener('mouseleave', () => {
        onNav = false;
        shrinkDot();
      });
    });
  }

  if (!cards.length) return;

  // Track previews for cleanup and easter-egg auto-play
  const previewData = [];
  let allPreviewsPlaying = false;

  function playAllPreviews() {
    if (allPreviewsPlaying) return;
    allPreviewsPlaying = true;
    previewData.forEach((entry, i) => {
      if (!entry.ensureVideo) return;
      setTimeout(() => {
        entry.ensureVideo();
        const v = entry.getVideo();
        if (!v) return;
        const tryPlay = () => {
          v.style.opacity = '1';
          v.currentTime = 0;
          v.play().catch(() => {});
        };
        if (v.readyState >= 3) {
          tryPlay();
        } else {
          v.addEventListener('canplay', tryPlay, { once: true });
        }
      }, i * 120); // stagger each card
    });
  }

  function stopAllPreviews() {
    previewData.forEach(entry => {
      const v = entry.getVideo();
      if (v) {
        v.pause();
        v.style.opacity = '0';
      }
    });
    allPreviewsPlaying = false;
  }

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
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      // iOS Safari needs these as HTML attributes for autoplay
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('autoplay', '');
      video.addEventListener('canplay', () => { videoReady = true; }, { once: true });
      thumb.appendChild(video);
      // Set src AFTER appending to DOM (iOS sometimes needs this)
      video.src = previewSrc;
      video.load();
    }

    previewData.push({ thumb, img, getVideo: () => video, ensureVideo });

    // On hover: hide video to reveal static thumbnail underneath
    if (hasPointer) {
      thumb.addEventListener('mouseenter', () => {
        if (video) {
          video.style.opacity = '0';
        }
      });
      thumb.addEventListener('mouseleave', () => {
        if (video && !video.paused) {
          video.style.opacity = '1';
        }
      });
    }
  });

  // ---- Auto-play previews on scroll into view (all devices) ----
  if (isHomepage && previewData.length) {
    // Track which thumbs are currently in view
    const visibleThumbs = new Set();

    function tryPlay(data) {
      data.ensureVideo();
      const v = data.getVideo();
      if (!v) return;
      v.muted = true;
      v.play().then(() => {
        v.style.opacity = '1';
      }).catch(() => {});
    }

    const autoPlayObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const data = previewData.find(d => d.thumb === entry.target);
        if (!data) return;

        if (entry.isIntersecting) {
          visibleThumbs.add(data);
          tryPlay(data);
        } else {
          visibleThumbs.delete(data);
          const v = data.getVideo();
          if (v) {
            v.pause();
            v.style.opacity = '0';
          }
        }
      });
    }, { threshold: 0.35 });

    previewData.forEach(entry => {
      autoPlayObserver.observe(entry.thumb);
    });

    // iOS fallback: on first touch, try playing all visible videos
    // iOS sometimes blocks autoplay until a user gesture occurs
    let touchUnlocked = false;
    document.addEventListener('touchstart', function unlockVideos() {
      if (touchUnlocked) return;
      touchUnlocked = true;
      document.removeEventListener('touchstart', unlockVideos);
      visibleThumbs.forEach(data => tryPlay(data));
    }, { once: true, passive: true });
  }

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
/**
 * Slow auto-scroll for the about page photo strip
 */
function initPhotoStripScroll() {
  const strip = document.querySelector('.about-photo-grid');
  if (!strip) return;

  const speed = 0.5; // pixels per frame
  let paused = false;
  let running = false;
  let acc = 0; // accumulator for sub-pixel scrolling

  function scroll() {
    if (!paused) {
      acc += speed;
      if (acc >= 1) {
        const px = Math.floor(acc);
        acc -= px;
        strip.scrollLeft += px;
        if (strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 1) {
          strip.scrollLeft = 0;
        }
      }
    }
    requestAnimationFrame(scroll);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(scroll);
  }

  // Desktop: pause on hover
  strip.addEventListener('mouseenter', () => { paused = true; });
  strip.addEventListener('mouseleave', () => { paused = false; });

  // Mobile: only pause while finger is actively swiping the strip
  let touchTimeout;
  strip.addEventListener('touchstart', () => {
    paused = true;
    clearTimeout(touchTimeout);
  }, { passive: true });
  strip.addEventListener('touchend', () => {
    // Brief delay so the strip doesn't jerk right as finger lifts
    clearTimeout(touchTimeout);
    touchTimeout = setTimeout(() => { paused = false; }, 1500);
  });

  // Start immediately — the .about-photo divs have fixed CSS widths
  // so scrollWidth > clientWidth even before images load
  start();
  // Also retry after load in case something delayed
  window.addEventListener('load', start);
}

/**
 * On mobile, show project-info overlay on the card nearest viewport center
 */
function initMobileActiveCard() {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  let activeCard = null;

  function update() {
    const center = window.innerHeight / 2;
    let closest = null;
    let closestDist = Infinity;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = card;
      }
    });

    if (closest !== activeCard) {
      if (activeCard) activeCard.classList.remove('mobile-active');
      if (closest && closestDist < window.innerHeight * 0.4) {
        closest.classList.add('mobile-active');
        activeCard = closest;
      } else {
        activeCard = null;
      }
    }
  }

  // Throttled scroll listener
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  }, { passive: true });

  update();
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  setActiveNavLink();
  initFadeInAnimations();
  initGridOverlays();
  initLightbox();
  initVideoPoster();
  initBackButton();
  initThumbnailScrub();
  initPhotoStripScroll();
  initMobileActiveCard();
});

/**
 * Re-initialize animations on page load (for cached pages)
 */
window.addEventListener('load', () => {
  initFadeInAnimations();
});
