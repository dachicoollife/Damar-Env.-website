document.addEventListener('DOMContentLoaded', function () {
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdnzoga';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.querySelector('.btn-label');
  var defaultLabel = submitLabel.textContent;

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (FORMSPREE_ENDPOINT.indexOf('YOUR_FORM_ID') !== -1) {
      setStatus('Form is not connected yet — add your Formspree endpoint in js/contact-form.js.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending...';
    setStatus('', '');

    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (response) {
      if (response.ok) {
        form.reset();
        setStatus("Thanks for reaching out — we'll be in touch soon.", 'success');
      } else {
        return response.json().then(function (data) {
          var message = (data && data.errors && data.errors.length)
            ? data.errors.map(function (err) { return err.message; }).join(', ')
            : 'Something went wrong. Please try again or email us directly.';
          setStatus(message, 'error');
        });
      }
    }).catch(function () {
      setStatus('Something went wrong. Please check your connection and try again.', 'error');
    }).finally(function () {
      submitBtn.disabled = false;
      submitLabel.textContent = defaultLabel;
    });
  });
});
