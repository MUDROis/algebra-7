/* Чистая математика координатных преобразований для виджетов (прямая и плоскость). UMD. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.AxisMath = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function linearMap(value, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function snapInterval(v, start, step) {
    return start + Math.round((v - start) / step) * step;
  }

  // Положение (в px) деления оси координатной плоскости.
  // Ось x: правее центра — значение растёт; ось y: выше центра — значение растёт.
  function planeTickPos(value, center, scale, axis) {
    return axis === 'y' ? center - value * scale : center + value * scale;
  }

  return { linearMap: linearMap, clamp: clamp, snapInterval: snapInterval, planeTickPos: planeTickPos };
});
