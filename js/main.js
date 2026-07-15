document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  }

  document.querySelectorAll('.nav-overlay a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
    });
  });

  var siteNav = document.querySelector('.site-nav');
  var searchBtn = document.querySelector('.search-btn');
  var searchInput = document.querySelector('.nav-search-input');

  if (siteNav && searchBtn) {
    searchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isActive = siteNav.classList.toggle('search-active');
      if (isActive && searchInput) {
        setTimeout(function () { searchInput.focus(); }, 350);
      } else if (searchInput) {
        searchInput.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (siteNav.classList.contains('search-active') && !siteNav.contains(e.target)) {
        siteNav.classList.remove('search-active');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        siteNav.classList.remove('search-active');
      }
    });
  }

  var mainNavFirstLink = document.querySelector('.main-nav a');
  var searchPrefix = mainNavFirstLink ? mainNavFirstLink.getAttribute('href').replace(/index\.html$/, '') : '';

  function goToSearch(query) {
    var q = (query || '').trim();
    if (!q) return;
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
    var activeLink = mainNav.querySelector('a.active') || navLinks[0];

    var movePill = function (el) {
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

    // re-measure once web fonts finish loading — text metrics change and the
    // links shift, leaving the pill at stale fallback-font coordinates
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        var current = mainNav.querySelector('a.pill-target') || activeLink;
        placeInstantly(current);
      });
    }

    navLinks.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        movePill(link);
        setTarget(link);
      });

      link.addEventListener('click', function (e) {
        if (link.classList.contains('active')) return;
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
          if (contactNavLink.classList.contains('active')) return;
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
