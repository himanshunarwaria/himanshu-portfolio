(function () {
  'use strict';

  var documentElement = document.documentElement;
  documentElement.classList.add('js');

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[character];
    });
  }

  function isValidUrl(value) {
    if (!value) return false;
    try {
      return new URL(value).protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function isValidPosterPosition(value) {
    return typeof value === 'string' && /^(?:100|\d{1,2})% (?:100|\d{1,2})%$/.test(value);
  }

  function validateProjects(projects) {
    var errors = [];
    var numbers = new Set();
    var slugs = new Set();

    if (!Array.isArray(projects) || projects.length !== 4) {
      return ['Project data must contain exactly four worlds.'];
    }

    projects.forEach(function (project, index) {
      var label = 'Project ' + (index + 1);
      ['number', 'slug', 'title', 'world', 'kicker', 'description', 'outcome', 'theme', 'status'].forEach(function (key) {
        if (!project[key] || !String(project[key]).trim()) errors.push(label + ' is missing ' + key + '.');
      });
      if (!Array.isArray(project.roles) || !project.roles.length) errors.push(label + ' has no roles/status detail.');
      if (numbers.has(project.number)) errors.push('Duplicate project number: ' + project.number + '.');
      if (slugs.has(project.slug)) errors.push('Duplicate project slug: ' + project.slug + '.');
      numbers.add(project.number);
      slugs.add(project.slug);

      if (project.status === 'published') {
        if (!project.caseStudy) errors.push(label + ' has no case-study route.');
        if (!project.poster || !project.posterWidth || !project.posterHeight || !project.posterAlt) errors.push(label + ' has incomplete poster data.');
        if (!isValidPosterPosition(project.posterPosition)) errors.push(label + ' has an invalid poster focal point.');
        if (!isValidUrl(project.live)) errors.push(label + ' has an invalid live URL.');
      }
    });

    return errors;
  }

  function renderProjectWorlds() {
    var mount = document.getElementById('projectWorldsMount');
    var fallback = document.getElementById('projectWorldsFallback');
    if (!mount) return;

    try {
      var projects = window.PROJECT_WORLDS;
      var errors = validateProjects(projects);
      if (errors.length) throw new Error(errors.join(' '));

      var navItems = projects.map(function (project) {
        return '<li><a href="#world-' + escapeHTML(project.slug) + '" data-world-link="' + escapeHTML(project.slug) + '">' +
          '<span>' + escapeHTML(project.number) + '</span><span>' + escapeHTML(project.title) + '</span></a></li>';
      }).join('');

      var cards = projects.map(function (project, index) {
        var previous = projects[(index - 1 + projects.length) % projects.length];
        var next = projects[(index + 1) % projects.length];
        var media = project.poster
          ? '<img src="' + escapeHTML(project.poster) + '" alt="' + escapeHTML(project.posterAlt) + '" width="' + project.posterWidth + '" height="' + project.posterHeight + '" loading="lazy" decoding="async">' +
            '<p class="world-media-status" role="status">The project image could not load. Project information and links remain available.</p>'
          : '<div class="companion-symbol" aria-hidden="true">●</div>';
        var roles = project.roles.map(function (role) {
          return '<li>' + escapeHTML(role) + '</li>';
        }).join('');
        var actions = '';

        if (project.caseStudy) {
          actions += '<a class="button button--light button--solid" href="' + escapeHTML(project.caseStudy) + '">View Case Study</a>';
        }
        if (isValidUrl(project.live)) {
          actions += '<a class="button button--light" href="' + escapeHTML(project.live) + '" target="_blank" rel="noopener noreferrer">Visit Live Website <span aria-hidden="true">↗</span></a>';
        }
        if (!actions) {
          actions = '<span class="unavailable-note">Private project · Public materials withheld</span>';
        }

        return '<article class="world-card world-card--' + escapeHTML(project.theme) + '" id="world-' + escapeHTML(project.slug) + '" data-world="' + escapeHTML(project.slug) + '" style="--poster-position:' + escapeHTML(project.posterPosition || '50% 0%') + '" aria-labelledby="world-title-' + escapeHTML(project.slug) + '" aria-describedby="world-description-' + escapeHTML(project.slug) + ' world-outcome-' + escapeHTML(project.slug) + '">' +
          '<div class="world-art">' + media +
            '<span class="world-number">' + escapeHTML(project.number) + '</span>' +
            '<div class="world-art-caption"><strong>' + escapeHTML(project.world) + '</strong><span>' + escapeHTML(project.kicker) + '</span></div>' +
          '</div>' +
          '<div class="world-info">' +
            '<div><p class="world-kicker">' + escapeHTML(project.kicker) + '</p>' +
              '<h3 id="world-title-' + escapeHTML(project.slug) + '">' + escapeHTML(project.title) + '</h3>' +
              '<p class="world-description" id="world-description-' + escapeHTML(project.slug) + '">' + escapeHTML(project.description) + '</p>' +
              '<p class="world-outcome" id="world-outcome-' + escapeHTML(project.slug) + '"><strong>Purpose / outcome:</strong> ' + escapeHTML(project.outcome) + '</p></div>' +
            '<div class="world-meta"><ul class="role-list" aria-label="Roles and project status">' + roles + '</ul><div class="world-actions">' + actions + '</div></div>' +
            '<nav class="world-pagination" aria-label="' + escapeHTML(project.title) + ' project navigation">' +
              '<a href="#world-' + escapeHTML(previous.slug) + '"><span aria-hidden="true">←</span> Previous · ' + escapeHTML(previous.title) + '</a>' +
              '<a href="#world-' + escapeHTML(next.slug) + '">Next · ' + escapeHTML(next.title) + ' <span aria-hidden="true">→</span></a>' +
            '</nav>' +
          '</div>' +
        '</article>';
      }).join('');

      mount.innerHTML = '<div class="world-experience">' +
        '<aside class="world-index" aria-label="Direct project navigation"><ol>' + navItems + '</ol>' +
          '<div class="world-progress" aria-hidden="true"><span class="progress-track"><span class="progress-bar" id="worldProgressBar"></span></span><span id="worldProgressText">01 / 04</span></div>' +
        '</aside><div class="world-stack">' + cards + '</div></div>' +
        '<p class="sr-only" id="worldLiveRegion" aria-live="polite" aria-atomic="true"></p>';

      mount.hidden = false;
      if (fallback) fallback.hidden = true;
      enhanceProjectWorlds(projects);
    } catch (error) {
      mount.hidden = true;
      if (fallback) fallback.hidden = false;
      documentElement.setAttribute('data-project-worlds-error', 'true');
      if (window.console && console.error) console.error('Project Worlds fallback used:', error);
    }
  }

  function enhanceProjectWorlds(projects) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-world]'));
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-world-link]'));
    var selectionLinks = Array.prototype.slice.call(document.querySelectorAll('#projectWorldsMount a[href^="#world-"]'));
    var progressBar = document.getElementById('worldProgressBar');
    var progressText = document.getElementById('worldProgressText');
    var liveRegion = document.getElementById('worldLiveRegion');
    var activeSlug = '';
    var resizeTimer = 0;
    var suppressObserverUntil = 0;

    function slugFromHash() {
      return window.location.hash.indexOf('#world-') === 0 ? window.location.hash.slice(7) : '';
    }

    function setActive(slug, announce, replaceHash) {
      var index = projects.findIndex(function (project) { return project.slug === slug; });
      if (index < 0) return false;
      var changed = activeSlug !== slug;
      activeSlug = slug;
      cards.forEach(function (card) { card.classList.toggle('is-active', card.dataset.world === slug); });
      links.forEach(function (link) {
        if (link.dataset.worldLink === slug) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      if (progressBar && progressText) {
        progressBar.style.width = (((index + 1) / projects.length) * 100) + '%';
        progressText.textContent = projects[index].number + ' / ' + String(projects.length).padStart(2, '0');
      }
      if (announce && changed && liveRegion) {
        liveRegion.textContent = 'Selected project ' + (index + 1) + ' of ' + projects.length + ': ' + projects[index].title + '.';
      }
      if (replaceHash && window.location.hash !== '#world-' + slug) {
        window.history.replaceState(null, '', '#world-' + slug);
      }
      return true;
    }

    function syncFromHash(announce) {
      var slug = slugFromHash();
      return slug ? setActive(slug, announce) : false;
    }

    function beginHashNavigation(announce) {
      suppressObserverUntil = Date.now() + 900;
      return syncFromHash(announce);
    }

    function syncFromViewport() {
      var focusLine = Math.min(window.innerHeight * .36, 280);
      var closest = null;
      var closestDistance = Infinity;
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        if (rect.bottom < 80 || rect.top > window.innerHeight) return;
        var distance = Math.abs(rect.top - focusLine);
        if (distance < closestDistance) {
          closest = card;
          closestDistance = distance;
        }
      });
      if (closest) setActive(closest.dataset.world, false, true);
    }

    function syncAfterLayoutChange() {
      resizeTimer = 0;
      var slug = slugFromHash();
      var target = slug ? cards.find(function (card) { return card.dataset.world === slug; }) : null;
      if (!target) {
        syncFromViewport();
        return;
      }
      setActive(slug, false, false);
      suppressObserverUntil = Date.now() + 320;
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }

    function scheduleLayoutSync() {
      suppressObserverUntil = Date.now() + 600;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(syncAfterLayoutChange, 140);
    }

    cards.forEach(function (card) {
      var image = card.querySelector('img');
      if (!image) return;
      if (image.complete && !image.naturalWidth) card.classList.add('poster-missing');
      image.addEventListener('error', function () { card.classList.add('poster-missing'); }, { once: true });
    });

    selectionLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        suppressObserverUntil = Date.now() + 900;
        setActive(link.getAttribute('href').slice(7), true);
      });
    });

    if ('IntersectionObserver' in window) {
      var visible = new Map();
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible.set(entry.target.dataset.world, entry.intersectionRatio); });
        if (Date.now() < suppressObserverUntil) return;
        var active = Array.from(visible.entries()).sort(function (a, b) { return b[1] - a[1]; })[0];
        if (active && active[1] > 0) setActive(active[0], false, true);
      }, { rootMargin: '-18% 0px -35% 0px', threshold: [0, .2, .45, .7] });
      cards.forEach(function (card) { observer.observe(card); });
    } else if (cards[0]) {
      setActive(cards[0].dataset.world, false);
    }

    window.addEventListener('hashchange', function () { beginHashNavigation(true); });
    window.addEventListener('popstate', function () { beginHashNavigation(true); });
    window.addEventListener('pageshow', function () {
      if (!beginHashNavigation(false)) syncFromViewport();
    });
    window.addEventListener('resize', scheduleLayoutSync, { passive: true });
    window.addEventListener('orientationchange', scheduleLayoutSync);

    if (beginHashNavigation(false)) {
      window.requestAnimationFrame(function () {
        var initialTarget = cards.find(function (card) { return card.dataset.world === slugFromHash(); });
        if (initialTarget) initialTarget.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    } else {
      setActive(projects[0].slug, false);
    }
  }

  function renderProjectGallery() {
    var mount = document.getElementById('projectWorldsMount');
    var fallback = document.getElementById('projectWorldsFallback');
    if (!mount) return;

    try {
      var projects = window.PROJECT_WORLDS;
      var errors = validateProjects(projects);
      if (errors.length) throw new Error(errors.join(' '));

      var cards = projects.map(function (project, index) {
        var media = project.poster
          ? '<div class="project-browser"><span class="project-browser-bar" aria-hidden="true">' +
              '<span class="project-browser-dots"><i></i><i></i><i></i></span>' +
              '<span class="project-browser-address">' + escapeHTML(project.title) + ' / Homepage</span>' +
              '<b>HN</b></span>' +
              '<img src="' + escapeHTML(project.poster) + '" alt="' + escapeHTML(project.posterAlt) + '" width="' + project.posterWidth + '" height="' + project.posterHeight + '" loading="lazy" decoding="async">' +
              '<p class="project-media-status" role="status">Preview unavailable. Project details and case-study access remain available.</p></div>'
          : '<div class="private-project-art" aria-hidden="true"><span>CARE</span><i></i><i></i><i></i><b>05</b></div>';

        var visual = '<div class="project-visual">' + media +
          '<span class="project-visual-word" aria-hidden="true">' + escapeHTML(project.title) + '</span>' +
          '<span class="project-number">' + escapeHTML(project.number) + '</span>' +
          '<span class="project-state" aria-hidden="true">Selected / ' + escapeHTML(project.kicker) + '</span>' +
          (project.caseStudy ? '<span class="project-open" aria-hidden="true"><span>View case</span><b>&#8599;</b></span>' : '<span class="project-private-label">Private</span>') +
          '</div>';

        var primary = project.caseStudy
          ? '<a class="project-tile-primary" href="' + escapeHTML(project.caseStudy) + '" aria-label="View ' + escapeHTML(project.title) + ' case study">' + visual + '</a>'
          : visual;

        var live = isValidUrl(project.live)
          ? '<a class="project-live" href="' + escapeHTML(project.live) + '" target="_blank" rel="noopener noreferrer">Live site <span aria-hidden="true">↗</span></a>'
          : '<span class="project-live project-live--muted">Materials withheld</span>';

        var roles = project.roles.slice(0, 3).map(function (role) {
          return '<li>' + escapeHTML(role) + '</li>';
        }).join('');

        return '<article class="project-tile project-tile--' + escapeHTML(project.theme) + ' project-tile--' + (index + 1) + '" data-project-card style="--poster-position:' + escapeHTML(project.posterPosition || '50% 0%') + '">' +
          primary +
          '<div class="project-tile-meta">' +
            '<div class="project-title-block"><p>' + escapeHTML(project.number) + ' / ' + escapeHTML(project.world) + '</p><h3>' + escapeHTML(project.title) + '</h3></div>' +
            '<div class="project-details"><p class="project-summary">' + escapeHTML(project.description) + '</p><ul class="project-role-list" aria-label="Project services">' + roles + '</ul></div>' +
            live +
          '</div>' +
        '</article>';
      }).join('');

      mount.innerHTML = '<div class="project-gallery">' + cards + '</div>';
      mount.hidden = false;
      if (fallback) fallback.hidden = true;
      enhanceProjectGallery();
    } catch (error) {
      mount.hidden = true;
      if (fallback) fallback.hidden = false;
      documentElement.setAttribute('data-project-worlds-error', 'true');
      if (window.console && console.error) console.error('Project gallery fallback used:', error);
    }
  }

  function enhanceProjectGallery() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-project-card]'));
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cards.forEach(function (card) {
      var image = card.querySelector('img');
      if (image) {
        if (image.complete && !image.naturalWidth) card.classList.add('is-media-missing');
        image.addEventListener('error', function () { card.classList.add('is-media-missing'); }, { once: true });
      }

      if (reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) - .5;
        var y = ((event.clientY - rect.top) / rect.height) - .5;
        card.style.setProperty('--card-tilt-x', (y * -5).toFixed(2) + 'deg');
        card.style.setProperty('--card-tilt-y', (x * 7).toFixed(2) + 'deg');
        card.style.setProperty('--card-shift-x', (x * 5).toFixed(2) + 'px');
        card.style.setProperty('--card-shift-y', (y * 5).toFixed(2) + 'px');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--card-tilt-x', '0deg');
        card.style.setProperty('--card-tilt-y', '0deg');
        card.style.setProperty('--card-shift-x', '0px');
        card.style.setProperty('--card-shift-y', '0px');
      });
    });
  }

  function setupKineticHero() {
    var stage = document.getElementById('heroStage');
    if (!stage) return;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var frame = 0;

    function updatePointer(event) {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        var rect = stage.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) - .5;
        var y = ((event.clientY - rect.top) / rect.height) - .5;
        stage.style.setProperty('--tilt-x', (y * -9).toFixed(2) + 'deg');
        stage.style.setProperty('--tilt-y', (x * 11).toFixed(2) + 'deg');
        stage.style.setProperty('--shift-x', (x * 14).toFixed(2) + 'px');
        stage.style.setProperty('--shift-y', (y * 10).toFixed(2) + 'px');
      });
    }

    if (!reduceMotion && finePointer) {
      stage.addEventListener('pointermove', updatePointer, { passive: true });
      stage.addEventListener('pointerleave', function () {
        stage.style.setProperty('--tilt-x', '0deg');
        stage.style.setProperty('--tilt-y', '0deg');
        stage.style.setProperty('--shift-x', '0px');
        stage.style.setProperty('--shift-y', '0px');
      });
    }
  }

  function setupHeader() {
    var header = document.getElementById('siteHeader');
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('mobileMenu');
    var lastFocused = null;
    if (!header || !toggle || !menu) return;

    function focusableItems() {
      return Array.prototype.slice.call(menu.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    }

    function openMenu() {
      lastFocused = document.activeElement;
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
      var items = focusableItems();
      if (items[0]) items[0].focus();
    }

    function closeMenu(restoreFocus) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
      else openMenu();
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });

    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      var items = focusableItems();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && !menu.hidden) closeMenu(false);
    });
    window.addEventListener('scroll', function () { header.classList.toggle('is-scrolled', window.scrollY > 12); }, { passive: true });
  }

  function setupSectionNavigation() {
    if (!('IntersectionObserver' in window)) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-section-link]'));
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.dataset.sectionLink === entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function setupContactForm() {
    var form = document.getElementById('contactForm');
    var status = document.getElementById('formStatus');
    var submitButton = document.getElementById('contactSubmit');
    if (!form || !status || !submitButton) return;
    var storageKey = 'hn-project-brief-draft-v1';
    var isPreparing = false;
    var hasValidationError = false;
    var fields = Array.prototype.slice.call(form.querySelectorAll('input,select,textarea')).filter(function (field) {
      return field.name !== 'website';
    });

    function readDraft() {
      try {
        var draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
        fields.forEach(function (field) {
          if (Object.prototype.hasOwnProperty.call(draft, field.name)) field.value = draft[field.name];
        });
      } catch (error) { /* Storage may be unavailable in private mode. */ }
    }

    function saveDraft() {
      try {
        var draft = {};
        fields.forEach(function (field) { draft[field.name] = field.value; });
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch (error) { /* The visible form still works without storage. */ }
    }

    function errorMessage(field) {
      if (field.required && !String(field.value).trim()) {
        return field.id === 'projectType' ? 'Choose a project type.' : field.id === 'message' ? 'Add a short project brief.' : 'Enter your ' + field.id + '.';
      }
      if (field.type === 'email' && field.validity.typeMismatch) return 'Enter a valid email address.';
      if (field.id === 'message' && field.value.trim().length < 20) return 'Add at least 20 characters so the project has enough context.';
      return '';
    }

    function updateFieldError(field) {
      var error = document.getElementById(field.id + 'Error');
      if (!error) return true;
      var message = errorMessage(field);
      error.textContent = message;
      error.hidden = !message;
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      return !message;
    }

    function validateForm() {
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!field.required) return;
        if (!updateFieldError(field) && !firstInvalid) firstInvalid = field;
      });
      if (!firstInvalid) {
        hasValidationError = false;
        return true;
      }
      hasValidationError = true;
      status.textContent = 'Please correct the highlighted fields. Your information is still here.';
      firstInvalid.focus();
      return false;
    }

    fields.forEach(function (field) {
      field.addEventListener('input', function () {
        saveDraft();
        if (field.getAttribute('aria-invalid') === 'true') updateFieldError(field);
        if (hasValidationError && fields.filter(function (item) { return item.required; }).every(function (item) { return !errorMessage(item); })) {
          hasValidationError = false;
          status.textContent = 'Ready to prepare your email. Your draft remains saved on this device.';
        }
      });
      field.addEventListener('blur', function () {
        if (field.required) updateFieldError(field);
      });
    });
    readDraft();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (isPreparing || !validateForm()) return;
      if (form.elements.website.value) return;

      saveDraft();
      isPreparing = true;
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Preparing…';
      var name = form.elements.name.value.trim();
      var subject = encodeURIComponent('Project enquiry from ' + name + ' — ' + form.elements.projectType.value);
      var body = encodeURIComponent([
        'Name: ' + name,
        'Email: ' + form.elements.email.value.trim(),
        'Company: ' + (form.elements.company.value.trim() || 'Not supplied'),
        'Project type: ' + form.elements.projectType.value,
        '',
        'Project brief:',
        form.elements.message.value.trim()
      ].join('\n'));
      status.textContent = 'Email draft prepared. If your email app does not open, use the direct email or WhatsApp link.';
      window.location.href = 'mailto:himanshunarwaria@gmail.com?subject=' + subject + '&body=' + body;
      window.setTimeout(function () {
        isPreparing = false;
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = 'Prepare Email';
      }, 1200);
    });
  }

  function setCurrentYear() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-current-year]'), function (element) {
      element.textContent = new Date().getFullYear();
    });
  }

  function setupSkipNavigation() {
    var skipLink = document.querySelector('.skip-link');
    var main = document.getElementById('main-content');
    if (!skipLink || !main) return;

    function moveToMain() {
      window.location.hash = 'main-content';
      main.focus();
    }

    skipLink.addEventListener('click', function () {
      window.requestAnimationFrame(function () {
        main.focus();
      });
    });

    skipLink.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      moveToMain();
    });
  }

  function settleInitialAnchor() {
    if (!window.location.hash || window.location.hash.indexOf('#world-') === 0) return;
    var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  renderProjectGallery();
  settleInitialAnchor();
  setupKineticHero();
  setupHeader();
  setupSectionNavigation();
  setupContactForm();
  setupSkipNavigation();
  setCurrentYear();
}());
