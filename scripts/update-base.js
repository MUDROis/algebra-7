// Меняет базовый URL в мета-тегах на кастомный домен.
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/Lenovo/Downloads/algebra-7';
const OLD = 'https://xn--80aaagnrcpdkofpu2ae0iuf.xn--p1ai/algebra-7';
const NEW = 'https://интерактивнаяшкола.рф/algebra-7';
const files = ['index.html'].concat(fs.readdirSync(DIR).filter(f=>/^lesson-\d+\.html$/.test(f)));
let changed = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  let c = fs.readFileSync(p, 'utf8');
  const n = c.split(OLD).join(NEW);
  if (n !== c) { fs.writeFileSync(p, n, 'utf8'); changed++; }
}
console.log('changed:' + changed);
