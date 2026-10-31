/* Code.House — shared behaviour
   Contact destinations are assembled at runtime from parts so that no plain
   address string appears in the page source. */
(function () {
  'use strict';

  /* ---------- contact targets ----------
     Destinations are decoded at runtime rather than written into the markup,
     so no address is left sitting in the page source for scrapers. */
  var T = ['aHR0cHM6Ly93ZWIud29ya3MvY29udGFjdA==', 'd2Vid29ya3NhMUBnbWFpbC5jb20=', 'bWFpbHRvOg=='];
  function dec(i) { try { return window.atob(T[i]); } catch (e) { return ''; } }
  function partnerUrl() { return dec(0); }
  function mailHref(subject, body) {
    var h = dec(2) + dec(1);
    var q = [];
    if (subject) { q.push('subject=' + encodeURIComponent(subject)); }
    if (body) { q.push('body=' + encodeURIComponent(body)); }
    return q.length ? h + '?' + q.join('&') : h;
  }

  function wireContactLinks() {
    var i, a, list = document.querySelectorAll('[data-partner]');
    for (i = 0; i < list.length; i++) {
      a = list[i];
      a.setAttribute('href', partnerUrl());
      a.setAttribute('rel', 'noopener nofollow');
      a.setAttribute('target', '_blank');
    }
    list = document.querySelectorAll('[data-mail]');
    for (i = 0; i < list.length; i++) {
      a = list[i];
      a.setAttribute('href', mailHref(a.getAttribute('data-subject') || 'Code.House enquiry', ''));
      a.setAttribute('rel', 'nofollow');
    }
  }

  /* ---------- theme ---------- */
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('ch-theme'); } catch (e) { }
    if (saved) { document.documentElement.setAttribute('data-theme', saved); }
    var btn = document.getElementById('themeBtn');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ch-theme', next); } catch (e) { }
    });
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var b = document.getElementById('burger'), m = document.getElementById('mobileMenu');
    if (!b || !m) { return; }
    b.addEventListener('click', function () {
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- advertising ----------
     The AdSense tag itself sits in the head of every page. Visitors who choose
     "essential only" get non-personalised ads, which the head script applies
     from the stored choice before the tag loads.
     Each ad container stays hidden until a real slot id is configured, so the
     page never shows an empty box. Replace the data-ad-slot values with the
     unit ids from the AdSense dashboard once the site is approved. */
  function readConsent() {
    try { return localStorage.getItem('ch-consent'); } catch (e) { return null; }
  }
  function fillSlots() {
    var slots = document.querySelectorAll('ins.adsbygoogle');
    for (var i = 0; i < slots.length; i++) {
      var ins = slots[i];
      var slot = ins.getAttribute('data-ad-slot');
      if (!slot || slot.indexOf('REPLACE') === 0) { continue; }
      var box = ins.closest ? ins.closest('.adbox') : null;
      if (box) { box.removeAttribute('hidden'); }
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
    }
  }

  function initConsent() {
    fillSlots();
    var choice = readConsent();
    var bar = document.getElementById('cookiebar');
    if (!bar) { return; }
    if (!choice) { bar.classList.add('show'); }
    function set(v) {
      try { localStorage.setItem('ch-consent', v); } catch (e) { }
      bar.classList.remove('show');
    }
    var a = document.getElementById('consentAll'), e = document.getElementById('consentEssential');
    if (a) { a.addEventListener('click', function () { set('all'); }); }
    if (e) { e.addEventListener('click', function () { set('essential'); }); }
  }

  /* ---------- contact / enquiry forms ---------- */
  function initForms() {
    var forms = document.querySelectorAll('form[data-mailform]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (ev) {
        ev.preventDefault();
        var f = ev.currentTarget;
        var subject = f.getAttribute('data-subject') || 'Code.House enquiry';
        var lines = [];
        var fields = f.querySelectorAll('input,select,textarea');
        for (var j = 0; j < fields.length; j++) {
          var el = fields[j];
          if (!el.name || el.type === 'submit' || el.type === 'button') { continue; }
          if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) { continue; }
          var lab = f.querySelector('label[for="' + el.id + '"]');
          var name = lab ? lab.textContent.replace(/\*/g, '').trim() : el.name;
          lines.push(name + ': ' + el.value);
        }
        var pressed = f.querySelectorAll('.chip[aria-pressed="true"]');
        if (pressed.length) {
          var picks = [];
          for (var k = 0; k < pressed.length; k++) { picks.push(pressed[k].textContent.trim()); }
          lines.push('Selected: ' + picks.join(', '));
        }
        lines.push('', 'Sent from the Code.House website.');
        window.location.href = mailHref(subject, lines.join('\n'));
        var note = f.querySelector('.form-status');
        if (note) { note.textContent = 'Your email app should now open with the message ready to send. If nothing happens, use the enquiry button above.'; }
      });
    }
    var chips = document.querySelectorAll('.chip[aria-pressed]');
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function (ev) {
        var t = ev.currentTarget;
        t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    }
  }

  /* ---------- misc ---------- */
  function initYear() {
    var y = document.querySelectorAll('[data-year]');
    for (var i = 0; i < y.length; i++) { y[i].textContent = String(new Date().getFullYear()); }
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    wireContactLinks();
    initTheme();
    initMenu();
    initForms();
    initYear();
    initConsent();
  });
})();
