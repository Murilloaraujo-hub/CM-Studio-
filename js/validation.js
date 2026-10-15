/* ==========================================================================
   CM Studio — validation.js
   Validação de e-mails, URLs e telefones; limpeza (sanitização) de
   documentos importados; e revisão do currículo (lista de avisos).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;

  var MAX_TEXT = 5000;      // limite por campo de texto longo
  var MAX_SHORT = 300;      // limite por campo curto
  var MAX_ITEMS = 200;      // limite de itens por seção
  var MAX_SECTIONS = 80;    // limite de seções por documento
  var MAX_TAGS = 150;

  var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-zA-Z]{2,}$/;

  function isValidEmail(value) {
    if (U.isBlank(value)) return true; // campo opcional
    return EMAIL_RE.test(String(value).trim());
  }

  /** Normaliza um endereço: aceita "github.com/x" e acrescenta https://. */
  function normalizeUrl(value) {
    if (U.isBlank(value)) return '';
    var v = String(value).trim();
    if (/^\/\//.test(v)) v = 'https:' + v;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) v = 'https://' + v;
    return v;
  }

  /** Retorna a URL segura (http/https/mailto) ou '' se for inválida/perigosa. */
  function safeUrl(value) {
    var v = normalizeUrl(value);
    if (!v) return '';
    try {
      var u = new URL(v);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      if (!u.hostname || u.hostname.indexOf('.') === -1) return '';
      if (/\s/.test(String(value).trim())) return '';
      return u.href;
    } catch (e) {
      return '';
    }
  }

  function isValidUrl(value) {
    if (U.isBlank(value)) return true;
    return safeUrl(value) !== '';
  }

  /** Remove o protocolo para exibição: "https://github.com/x/" -> "github.com/x". */
  function displayUrl(value) {
    var safe = safeUrl(value);
    if (!safe) return String(value || '').trim();
    return safe.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }

  function isValidPhone(value) {
    if (U.isBlank(value)) return true;
    var digits = String(value).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 && /^[\d\s()+\-.]+$/.test(String(value).trim());
  }

  /** Valida um campo pelo tipo; devolve mensagem de erro ou ''. */
  function fieldError(type, value) {
    if (type === 'email' && !isValidEmail(value)) return 'E-mail inválido. Exemplo de formato: nome@exemplo.com';
    if (type === 'url' && !isValidUrl(value)) return 'Endereço inválido. Use um link completo, como https://site.com';
    if (type === 'tel' && !isValidPhone(value)) return 'Telefone parece incompleto. Use apenas números, espaços, parênteses e hífen.';
    return '';
  }

  /* ---------------- Sanitização de documentos importados ----------------
     Constrói um documento NOVO apenas com campos conhecidos, convertendo
     tudo para texto. Nada do arquivo importado é executado ou inserido
     como HTML. */
  function str(v, max) {
    if (v == null) return '';
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') return '';
    return String(v).replace(/\u0000/g, '').slice(0, max || MAX_SHORT);
  }

  function sanitizeSection(raw, warnings) {
    if (!raw || typeof raw !== 'object') return null;
    var kind = C.KINDS[raw.kind] ? raw.kind : 'custom';
    if (kind !== raw.kind) warnings.push('Uma seção de tipo desconhecido foi convertida em "Seção personalizada".');
    var schema = C.getSchema(kind);
    var sec = {
      id: str(raw.id, 60) || U.uid('sec'),
      kind: kind,
      title: str(raw.title, 120) || C.getKind(kind).title,
      visible: raw.visible !== false
    };
    if (schema.kind === 'text') {
      sec.content = str(raw.content, MAX_TEXT);
    } else if (schema.kind === 'tags') {
      sec.tags = (Array.isArray(raw.tags) ? raw.tags : [])
        .map(function (t) { return str(t, 120).trim(); })
        .filter(Boolean).slice(0, MAX_TAGS);
    } else {
      var fields = C.fieldsFor(kind);
      sec.items = (Array.isArray(raw.items) ? raw.items : []).slice(0, MAX_ITEMS)
        .filter(function (it) { return it && typeof it === 'object'; })
        .map(function (it) {
          var item = { id: str(it.id, 60) || U.uid('it') };
          fields.forEach(function (f) {
            if (f.type === 'checkbox') item[f.key] = it[f.key] === true;
            else if (f.type === 'textarea') item[f.key] = str(it[f.key], MAX_TEXT);
            else if (f.type === 'select') {
              var val = str(it[f.key], 60);
              var allowed = (f.options || []).some(function (o) { return o.value === val; });
              item[f.key] = allowed ? val : '';
            } else item[f.key] = str(it[f.key], MAX_SHORT);
          });
          return item;
        });
    }
    return sec;
  }

  function sanitizeDocument(raw) {
    var warnings = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { doc: null, warnings: ['Documento inválido.'] };
    }
    if (!Array.isArray(raw.sections)) {
      return { doc: null, warnings: ['Documento sem a lista de seções.'] };
    }
    var templateIds = CM.templates ? CM.templates.ids() : [];
    var personal = {};
    var rawPersonal = raw.personal && typeof raw.personal === 'object' ? raw.personal : {};
    C.PERSONAL_FIELDS.forEach(function (f) { personal[f.key] = str(rawPersonal[f.key], MAX_SHORT); });

    var design = raw.design && typeof raw.design === 'object' ? raw.design : {};
    var doc = {
      id: str(raw.id, 60) || U.uid('doc'),
      schemaVersion: 1,
      name: str(raw.name, 120) || 'Currículo importado',
      type: C.TYPES[raw.type] ? raw.type : 'custom',
      template: templateIds.indexOf(raw.template) !== -1 ? raw.template : 'classic',
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
      design: {
        accent: CM.templates && CM.templates.ACCENTS[design.accent] ? design.accent : 'teal',
        fontScale: ['small', 'normal', 'large'].indexOf(design.fontScale) !== -1 ? design.fontScale : 'normal',
        density: ['compact', 'normal', 'relaxed'].indexOf(design.density) !== -1 ? design.density : 'normal',
        pageNumbers: design.pageNumbers !== false
      },
      personal: personal,
      sections: raw.sections.slice(0, MAX_SECTIONS)
        .map(function (s) { return sanitizeSection(s, warnings); })
        .filter(Boolean)
    };
    // Garante IDs de seção únicos dentro do documento
    var seen = {};
    doc.sections.forEach(function (s) {
      if (seen[s.id]) s.id = U.uid('sec');
      seen[s.id] = true;
    });
    return { doc: doc, warnings: warnings };
  }

  /* ---------------- Revisão do currículo ----------------
     Devolve uma lista de avisos { level: 'error'|'warning'|'info', text, target } */
  function reviewDocument(doc, pageCount) {
    var out = [];
    var p = doc.personal || {};
    var type = C.TYPES[doc.type] || C.TYPES.custom;

    if (U.isBlank(p.fullName)) out.push({ level: 'warning', text: 'Informe seu nome completo.', target: 'p:fullName' });
    if (U.isBlank(p.email) && U.isBlank(p.phone)) {
      out.push({ level: 'warning', text: 'Adicione pelo menos uma forma de contato (e-mail ou telefone).', target: 'p:email' });
    }
    if (!isValidEmail(p.email)) out.push({ level: 'error', text: 'O e-mail informado parece inválido.', target: 'p:email' });
    if (!isValidPhone(p.phone)) out.push({ level: 'warning', text: 'O telefone informado parece incompleto.', target: 'p:phone' });
    ['linkedin', 'github', 'website'].forEach(function (k) {
      if (!isValidUrl(p[k])) out.push({ level: 'error', text: 'O link em "' + labelFor(k) + '" é inválido e não aparecerá como link.', target: 'p:' + k });
    });

    var placeholderFound = false;
    var hasAnySection = false;
    doc.sections.forEach(function (sec) {
      var has = C.sectionHasContent(sec);
      if (has && sec.visible) hasAnySection = true;
      if (sec.kind === 'summary' && !has) {
        out.push({ level: 'info', text: 'A seção "' + sec.title + '" está vazia. Um texto curto ajuda a apresentar você.', target: 's:' + sec.id });
      } else if (!has) {
        out.push({ level: 'info', text: 'A seção "' + sec.title + '" está vazia e não aparecerá no currículo.', target: 's:' + sec.id });
      } else if (!sec.visible) {
        out.push({ level: 'info', text: 'A seção "' + sec.title + '" está oculta e não aparecerá no currículo.', target: 's:' + sec.id });
      }
      var texts = [];
      if (sec.content) texts.push(sec.content);
      (sec.items || []).forEach(function (it) {
        var fields = C.fieldsFor(sec.kind);
        fields.forEach(function (f) {
          if (f.type === 'url' && !isValidUrl(it[f.key])) {
            out.push({ level: 'error', text: 'Há um link inválido em "' + sec.title + '".', target: 'i:' + sec.id + ':' + it.id + ':' + f.key });
          }
          if (typeof it[f.key] === 'string') texts.push(it[f.key]);
        });
        var schema = C.getSchema(sec.kind);
        var titleKey = schema.titleKeys && schema.titleKeys[0];
        if (titleKey && C.itemHasContent(it, sec.kind) && U.isBlank(it[titleKey])) {
          out.push({ level: 'warning', text: 'Um item em "' + sec.title + '" está sem o campo "' + fieldLabel(sec.kind, titleKey) + '".', target: 'i:' + sec.id + ':' + it.id + ':' + titleKey });
        }
      });
      (sec.tags || []).forEach(function (t) { texts.push(t); });
      if (texts.some(function (t) { return /\[[^\]]{2,}\]/.test(t); })) placeholderFound = true;
    });

    if (placeholderFound) {
      out.push({ level: 'warning', text: 'Há trechos entre [colchetes] vindos de exemplos. Substitua-os por informações reais ou apague-os.' });
    }
    if (!hasAnySection) {
      out.push({ level: 'info', text: 'Preencha pelo menos uma seção para que o currículo tenha conteúdo.' });
    }
    if (type.maxPages && pageCount > type.maxPages) {
      out.push({
        level: 'warning',
        text: 'O currículo tem ' + pageCount + ' páginas. Para "' + type.short + '", o recomendado é até ' +
          U.plural(type.maxPages, 'página', 'páginas') + '. Tente resumir descrições, usar o espaçamento compacto ou remover seções menos relevantes.'
      });
    } else if (!type.maxPages && pageCount > 4) {
      out.push({ level: 'info', text: 'O currículo está longo (' + pageCount + ' páginas). Verifique se todas as informações são relevantes.' });
    }
    return out;
  }

  function labelFor(key) {
    var f = C.PERSONAL_FIELDS.filter(function (x) { return x.key === key; })[0];
    return f ? f.label : key;
  }

  function fieldLabel(kind, key) {
    var f = C.fieldsFor(kind).filter(function (x) { return x.key === key; })[0];
    return f ? f.label : key;
  }

  CM.validation = {
    isValidEmail: isValidEmail,
    isValidUrl: isValidUrl,
    isValidPhone: isValidPhone,
    normalizeUrl: normalizeUrl,
    safeUrl: safeUrl,
    displayUrl: displayUrl,
    fieldError: fieldError,
    sanitizeDocument: sanitizeDocument,
    reviewDocument: reviewDocument,
    LIMITS: { MAX_TEXT: MAX_TEXT, MAX_SHORT: MAX_SHORT, MAX_ITEMS: MAX_ITEMS, MAX_SECTIONS: MAX_SECTIONS }
  };
})();
