/* Code.House — tool behaviour. Everything runs in the visitor's browser;
   no data is uploaded anywhere. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function on(id, ev, fn) { var el = $(id); if (el) { el.addEventListener(ev, fn); } }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function copy(text, statusId) {
    var st = $(statusId);
    function done(ok) { if (st) { st.textContent = ok ? 'Copied to clipboard.' : 'Copy blocked by the browser — select the text and copy manually.'; st.className = 'status ' + (ok ? 'ok' : 'bad'); } }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  }

  /* ---------- JSON formatter ---------- */
  function initJson() {
    if (!$('jsonIn')) { return; }
    function run(indent) {
      var st = $('jsonStatus'), out = $('jsonOut');
      var raw = $('jsonIn').value.trim();
      if (!raw) { out.textContent = ''; st.textContent = 'Paste some JSON to begin.'; st.className = 'status'; return; }
      try {
        var parsed = JSON.parse(raw);
        out.textContent = JSON.stringify(parsed, null, indent);
        var count = (function walk(v) {
          if (Array.isArray(v)) { return v.reduce(function (n, x) { return n + walk(x); }, 1); }
          if (v && typeof v === 'object') { return Object.keys(v).reduce(function (n, k) { return n + walk(v[k]); }, 1); }
          return 1;
        })(parsed);
        st.textContent = 'Valid JSON — ' + count + ' nodes, ' + out.textContent.length + ' characters.';
        st.className = 'status ok';
      } catch (e) {
        out.textContent = '';
        st.textContent = 'Invalid JSON: ' + e.message;
        st.className = 'status bad';
      }
    }
    on('jsonFormat', 'click', function () { run(2); });
    on('jsonTab', 'click', function () { run('\t'); });
    on('jsonMin', 'click', function () { run(0); });
    on('jsonCopy', 'click', function () { copy($('jsonOut').textContent, 'jsonStatus'); });
    on('jsonClear', 'click', function () { $('jsonIn').value = ''; $('jsonOut').textContent = ''; $('jsonStatus').textContent = ''; });
    run(2);
  }

  /* ---------- Regex tester ---------- */
  function initRegex() {
    if (!$('rePattern')) { return; }
    function run() {
      var pat = $('rePattern').value, text = $('reText').value, st = $('reStatus'), out = $('reOut');
      var flags = '';
      ['g', 'i', 'm', 's'].forEach(function (f) { var b = $('flag_' + f); if (b && b.checked) { flags += f; } });
      if (!pat) { out.innerHTML = esc(text); st.textContent = 'Enter a pattern.'; st.className = 'status'; return; }
      var re;
      try { re = new RegExp(pat, flags); } catch (e) {
        st.textContent = 'Invalid pattern: ' + e.message; st.className = 'status bad'; out.innerHTML = esc(text); return;
      }
      var matches = [], m, guard = 0;
      if (flags.indexOf('g') >= 0) {
        while ((m = re.exec(text)) !== null && guard++ < 5000) {
          matches.push(m);
          if (m.index === re.lastIndex) { re.lastIndex++; }
        }
      } else { m = re.exec(text); if (m) { matches.push(m); } }
      var html = '', last = 0;
      matches.forEach(function (mm) {
        html += esc(text.slice(last, mm.index)) + '<mark>' + esc(mm[0]) + '</mark>';
        last = mm.index + (mm[0].length || 1);
      });
      html += esc(text.slice(last));
      out.innerHTML = html || '<span class="muted">No text.</span>';
      st.textContent = matches.length + ' match' + (matches.length === 1 ? '' : 'es') + ' found.';
      st.className = 'status ' + (matches.length ? 'ok' : '');
      var groups = $('reGroups');
      if (groups) {
        if (matches.length && matches[0].length > 1) {
          var rows = matches.slice(0, 20).map(function (mm, i) {
            return '<tr><td>' + (i + 1) + '</td><td><code>' + esc(mm[0]) + '</code></td><td>' +
              mm.slice(1).map(function (g, gi) { return '<code>$' + (gi + 1) + ' = ' + esc(g === undefined ? '' : g) + '</code>'; }).join(' ') + '</td></tr>';
          }).join('');
          groups.innerHTML = '<table><thead><tr><th>#</th><th>Match</th><th>Capture groups</th></tr></thead><tbody>' + rows + '</tbody></table>';
        } else { groups.innerHTML = ''; }
      }
    }
    ['rePattern', 'reText'].forEach(function (id) { on(id, 'input', run); });
    ['g', 'i', 'm', 's'].forEach(function (f) { on('flag_' + f, 'change', run); });
    run();
  }

  /* ---------- Base64 ---------- */
  function initB64() {
    if (!$('b64In')) { return; }
    function enc() {
      try {
        $('b64Out').textContent = btoa(unescape(encodeURIComponent($('b64In').value)));
        $('b64Status').textContent = 'Encoded.'; $('b64Status').className = 'status ok';
      } catch (e) { $('b64Status').textContent = 'Could not encode: ' + e.message; $('b64Status').className = 'status bad'; }
    }
    function dec() {
      try {
        $('b64Out').textContent = decodeURIComponent(escape(atob($('b64In').value.replace(/\s+/g, ''))));
        $('b64Status').textContent = 'Decoded.'; $('b64Status').className = 'status ok';
      } catch (e) { $('b64Status').textContent = 'That is not valid Base64.'; $('b64Status').className = 'status bad'; }
    }
    on('b64Enc', 'click', enc);
    on('b64Dec', 'click', dec);
    on('b64Copy', 'click', function () { copy($('b64Out').textContent, 'b64Status'); });
  }

  /* ---------- UUID / password ---------- */
  function rnd(n) {
    var a = new Uint8Array(n);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a;
  }
  function uuid4() {
    var b = rnd(16);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = [].map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function initUuid() {
    if (!$('uuidOut')) { return; }
    function gen() {
      var n = Math.min(100, Math.max(1, parseInt($('uuidCount').value, 10) || 1));
      var list = [];
      for (var i = 0; i < n; i++) { list.push($('uuidUpper').checked ? uuid4().toUpperCase() : uuid4()); }
      $('uuidOut').textContent = list.join('\n');
      $('uuidStatus').textContent = n + ' identifier' + (n === 1 ? '' : 's') + ' generated in your browser.';
      $('uuidStatus').className = 'status ok';
    }
    on('uuidGen', 'click', gen);
    on('uuidCopy', 'click', function () { copy($('uuidOut').textContent, 'uuidStatus'); });
    function genPw() {
      var len = Math.min(128, Math.max(8, parseInt($('pwLen').value, 10) || 20));
      var sets = '';
      if ($('pwLower').checked) { sets += 'abcdefghijkmnopqrstuvwxyz'; }
      if ($('pwUpper').checked) { sets += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; }
      if ($('pwDigit').checked) { sets += '23456789'; }
      if ($('pwSym').checked) { sets += '!@#$%^&*()-_=+[]{};:,.?'; }
      if (!sets) { $('pwOut').textContent = ''; $('pwStatus').textContent = 'Pick at least one character set.'; $('pwStatus').className = 'status bad'; return; }
      var bytes = rnd(len), out = '';
      for (var i = 0; i < len; i++) { out += sets[bytes[i] % sets.length]; }
      $('pwOut').textContent = out;
      var bits = Math.round(len * Math.log(sets.length) / Math.log(2));
      $('pwStatus').textContent = 'Roughly ' + bits + ' bits of entropy.';
      $('pwStatus').className = 'status ok';
    }
    on('pwGen', 'click', genPw);
    on('pwCopy', 'click', function () { copy($('pwOut').textContent, 'pwStatus'); });
    gen();
  }

  /* ---------- Colour converter ---------- */
  function initColor() {
    if (!$('colIn')) { return; }
    function parse(v) {
      v = v.trim();
      var m = v.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (m) {
        var h = m[1];
        if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      m = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
      if (m) { return [+m[1], +m[2], +m[3]]; }
      return null;
    }
    function toHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
      if (d) {
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) { h = ((g - b) / d + (g < b ? 6 : 0)); }
        else if (mx === g) { h = (b - r) / d + 2; }
        else { h = (r - g) / d + 4; }
        h *= 60;
      }
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }
    function lum(c) {
      var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    function run() {
      var rgb = parse($('colIn').value), st = $('colStatus');
      if (!rgb) { st.textContent = 'Enter a hex value such as #22D3EE, or rgb(34, 211, 238).'; st.className = 'status bad'; return; }
      var hex = '#' + rgb.map(function (v) { return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }).join('').toUpperCase();
      var hsl = toHsl(rgb[0], rgb[1], rgb[2]);
      $('colSwatch').style.background = hex;
      $('colHex').textContent = hex;
      $('colRgb').textContent = 'rgb(' + rgb.join(', ') + ')';
      $('colHsl').textContent = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
      var L = lum(rgb);
      var onWhite = (1.05) / (L + 0.05), onBlack = (L + 0.05) / 0.05;
      $('colContrast').innerHTML =
        'Contrast against white: <strong>' + onWhite.toFixed(2) + ':1</strong> (' + (onWhite >= 4.5 ? 'passes' : 'fails') + ' WCAG AA for body text)<br>' +
        'Contrast against black: <strong>' + onBlack.toFixed(2) + ':1</strong> (' + (onBlack >= 4.5 ? 'passes' : 'fails') + ' WCAG AA for body text)';
      st.textContent = 'Converted.'; st.className = 'status ok';
    }
    on('colIn', 'input', run);
    run();
  }

  /* ---------- Project cost estimator ----------
     Ranges are built from publicly quoted agency day rates and typical scope
     sizes. They are a planning aid, not a quotation. */
  function initEstimator() {
    if (!$('estType')) { return; }
    var BASE = { web: 30, mobile: 45, site: 12, ai: 50, saas: 60, store: 28 };
    var REGION = { na: 1.0, eu: 0.8, ee: 0.5, sa: 0.35, latam: 0.5 };
    function run() {
      var base = BASE[$('estType').value] || 30;
      var plat = parseFloat($('estPlatforms').value);
      var cx = parseFloat($('estComplexity').value);
      var region = REGION[$('estRegion').value] || 1;
      var extras = 0;
      ['estAuth', 'estPay', 'estAdmin', 'estAI', 'estIntegr', 'estDesign'].forEach(function (id) {
        var el = $(id); if (el && el.checked) { extras += parseFloat(el.getAttribute('data-w')) || 0; }
      });
      var mid = (base + extras) * plat * cx * region;
      var lo = Math.max(3, Math.round(mid * 0.8));
      var hi = Math.round(mid * 1.45);
      var wLo = Math.max(3, Math.round(lo / 2.8)), wHi = Math.max(5, Math.round(hi / 2.8));
      $('estRange').textContent = '$' + lo.toLocaleString() + 'k – $' + hi.toLocaleString() + 'k';
      $('estTime').textContent = 'Indicative schedule: ' + wLo + '–' + wHi + ' weeks with a team of ' +
        (cx >= 1.8 ? '5–7' : cx >= 1 ? '3–4' : '2–3') + ' people.';
      $('estBreak').innerHTML =
        '<tr><td>Discovery and design</td><td>' + Math.round(lo * 0.15) + 'k – ' + Math.round(hi * 0.2) + 'k</td></tr>' +
        '<tr><td>Engineering</td><td>' + Math.round(lo * 0.55) + 'k – ' + Math.round(hi * 0.6) + 'k</td></tr>' +
        '<tr><td>Testing and QA</td><td>' + Math.round(lo * 0.12) + 'k – ' + Math.round(hi * 0.15) + 'k</td></tr>' +
        '<tr><td>Project management</td><td>' + Math.round(lo * 0.1) + 'k – ' + Math.round(hi * 0.12) + 'k</td></tr>' +
        '<tr><td>Launch and first-month fixes</td><td>' + Math.round(lo * 0.05) + 'k – ' + Math.round(hi * 0.08) + 'k</td></tr>';
    }
    var ids = ['estType', 'estPlatforms', 'estComplexity', 'estRegion', 'estAuth', 'estPay', 'estAdmin', 'estAI', 'estIntegr', 'estDesign'];
    ids.forEach(function (id) { on(id, 'change', run); on(id, 'input', run); });
    run();
  }

  /* ---------- Roadmap ---------- */
  function initRoadmap() {
    var wrap = $('roadmap');
    if (!wrap) { return; }
    var nodes = wrap.querySelectorAll('.node');
    var done = {};
    try { done = JSON.parse(localStorage.getItem('ch-roadmap') || '{}'); } catch (e) { done = {}; }
    function save() { try { localStorage.setItem('ch-roadmap', JSON.stringify(done)); } catch (e) { } }
    function show(key) {
      for (var i = 0; i < nodes.length; i++) { nodes[i].classList.toggle('active', nodes[i].getAttribute('data-key') === key); }
      var panels = document.querySelectorAll('[data-panel]');
      for (var j = 0; j < panels.length; j++) { panels[j].hidden = panels[j].getAttribute('data-panel') !== key; }
    }
    for (var i = 0; i < nodes.length; i++) {
      (function (n) {
        var k = n.getAttribute('data-key');
        n.setAttribute('aria-pressed', done[k] ? 'true' : 'false');
        n.addEventListener('click', function () { show(k); });
        n.addEventListener('dblclick', function () {
          done[k] = !done[k]; n.setAttribute('aria-pressed', done[k] ? 'true' : 'false'); save();
        });
      })(nodes[i]);
    }
    var toggles = document.querySelectorAll('[data-done-for]');
    for (var t = 0; t < toggles.length; t++) {
      (function (b) {
        var k = b.getAttribute('data-done-for');
        function label() { b.textContent = done[k] ? 'Completed — click to undo' : 'Mark this step complete'; }
        label();
        b.addEventListener('click', function () {
          done[k] = !done[k]; save(); label();
          var n = wrap.querySelector('.node[data-key="' + k + '"]');
          if (n) { n.setAttribute('aria-pressed', done[k] ? 'true' : 'false'); }
        });
      })(toggles[t]);
    }
    if (nodes.length) { show(nodes[0].getAttribute('data-key')); }
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
  }
  ready(function () {
    initJson(); initRegex(); initB64(); initUuid(); initColor(); initEstimator(); initRoadmap();
  });
})();
