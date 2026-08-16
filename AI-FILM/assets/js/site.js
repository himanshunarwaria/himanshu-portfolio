/* ==========================================================================
   HIMANSHU NARWARIA — site behaviour
   No dependencies. Everything here is progressive enhancement: with JS off
   the page still reads, the posters still show, and every work card is a
   plain link straight to its video file.

   1  Environment gates      — never autoplay on data-saver / slow / reduced-motion
   2  Reveal on scroll
   3  Hero band video
   4  Work card hover preview
   5  Lightbox
   6  Nav highlight + floating WhatsApp
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1  ENVIRONMENT GATES --------------------------------------- */
  var conn        = navigator.connection || navigator.webkitConnection || {};
  var saveData    = conn.saveData === true;
  var slowNet     = /2g/.test(conn.effectiveType || '');
  var mqReduce    = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqHover     = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqWide      = window.matchMedia('(min-width: 900px)');

  function reduced()  { return mqReduce.matches; }
  /* heavy media only when the connection and the user's settings allow it */
  function mayStream(){ return !saveData && !slowNet && !reduced(); }

  /* tell the inline head script that the reveal failsafe is not needed */
  window.__siteReady = true;

  /* current year in the footer */
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = year;
  });

  /* ---------- 2  REVEAL ON SCROLL ---------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced()) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { revealObs.observe(el); });
  }

  /* ---------- 3  HERO BAND VIDEO -----------------------------------------
     The poster carries first paint. The video is only attached on a wide
     screen with a healthy connection, and it pauses whenever it scrolls out
     of view so it costs nothing while the visitor reads the rest.          */
  var heroBand = document.querySelector('[data-hero-band]');
  if (heroBand && mayStream() && mqWide.matches) {
    var heroSrc = heroBand.getAttribute('data-video');
    if (heroSrc) {
      var heroVideo = document.createElement('video');
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.loop = true;
      heroVideo.autoplay = true;
      heroVideo.playsInline = true;
      heroVideo.setAttribute('playsinline', '');
      heroVideo.setAttribute('muted', '');
      heroVideo.setAttribute('aria-hidden', 'true');
      heroVideo.setAttribute('tabindex', '-1');
      heroVideo.preload = 'auto';
      heroVideo.src = heroSrc;

      heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-live'); });

      /* sits directly after the poster so it paints over it, and under the
         viewfinder marks and the caption bar */
      var heroPoster = heroBand.querySelector('img');
      if (heroPoster) { heroPoster.insertAdjacentElement('afterend', heroVideo); }
      else { heroBand.insertBefore(heroVideo, heroBand.firstChild); }

      var tryPlay = heroVideo.play();
      if (tryPlay && typeof tryPlay.catch === 'function') { tryPlay.catch(function () { /* poster stays */ }); }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!document.body.classList.contains('is-locked')) { heroVideo.play().catch(function () {}); }
            } else {
              heroVideo.pause();
            }
          });
        }, { threshold: 0.15 }).observe(heroBand);
      }
    }
  }

  /* ---------- 4  WORK CARD HOVER PREVIEW ---------------------------------
     Desktop pointers only. The clip is fetched on first hover, never before,
     so a visitor who scrolls past the grid downloads nothing but posters.  */
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-work]'));

  function attachPreview(card) {
    var media = card.querySelector('.work-media');
    var src   = card.getAttribute('data-video');
    if (!media || !src) return null;

    var vid = media.querySelector('video[data-preview]');
    if (vid) return vid;

    vid = document.createElement('video');
    vid.muted = true;
    vid.defaultMuted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('muted', '');
    vid.setAttribute('aria-hidden', 'true');
    vid.setAttribute('tabindex', '-1');
    vid.setAttribute('data-preview', '');
    vid.preload = 'auto';
    vid.src = src;
    vid.addEventListener('playing', function () { vid.classList.add('is-live'); });
    media.appendChild(vid);
    return vid;
  }

  if (mqHover.matches) {
    cards.forEach(function (card) {
      /* the campaign masters are large; they play on click only, never on hover */
      if (card.hasAttribute('data-portrait')) return;
      var vid = null;

      function start() {
        if (!mayStream()) return;
        vid = vid || attachPreview(card);
        if (!vid) return;
        var p = vid.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      }
      function stop() {
        if (!vid) return;
        vid.classList.remove('is-live');
        vid.pause();
        try { vid.currentTime = 0; } catch (e) { /* not seekable yet */ }
      }

      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focus', start);
      card.addEventListener('blur', stop);
    });
  }

  /* ---------- 5  LIGHTBOX ------------------------------------------------ */
  var lb        = document.getElementById('lightbox');
  var lbStage   = lb && lb.querySelector('[data-lb-stage]');
  var lbTags    = lb && lb.querySelector('[data-lb-tags]');
  var lbTitle   = lb && lb.querySelector('[data-lb-title]');
  var lbNote    = lb && lb.querySelector('[data-lb-note]');
  var lbCount   = lb && lb.querySelector('[data-lb-count]');
  var lbPrev    = lb && lb.querySelector('[data-lb-prev]');
  var lbNext    = lb && lb.querySelector('[data-lb-next]');
  var lbClose   = lb && lb.querySelector('[data-lb-close]');
  var lbVideo   = null;
  var lbIndex   = -1;
  var lastFocus = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function renderSlide(i) {
    var card = cards[i];
    if (!card) return;
    lbIndex = i;

    /* 9:16 films get a portrait stage instead of pillarboxing */
    lb.classList.toggle('is-portrait', card.hasAttribute('data-portrait'));

    if (!lbVideo) {
      lbVideo = document.createElement('video');
      lbVideo.setAttribute('controls', '');
      lbVideo.setAttribute('playsinline', '');
      lbVideo.playsInline = true;
      lbVideo.preload = 'auto';
      lbStage.appendChild(lbVideo);
    }
    lbVideo.poster = card.getAttribute('data-poster') || '';
    lbVideo.src    = card.getAttribute('data-video');
    lbVideo.load();
    var p = lbVideo.play();
    if (p && typeof p.catch === 'function') { p.catch(function () { /* user can hit play */ }); }

    lbTags.textContent  = card.getAttribute('data-tags')  || '';
    lbTitle.textContent = card.getAttribute('data-title') || '';
    lbNote.textContent  = card.getAttribute('data-note')  || '';
    lbCount.textContent = pad(i + 1) + ' / ' + pad(cards.length);
  }

  function openLightbox(i) {
    if (!lb) return;
    lastFocus = document.activeElement;
    lb.classList.add('is-open');
    lb.removeAttribute('aria-hidden');
    document.body.classList.add('is-locked');
    renderSlide(i);
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); }
    if (lastFocus && typeof lastFocus.focus === 'function') { lastFocus.focus(); }
  }

  function step(delta) {
    if (!cards.length) return;
    renderSlide((lbIndex + delta + cards.length) % cards.length);
  }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function (e) {
      if (!lb) return;                 /* no lightbox in the DOM -> follow the href */
      /* leave modified clicks alone so "open in new tab" still reaches the file */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openLightbox(i);
    });
  });

  /* The hero's watch control reuses the same lightbox. It addresses the target
     by selector rather than by index, so reordering the work sections can never
     silently point it at the wrong film. */
  var heroWatch = document.querySelector('[data-lb-open]');
  if (heroWatch && lb) {
    heroWatch.addEventListener('click', function (e) {
      e.preventDefault();
      var sel = heroWatch.getAttribute('data-lb-open');
      var el = sel ? document.querySelector(sel) : null;
      var card = el && (el.matches('[data-work]') ? el : el.querySelector('[data-work]'));
      var idx = cards.indexOf(card);
      openLightbox(idx >= 0 ? idx : 0);
    });
  }

  if (lb) {
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev)  lbPrev.addEventListener('click', function () { step(-1); });
    if (lbNext)  lbNext.addEventListener('click', function () { step(1); });

    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape')     { closeLightbox(); }
      else if (e.key === 'ArrowLeft')  { step(-1); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'Tab') {
        /* keep focus inside the dialog */
        var focusables = lb.querySelectorAll('button, [href], video[controls]');
        if (!focusables.length) return;
        var first = focusables[0];
        var last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 6  NAV HIGHLIGHT + FLOATING WHATSAPP ------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('accent', on);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* the floating button steps aside once the visitor reaches the contact block */
  var waFloat = document.querySelector('[data-wa-float]');
  var contact = document.getElementById('contact');
  if (waFloat && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        waFloat.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.14 }).observe(contact);
  }
})();
