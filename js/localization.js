/* ==========================================================================
   CM Studio — localization.js
   Funções de apresentação dependentes do IDIOMA DO DOCUMENTO:
   - títulos de seções (com detecção de títulos padrão para retitulação segura);
   - datas e períodos ("03/2023" → "Mar 2023", "03.2023", "2023年3月");
   - níveis de idioma (valores salvos em pt-BR + níveis do QECR A1–C2);
   - rótulos (Atual, previsão, Página x de y...).

   Datas: o CM Studio guarda o texto exatamente como a pessoa digitou. Só
   reformatamos padrões inequívocos (MM/AAAA, mês abreviado em português +
   ano, ou apenas o ano). Qualquer outro texto é exibido sem alteração.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var I = CM.i18n;

  /* Estilo de data padrão por idioma. O perfil do país pode sobrepor. */
  var DATE_STYLE_BY_LOCALE = {
    'pt-BR': 'numeric-slash', 'pt-PT': 'numeric-slash', 'es-ES': 'numeric-slash', 'it-IT': 'numeric-slash',
    'it-CH': 'numeric-dot', 'fr-FR': 'numeric-slash', 'fr-CA': 'month-short', 'fr-CH': 'numeric-dot',
    'de-DE': 'numeric-dot', 'de-CH': 'numeric-dot',
    'en-US': 'month-short', 'en-GB': 'month-short', 'en-CA': 'month-short', 'en-AU': 'month-short',
    'en-IE': 'month-short', 'en-NZ': 'month-short', 'nl-NL': 'month-short', 'ja-JP': 'ja'
  };

  var DATE_STYLES = {
    'numeric-slash': 'MM/AAAA (ex.: 03/2023)',
    'numeric-dot': 'MM.AAAA (ex.: 03.2023)',
    'month-short': 'Mês abreviado e ano (ex.: Mar 2023)',
    'ja': 'Ano e mês japoneses (ex.: 2023年3月)'
  };

  var PT_MONTHS = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

  function dict(locale) { return I.get(locale || 'pt-BR'); }

  function label(key, locale, vars) {
    var d = dict(locale);
    var v = d.labels[key];
    if (v == null) v = key;
    return vars ? I.format(v, vars) : v;
  }

  function dateStyleFor(locale, override) {
    if (override && DATE_STYLES[override]) return override;
    return DATE_STYLE_BY_LOCALE[locale] || 'numeric-slash';
  }

  /** Interpreta um texto de data. Retorna {y, m|null} ou null se não for inequívoco. */
  function parseDate(str) {
    if (U.isBlank(str)) return null;
    var s = String(str).trim();
    var m = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
    if (m) {
      var mo = parseInt(m[1], 10);
      if (mo >= 1 && mo <= 12) return { y: parseInt(m[2], 10), m: mo };
      return null;
    }
    m = s.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})$/);
    if (m) {
      var mo2 = parseInt(m[2], 10);
      if (mo2 >= 1 && mo2 <= 12) return { y: parseInt(m[1], 10), m: mo2 };
      return null;
    }
    m = s.toLowerCase().match(/^([a-zç]{3})[a-zç]*\.?\s*(?:de\s+)?[\/\-.\s]?\s*(\d{4})$/);
    if (m && PT_MONTHS[m[1]]) return { y: parseInt(m[2], 10), m: PT_MONTHS[m[1]] };
    m = s.match(/^(\d{4})$/);
    if (m) return { y: parseInt(m[1], 10), m: null };
    return null;
  }

  var monthFmtCache = {};
  function monthShort(intl, month) {
    var key = intl + '|' + month;
    if (monthFmtCache[key]) return monthFmtCache[key];
    var out;
    try {
      out = new Intl.DateTimeFormat(intl, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, month - 1, 15)));
    } catch (e) {
      out = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
    }
    // Em alguns idiomas o Intl devolve minúsculas com ponto ("mars", "sept."); capitalizamos.
    out = out.charAt(0).toUpperCase() + out.slice(1);
    monthFmtCache[key] = out;
    return out;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /** Formata UMA data conforme o idioma. Textos não reconhecidos voltam intactos. */
  function formatDate(str, locale, styleOverride) {
    if (U.isBlank(str)) return '';
    var p = parseDate(str);
    if (!p) return String(str).trim();
    var style = dateStyleFor(locale, styleOverride);
    if (style === 'ja') return p.m ? p.y + '年' + p.m + '月' : p.y + '年';
    if (!p.m) return String(p.y);
    if (style === 'numeric-dot') return pad(p.m) + '.' + p.y;
    if (style === 'month-short') return monthShort(dict(locale).meta.intl || locale, p.m) + ' ' + p.y;
    return pad(p.m) + '/' + p.y;
  }

  function separator(locale) { return locale === 'ja-JP' ? ' ～ ' : ' – '; }

  /** Período início–fim (ou "Atual"). */
  function formatRange(start, end, current, locale, styleOverride) {
    var s = formatDate(start, locale, styleOverride);
    var e = current ? label('present', locale) : formatDate(end, locale, styleOverride);
    if (s && e) return s + separator(locale) + e;
    return s || e;
  }

  /** Período de formação com situação (cursando, trancado...). */
  function educationWhen(it, locale, styleOverride) {
    var d = dict(locale);
    var s = formatDate(it.start, locale, styleOverride);
    var e = formatDate(it.end, locale, styleOverride);
    var sep = separator(locale);
    var r = s && e ? s + sep + e : (s || e);
    switch (it.status) {
      case 'cursando':
        if (e) {
          if (locale === 'ja-JP') return (s ? s + sep : '') + e + d.labels.expected;
          return (s ? s + sep : '') + d.labels.expected + ': ' + e;
        }
        return (s ? s + sep : '') + d.labels.inProgress;
      case 'trancado': return (r ? r + ' · ' : '') + d.status.trancado;
      case 'interrompido': return (r ? r + ' · ' : '') + d.status.interrompido;
      default: return r;
    }
  }

  /* ---------------- Níveis de idioma ----------------
     Valores salvos (compatíveis com a versão 1): 'Básico', 'Intermediário',
     'Avançado', 'Fluente', 'Nativo'. Também aceitamos os níveis do QECR
     (A1–C2), que são exibidos sem tradução por serem um padrão europeu. */
  var LEVEL_KEYS = { 'Básico': 'basic', 'Intermediário': 'intermediate', 'Avançado': 'advanced', 'Fluente': 'fluent', 'Nativo': 'native' };
  var CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  function levelLabel(value, locale) {
    if (U.isBlank(value)) return '';
    var v = String(value).trim();
    if (CEFR.indexOf(v.toUpperCase()) !== -1) return v.toUpperCase();
    var key = LEVEL_KEYS[v];
    if (!key) return v; // texto livre (importado de outra versão): exibe como está
    return dict(locale).levels[key] || v;
  }

  /* ---------------- Títulos de seções ---------------- */
  function sectionTitle(key, locale) {
    if (!key) return '';
    var d = dict(locale);
    return d.titles[key] || '';
  }

  /** Procura qual chave de título corresponde a um texto, em um idioma (ou em todos). */
  function findTitleKey(title, locale) {
    if (U.isBlank(title)) return null;
    var t = String(title).trim().toLowerCase();
    var codes = locale ? [locale] : I.codes();
    for (var i = 0; i < codes.length; i++) {
      var titles = dict(codes[i]).titles;
      var keys = Object.keys(titles);
      for (var j = 0; j < keys.length; j++) {
        if (String(titles[keys[j]]).toLowerCase() === t) return keys[j];
      }
    }
    return null;
  }

  /**
   * Ao trocar o idioma do documento, retitula SOMENTE as seções cujo título
   * ainda é o padrão do idioma anterior. Títulos personalizados pela pessoa
   * são preservados. Retorna quantas seções foram retituladas.
   */
  function retitleSections(doc, fromLocale, toLocale) {
    var changed = 0;
    var kept = [];
    (doc.sections || []).forEach(function (sec) {
      var key = sec.titleKey || null;
      if (!key) return;
      var oldDefault = sectionTitle(key, fromLocale);
      var current = String(sec.title || '').trim();
      if (current === '' || current === oldDefault) {
        var next = sectionTitle(key, toLocale);
        if (next && next !== current) { sec.title = next; changed++; }
      } else {
        kept.push(current);
      }
    });
    return { changed: changed, kept: kept };
  }

  /** Nome legível do idioma (para a interface em pt-BR). */
  function localeName(code) {
    if (!I.has(code)) return code;
    return dict(code).meta.name || code;
  }

  /** Título do documento. 履歴書 e 職務経歴書 são nomes próprios japoneses: sem tradução, usa-se o original. */
  function docTitle(key, locale) {
    var v = dict(locale).docTitles[key];
    if (!v && (key === 'rirekisho' || key === 'shokumu') && I.has('ja-JP')) v = dict('ja-JP').docTitles[key];
    return v || '';
  }

  function pageLabel(n, t, locale) { return label('page', locale, { n: n, t: t }); }

  CM.l10n = {
    DATE_STYLES: DATE_STYLES,
    CEFR: CEFR,
    label: label,
    dict: dict,
    dateStyleFor: dateStyleFor,
    parseDate: parseDate,
    formatDate: formatDate,
    formatRange: formatRange,
    educationWhen: educationWhen,
    separator: separator,
    levelLabel: levelLabel,
    sectionTitle: sectionTitle,
    findTitleKey: findTitleKey,
    retitleSections: retitleSections,
    localeName: localeName,
    docTitle: docTitle,
    pageLabel: pageLabel
  };
})();
