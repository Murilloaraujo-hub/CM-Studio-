/* ==========================================================================
   CM Studio — utils.js
   Funções utilitárias compartilhadas por todos os módulos.
   O projeto usa scripts clássicos (sem módulos ES) para funcionar também
   quando o index.html é aberto diretamente do computador (file://).
   Todos os módulos são registrados no objeto global window.CM.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});

  /** Gera um identificador curto e único o suficiente para uso local. */
  function uid(prefix) {
    var rand = '';
    if (window.crypto && window.crypto.getRandomValues) {
      var arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      rand = arr[0].toString(36) + arr[1].toString(36);
    } else {
      rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
    return (prefix || 'id') + '_' + Date.now().toString(36) + rand.slice(0, 8);
  }

  /**
   * Cria um elemento DOM de forma segura.
   * Textos são sempre inseridos com textContent (nunca innerHTML),
   * evitando injeção de HTML a partir dos dados do usuário.
   *   el('div', { class: 'x', text: 'Olá', attrs: { 'aria-label': '...' } }, [filhos])
   */
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.id) node.id = opts.id;
    if (opts.type) node.type = opts.type;
    if (opts.html === true) throw new Error('innerHTML não é permitido em el()');
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) {
        var v = opts.attrs[k];
        if (v === false || v == null) return;
        node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    if (opts.dataset) {
      Object.keys(opts.dataset).forEach(function (k) {
        node.dataset[k] = opts.dataset[k];
      });
    }
    if (opts.on) {
      Object.keys(opts.on).forEach(function (evt) {
        node.addEventListener(evt, opts.on[evt]);
      });
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') {
        node.appendChild(document.createTextNode(String(c)));
      } else {
        node.appendChild(c);
      }
    });
  }

  /** Cria um ícone a partir do sprite SVG embutido no index.html. */
  function icon(name, extraClass) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon' + (extraClass ? ' ' + extraClass : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  /** Botão com ícone e nome acessível. */
  function iconButton(iconName, label, opts) {
    opts = opts || {};
    var btn = el('button', {
      class: 'btn-icon' + (opts.class ? ' ' + opts.class : ''),
      type: 'button',
      attrs: Object.assign({ 'aria-label': label, title: label }, opts.attrs || {}),
      dataset: opts.dataset,
      on: opts.on
    });
    btn.appendChild(icon(iconName));
    return btn;
  }

  function debounce(fn, wait) {
    var t = null;
    function debounced() {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(ctx, args); }, wait);
    }
    debounced.flush = function () {
      if (t) { clearTimeout(t); t = null; fn(); }
    };
    debounced.cancel = function () { clearTimeout(t); t = null; };
    return debounced;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function isBlank(v) {
    return v == null || String(v).trim() === '';
  }

  function uiLocale() { return (CM.uiLang && CM.uiLang.current()) || 'pt-BR'; }
  function tr(msg, args) { return CM.t ? CM.t(msg, args) : msg; }

  /** Formata data/hora no idioma da interface. */
  function formatDateTime(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString(uiLocale(), {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return new Date(ts).toISOString();
    }
  }

  /** "há 5 minutos", "ontem" etc. — via Intl.RelativeTimeFormat no idioma da interface. */
  function relativeTime(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    var min = Math.round(diff / 60000);
    if (min < 1) return tr('agora mesmo');
    var rtf = null;
    try { rtf = new Intl.RelativeTimeFormat(uiLocale(), { numeric: 'auto' }); } catch (e) { rtf = null; }
    var h = Math.round(min / 60);
    var d = Math.round(h / 24);
    if (rtf) {
      if (min < 60) return rtf.format(-min, 'minute');
      if (h < 24) return rtf.format(-h, 'hour');
      if (d < 30) return rtf.format(-d, 'day');
      return formatDateTime(ts);
    }
    if (min < 60) return 'há ' + min + (min === 1 ? ' minuto' : ' minutos');
    if (h < 24) return 'há ' + h + (h === 1 ? ' hora' : ' horas');
    if (d === 1) return 'ontem';
    if (d < 30) return 'há ' + d + ' dias';
    return formatDateTime(ts);
  }

  function todayStamp() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** Converte "03/2022", "2022", "mar/2022" em número comparável (AAAAMM). */
  function parsePeriod(str) {
    if (isBlank(str)) return null;
    var s = String(str).trim().toLowerCase();
    var months = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
    var m = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
    if (m) return parseInt(m[2], 10) * 100 + Math.min(12, parseInt(m[1], 10));
    m = s.match(/^([a-zç]{3})[a-zç]*\.?\s*(?:de\s*)?[\/\-.\s]?\s*(\d{4})$/);
    if (m && months[m[1]]) return parseInt(m[2], 10) * 100 + months[m[1]];
    m = s.match(/(\d{4})/);
    if (m) return parseInt(m[1], 10) * 100;
    return null;
  }

  /** Download de um arquivo gerado no navegador (Blob). */
  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  }

  /** Remove caracteres inválidos para nomes de arquivo. */
  function safeFileName(name) {
    var base = String(name || 'curriculo')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]+/g, '')
      .trim().replace(/\s+/g, '-').toLowerCase();
    return base.slice(0, 60) || 'curriculo';
  }

  /** "3 itens": as duas formas (em pt-BR) são traduzidas e escolhidas por Intl.PluralRules. */
  function plural(n, singular, pluralForm) {
    if (CM.uiLang) return CM.uiLang.plural(n, singular, pluralForm, { raw: true });
    return n + ' ' + (n === 1 ? singular : pluralForm);
  }

  CM.utils = {
    uid: uid,
    el: el,
    appendChildren: appendChildren,
    icon: icon,
    iconButton: iconButton,
    debounce: debounce,
    deepClone: deepClone,
    clear: clear,
    isBlank: isBlank,
    formatDateTime: formatDateTime,
    relativeTime: relativeTime,
    todayStamp: todayStamp,
    parsePeriod: parsePeriod,
    downloadFile: downloadFile,
    safeFileName: safeFileName,
    plural: plural
  };
})();
