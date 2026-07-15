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
