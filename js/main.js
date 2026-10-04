// mobile keeps the classic page load — cancel the view transition on both the
// outgoing (pageswap) and incoming (pagereveal) side. This must live in JS:
// wrapping @view-transition in @media silently kills it in some browsers.
// Desktop runs the cross-fade with the reveal pop-ins playing on top.
function skipMobileTransition(e) {
  if (e.viewTransition && window.innerWidth <= 860) {
    e.viewTransition.skipTransition();
  }
}

window.addEventListener('pageswap', skipMobileTransition);
window.addEventListener('pagereveal', skipMobileTransition);

// going to another page on this site: tell the next page to keep the top
// bar static (read by the inline script in each page's <head>). Works on
// file:// too, where browsers send no referrer. Link clicks are caught
// below; script-driven navigation (search) calls markNavStatic itself.
function markNavStatic() {
  try { sessionStorage.setItem('navStatic', '1'); } catch (err) {}
}

document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a[href]');
  if (link && link.protocol === location.protocol && link.host === location.host &&
      link.pathname !== location.pathname) {
    markNavStatic();
  }
});

// let the browser handle ctrl/cmd/shift/middle clicks (open in new tab or
// window) instead of hijacking them into a same-tab navigation
function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // no autoplaying hero video for reduced-motion users; the poster stays
  if (reduceMotion) {
    document.querySelectorAll('video[autoplay]').forEach(function (video) {
      video.removeAttribute('autoplay');
      video.pause();
    });
  }

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // keep the overlay covering the page while the next page loads (closing it
  // early flashes the old page); close it only when returning via back/forward
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.body.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  var siteNav = document.querySelector('.site-nav');
  var searchBtn = document.querySelector('.search-btn');
  var searchInput = document.querySelector('.nav-search-input');

  if (siteNav && searchBtn) {
    searchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isActive = siteNav.classList.toggle('search-active');
      searchBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      if (isActive && searchInput) {
        setTimeout(function () { searchInput.focus(); }, 350);
      } else if (searchInput) {
        searchInput.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (siteNav.classList.contains('search-active') && !siteNav.contains(e.target)) {
        siteNav.classList.remove('search-active');
        searchBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        siteNav.classList.remove('search-active');
        searchBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var mainNavFirstLink = document.querySelector('.main-nav a');
  var searchPrefix = mainNavFirstLink ? mainNavFirstLink.getAttribute('href').replace(/index\.html$/, '') : '';

  function goToSearch(query) {
    var q = (query || '').trim();
    if (!q) return;
    markNavStatic();
    window.location.href = searchPrefix + 'search-results/index.html?q=' + encodeURIComponent(q);
  }

  function setupLiveSearch(input, resultsEl, limit) {
    if (!input || !resultsEl) return;
    var core = window.SearchCore;
    var timer = null;

    function close() {
      resultsEl.classList.remove('is-open');
    }

    function renderMatches(query) {
      var q = query.trim();
      if (!q || !core) { resultsEl.innerHTML = ''; close(); return; }

      var matches = core.match(q);
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      var top = matches.slice(0, limit);

      var rows = top.map(function (m) {
        var item = m.item;
        return '<a class="nav-search-result-item" href="' + item.url + '" target="_blank" rel="noopener">' +
          '<span class="nav-search-result-tag">' + core.escapeHtml(item.category) + ' &middot; ' + core.escapeHtml(item.jurisdiction) + '</span>' +
          '<span class="nav-search-result-title">' + core.highlight(item.title, terms) + '</span>' +
        '</a>';
      }).join('');

      if (!matches.length) {
        rows = '<div class="nav-search-empty">No matches for &ldquo;' + core.escapeHtml(q) + '&rdquo;</div>';
      }

      resultsEl.innerHTML = rows +
        '<button type="button" class="nav-search-view-all">View all ' + (matches.length ? matches.length + ' ' : '') + 'results' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></button>';

      var viewAllBtn = resultsEl.querySelector('.nav-search-view-all');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function () { goToSearch(q); });
      }

      resultsEl.classList.add('is-open');
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var value = input.value;
      timer = setTimeout(function () { renderMatches(value); }, 150);
    });

    input.addEventListener('focus', function () {
      if (input.value.trim()) renderMatches(input.value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(timer);
        close();
        goToSearch(input.value);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    input._resetLiveSearch = function () {
      clearTimeout(timer);
      input.value = '';
      resultsEl.innerHTML = '';
      close();
    };
  }

  if (searchInput) {
    var navSearchResults = document.createElement('div');
    navSearchResults.className = 'nav-search-results';
    searchInput.parentElement.appendChild(navSearchResults);
    setupLiveSearch(searchInput, navSearchResults, 5);
  }

  var overlaySearchInput = document.querySelector('.overlay-search-input');
  if (overlaySearchInput) {
    var overlaySearchResults = document.createElement('div');
    overlaySearchResults.className = 'overlay-search-results';
    overlaySearchInput.parentElement.insertAdjacentElement('afterend', overlaySearchResults);
    setupLiveSearch(overlaySearchInput, overlaySearchResults, 2);
  }

  if (searchBtn && siteNav) {
    searchBtn.addEventListener('click', function () {
      if (!siteNav.classList.contains('search-active') && searchInput && searchInput._resetLiveSearch) {
        searchInput._resetLiveSearch();
      }
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (!document.body.classList.contains('nav-open') && overlaySearchInput && overlaySearchInput._resetLiveSearch) {
        overlaySearchInput._resetLiveSearch();
      }
    });
  }

  var mainNav = document.querySelector('.main-nav');
  if (mainNav) {
    var pill = document.createElement('li');
    pill.className = 'nav-pill no-anim';
    pill.setAttribute('aria-hidden', 'true');
    mainNav.appendChild(pill);

    var navLinks = Array.prototype.slice.call(mainNav.querySelectorAll('a'));
    // pages outside the main nav (search results, 404) have no active link:
    // the pill then stays hidden until a link is hovered
    var activeLink = mainNav.querySelector('a.active');

    var movePill = function (el) {
      pill.classList.toggle('is-hidden', !el);
      if (!el) return;
      var navBox = mainNav.getBoundingClientRect();
      var elBox = el.getBoundingClientRect();
      pill.style.width = elBox.width + 'px';
      pill.style.height = elBox.height + 'px';
      pill.style.transform = 'translate(' + (elBox.left - navBox.left) + 'px, ' + (elBox.top - navBox.top) + 'px)';
    };

    var setTarget = function (el) {
      navLinks.forEach(function (l) { l.classList.toggle('pill-target', l === el); });
    };

    var placeInstantly = function (el) {
      pill.classList.add('no-anim');
      movePill(el);
      setTarget(el);
      // force reflow so the next transition re-enables cleanly
      void pill.offsetWidth;
      pill.classList.remove('no-anim');
    };

    placeInstantly(activeLink);
    mainNav.classList.add('pill-ready');

    // re-measure whenever the links change size (e.g. the web font arriving
    // after first paint) — otherwise the pill sits at stale coordinates and
    // visibly slides into place on the next hover. fonts.ready alone misses
    // this: it can resolve before the font files have even started loading.
    var resync = function () {
      placeInstantly(mainNav.querySelector('a.pill-target') || activeLink);
    };
    if (window.ResizeObserver) {
      var linkObserver = new ResizeObserver(resync);
      linkObserver.observe(mainNav);
      navLinks.forEach(function (l) { linkObserver.observe(l); });
    }
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(resync);
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', resync);
    }

    navLinks.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        // coming from hidden: appear on the link instead of sliding from 0,0
        if (pill.classList.contains('is-hidden')) placeInstantly(link);
        else movePill(link);
        setTarget(link);
      });

      link.addEventListener('click', function (e) {
        if (link.classList.contains('active') || isModifiedClick(e)) return;
        var href = link.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        movePill(link);
        setTarget(link);
        setTimeout(function () { window.location.href = href; }, 240);
      });
    });

    mainNav.addEventListener('mouseleave', function () {
      movePill(activeLink);
      setTarget(activeLink);
    });

    window.addEventListener('resize', function () {
      var current = mainNav.querySelector('a.pill-target') || activeLink;
      placeInstantly(current);
    });

    var contactNavLink = navLinks.filter(function (l) {
      return /contact/i.test(l.getAttribute('href') || '');
    })[0];

    if (contactNavLink) {
      document.querySelectorAll('a.btn[href*="contact"]').forEach(function (btn) {
        if (mainNav.contains(btn)) return;
        btn.addEventListener('click', function (e) {
          if (contactNavLink.classList.contains('active') || isModifiedClick(e)) return;
          var href = btn.getAttribute('href');
          if (!href) return;
          e.preventDefault();
          movePill(contactNavLink);
          setTarget(contactNavLink);
          setTimeout(function () { window.location.href = href; }, 240);
        });
      });
    }
  }

  var footer = document.querySelector('.site-footer');
  if (footer) {
    footer.textContent = footer.textContent.replace(/\d{4}/, new Date().getFullYear());
  }

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
});
