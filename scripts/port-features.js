// Портирует фичи из курса «Математика 6» в «Алгебра 7»:
// KaTeX, инъекция ассетов, самопроверка, мета/OG/лого, поиск, виджеты. Идемпотентно.
const fs = require('fs');
const path = require('path');
const { convertMathText } = require('./katex-convert');

const DIR = 'C:/Users/Lenovo/Downloads/algebra-7';
const BASE = 'https://MUDROis.github.io/algebra-7';
const SITE = 'Алгебра 7 класс';

const files = ['index.html'].concat(
  fs.readdirSync(DIR).filter(f => /^lesson-\d+\.html$/.test(f)).sort(
    (a, b) => parseInt(a.slice(7)) - parseInt(b.slice(7))));

const WIDGET_PLAN = { 11: 'widget-num-11', 15: 'widget-coord-15', 16: 'widget-coord-16' };
const ANCHOR_CHECK = '<span class="emoji">✏️</span> Проверь себя';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function decodeText(h) {
  return String(h).replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}
function hasCyrillic(s) { return /[а-яА-ЯёЁ]/.test(s); }

// ---------- 1. Инъекция ассетов (head/body) ----------
const HEAD_BLOCK =
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">\n' +
  '<link rel="stylesheet" href="assets/course.css">\n';
const BODY_BLOCK =
  '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>\n' +
  '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>\n' +
  '<script defer src="assets/axis-math.js"></script>\n' +
  '<script defer src="assets/answer-core.js"></script>\n' +
  '<script defer src="assets/course.js"></script>\n';

function injectAssets(c) {
  if (!c.includes('assets/course.css')) {
    const i = c.lastIndexOf('</head>');
    c = c.slice(0, i) + HEAD_BLOCK + c.slice(i);
  }
  if (!c.includes('assets/course.js')) {
    const i = c.lastIndexOf('</body>');
    c = c.slice(0, i) + BODY_BLOCK + c.slice(i);
  }
  return c;
}

// ---------- 2. KaTeX-конвертация span.math ----------
const SPAN_RE = /<span class="math([^"]*)"([^>]*)>([\s\S]*?)<\/span>/g;

function convertKatex(c) {
  return c.replace(SPAN_RE, function (m, cls, attrs, inner) {
    var inner = arguments[3];
    if (inner.trim() === '') return m;
    if (inner.includes('\\(') || inner.includes('\\)')) return m;
    if (hasCyrillic(inner)) return m;
    const out = convertMathText(inner);
    return '<span class="math' + cls + '"' + attrs + '>\\(' + out + '\\)</span>';
  });
}

// ---------- 3. Самопроверка ----------
const BTN_RE = /(<button class="answer-btn"[^>]*onclick="toggleAnswer\('(\w+)'\)")/g;
const BTN_RE_B = /(<button class="btn-check"[^>]*onclick="toggleAnswer\('(\w+)'\)")/g;

function extractAnswer(c, id, cls) {
  const open = c.indexOf('<div id="' + id + '" class="' + cls + '">');
  if (open === -1) return '';
  const close = c.indexOf('</div>', open);
  let seg = c.slice(open, close);
  const li = seg.indexOf('Ответ');
  if (li !== -1) { const col = seg.indexOf(':', li); if (col !== -1) seg = seg.slice(col + 1); }
  seg = seg.replace(/<[^>]+>/g, '');
  seg = seg.replace(/\\\(/g, '').replace(/\\\)/g, '');
  seg = seg.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  return seg.replace(/\s+/g, ' ').trim();
}

function rowHtml(answer) {
  const e = esc(answer);
  return '<div class="check-row"><input class="check-input" type="text" placeholder="Введи ответ" data-answer="' + e +
    '"><button class="check-btn" type="button">Проверить</button><span class="check-feedback"></span></div>';
}

function injectInput(c) {
  if (c.includes('class="check-input"')) return c; // уже обработан
  c = c.replace(BTN_RE, function (m, open, id) {
    return rowHtml(extractAnswer(c, id, 'answer-content')) + '\n' + open;
  });
  c = c.replace(BTN_RE_B, function (m, open, id) {
    return rowHtml(extractAnswer(c, id, 'answer')) + '\n' + open;
  });
  return c;
}

// ---------- 4. Мета/OG/лого ----------
function injectMeta(c, f) {
  if (c.includes('property="og:title"')) return c;
  const titleM = /\<title>(.*?)<\/title>/s.exec(c);
  const title = titleM ? decodeText(titleM[1]) : SITE;
  const subM = /<p class="subtitle">([\s\S]*?)<\/p>/s.exec(c);
  const desc = subM ? decodeText(subM[1]) : title;
  const page = f === 'index.html' ? BASE + '/' : BASE + '/' + f;
  const block =
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="icon" type="image/x-icon" href="assets/favicon.ico">\n' +
    '<link rel="apple-touch-icon" href="assets/logo.png">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + esc(SITE) + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:image" content="' + BASE + '/assets/logo.png">\n' +
    '<meta property="og:url" content="' + page + '">\n' +
    '<meta property="og:locale" content="ru_RU">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + esc(title) + '">\n' +
    '<meta name="twitter:description" content="' + esc(desc) + '">\n' +
    '<meta name="twitter:image" content="' + BASE + '/assets/logo.png">\n' +
    '<link rel="canonical" href="' + page + '">\n';
  const i = c.lastIndexOf('</head>');
  return c.slice(0, i) + block + c.slice(i);
}

function injectIndexHeader(c) {
  if (c.includes('course-logo')) return c;
  // лого + заголовок на одной строке
  c = c.replace('<h1>Алгебра 7 класс</h1>',
    '<div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">' +
    '<img class="course-logo" src="assets/logo.png" alt="Логотип курса «Алгебра 7 класс»">' +
    '<h1 style="margin:0;">Алгебра 7 класс</h1></div>');
  // поиск перед первой главой
  if (!c.includes('course-search')) {
    const anchor = '<section class="chapter c1">';
    const at = c.indexOf(anchor);
    if (at !== -1) {
      const box = '<div style="background:#fff;padding:16px;margin-bottom:22px;box-shadow:0 2px 6px rgba(0,0,0,.08);border-left:6px solid #3498db;">' +
        '<input id="course-search" type="search" placeholder="Поиск по курсу…"></div>\n';
      c = c.slice(0, at) + box + c.slice(at);
    }
  }
  return c;
}

// ---------- 5. Виджеты ----------
function injectWidgets(c, num) {
  const id = WIDGET_PLAN[num];
  if (!id) return c;
  if (c.includes('id="' + id + '"')) return c;
  const marker = c.indexOf('Проверь себя');
  if (marker === -1) return c;
  let blockStart = c.lastIndexOf('<div class="content-block">', marker);
  if (blockStart === -1) blockStart = c.lastIndexOf('<h2 class="tasks-title', marker);
  if (blockStart === -1) return c;
  const kind = id.indexOf('coord') !== -1 ? 'coordinate' : 'numberline';
  const title = kind === 'coordinate' ? '🖱 Потренируйся на координатной плоскости' : '🖱 Потренируйся на числовой прямой';
  const widget = '<div class="content-block"><h2>' + title + '</h2>' +
    '<div class="widget" id="' + id + '" data-widget="' + kind + '"></div></div>\n';
  return c.slice(0, blockStart) + widget + c.slice(blockStart);
}

// ---------- Выполнение ----------
let filesChanged = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  let c = fs.readFileSync(p, 'utf8');
  const orig = c;

  c = injectAssets(c);
  c = convertKatex(c);
  c = injectInput(c);
  c = injectMeta(c, f);
  if (f === 'index.html') c = injectIndexHeader(c);
  const num = /^lesson-(\d+)\.html$/.exec(f);
  if (num) c = injectWidgets(c, parseInt(num[1], 10));

  if (c !== orig) { fs.writeFileSync(p, c, 'utf8'); filesChanged++; }
}
console.log('files changed:' + filesChanged);
