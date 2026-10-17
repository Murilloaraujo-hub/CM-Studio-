/* ==========================================================================
   CM Studio — i18n/ui-core.js
   Motor de tradução da INTERFACE (separado dos dicionários do documento).

   Convenção (estilo gettext): a chave de cada mensagem é o próprio texto em
   português do Brasil, que é o idioma-fonte. Assim nenhuma "chave técnica"
   (ex.: editor.save.button) pode aparecer na tela: no pior caso aparece o
   texto-fonte. Variáveis usam {0}, {1}… (posicionais) ou {nome}.

     CM.t('Salvar agora')                       → "Save now" (en-US)
     CM.t('Tipo alterado para "{0}".', [label]) → 'Type changed to "…".'
     CM.uiLang.plural(n, 'item', 'itens')        → "3 items" / "3 件"

   Cadeia de fallback de uma mensagem:
     idioma ativo → idioma-base (en-GB → en-US; de-CH → de-DE…) →
     inglês (en-US) para idiomas não portugueses → texto-fonte (pt-BR).
   Toda mensagem que cair no fallback é registrada em CM.uiLang.missing e
   pode ser listada com CM.uiLang.report(). Com localStorage
   'cmstudio.debug' = '1', cada falta também gera um aviso no console.

   Dicionários: js/i18n/ui/<idioma>.js chamam CM.uiLang.register(code, dict, opts).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var SOURCE = 'pt-BR';
  var FALLBACK = 'en-US';
  var DICTS = {};        // code -> { dict, base, transform, meta }
  var CACHE = {};        // code -> { msg -> tradução resolvida | null }
  var current = SOURCE;
  var listeners = [];
  var missing = {};      // code -> { msg: true }
  var debug = false;
  try { debug = window.localStorage && localStorage.getItem('cmstudio.debug') === '1'; } catch (e) { /* sem acesso */ }

  /* Nome de cada idioma no próprio idioma (endônimo): usado nos seletores. */
  var ENDONYMS = {
    'pt-BR': 'Português (Brasil)', 'pt-PT': 'Português (Portugal)',
    'en-US': 'English (United States)', 'en-GB': 'English (United Kingdom)', 'en-CA': 'English (Canada)',
    'en-AU': 'English (Australia)', 'en-IE': 'English (Ireland)', 'en-NZ': 'English (New Zealand)',
    'de-DE': 'Deutsch (Deutschland)', 'de-CH': 'Deutsch (Schweiz)',
    'fr-FR': 'Français (France)', 'fr-CA': 'Français (Canada)', 'fr-CH': 'Français (Suisse)',
    'es-ES': 'Español (España)', 'it-IT': 'Italiano (Italia)', 'it-CH': 'Italiano (Svizzera)',
    'nl-NL': 'Nederlands (Nederland)', 'ja-JP': '日本語'
  };

  function register(code, dict, opts) {
    opts = opts || {};
    DICTS[code] = { dict: dict || {}, base: opts.base || null, transform: opts.transform || null, meta: opts.meta || {} };
    CACHE = {};
  }

  function has(code) { return code === SOURCE || !!DICTS[code]; }
  function codes() {
    var all = [SOURCE].concat(Object.keys(DICTS).filter(function (c) { return c !== SOURCE; }));
    var order = Object.keys(ENDONYMS);
    return all.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
  }
  function endonym(code) { return ENDONYMS[code] || code; }

  /** Situação da tradução: 'source' | 'complete' | 'partial' | 'adapted' | 'missing'. */
  function status(code, guard) {
    if (code === SOURCE) return 'source';
    var d = DICTS[code];
    if (!d || (guard || 0) > 5) return 'missing';
    if (d.meta.adapted) return 'adapted';
    if (d.meta.complete) return 'complete';
    if (d.base) { var b = status(d.base, (guard || 0) + 1); return b === 'source' ? 'adapted' : b; }
    return 'partial';
  }
  /** Cobertura gravada na geração do dicionário: {translated, total} (variantes herdam da base). */
  function coverage(code, guard) {
    var d = DICTS[code];
    if (!d || (guard || 0) > 5) return null;
    if (d.meta.total) return { translated: d.meta.translated || 0, total: d.meta.total };
    return d.base ? coverage(d.base, (guard || 0) + 1) : null;
  }
  function baseOf(code) { var d = DICTS[code]; return d ? d.base : null; }
  function langOf(code) { return String(code || '').slice(0, 2); }

  /** Procura a tradução de `msg` em `code`, seguindo a herança. null = não encontrada. */
  function lookup(code, msg, guard) {
    guard = guard || 0;
    if (guard > 5) return null;
    if (code === SOURCE) return msg;
    var d = DICTS[code];
    if (!d) return null;
    if (Object.prototype.hasOwnProperty.call(d.dict, msg)) return d.dict[msg];
    if (d.base) {
      var inherited = lookup(d.base, msg, guard + 1);
      if (inherited != null) return d.transform ? d.transform(inherited, msg) : inherited;
    }
    return null;
  }

  function resolve(msg) {
    var c = current;
    var cache = CACHE[c] || (CACHE[c] = {});
    if (Object.prototype.hasOwnProperty.call(cache, msg)) return cache[msg];
    var v = lookup(c, msg);
    if (v == null) {
      (missing[c] = missing[c] || {})[msg] = true;
      if (debug && window.console) console.warn('[CM i18n] sem tradução (' + c + '): ' + msg);
      // Português europeu nunca cai no inglês; os demais idiomas preferem o inglês ao português.
      if (langOf(c) !== 'pt' && c !== FALLBACK) v = lookup(FALLBACK, msg);
      if (v == null) v = msg;
    }
    cache[msg] = v;
    return v;
  }

  function format(str, args) {
    if (args == null) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      var v = Array.isArray(args) ? args[+k] : args[k];
      return v != null ? String(v) : m;
    });
  }

  /** Traduz uma mensagem da interface. Valores não textuais são devolvidos como estão. */
  function t(msg, args) {
    if (typeof msg !== 'string' || !msg) return msg;
    return format(resolve(msg), args);
  }

  /** "3 itens" — formas traduzidas separadamente e escolhidas por Intl.PluralRules. */
  function plural(n, one, other, opts) {
    var rule = 'other';
    try { rule = new Intl.PluralRules(current).select(n); } catch (e) { rule = n === 1 ? 'one' : 'other'; }
    var word = t(rule === 'one' ? one : other);
    var num = (opts && opts.raw) ? String(n) : formatNumber(n);
    // Em japonês o contador vem colado ao número (ex.: "3件")
    return langOf(current) === 'ja' ? num + word : num + ' ' + word;
  }

  function formatNumber(n, opts) {
    try { return new Intl.NumberFormat(current, opts).format(n); } catch (e) { return String(n); }
  }
  function formatDate(ts, opts) {
    try { return new Intl.DateTimeFormat(current, opts || { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts)); }
    catch (e) { return new Date(ts).toISOString().slice(0, 10); }
  }

  /* ---------------- Idioma ativo ---------------- */
  function getCurrent() { return current; }

  /**
   * Ativa um idioma de interface (sem recarregar a página). Atualiza lang/dir
   * do documento, reaplica os textos estáticos e avisa os ouvintes, que
   * redesenham a tela atual.
   */
  function set(code, opts) {
    if (!has(code)) code = SOURCE;
    var prev = current;
    current = code;
    var root = document.documentElement;
    root.setAttribute('lang', code);
    root.setAttribute('dir', (DICTS[code] && DICTS[code].meta.dir) || 'ltr');
    root.setAttribute('data-ui-lang', langOf(code));
    localizeTrees();
    applyStatic();
    if (prev !== code || (opts && opts.force)) {
      listeners.forEach(function (fn) { try { fn(code, prev, opts || {}); } catch (e) { if (window.console) console.error(e); } });
    }
    return code;
  }
  function onChange(fn) { listeners.push(fn); }

  /* ---------------- Estruturas de dados (tipos, seções, modelos, países…) ---------------- */
  // Guarda os textos originais (pt-BR) das estruturas registradas e os troca
  // pela tradução sempre que o idioma muda. Só textos presentes nos dicionários
  // mudam; identificadores e códigos permanecem como estão.
  var TREES = [];
  // Chaves cujos valores nunca são traduzidos (identificadores, valores salvos, nomes locais).
  var SKIP_KEYS = {};
  ('id code kind key type schema layout icon value url accessed verifiedAt policy tone base intl dateStyle paper ' +
   'suggest tagsKey contactStyle titleKey docTitleKey locale accent defaultLanguage aliases nameLocal width group ' +
   'summaryKey autocomplete prefix side mode dateLayout tagStyle').split(' ').forEach(function (k) { SKIP_KEYS[k] = 1; });

  function looksTechnical(v) {
    return /^[a-z][A-Za-z0-9_]*$/.test(v) || /^[A-Z0-9_\-]+$/.test(v) || /^[a-z]{2}-[A-Z]{2}$/.test(v) ||
      /^(https?:|mailto:|#|\+)/.test(v) ||
      // começa com número e não tem frase (ex.: "2024", "10 MB"); "1º parágrafo: …" é texto
      (/^\d/.test(v) && !/[A-Za-zÀ-ÿ\u3040-\u30ff\u4e00-\u9fff]{3,}\s+\S/.test(v));
  }

  function captureTree(obj, out, depth, skip) {
    if (!obj || typeof obj !== 'object' || depth > 8) return;
    Object.keys(obj).forEach(function (k) {
      if (SKIP_KEYS[k] || (skip && skip[k])) return;
      var v = obj[k];
      if (typeof v === 'string') {
        if (/[A-Za-zÀ-ÿ\u3040-\u30ff\u4e00-\u9fff]/.test(v) && !looksTechnical(v)) out.push({ o: obj, k: k, src: v });
      } else if (v && typeof v === 'object') {
        captureTree(v, out, depth + 1, skip);
      }
    });
  }
  /**
   * Registra uma estrutura de dados com textos de interface (tipos de
   * currículo, seções, modelos, perfis de países…). Os textos originais são
   * guardados e retraduzidos a cada troca de idioma. opts.skip: chaves extras a ignorar.
   */
  function registerTree(obj, opts) {
    var skip = null;
    if (opts && opts.skip) { skip = {}; opts.skip.forEach(function (k) { skip[k] = 1; }); }
    var entries = [];
    captureTree(obj, entries, 0, skip);
    TREES.push(entries);
    if (current !== SOURCE) entries.forEach(function (e) { e.o[e.k] = t(e.src); });
    return obj;
  }
  function localizeTrees() {
    TREES.forEach(function (entries) { entries.forEach(function (e) { e.o[e.k] = t(e.src); }); });
  }
  function treeMessages() {
    var out = [];
    TREES.forEach(function (entries) { entries.forEach(function (e) { out.push(e.src); }); });
    return out;
  }

  /* ---------------- Textos estáticos do index.html ---------------- */
  // Registrados uma vez na inicialização. Elementos cujo conteúdo é só texto
  // com marcação simples (<strong>, <em>, <code>, <kbd>, <br>, <a href="#…">)
  // viram uma única mensagem, para que a ordem das palavras possa mudar.
  var INLINE = { STRONG: 1, EM: 1, B: 1, I: 1, CODE: 1, KBD: 1, BR: 1, A: 1, ABBR: 1, SMALL: 1 };
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, SVG: 1, TEMPLATE: 1, NOSCRIPT: 1 };
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'label'];
  var UNITS = [];
  var captured = false;

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  function serializeInline(el) {
    var out = '';
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += escapeHtml(n.nodeValue);
      else if (n.nodeType === 1) {
        var tag = n.tagName.toLowerCase();
        if (tag === 'br') { out += '<br>'; return; }
        var attrs = '';
        if (tag === 'a' && n.getAttribute('href')) attrs = ' href="' + escapeHtml(n.getAttribute('href')) + '"';
        out += '<' + tag + attrs + '>' + serializeInline(n) + '</' + tag + '>';
      }
    });
    return out;
  }
  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // Só vira mensagem única se TODOS os elementos internos forem marcação simples
  // sem atributos (exceto href em <a>), para não perder classes, ids ou eventos.
  function isInlineOnly(el) {
    var all = el.querySelectorAll('*');
    if (!all.length) return false;
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (!INLINE[n.tagName]) return false;
      for (var j = 0; j < n.attributes.length; j++) {
        if (!(n.tagName === 'A' && n.attributes[j].name === 'href')) return false;
      }
    }
    return /[A-Za-zÀ-ÿ]/.test(el.textContent);
  }

  function captureNode(el) {
    if (el.nodeType !== 1 || SKIP_TAGS[el.tagName] || el.hasAttribute('data-i18n-skip')) return;
    ATTRS.forEach(function (a) {
      var v = el.getAttribute(a);
      if (v && /[A-Za-zÀ-ÿ]/.test(v) && !(a === 'label' && el.tagName !== 'OPTGROUP' && el.tagName !== 'OPTION')) {
        UNITS.push({ kind: 'attr', node: el, attr: a, src: norm(v), last: v });
      }
    });
    if (isInlineOnly(el)) {
      var html = norm(serializeInline(el));
      UNITS.push({ kind: 'html', node: el, src: html, last: el.innerHTML });
      return;
    }
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3 && /[A-Za-zÀ-ÿ]/.test(n.nodeValue)) {
        var raw = n.nodeValue;
        var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
        UNITS.push({ kind: 'text', node: n, src: norm(raw), lead: lead, trail: trail, last: raw });
      } else if (n.nodeType === 1) captureNode(n);
    });
  }

  function captureStatic() {
    if (captured) return;
    captured = true;
    var title = document.querySelector('title');
    if (title) UNITS.push({ kind: 'title', node: title, src: norm(title.textContent), last: title.textContent });
    var desc = document.querySelector('meta[name="description"]');
    if (desc) UNITS.push({ kind: 'attr', node: desc, attr: 'content', src: norm(desc.getAttribute('content')), last: desc.getAttribute('content') });
    captureNode(document.body);
  }

  /** Insere HTML traduzido aceitando apenas a marcação simples permitida. */
  function setSafeHtml(el, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var frag = document.createDocumentFragment();
    (function copy(src, dst) {
      src.childNodes.forEach(function (n) {
        if (n.nodeType === 3) dst.appendChild(document.createTextNode(n.nodeValue));
        else if (n.nodeType === 1 && INLINE[n.tagName]) {
          var c = document.createElement(n.tagName.toLowerCase());
          if (n.tagName === 'A') {
            var href = n.getAttribute('href') || '';
            if (/^(#|https:\/\/)/.test(href)) c.setAttribute('href', href);
            if (/^https:/.test(href)) { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener noreferrer'); }
          }
          copy(n, c);
          dst.appendChild(c);
        } else if (n.nodeType === 1) copy(n, dst);
      });
    })(tpl.content, frag);
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
  }

  function applyStatic() {
    if (!captured) return;
    UNITS.forEach(function (u) {
      var tr = t(u.src);
      if (u.kind === 'text') {
        if (u.node.nodeValue !== u.last) return; // alterado por script: não sobrescreve
        u.last = u.lead + tr + u.trail;
        u.node.nodeValue = u.last;
      } else if (u.kind === 'attr') {
        if (u.node.getAttribute(u.attr) !== u.last) return;
        u.node.setAttribute(u.attr, tr);
        u.last = tr;
      } else if (u.kind === 'title') {
        u.node.textContent = tr; u.last = tr;
      } else if (u.kind === 'html') {
        if (u.node.innerHTML !== u.last) return;
        setSafeHtml(u.node, tr);
        u.last = u.node.innerHTML;
      }
    });
  }
  function staticMessages() { return UNITS.map(function (u) { return u.src; }); }

  /* ---------------- Mensagens usadas de forma dinâmica ---------------- */
  // Textos passados a CM.t por variável (ex.: títulos de página) são declarados
  // aqui para que a ferramenta de extração os encontre.
  var DECLARED = [];
  function declare(list) { (list || []).forEach(function (m) { if (typeof m === 'string') DECLARED.push(m); }); return list; }

  /* ---------------- Relatórios ---------------- */
  /** Mensagens conhecidas (estáticas + estruturas). As mensagens dos scripts vêm de docs/i18n/messages.json. */
  function knownMessages() {
    var seen = {}, out = [];
    staticMessages().concat(treeMessages()).concat(DECLARED).forEach(function (m) { if (!seen[m]) { seen[m] = 1; out.push(m); } });
    return out;
  }
  /** Mensagens sem tradução própria em `code` (sem contar o fallback). */
  function untranslated(code, messages) {
    return messages.filter(function (m) { return lookup(code, m) == null; });
  }
  function report() {
    var out = {};
    Object.keys(missing).forEach(function (c) { out[c] = Object.keys(missing[c]); });
    return out;
  }

  CM.uiLang = {
    SOURCE: SOURCE,
    FALLBACK: FALLBACK,
    register: register,
    has: has,
    codes: codes,
    endonym: endonym,
    status: status,
    coverage: coverage,
    baseOf: baseOf,
    current: getCurrent,
    set: set,
    onChange: onChange,
    t: t,
    plural: plural,
    format: format,
    formatNumber: formatNumber,
    formatDate: formatDate,
    registerTree: registerTree,
    declare: declare,
    captureStatic: captureStatic,
    applyStatic: applyStatic,
    knownMessages: knownMessages,
    untranslated: untranslated,
    lookup: lookup,
    report: report,
    missing: missing
  };
  CM.t = t;
})();
