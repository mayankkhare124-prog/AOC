/* ============================================================
   AOC — Frontend App Logic
   Loads dynamic content from the API and wires up all
   interactive elements (forms, modals, lightbox, filters).
   ============================================================ */

/* ---------- HTML escaping (XSS hardening) ----------
   All event/session/gallery/testimonial/team content comes from the
   database (admin-authored, but still untrusted by the time it reaches
   every visitor's browser) and is injected via innerHTML/template
   strings below. Every such value must go through this first. */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

/* Only allow http(s) image/video URLs through into src/href attributes —
   blocks javascript:, data:text/html, and similar attribute-breakout vectors. */
function safeURL(url) {
  if (!url) return '';
  try {
    const u = new URL(url, window.location.origin);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch (err) { /* invalid URL — fall through to empty */ }
  return '';
}

/* ---------- Toasts ---------- */
function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 450);
  }, 4200);
}

/* ---------- Scroll progress bar ---------- */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = `${scrolled}%`;
  });
}

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const menu = document.getElementById('mobileNav');
  if (!hamburger || !menu) return;
  function toggle() {
    const open = menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    hamburger.classList.toggle('active', open);
  }
  hamburger.addEventListener('click', toggle);
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu.classList.remove('open')));
}

/* ---------- Disable heavy cursor effects on touch devices ---------- */
function disableCursorOnTouch() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) {
    const spot = document.getElementById('cursorSpot');
    if (spot) spot.style.display = 'none';
  }
}

/* ---------- Animated counters ---------- */
function animateCounter(el, target, suffix = '', pad = 0) {
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = (pad ? String(value).padStart(pad, '0') : value.toLocaleString()) + (progress >= 1 ? suffix : '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCounters(stats) {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const key = el.dataset.counter;
          const value = stats && stats[key] != null ? stats[key] : 0;
          animateCounter(el, value, el.dataset.suffix || '', parseInt(el.dataset.pad || '0', 10));
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* ---------- Date formatting ---------- */
function formatEventDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

/* ---------- Events (upcoming) ---------- */
async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  const empty = document.getElementById('eventsEmpty');
  if (!grid) return;
  try {
    const { data } = await AOC_API.getEvents('upcoming');
    if (!data.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    grid.innerHTML = data
      .map((ev) => {
        const full = ev.spotsLeft === 0;
        const regLabel = ev.registrationLimit > 0
          ? `${ev.registeredCount || 0} / ${ev.registrationLimit} registered${full ? ' · FULL' : ''}`
          : (ev.registeredCount ? `${ev.registeredCount} registered` : '');
        return `
      <div class="poster reveal" data-event-id="${escapeHTML(ev._id)}">
        <a href="/events/${escapeHTML(ev.slug)}">
          <img src="${safeURL(ev.posterImage) || 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1000&auto=format&fit=crop'}" alt="${escapeHTML(ev.title)}" loading="lazy">
          <div class="poster-overlay">
            <div class="poster-date">${escapeHTML(formatEventDate(ev.date))}${ev.venue ? ' · ' + escapeHTML(ev.venue) : ''}</div>
            <div class="poster-title">${escapeHTML(ev.title)}</div>
            <div class="poster-type">${escapeHTML(ev.category || '')}</div>
            ${regLabel ? `<div class="poster-regcount">${escapeHTML(regLabel)}</div>` : ''}
            <div class="poster-actions">
              <a href="/events/${escapeHTML(ev.slug)}">View Event</a>
              ${ev.registrationEnabled && !full ? `<button class="btn-register" data-register="${escapeHTML(ev._id)}" data-title="${escapeHTML(ev.title)}">Register</button>` : ''}
            </div>
          </div>
        </a>
      </div>`;
      })
      .join('');

    grid.querySelectorAll('[data-register]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openRegisterModal(btn.dataset.register, btn.dataset.title);
      });
    });

    if (window.gsap) {
      gsap.utils.toArray(grid.querySelectorAll('.reveal')).forEach((el) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
      });
    }
  } catch (err) {
    grid.innerHTML = `<div class="error-state">Something interrupted the signal.<br><button class="retry-btn" onclick="loadEvents()">Retry</button></div>`;
  }
}

/* ---------- Previous Sessions / Archive ---------- */
let ALL_SESSIONS = [];
let sessionsShown = 6;

function resolveVideoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  if (/\.(mp4|webm)$/i.test(url)) {
    const safe = safeURL(url);
    return safe ? { type: 'video', src: safe } : null;
  }
  // Unrecognized URL shape — only allow it through as an iframe src if it's a genuine http(s) URL.
  const safe = safeURL(url);
  return safe ? { type: 'iframe', src: safe } : null;
}

function renderSessions() {
  const grid = document.getElementById('sessionGrid');
  const empty = document.getElementById('sessionEmpty');
  const loadMoreBtn = document.getElementById('loadMoreSessions');
  if (!grid) return;

  const activeChip = document.querySelector('.filter-chip.active');
  const category = activeChip ? activeChip.dataset.cat : 'All';
  const search = (document.getElementById('archiveSearch').value || '').toLowerCase();

  let filtered = ALL_SESSIONS.filter((s) => {
    const matchCat = category === 'All' || s.category === category;
    const matchSearch = !search || s.title.toLowerCase().includes(search) || (s.speaker || '').toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    loadMoreBtn.hidden = true;
    return;
  }
  empty.hidden = true;

  const visible = filtered.slice(0, sessionsShown);
  grid.innerHTML = visible
    .map(
      (s) => `
    <div class="session-card" data-session-id="${escapeHTML(s._id)}">
      <div class="session-thumb">
        <img src="${safeURL(s.thumbnail) || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop'}" alt="${escapeHTML(s.title)}" loading="lazy">
        <div class="session-play"><span>&#9658;</span></div>
        ${s.duration ? `<div class="session-duration">${escapeHTML(s.duration)}</div>` : ''}
      </div>
      <div class="session-body">
        <div class="session-cat">${escapeHTML(s.category)}</div>
        <div class="session-title">${escapeHTML(s.title)}</div>
        <div class="session-meta">${s.speaker ? escapeHTML(s.speaker) + ' · ' : ''}${escapeHTML(new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))}</div>
        <div class="session-desc">${escapeHTML(s.description || '')}</div>
      </div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('.session-card').forEach((card) => {
    card.addEventListener('click', () => {
      const session = ALL_SESSIONS.find((s) => s._id === card.dataset.sessionId);
      openVideoLightbox(session);
    });
  });

  loadMoreBtn.hidden = filtered.length <= sessionsShown;
}

async function loadSessions() {
  const grid = document.getElementById('sessionGrid');
  if (!grid) return;
  try {
    const { data } = await AOC_API.getSessions();
    ALL_SESSIONS = data;
    renderSessions();
  } catch (err) {
    grid.innerHTML = `<div class="error-state">Something interrupted the signal.<br><button class="retry-btn" onclick="loadSessions()">Retry</button></div>`;
  }
}

function initArchiveControls() {
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      sessionsShown = 6;
      renderSessions();
    });
  });
  const search = document.getElementById('archiveSearch');
  if (search) {
    let t;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        sessionsShown = 6;
        renderSessions();
      }, 250);
    });
  }
  const loadMoreBtn = document.getElementById('loadMoreSessions');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      sessionsShown += 6;
      renderSessions();
    });
  }
}

/* ---------- Gallery (Featured Editorial Mosaic + View All + Touch Swipe Lightbox) ---------- */
window.ALL_AOC_GALLERY = [];

async function loadGallery() {
  const exhibit = document.getElementById('galleryExhibit');
  const empty = document.getElementById('galleryEmpty');
  const ctaWrap = document.getElementById('galleryCtaWrap');
  if (!exhibit) return;
  try {
    const { data } = await AOC_API.getGallery();
    if (!data.length) {
      empty.hidden = false;
      if (ctaWrap) ctaWrap.hidden = true;
      return;
    }
    window.ALL_AOC_GALLERY = data;

    // Featured slice: max 5 photos on mobile, max 7 on desktop
    const isMobile = window.innerWidth <= 768;
    const featuredCount = isMobile ? 5 : 7;
    const items = data.slice(0, featuredCount);

    exhibit.innerHTML = items
      .map((g, i) => {
        let spanClass = '';
        if (i === 0) spanClass = 'feature';
        else if (i === 1) spanClass = 'wide';
        else if (i === 3) spanClass = 'tall';

        const capHtml = g.title ? `<div class="mosaic-caption">${escapeHTML(g.title)}</div>` : '';
        return `<div class="mosaic-item ${spanClass}" data-index="${i}">
          <img src="${safeURL(g.imageUrl)}" alt="${escapeHTML(g.title || 'AOC moment')}" loading="lazy">
          ${capHtml}
        </div>`;
      })
      .join('');

    exhibit.querySelectorAll('.mosaic-item').forEach((item) => {
      item.addEventListener('click', () => openGalleryLightbox(parseInt(item.dataset.index, 10)));
    });

    if (ctaWrap) ctaWrap.hidden = false;
    initFullGalleryModal();
  } catch (err) {
    exhibit.innerHTML = `<div class="error-state">Something interrupted the signal.<br><button class="retry-btn" onclick="loadGallery()">Retry</button></div>`;
  }
}

function initFullGalleryModal() {
  const btn = document.getElementById('viewAllMomentsBtn');
  const modal = document.getElementById('fullGalleryModal');
  const closeBtn = document.getElementById('fullGalleryClose');
  const grid = document.getElementById('fullGalleryGrid');
  if (!btn || !modal || !grid) return;

  function openModal() {
    const items = window.ALL_AOC_GALLERY || [];
    grid.innerHTML = items
      .map((g, i) => `
        <div class="full-gallery-item" data-index="${i}">
          <img src="${safeURL(g.imageUrl)}" alt="${escapeHTML(g.title || 'AOC moment')}" loading="lazy">
        </div>
      `)
      .join('');

    grid.querySelectorAll('.full-gallery-item').forEach((el) => {
      el.addEventListener('click', () => {
        openGalleryLightbox(parseInt(el.dataset.index, 10));
      });
    });

    modal.classList.add('open');
    openModalA11y('fullGalleryModal');
  }

  function closeModal() {
    modal.classList.remove('open');
    closeModalA11y('fullGalleryModal');
  }

  btn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('open') && e.key === 'Escape') closeModal();
  });
}

let galleryLightboxIndex = 0;
function openGalleryLightbox(index) {
  const items = window.ALL_AOC_GALLERY || [];
  if (!items.length) return;
  galleryLightboxIndex = index;
  renderGalleryLightbox();
  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  lb.dataset.mode = 'gallery';
  document.querySelector('.lightbox-prev').style.display = '';
  document.querySelector('.lightbox-next').style.display = '';
  openModalA11y('lightbox');
}

function renderGalleryLightbox() {
  const items = window.ALL_AOC_GALLERY || [];
  const item = items[galleryLightboxIndex];
  if (!item) return;

  document.getElementById('lightboxContent').innerHTML = `<img src="${safeURL(item.imageUrl)}" alt="${escapeHTML(item.title || '')}">`;
  document.getElementById('lightboxCaption').textContent = [item.title, item.caption].filter(Boolean).join(' — ');

  const counterEl = document.getElementById('lightboxCounter');
  if (counterEl) {
    const current = String(galleryLightboxIndex + 1).padStart(2, '0');
    const total = String(items.length).padStart(2, '0');
    counterEl.textContent = `${current} / ${total}`;
  }
}

/* ---------- Video lightbox (sessions) ---------- */
function openVideoLightbox(session) {
  if (!session) return;
  const lb = document.getElementById('lightbox');
  lb.dataset.mode = 'video';
  const embed = resolveVideoEmbed(session.videoUrl);
  const content = document.getElementById('lightboxContent');
  if (!embed) {
    content.innerHTML = `<div style="max-width:500px;text-align:center;font-family:'Fraunces',serif;font-style:italic;font-size:20px;color:#A3A3A8;">
      This session recording isn't linked yet.<br>Check back soon.</div>`;
  } else if (embed.type === 'iframe') {
    content.innerHTML = `<iframe src="${embed.src}" allow="autoplay; fullscreen" allowfullscreen title="${escapeHTML(session.title)}"></iframe>`;
  } else {
    content.innerHTML = `<video src="${embed.src}" controls autoplay></video>`;
  }
  document.getElementById('lightboxCaption').textContent = `${session.title}${session.speaker ? ' — ' + session.speaker : ''}`;
  const counterEl = document.getElementById('lightboxCounter');
  if (counterEl) counterEl.textContent = '';
  document.querySelector('.lightbox-prev').style.display = 'none';
  document.querySelector('.lightbox-next').style.display = 'none';
  lb.classList.add('open');
  openModalA11y('lightbox');
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  const close = () => {
    lb.classList.remove('open');
    document.getElementById('lightboxContent').innerHTML = '';
    closeModalA11y('lightbox');
  };
  document.getElementById('lightboxClose').addEventListener('click', close);
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else trapFocus(lb, e);
    if (lb.dataset.mode === 'gallery') {
      if (e.key === 'ArrowRight') navigateGallery(1);
      if (e.key === 'ArrowLeft') navigateGallery(-1);
    }
  });

  function navigateGallery(dir) {
    const items = window.ALL_AOC_GALLERY || [];
    if (!items.length) return;
    galleryLightboxIndex = (galleryLightboxIndex + dir + items.length) % items.length;
    renderGalleryLightbox();
  }

  document.getElementById('lightboxPrev').addEventListener('click', () => {
    if (lb.dataset.mode === 'gallery') navigateGallery(-1);
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    if (lb.dataset.mode === 'gallery') navigateGallery(1);
  });

  // Touch Swipe Support for Mobile Phones
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  lb.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].screenX;
      touchStartY = e.touches[0].screenY;
    }
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length === 1) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }
  }, { passive: true });

  function handleSwipe() {
    if (lb.dataset.mode !== 'gallery') return;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > 45 && Math.abs(diffY) < 60) {
      if (diffX < 0) navigateGallery(1);   // Swipe left -> Next photo
      else navigateGallery(-1);            // Swipe right -> Prev photo
    }
  }
}

/* ---------- Testimonials ---------- */
async function loadTestimonials() {
  const wrap = document.getElementById('testiWrap');
  const dotsWrap = document.getElementById('testiDots');
  if (!wrap) return;
  try {
    const { data: allTestimonials } = await AOC_API.getTestimonials();
    if (!allTestimonials.length) return;
    // Keep the homepage focused — a handful of strong quotes reads stronger than a wall of cards.
    const data = allTestimonials.slice(0, 4);
    const mark = wrap.querySelector('.testi-mark');
    wrap.innerHTML = '';
    wrap.appendChild(mark);
    data.forEach((t, i) => {
      const slide = document.createElement('div');
      slide.className = `testi-slide${i === 0 ? ' active' : ''}`;
      slide.innerHTML = `
        <div class="testi-portrait"><img src="${safeURL(t.imageUrl) || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop'}" alt="${escapeHTML(t.name)}" loading="lazy"></div>
        <p class="testi-quote">${escapeHTML(t.quote)}</p>
        <div class="testi-name">${escapeHTML(t.name)}</div><div class="testi-role">${escapeHTML([t.role, t.course].filter(Boolean).join(', '))}</div>`;
      wrap.appendChild(slide);
    });
    dotsWrap.innerHTML = data.map((_, i) => `<div class="testi-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`).join('');

    const slides = wrap.querySelectorAll('.testi-slide');
    const dots = dotsWrap.querySelectorAll('.testi-dot');
    let idx = 0;
    function show(i) {
      slides.forEach((s) => s.classList.remove('active'));
      dots.forEach((d) => d.classList.remove('active'));
      slides[i].classList.add('active');
      dots[i].classList.add('active');
      idx = i;
    }
    dots.forEach((d) => d.addEventListener('click', () => show(parseInt(d.dataset.i, 10))));
    if (slides.length > 1) {
      setInterval(() => show((idx + 1) % slides.length), 5200);
    }
  } catch (err) {
    wrap.innerHTML = `<div class="error-state">Something interrupted the signal.</div>`;
  }
}

/* ---------- Team ---------- */
async function loadTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  try {
    const { data } = await AOC_API.getTeam();
    grid.innerHTML = data
      .map(
        (m) => `
      <div class="team-card reveal">
        <img src="${safeURL(m.imageUrl) || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop'}" alt="${escapeHTML(m.name)}" loading="lazy">
        <div class="team-info">
          <div class="team-name">${escapeHTML(m.name)}</div><div class="team-role">${escapeHTML(m.role)}</div>
          ${m.quote ? `<div class="team-quote">"${escapeHTML(m.quote)}"</div>` : ''}
          <div class="team-social">
            ${m.instagram ? `<a href="${safeURL(m.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
            ${m.linkedin ? `<a href="${safeURL(m.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
          </div>
        </div>
      </div>`
      )
      .join('');
    if (window.gsap) {
      gsap.utils.toArray(grid.querySelectorAll('.reveal')).forEach((el) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
      });
    }
  } catch (err) {
    grid.innerHTML = `<div class="error-state">Something interrupted the signal.</div>`;
  }
}

/* ---------- Site settings (social links + stats + hero video) ---------- */
async function loadSettings() {
  try {
    const { data } = await AOC_API.getSettings();
    initCounters(data.stats || {});

    const footerLinks = document.getElementById('footerLinks');
    if (footerLinks) {
      const links = [];
      if (data.social?.instagram) links.push(`<li><a href="${safeURL(data.social.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a></li>`);
      if (data.social?.linkedin) links.push(`<li><a href="${safeURL(data.social.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>`);
      if (data.social?.youtube) links.push(`<li><a href="${safeURL(data.social.youtube)}" target="_blank" rel="noopener noreferrer">YouTube</a></li>`);
      if (data.social?.mits) links.push(`<li><a href="${safeURL(data.social.mits)}" target="_blank" rel="noopener noreferrer">MITS</a></li>`);
      footerLinks.innerHTML = links.join('') || '<li><span style="color:#555;">Social links coming soon</span></li>';
    }
  } catch (err) {
    initCounters({});
  }
}

/* ---------- Modal accessibility helpers (focus trap + return focus) ---------- */
const modalTriggerEls = {};
function trapFocus(overlay, e) {
  if (e.key !== 'Tab') return;
  const focusable = overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}
function openModalA11y(overlayId) {
  modalTriggerEls[overlayId] = document.activeElement;
  const overlay = document.getElementById(overlayId);
  // Move focus into the dialog once it's visible (next tick so display/opacity transitions don't eat it).
  setTimeout(() => {
    const focusable = overlay.querySelector('input, textarea, select, button');
    if (focusable) focusable.focus();
  }, 50);
}
function closeModalA11y(overlayId) {
  const trigger = modalTriggerEls[overlayId];
  if (trigger && typeof trigger.focus === 'function') trigger.focus();
}

/* ---------- Registration modal ---------- */
function openRegisterModal(eventId, eventTitle) {
  document.getElementById('regEventId').value = eventId;
  document.getElementById('registerEventTitle').textContent = eventTitle || 'Event Registration';
  document.getElementById('registerFormWrap').hidden = false;
  document.getElementById('registerSuccess').hidden = true;
  document.getElementById('registerForm').reset();
  document.getElementById('regEventId').value = eventId;
  document.getElementById('registerStatus').textContent = '';
  document.getElementById('registerModal').classList.add('open');
  openModalA11y('registerModal');
}

function initRegisterModal() {
  const overlay = document.getElementById('registerModal');
  const close = () => { overlay.classList.remove('open'); closeModalA11y('registerModal'); };
  document.getElementById('registerClose').addEventListener('click', close);
  document.getElementById('registerSuccessClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else trapFocus(overlay, e);
  });

  const form = document.getElementById('registerForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerSubmitBtn');
    const status = document.getElementById('registerStatus');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    btn.disabled = true;
    btn.textContent = 'Registering...';
    status.textContent = '';
    status.className = 'form-status';
    try {
      await AOC_API.register(payload);
      document.getElementById('registerFormWrap').hidden = true;
      document.getElementById('registerSuccess').hidden = false;
      document.getElementById('registerSuccessClose')?.focus();
      showToast('Registration confirmed.', 'success');
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Register';
    }
  });
}

/* ---------- Join AOC modal ---------- */
function openJoinModal() {
  document.getElementById('joinFormWrap').hidden = false;
  document.getElementById('joinSuccess').hidden = true;
  document.getElementById('joinForm').reset();
  document.getElementById('joinStatus').textContent = '';
  document.getElementById('joinModal').classList.add('open');
  openModalA11y('joinModal');
}

function initJoinModal() {
  const overlay = document.getElementById('joinModal');
  const close = () => { overlay.classList.remove('open'); closeModalA11y('joinModal'); };
  document.getElementById('joinClose').addEventListener('click', close);
  document.getElementById('joinSuccessClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else trapFocus(overlay, e);
  });

  ['heroJoinBtn', 'navJoinBtn', 'finalJoinBtn', 'mobileJoinBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => { document.getElementById('mobileNav')?.classList.remove('open'); openJoinModal(); });
  });

  const form = document.getElementById('joinForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('joinSubmitBtn');
    const status = document.getElementById('joinStatus');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    status.textContent = '';
    status.className = 'form-status';
    try {
      await AOC_API.joinAoc(payload);
      document.getElementById('joinFormWrap').hidden = true;
      document.getElementById('joinSuccess').hidden = false;
      document.getElementById('joinSuccessClose')?.focus();
      showToast('Application submitted.', 'success');
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit';
    }
  });
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('contactStatus');
    const btn = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.textContent = '';
    status.className = 'form-status';
    try {
      await AOC_API.contact(payload);
      status.textContent = 'Message sent. We\'ll get back to you soon.';
      status.classList.add('success');
      form.reset();
      showToast('Message sent.', 'success');
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initMobileNav();
  disableCursorOnTouch();
  initLightbox();
  initRegisterModal();
  initJoinModal();
  initContactForm();
  initArchiveControls();

  loadEvents();
  loadSessions();
  loadGallery();
  loadTestimonials();
  loadTeam();
  loadSettings();
});
