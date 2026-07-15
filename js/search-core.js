window.SearchCore = (function () {
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  function match(query) {
    var index = window.REGULATORY_INDEX || [];
    var q = (query || '').toLowerCase().trim();
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);
    return index.map(function (item) {
      var haystack = (item.title + ' ' + item.snippet + ' ' + item.category + ' ' + item.jurisdiction).toLowerCase();
      var score = 0;
      terms.forEach(function (term) {
        if (haystack.indexOf(term) !== -1) score += 1;
        if (item.title.toLowerCase().indexOf(term) !== -1) score += 2;
      });
      if (haystack.indexOf(q) !== -1) score += 3;
      return { item: item, score: score };
    }).filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  return { escapeHtml: escapeHtml, highlight: highlight, match: match };
})();
