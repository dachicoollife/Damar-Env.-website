document.addEventListener('DOMContentLoaded', function () {
  var listEl = document.getElementById('searchResults');
  var metaEl = document.getElementById('searchMeta');
  var input = document.getElementById('pageSearchInput');
  if (!listEl || !window.REGULATORY_INDEX) return;

  var arrowSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function playReveal(container) {
    var els = container.querySelectorAll('.reveal');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) { el.classList.add('is-visible'); });
      });
    });
  }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (term) {
      if (!term) return;
      var re = new RegExp('(' + escapeRegex(term) + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function matchResults(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return window.REGULATORY_INDEX.map(function (item) {
      var haystack = (item.title + ' ' + item.snippet + ' ' + item.category + ' ' + item.jurisdiction).toLowerCase();
      var score = 0;
      terms.forEach(function (term) {
        if (haystack.indexOf(term) !== -1) score += 1;
        if (item.title.toLowerCase().indexOf(term) !== -1) score += 2;
      });
      if (haystack.indexOf(query.toLowerCase()) !== -1) score += 3;
      return { item: item, score: score };
    }).filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  function renderSuggestions() {
    var categories = [];
    window.REGULATORY_INDEX.forEach(function (item) {
      if (categories.indexOf(item.jurisdiction) === -1) categories.push(item.jurisdiction);
    });
    var chips = categories.map(function (c) {
      return '<button type="button" class="search-suggestion-chip" data-query="' + escapeHtml(c) + '">' + escapeHtml(c) + '</button>';
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
        '<p>No results found for &ldquo;' + escapeHtml(query) + '&rdquo;.</p>' +
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
            '<span class="result-tag accent">' + escapeHtml(item.category) + '</span>' +
            '<span class="result-tag">' + escapeHtml(item.jurisdiction) + '</span>' +
          '</div>' +
          '<h3 class="result-title">' + highlight(item.title, terms) + '</h3>' +
          '<p class="result-snippet">' + highlight(item.snippet, terms) + '</p>' +
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
    var results = matchResults(query);
    if (metaEl) {
      metaEl.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' found for "' + query + '"';
    }
    renderResults(query, results);
  }

  var initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  if (input) input.value = initialQuery;
  render(initialQuery);

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setQuery(input.value.trim());
      }
    });
  }
});
