/* Терпимое сравнение ответов ученика с эталоном. Работает и в браузере, и в Node (CommonJS). */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CourseAnswerCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function normalizeAnswer(s) {
    s = String(s).toLowerCase().replace(/[−–]/g, '-').trim();
    var nums = [];
    var re = /-?\d+(?:[.,]\d+)?/g;
    var m;
    while ((m = re.exec(s)) !== null) {
      nums.push(m[0].replace(',', '.'));
    }
    nums.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
    return { raw: s, nums: nums };
  }

  function checkAnswer(userInput, expectedStr) {
    var u = normalizeAnswer(userInput);
    var e = normalizeAnswer(expectedStr);
    if (e.nums.length > 0) {
      if (u.nums.length !== e.nums.length) return false;
      for (var i = 0; i < u.nums.length; i++) {
        if (u.nums[i] !== e.nums[i]) return false;
      }
      return true;
    }
    return u.raw === e.raw;
  }

  return { normalizeAnswer: normalizeAnswer, checkAnswer: checkAnswer };
});
