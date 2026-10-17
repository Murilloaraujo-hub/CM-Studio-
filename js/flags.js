/* ==========================================================================
   CM Studio — flags.js
   Bandeiras SIMPLIFICADAS em SVG (desenhadas em código, sem imagens externas).
   São apenas complementares: o nome do país sempre aparece em texto ao lado,
   e o SVG é marcado como decorativo (aria-hidden). Algumas bandeiras são
   representações reduzidas (sem todos os detalhes), adequadas a ícones.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var NS = 'http://www.w3.org/2000/svg';

  function node(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function rect(x, y, w, h, fill) { return node('rect', { x: x, y: y, width: w, height: h, fill: fill }); }
  function hStripes(colors) {
    var h = 20 / colors.length;
    return colors.map(function (c, i) { return rect(0, i * h, 30, h + 0.05, c); });
  }
  function vStripes(colors) {
    var w = 30 / colors.length;
    return colors.map(function (c, i) { return rect(i * w, 0, w + 0.05, 20, c); });
  }
  function unionCanton(w, h) {
    // Union Jack reduzida (canto superior esquerdo)
    var g = node('g', {});
    g.appendChild(rect(0, 0, w, h, '#012169'));
    g.appendChild(node('path', { d: 'M0,0 L' + w + ',' + h + ' M' + w + ',0 L0,' + h, stroke: '#fff', 'stroke-width': h / 5 }));
    g.appendChild(node('path', { d: 'M0,0 L' + w + ',' + h + ' M' + w + ',0 L0,' + h, stroke: '#C8102E', 'stroke-width': h / 12 }));
    g.appendChild(node('path', { d: 'M' + w / 2 + ',0 V' + h + ' M0,' + h / 2 + ' H' + w, stroke: '#fff', 'stroke-width': h / 3.2 }));
    g.appendChild(node('path', { d: 'M' + w / 2 + ',0 V' + h + ' M0,' + h / 2 + ' H' + w, stroke: '#C8102E', 'stroke-width': h / 5.5 }));
    return g;
  }
  function star(cx, cy, r, fill) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var ang = Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 === 0 ? r : r * 0.45;
      pts.push((cx + rr * Math.cos(ang)).toFixed(2) + ',' + (cy - rr * Math.sin(ang)).toFixed(2));
    }
    return node('polygon', { points: pts.join(' '), fill: fill });
  }

  var DRAW = {
    BR: function () {
      return [rect(0, 0, 30, 20, '#009C3B'), node('polygon', { points: '15,2.5 27.5,10 15,17.5 2.5,10', fill: '#FFDF00' }), node('circle', { cx: 15, cy: 10, r: 4.6, fill: '#002776' }),
        node('path', { d: 'M10.6,9.2 Q15,7.6 19.4,10.6', stroke: '#fff', 'stroke-width': 0.8, fill: 'none' })];
    },
    US: function () {
      var parts = [];
      for (var i = 0; i < 13; i++) parts.push(rect(0, i * (20 / 13), 30, 20 / 13 + 0.05, i % 2 ? '#fff' : '#B22234'));
      parts.push(rect(0, 0, 12, 20 * 7 / 13, '#3C3B6E'));
      for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) parts.push(node('circle', { cx: 1.4 + c * 2.3, cy: 1.4 + r * 2.6, r: 0.45, fill: '#fff' }));
      return parts;
    },
    UK: function () { return [unionCanton(30, 20)]; },
    CA: function () {
      return [rect(0, 0, 30, 20, '#fff'), rect(0, 0, 7.5, 20, '#D52B1E'), rect(22.5, 0, 7.5, 20, '#D52B1E'),
        node('path', { d: 'M15,4 L16.2,7 L18.6,6.2 L17.6,9.6 L19.6,10 L17.4,12 L17.8,13.4 L15.4,13 L15.4,16 L14.6,16 L14.6,13 L12.2,13.4 L12.6,12 L10.4,10 L12.4,9.6 L11.4,6.2 L13.8,7 Z', fill: '#D52B1E' })];
    },
    AU: function () {
      return [rect(0, 0, 30, 20, '#012169'), unionCanton(15, 10), star(7.5, 15.3, 2.2, '#fff'),
        star(23, 4.5, 1.1, '#fff'), star(20, 9.5, 1.1, '#fff'), star(26, 8.5, 1.1, '#fff'), star(23, 16, 1.1, '#fff')];
    },
    DE: function () { return hStripes(['#000000', '#DD0000', '#FFCE00']); },
    FR: function () { return vStripes(['#002395', '#ffffff', '#ED2939']); },
    PT: function () {
      return [rect(0, 0, 12, 20, '#006600'), rect(12, 0, 18, 20, '#FF0000'), node('circle', { cx: 12, cy: 10, r: 4.2, fill: '#FFCC00' }),
        node('rect', { x: 10.3, y: 7.8, width: 3.4, height: 4.4, rx: 0.8, fill: '#fff', stroke: '#FF0000', 'stroke-width': 0.8 })];
    },
    ES: function () { return [rect(0, 0, 30, 5, '#AA151B'), rect(0, 5, 30, 10, '#F1BF00'), rect(0, 15, 30, 5, '#AA151B')]; },
    IT: function () { return vStripes(['#009246', '#ffffff', '#CE2B37']); },
    JP: function () { return [rect(0, 0, 30, 20, '#ffffff'), node('circle', { cx: 15, cy: 10, r: 6, fill: '#BC002D' })]; },
    IE: function () { return vStripes(['#169B62', '#ffffff', '#FF883E']); },
    NL: function () { return hStripes(['#AE1C28', '#ffffff', '#21468B']); },
    NZ: function () {
      return [rect(0, 0, 30, 20, '#012169'), unionCanton(15, 10),
        star(23, 4.5, 1.3, '#C8102E'), star(20, 9.5, 1.3, '#C8102E'), star(26, 9, 1.3, '#C8102E'), star(23, 16, 1.4, '#C8102E')];
    },
    CH: function () { return [rect(0, 0, 30, 20, '#DA291C'), rect(13, 4, 4, 12, '#fff'), rect(9, 8, 12, 4, '#fff')]; },
    XX: function () {
      return [rect(0, 0, 30, 20, '#e6e9ec'), node('circle', { cx: 15, cy: 10, r: 6.5, fill: 'none', stroke: '#5b6670', 'stroke-width': 1.1 }),
        node('path', { d: 'M8.5,10 H21.5 M15,3.5 C12,6.5 12,13.5 15,16.5 M15,3.5 C18,6.5 18,13.5 15,16.5', stroke: '#5b6670', 'stroke-width': 0.9, fill: 'none' })];
    }
  };

  /** Cria o SVG da bandeira (decorativo). */
  function svg(code, cls) {
    var draw = DRAW[code] || DRAW.XX;
    var s = node('svg', { viewBox: '0 0 30 20', class: 'flag' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true', focusable: 'false' });
    draw().forEach(function (p) { s.appendChild(p); });
    s.appendChild(node('rect', { x: 0.25, y: 0.25, width: 29.5, height: 19.5, fill: 'none', stroke: 'rgba(0,0,0,.18)', 'stroke-width': 0.5 }));
    return s;
  }

  CM.flags = { svg: svg, has: function (c) { return !!DRAW[c]; } };
})();
