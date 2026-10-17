/* ==========================================================================
   CM Studio — i18n/registry.js
   Registro dos dicionários de IDIOMA DO DOCUMENTO.

   Importante: a interface do CM Studio permanece em português brasileiro.
   Estes dicionários traduzem o que vai IMPRESSO no currículo e nas cartas:
   títulos de seções, rótulos de contato, "Atual", níveis de idioma,
   numeração de páginas, saudações de cartas etc.

   Cada idioma é registrado com:
     CM.i18n.register('xx-YY', { meta, titles, labels, levels, status, docTitles, letter })
   Variantes regionais podem herdar de outro idioma:
     CM.i18n.derive('en-CA', 'en-US', { meta, titles: {...} }, transformFn)
   Chaves ausentes são buscadas no idioma-base e, por fim, no inglês (en-US).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var RAW = {};
  var CACHE = {};
  var ORDER = [];
  var FALLBACK = 'en-US';
  var GROUPS = ['titles', 'labels', 'levels', 'status', 'docTitles', 'letter'];

  function register(code, dict) {
    RAW[code] = dict;
    if (ORDER.indexOf(code) === -1) ORDER.push(code);
    CACHE = {};
  }

  /** Registra uma variante regional que herda de `base`. */
  function derive(code, base, overrides, transform) {
    var d = overrides || {};
    d.base = base;
    if (typeof transform === 'function') d.transform = transform;
    register(code, d);
  }

  function mergeInto(target, source) {
    GROUPS.forEach(function (g) {
      if (!source[g]) return;
      target[g] = target[g] || {};
      Object.keys(source[g]).forEach(function (k) {
        if (target[g][k] == null) target[g][k] = source[g][k];
      });
    });
  }

  /** Dicionário completo (com herança resolvida) de um idioma. */
  function get(code) {
    if (!RAW[code]) code = FALLBACK;
    if (CACHE[code]) return CACHE[code];
    var chain = [];
    var cur = code;
    var guard = 0;
    while (cur && RAW[cur] && guard++ < 5) {
      chain.push(cur);
      cur = RAW[cur].base;
    }
    var out = { code: code, meta: Object.assign({}, RAW[code].meta || {}) };
    GROUPS.forEach(function (g) { out[g] = {}; });
    chain.forEach(function (c) {
      var src = RAW[c];
      var copy = {};
      GROUPS.forEach(function (g) {
        if (!src[g]) return;
        copy[g] = {};
        Object.keys(src[g]).forEach(function (k) {
          var v = src[g][k];
          // Transformação regional (ex.: alemão suíço sem "ß") só sobre textos herdados
          if (c !== code && RAW[code].transform && typeof v === 'string') v = RAW[code].transform(v);
          copy[g][k] = v;
        });
      });
      mergeInto(out, copy);
      if (!out.meta.dateStyle && src.meta && src.meta.dateStyle) out.meta.dateStyle = src.meta.dateStyle;
      if (!out.meta.intl && src.meta && src.meta.intl) out.meta.intl = src.meta.intl;
      if (out.meta.suggestions == null && src.meta && src.meta.suggestions) out.meta.suggestions = src.meta.suggestions;
    });
    if (code !== FALLBACK && RAW[FALLBACK]) mergeInto(out, RAW[FALLBACK]);
    out.meta.intl = out.meta.intl || code;
    CACHE[code] = out;
    return out;
  }

  function has(code) { return !!RAW[code]; }

  function list() {
    return ORDER.map(function (c) {
      var d = get(c);
      return { code: c, name: d.meta.name || c, nativeName: d.meta.nativeName || c, completeness: completeness(c) };
    });
  }

  /**
   * Grau de cobertura de um idioma:
   * - document: 'full' quando todos os títulos e rótulos do idioma de referência existem
   *   no próprio idioma ou no seu idioma-base (sem cair no inglês);
   * - suggestions: idioma das sugestões de texto disponíveis ('own', 'base' ou 'fallback').
   */
  function completeness(code) {
    var ref = RAW['pt-BR'];
    if (!ref || !RAW[code]) return { document: 'none', missing: [], suggestions: 'fallback' };
    var missing = [];
    ['titles', 'labels', 'levels', 'status', 'letter'].forEach(function (g) {
      Object.keys(ref[g] || {}).forEach(function (k) {
        var cur = code;
        var found = false;
        var guard = 0;
        while (cur && RAW[cur] && guard++ < 5) {
          if (RAW[cur][g] && RAW[cur][g][k] != null) { found = true; break; }
          cur = RAW[cur].base;
        }
        if (!found) missing.push(g + '.' + k);
      });
    });
    var sugg = (get(code).meta.suggestions) || 'fallback';
    return { document: missing.length ? 'partial' : 'full', missing: missing, suggestions: sugg };
  }

  /** Substitui {n}, {t} etc. em um texto. */
  function format(str, vars) {
    return String(str || '').replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : m;
    });
  }

  CM.i18n = {
    register: register,
    derive: derive,
    get: get,
    has: has,
    list: list,
    codes: function () { return ORDER.slice(); },
    completeness: completeness,
    format: format,
    FALLBACK: FALLBACK
  };
})();
