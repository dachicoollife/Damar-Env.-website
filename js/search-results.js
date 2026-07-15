document.addEventListener('DOMContentLoaded', function () {
  var listEl = document.getElementById('searchResults');
  var metaEl = document.getElementById('searchMeta');
  var input = document.getElementById('pageSearchInput');
  var core = window.SearchCore;
  if (!listEl || !core || !window.REGULATORY_INDEX) return;

  var arrowSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  function playReveal(container) {
    var els = container.querySelectorAll('.reveal');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) { el.classList.add('is-visible'); });
      });
    });
  }

  function renderSuggestions() {
    var categories = [];
    window.REGULATORY_INDEX.forEach(function (item) {
      if (categories.indexOf(item.jurisdiction) === -1) categories.push(item.jurisdiction);
    });
    var chips = categories.map(function (c) {
      return '<button type="button" class="search-suggestion-chip" data-query="' + core.escapeHtml(c) + '">' + core.escapeHtml(c) + '</button>';
    }).join('');
    listEl.innerHTML = '<div class="search-empty reveal"><p>Start typing to search asbestos, lead-based paint, and agency regulations.</p><div class="search-suggestions">' + chips + '</div></div>';

    listEl.querySelectorAll('.search-suggestion-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var q = chip.getAttribute('data-query');
        if (input) input.value = q;
        setQuery(q);
      });
    });

    playReveal(listEl);
  }

  function renderResults(query, results) {
    if (!results.length) {
      listEl.innerHTML = '<div class="search-empty reveal">' +
        '<p>No results found for &ldquo;' + core.escapeHtml(query) + '&rdquo;.</p>' +
        '<a class="btn" href="../regulatory-resources/index.html">Browse Regulatory Resources' +
        '<span class="icon-circle">' + arrowSvg + '</span></a></div>';
      playReveal(listEl);
      return;
    }

    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    listEl.innerHTML = results.map(function (r, i) {
      var item = r.item;
      var delay = Math.min(i * 0.07, 0.42);
      return '<a class="bezel result-card reveal" style="transition-delay:' + delay + 's" href="' + item.url + '" target="_blank" rel="noopener">' +
        '<div class="bezel-inner">' +
          '<div class="result-tags">' +
            '<span class="result-tag accent">' + core.escapeHtml(item.category) + '</span>' +
            '<span class="result-tag">' + core.escapeHtml(item.jurisdiction) + '</span>' +
          '</div>' +
          '<h3 class="result-title">' + core.highlight(item.title, terms) + '</h3>' +
          '<p class="result-snippet">' + core.highlight(item.snippet, terms) + '</p>' +
          '<span class="result-link">Visit Source<span class="icon-circle small">' + arrowSvg + '</span></span>' +
        '</div>' +
      '</a>';
    }).join('');
    playReveal(listEl);
  }

  function setQuery(query) {
    var url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
    render(query);
  }

  function render(query) {
    query = (query || '').trim();
    if (!query) {
      if (metaEl) metaEl.textContent = 'Search across asbestos, lead-based paint, and agency regulations.';
      renderSuggestions();
      return;
    }
    var results = core.match(query);
    if (metaEl) {
      metaEl.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' found for "' + query + '"';
    }
    renderResults(query, results);
  }

  var initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  if (input) input.value = initialQuery;
  render(initialQuery);

  if (input) {
    var liveTimer = null;

    input.addEventListener('input', function () {
      clearTimeout(liveTimer);
      var value = input.value;
      liveTimer = setTimeout(function () { setQuery(value.trim()); }, 150);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(liveTimer);
        setQuery(input.value.trim());
      }
    });
  }
});
