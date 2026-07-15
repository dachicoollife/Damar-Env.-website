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

  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        goToSearch(searchInput.value);
      }
    });
  }

  var overlaySearchInput = document.querySelector('.overlay-search-input');
  if (overlaySearchInput) {
    overlaySearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        goToSearch(overlaySearchInput.value);
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
