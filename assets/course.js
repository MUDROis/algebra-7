/* Общий JS курса «Алгебра 7 класс» */
(function () {
  'use strict';

  function renderKatexIfPresent() {
    if (window.renderMathInElement && document.querySelector('.math')) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [{ left: '\\(', right: '\\)', display: false }],
          throwOnError: false,
          strict: 'ignore'
        });
      } catch (e) {
        if (window.console && console.error) console.error('KaTeX render error:', e);
      }
    }
  }

  function initSelfCheck() {
    var core = window.CourseAnswerCore;
    if (!core) return;
    var btns = document.querySelectorAll('.check-btn');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        function run() {
          var row = btn.closest ? btn.closest('.check-row') : null;
          if (!row) return;
          var input = row.querySelector('.check-input');
          var fb = row.querySelector('.check-feedback');
          if (!input || !fb) return;
          var expected = input.getAttribute('data-answer') || '';
          var ok = core.checkAnswer(input.value, expected);
          fb.classList.remove('ok', 'bad');
          if (ok) { fb.textContent = '✅ Верно!'; fb.classList.add('ok'); }
          else { fb.textContent = '❌ Попробуй ещё'; fb.classList.add('bad'); }
        }
        btn.addEventListener('click', run);
        var input = btn.previousElementSibling;
        if (input && input.classList && input.classList.contains('check-input')) {
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); run(); }
          });
        }
      })(btns[i]);
    }
  }

  function initSearch() {
    var box = document.getElementById('course-search');
    if (!box) return;
    box.addEventListener('input', function () {
      var q = box.value.trim().toLowerCase();
      var cards = document.querySelectorAll('.topic-card');
      for (var i = 0; i < cards.length; i++) {
        var txt = (cards[i].textContent || '').toLowerCase();
        var hit = !q || txt.indexOf(q) !== -1;
        cards[i].classList.toggle('hidden', !hit);
      }
    });
  }

  function initToc() {
    if (document.querySelector('section.chapter')) return;
    var headings = Array.prototype.slice.call(document.querySelectorAll('.content-block h2'));
    if (headings.length < 2) return;
    var toc = document.createElement('div');
    toc.className = 'toc-sidebar';
    var h3 = document.createElement('h3');
    h3.textContent = 'Содержание';
    toc.appendChild(h3);
    headings.forEach(function (h, idx) {
      h.id = h.id || ('sec-' + (idx + 1));
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/^\s*[^\s]+\s*/, '');
      a.dataset.target = h.id;
      toc.appendChild(a);
    });
    document.body.appendChild(toc);
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle('active', a.dataset.target === id); });
    }
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActive(en.target.id);
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      headings.forEach(function (h) { obs.observe(h); });
    }
  }

  var WIDGET_DATA = {
    'widget-num-4': { kind: 'numberline', min: -5, max: 5, step: 1, exercises: [
      { prompt: 'Отметь число −3.', correct: -3 },
      { prompt: 'Отметь число 2.', correct: 2 },
      { prompt: 'Отметь число 0.', correct: 0 }
    ] },
    'widget-num-11': { kind: 'numberline', min: -5, max: 5, step: 1, exercises: [
      { prompt: 'Отметь точку с координатой −2.', correct: -2 },
      { prompt: 'Отметь точку с координатой 3.', correct: 3 },
      { prompt: 'Отметь точку с координатой 0.', correct: 0 }
    ] },
    'widget-coord-14': { kind: 'coordinate', exercises: [
      { prompt: 'Построй точку графика y = x² (x = 2).', correct: [2, 4] },
      { prompt: 'Построй точку графика y = x² (x = −1).', correct: [-1, 1] },
      { prompt: 'Построй точку графика y = x² (x = 0).', correct: [0, 0] }
    ] },
    'widget-coord-15': { kind: 'coordinate', exercises: [
      { prompt: 'Построй точку на графике y = 2x (x = 1).', correct: [1, 2] },
      { prompt: 'Построй точку на графике y = 2x (x = 2).', correct: [2, 4] },
      { prompt: 'Построй точку на графике y = 2x (x = −1).', correct: [-1, -2] }
    ] },
    'widget-coord-16': { kind: 'coordinate', exercises: [
      { prompt: 'Построй точку пересечения графика y = x + 3 с осью y.', correct: [0, 3] },
      { prompt: 'Построй точку на графике y = x + 3 (x = 2).', correct: [2, 5] },
      { prompt: 'Построй точку на графике y = −2x + 1 (x = 1).', correct: [1, -1] }
    ] }
  };

  function svgPoint(cx, cy, r, color) {
    return '<circle class="w-point" cx="' + cx + '" cy="' + cy + '" r="' + r +
      '" fill="' + color + '" stroke="#2d3436" stroke-width="2"/>';
  }
  function fmtCoord(v) {
    return Number.isInteger(v) ? String(v) : String(v).replace('.', ',');
  }

  function buildNumberLineWidget(el, cfg) {
    var W = 480, H = 100, PAD = 40;
    var am = window.AxisMath;
    var i = 0, placed = null;
    var ex = cfg.exercises;
    el.innerHTML =
      '<div class="w-prompt"></div>' +
      '<svg class="w-grid" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
        '<line x1="' + PAD + '" y1="52" x2="' + (W - PAD) + '" y2="52" stroke="#2d3436" stroke-width="2"/>' +
        '<polygon points="' + (W - PAD) + ',52 ' + (W - PAD - 10) + ',47 ' + (W - PAD - 10) + ',57" fill="#2d3436"/>' +
        '<g id="ticks"></g><g id="pts"></g>' +
      '</svg>' +
      '<div class="w-hint">Кликни по прямой, чтобы поставить точку</div>' +
      '<div class="w-actions"><button type="button" class="w-check">Проверить</button> <button type="button" class="w-next">Дальше →</button></div>' +
      '<div class="w-feedback"></div>';
    var svg = el.querySelector('svg');
    var gTicks = el.querySelector('#ticks');
    var gPts = el.querySelector('#pts');
    var promptEl = el.querySelector('.w-prompt');
    var fb = el.querySelector('.w-feedback');
    var tickHtml = '';
    for (var v = cfg.min; v <= cfg.max; v += cfg.step) {
      var px = am.linearMap(v, cfg.min, cfg.max, PAD, W - PAD);
      tickHtml += '<line x1="' + px + '" y1="46" x2="' + px + '" y2="58" stroke="#2d3436" stroke-width="1.5"/>' +
        '<text x="' + px + '" y="76" font-size="12" text-anchor="middle" fill="#2d3436">' + v + '</text>';
    }
    gTicks.innerHTML = tickHtml;
    function render() {
      promptEl.textContent = (i + 1) + '. ' + ex[i].prompt;
      gPts.innerHTML = '';
      if (placed !== null) {
        gPts.innerHTML = svgPoint(am.linearMap(placed, cfg.min, cfg.max, PAD, W - PAD), 52, 8, '#f39c12');
      }
      fb.textContent = ''; fb.className = 'w-feedback';
    }
    svg.addEventListener('click', function (e) {
      var r = svg.getBoundingClientRect();
      var w = svg.viewBox.baseVal.width;
      var xPx = (e.clientX - r.left) * (w / r.width);
      var val = am.clamp(am.linearMap(xPx, PAD, W - PAD, cfg.min, cfg.max), cfg.min, cfg.max);
      placed = am.snapInterval(val, cfg.min, cfg.step);
      render();
    });
    el.querySelector('.w-check').addEventListener('click', function () {
      if (placed === null) { fb.textContent = 'Сначала поставь точку кликом.'; fb.className = 'w-feedback bad'; return; }
      var ok = Math.abs(placed - ex[i].correct) <= cfg.step / 2;
      fb.textContent = ok ? '✅ Верно!' : '❌ Попробуй ещё (ответ около ' + ex[i].correct + ')';
      fb.className = 'w-feedback ' + (ok ? 'ok' : 'bad');
    });
    el.querySelector('.w-next').addEventListener('click', function () {
      i = (i + 1) % ex.length; placed = null; render();
    });
    render();
  }

  function buildCoordinatePlaneWidget(el, cfg) {
    var W = 400, H = 400, CX = 200, CY = 200, SCALE = 20;
    var am = window.AxisMath;
    var i = 0, placed = null;
    var ex = cfg.exercises;
    el.innerHTML =
      '<div class="w-prompt"></div>' +
      '<svg class="w-grid" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
        '<g id="grid"></g><g id="pts"></g>' +
      '</svg>' +
      '<div class="w-hint">Кликни по плоскости, чтобы построить точку</div>' +
      '<div class="w-actions"><button type="button" class="w-check">Проверить</button> <button type="button" class="w-next">Дальше →</button></div>' +
      '<div class="w-feedback"></div>';
    var svg = el.querySelector('svg');
    var gGrid = el.querySelector('#grid');
    var gPts = el.querySelector('#pts');
    var promptEl = el.querySelector('.w-prompt');
    var fb = el.querySelector('.w-feedback');
    var g = '';
    for (var k = 0; k <= W; k += SCALE) g += '<line x1="' + k + '" y1="0" x2="' + k + '" y2="' + H + '" stroke="#dfe6e9" stroke-width="1"/>';
    for (var j = 0; j <= H; j += SCALE) g += '<line x1="0" y1="' + j + '" x2="' + W + '" y2="' + j + '" stroke="#dfe6e9" stroke-width="1"/>';
    g += '<line x1="0" y1="' + CY + '" x2="' + W + '" y2="' + CY + '" stroke="#2d3436" stroke-width="2"/>';
    g += '<line x1="' + CX + '" y1="0" x2="' + CX + '" y2="' + H + '" stroke="#2d3436" stroke-width="2"/>';
    g += '<polygon points="' + W + ',' + CY + ' ' + (W - 10) + ',' + (CY - 5) + ' ' + (W - 10) + ',' + (CY + 5) + '" fill="#2d3436"/>';
    g += '<polygon points="' + CX + ',0 ' + (CX - 5) + ',10 ' + (CX + 5) + ',10" fill="#2d3436"/>';
    g += '<text x="' + (W - 14) + '" y="' + (CY - 8) + '" font-size="13" fill="#2d3436">x</text>';
    g += '<text x="' + (CX + 8) + '" y="14" font-size="13" fill="#2d3436">y</text>';
    g += '<text x="' + (CX - 6) + '" y="' + (CY + 16) + '" font-size="12" fill="#2d3436">O</text>';
    for (var xv = -6; xv <= 6; xv++) {
      if (xv === 0) continue;
      var xp = am.planeTickPos(xv, CX, SCALE, 'x');
      g += '<text x="' + xp + '" y="' + (CY + 18) + '" font-size="11" text-anchor="middle" fill="#636e72">' + xv + '</text>';
      g += '<line x1="' + xp + '" y1="' + (CY - 3) + '" x2="' + xp + '" y2="' + (CY + 3) + '" stroke="#2d3436" stroke-width="1"/>';
    }
    for (var yv = -10; yv <= 10; yv++) {
      if (yv === 0) continue;
      var yp = am.planeTickPos(yv, CY, SCALE, 'y');
      g += '<text x="' + (CX - 10) + '" y="' + (yp + 4) + '" font-size="11" text-anchor="end" fill="#636e72">' + yv + '</text>';
      g += '<line x1="' + (CX - 3) + '" y1="' + yp + '" x2="' + (CX + 3) + '" y2="' + yp + '" stroke="#2d3436" stroke-width="1"/>';
    }
    gGrid.innerHTML = g;
    function worldToPx(x, y) { return { x: CX + x * SCALE, y: CY - y * SCALE }; }
    function pxToWorld(px, py) { return { x: (px - CX) / SCALE, y: (CY - py) / SCALE }; }
    function render() {
      promptEl.textContent = (i + 1) + '. ' + ex[i].prompt;
      gPts.innerHTML = '';
      if (placed) {
        var p = worldToPx(placed.x, placed.y);
        gPts.innerHTML = svgPoint(p.x, p.y, 7, '#f39c12') +
          '<text x="' + (p.x + 10) + '" y="' + (p.y - 8) + '" font-size="13" font-weight="bold" fill="#b9770e">(' + fmtCoord(placed.x) + '; ' + fmtCoord(placed.y) + ')</text>';
      }
      fb.textContent = ''; fb.className = 'w-feedback';
    }
    svg.addEventListener('click', function (e) {
      var r = svg.getBoundingClientRect();
      var bw = svg.viewBox.baseVal.width, bh = svg.viewBox.baseVal.height;
      var w = pxToWorld((e.clientX - r.left) * (bw / r.width), (e.clientY - r.top) * (bh / r.height));
      placed = { x: Math.round(w.x * 2) / 2, y: Math.round(w.y * 2) / 2 };
      render();
    });
    el.querySelector('.w-check').addEventListener('click', function () {
      if (!placed) { fb.textContent = 'Сначала построй точку кликом.'; fb.className = 'w-feedback bad'; return; }
      var c = ex[i].correct;
      var ok = Math.abs(placed.x - c[0]) <= 0.5 && Math.abs(placed.y - c[1]) <= 0.5;
      fb.textContent = ok ? '✅ Верно!' : '❌ Попробуй ещё (нужна точка ' + fmtCoord(c[0]) + '; ' + fmtCoord(c[1]) + ')';
      fb.className = 'w-feedback ' + (ok ? 'ok' : 'bad');
    });
    el.querySelector('.w-next').addEventListener('click', function () {
      i = (i + 1) % ex.length; placed = null; render();
    });
    render();
  }

  function initWidgets() {
    var nodes = document.querySelectorAll('.widget[data-widget]');
    for (var idx = 0; idx < nodes.length; idx++) {
      var el = nodes[idx];
      var cfg = WIDGET_DATA[el.id];
      if (!cfg) continue;
      try {
        if (cfg.kind === 'coordinate') buildCoordinatePlaneWidget(el, cfg);
        else buildNumberLineWidget(el, cfg);
      } catch (e) {
        if (window.console && console.error) console.error('Widget build error [' + el.id + ']:', e);
      }
    }
  }

  function initContentsSidebar() {
    var chapters = document.querySelectorAll('section.chapter');
    if (!chapters.length) return;
    var toc = document.createElement('div');
    toc.className = 'toc-sidebar';
    var h3 = document.createElement('h3');
    h3.textContent = 'Содержание';
    toc.appendChild(h3);
    var seen = {};
    chapters.forEach(function (ch) {
      var btn = ch.querySelector('.chapter-header');
      if (!btn) return;
      var title = btn.textContent.replace(/\s+/g, ' ').replace(/^[IVXLC]+\s*/, '').trim();
      var det = document.createElement('details');
      det.open = true;
      var sum = document.createElement('summary');
      sum.textContent = title || 'Глава';
      det.appendChild(sum);
      var body = document.createElement('div');
      ch.querySelectorAll('.topic-card').forEach(function (card) {
        var a = card.querySelector('a.go-btn[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (seen[href]) return;
        seen[href] = true;
        var h4 = card.querySelector('.info h4');
        var link = document.createElement('a');
        link.href = href;
        link.textContent = h4 ? h4.textContent.replace(/\s+/g, ' ').trim() : href;
        body.appendChild(link);
      });
      det.appendChild(body);
      toc.appendChild(det);
    });
    document.body.appendChild(toc);
  }

  window.Course = {
    init: function () {
      renderKatexIfPresent();
      initSelfCheck();
      initWidgets();
      initSearch();
      initToc();
      initContentsSidebar();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.Course.init(); });
  } else {
    window.Course.init();
  }
})();
