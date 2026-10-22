// Конвертация строчных математических записей в LaTeX для KaTeX (версия для алгебры 7).
'use strict';

const SUPERSCRIPTS = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', 'ⁿ': 'n'
};
const SUPERSCRIPT_RE = /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g;

function convertMathText(src) {
  let s = src;

  s = s.replace(/&lt;/g, '\\lt');
  s = s.replace(/&gt;/g, '\\gt');
  s = s.replace(/&ne;/g, '\\ne');
  s = s.replace(/&le;/g, '\\le');
  s = s.replace(/&ge;/g, '\\ge');
  s = s.replace(/&times;/g, '\\times');
  s = s.replace(/&nbsp;/g, ' ');

  // Степени: группа юникод-надстрочных -> ^{цифры}
  s = s.replace(SUPERSCRIPT_RE, function (run) {
    let out = '';
    for (let i = 0; i < run.length; i++) out += SUPERSCRIPTS[run[i]] || run[i];
    return '^{' + out + '}';
  });

  // Умножение и деление
  s = s.replace(/·/g, '\\cdot{}');
  s = s.replace(/×/g, '\\times{}');
  s = s.replace(/÷/g, '\\div ');

  // Проценты / градусы
  s = s.replace(/%/g, '\\%');
  s = s.replace(/°/g, '^{\\circ}');

  // Смешанные числа: "Ц Д/З" -> "Ц\frac{Д}{З}"
  s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, '$1\\frac{$2}{$3}');
  // Дроби: "Д/З" -> "\frac{Д}{З}"
  s = s.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

  return s;
}

module.exports = { convertMathText };
