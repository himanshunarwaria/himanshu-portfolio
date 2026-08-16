/* ==========================================================================
   HIMANSHU NARWARIA — AI CLIPS page behaviour
   Same contract as site.js: progressive enhancement only. With JS off every
   card is still a plain link straight to its video file, and every poster
   still shows.

   1  Environment gates   — never stream on data-saver / slow / reduced-motion
   2  Reveal on scroll
   3  Hover preview       — clip is fetched on first hover, never before
   4  Lightbox            — adapts its stage to each clip's aspect ratio
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1  ENVIRONMENT GATES --------------------------------------- */
  var conn     = navigator.connection || navigator.webkitConnection || {};
  var saveData = conn.saveData === true;
  var slowNet  = /2g/.test(conn.effectiveType || '');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqHover  = window.matchMedia('(hover: hover) and (pointer: fine)');

  function reduced()   { return mqReduce.matches; }
  function mayStream() { return !saveData && !slowNet && !reduced(); }

  window.__clipsReady = true;

  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 2  REVEAL ON SCROLL ---------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced()) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { obs.observe(el); });
  }

  /* ---------- 3  HOVER PREVIEW -------------------------------------------
     Desktop pointers only, and only on first hover — a visitor who scrolls
     the grid without stopping downloads nothing but posters.               */
  var clips = Array.prototype.slice.call(document.querySelectorAll('[data-clip]'));

  if (mqHover.matches) {
    clips.forEach(function (clip) {
      var media = clip.querySelector('.clip__media');
      var src   = clip.getAttribute('data-video');
      if (!media || !src) return;
      var vid = null;

      function start() {
        if (!mayStream()) return;
        if (!vid) {
          vid = document.createElement('video');
          vid.muted = true;
          vid.defaultMuted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.setAttribute('playsinline', '');
          vid.setAttribute('muted', '');
          vid.setAttribute('aria-hidden', 'true');
          vid.setAttribute('tabindex', '-1');
          vid.preload = 'auto';
          vid.src = src;
          vid.addEventListener('playing', function () { vid.classList.add('is-live'); });
          media.appendChild(vid);
        }
        var p = vid.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      }
      function stop() {
        if (!vid) return;
        vid.classList.remove('is-live');
        vid.pause();
        try { vid.currentTime = 0; } catch (e) { /* not seekable yet */ }
      }

      clip.addEventListener('pointerenter', start);
      clip.addEventListener('pointerleave', stop);
      clip.addEventListener('focus', start);
      clip.addEventListener('blur', stop);
    });
  }

  /* ---------- 4  LIGHTBOX ------------------------------------------------ */
  var lb      = document.getElementById('lightbox');
  var lbStage = lb && lb.querySelector('[data-lb-stage]');
  var lbTags  = lb && lb.querySelector('[data-lb-tags]');
  var lbTitle = lb && lb.querySelector('[data-lb-title]');
  var lbNote  = lb && lb.querySelector('[data-lb-note]');
  var lbCount = lb && lb.querySelector('[data-lb-count]');
  var lbPrev  = lb && lb.querySelector('[data-lb-prev]');
  var lbNext  = lb && lb.querySelector('[data-lb-next]');
  var lbClose = lb && lb.querySelector('[data-lb-close]');
  var lbVideo = null;
  var lbIndex = -1;
  var lastFocus = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function renderSlide(i) {
    var clip = clips[i];
    if (!clip) return;
    lbIndex = i;

    /* the stage takes the clip's own ratio, so nothing is pillar- or letterboxed */
    var ratio = clip.getAttribute('data-ratio') || 'landscape';
    lb.classList.toggle('is-portrait', ratio === 'portrait');
    lb.classList.toggle('is-tall',     ratio === 'tall');
    lb.classList.toggle('is-square',   ratio === 'square');

    if (!lbVideo) {
      lbVideo = document.createElement('video');
      lbVideo.setAttribute('controls', '');
      lbVideo.setAttribute('playsinline', '');
      lbVideo.playsInline = true;
      lbVideo.preload = 'auto';
      lbVideo.loop = true;          /* clips are 4-10s; looping beats an instant end */
      lbStage.appendChild(lbVideo);
    }
    var poster = clip.querySelector('img');
    lbVideo.poster = poster ? poster.currentSrc || poster.src : '';
    lbVideo.src = clip.getAttribute('data-video');
    lbVideo.load();
    var p = lbVideo.play();
    if (p && typeof p.catch === 'function') { p.catch(function () { /* user can hit play */ }); }

    lbTags.textContent  = clip.getAttribute('data-tags')  || '';
    lbTitle.textContent = clip.getAttribute('data-title') || '';
    lbNote.textContent  = clip.getAttribute('data-note')  || '';
    lbCount.textContent = pad(i + 1) + ' / ' + pad(clips.length);
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
    if (!clips.length) return;
    renderSlide((lbIndex + delta + clips.length) % clips.length);
  }

  clips.forEach(function (clip, i) {
    clip.addEventListener('click', function (e) {
      if (!lb) return;                 /* no lightbox in the DOM -> follow the href */
      /* leave modified clicks alone so "open in new tab" still reaches the file */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openLightbox(i);
    });
  });

  if (lb) {
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev)  lbPrev.addEventListener('click', function () { step(-1); });
    if (lbNext)  lbNext.addEventListener('click', function () { step(1); });

    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape')          { closeLightbox(); }
      else if (e.key === 'ArrowLeft')  { step(-1); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button, [href], video[controls]');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
