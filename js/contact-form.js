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

  // inline validation instead of the browser's "Please fill out this field"
  // bubble: errors appear under each field after a submit attempt and clear
  // as soon as the field becomes valid
  form.setAttribute('novalidate', '');
  var fields = Array.prototype.slice.call(form.querySelectorAll('.field input, .field textarea'));

  function errorText(field) {
    if (field.validity.valueMissing) return 'Please fill out this field.';
    if (field.validity.typeMismatch && field.type === 'email') return 'Please enter a valid email address.';
    return field.validationMessage;
  }

  function showError(field) {
    var wrap = field.closest('.field');
    var msg = wrap.querySelector('.field-error');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'field-error';
      msg.id = 'error-' + field.name;
      wrap.appendChild(msg);
    }
    msg.textContent = errorText(field);
    wrap.classList.add('has-error');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', msg.id);
  }

  function clearError(field) {
    var wrap = field.closest('.field');
    var msg = wrap.querySelector('.field-error');
    if (msg) msg.remove();
    wrap.classList.remove('has-error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }

  function validateForm() {
    var firstInvalid = null;
    fields.forEach(function (field) {
      if (field.checkValidity()) {
        clearError(field);
      } else {
        showError(field);
        if (!firstInvalid) firstInvalid = field;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  fields.forEach(function (field) {
    field.addEventListener('input', function () {
      if (!field.closest('.field').classList.contains('has-error')) return;
      if (field.checkValidity()) clearError(field); else showError(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    if (FORMSPREE_ENDPOINT.indexOf('YOUR_FORM_ID') !== -1) {
      setStatus('Form is not connected yet. Add your Formspree endpoint in js/contact-form.js.', 'error');
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
        setStatus("Thanks for reaching out. We'll be in touch soon.", 'success');
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
