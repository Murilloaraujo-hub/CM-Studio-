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
    if (type === 'email' && !isValidEmail(value)) return CM.t('E-mail inválido. Exemplo de formato: nome@exemplo.com');
    if (type === 'url' && !isValidUrl(value)) return CM.t('Endereço inválido. Use um link completo, como https://site.com');
    if (type === 'tel' && !isValidPhone(value)) return CM.t('Telefone parece incompleto. Use apenas números, espaços, parênteses e hífen.');
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

  /* Foto: apenas imagens PNG/JPEG/WebP embutidas (data URL base64), com tamanho limitado. */
  var MAX_PHOTO = 600000;
  var PHOTO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/]+=*$/;
  function safePhoto(v) {
    if (typeof v !== 'string' || !v) return '';
    if (v.length > MAX_PHOTO) return '';
    return PHOTO_RE.test(v) ? v : '';
  }

  function oneOf(v, list, def) { return list.indexOf(v) !== -1 ? v : def; }

  /** Chave de título (titleKey) válida? Precisa existir no dicionário de referência. */
  function validTitleKey(k) {
    return typeof k === 'string' && /^[A-Za-z]{2,40}$/.test(k) && !!(CM.l10n && CM.l10n.sectionTitle(k, 'pt-BR'));
  }

  /* Cartas e documentos complementares (cover letter, Anschreiben...). */
  var COMPANION_KINDS = ['cover', 'lettre', 'anschreiben', 'carta', 'project', 'publications', 'portfolio', 'references', 'criteria'];
  function sanitizeCompanion(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var r = raw.recipient && typeof raw.recipient === 'object' ? raw.recipient : {};
    var locale = CM.i18n && CM.i18n.has(raw.locale) ? raw.locale : 'pt-BR';
    return {
      id: str(raw.id, 60) || U.uid('cmp'),
      kind: oneOf(raw.kind, COMPANION_KINDS, 'cover'),
      title: str(raw.title, 120) || CM.t('Documento complementar'),
      locale: locale,
      senderBlock: str(raw.senderBlock, 600),
      recipient: { name: str(r.name, 160), org: str(r.org, 160), address: str(r.address, 400) },
      place: str(raw.place, 120),
      date: str(raw.date, 60),
      subject: str(raw.subject, 300),
      salutation: str(raw.salutation, 200),
      body: str(raw.body, 20000),
      closing: str(raw.closing, 300),
      signatureName: str(raw.signatureName, 160),
      enclosures: str(raw.enclosures, 300),
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now()
    };
  }

  /* Vaga analisada localmente (descrição colada pela pessoa). */
  function sanitizeJob(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var kws = (Array.isArray(raw.keywords) ? raw.keywords : []).slice(0, 300)
      .filter(function (k) { return k && typeof k === 'object' && typeof k.term === 'string'; })
      .map(function (k) {
        return { term: str(k.term, 80), status: oneOf(k.status, ['pending', 'accepted', 'ignored', 'edited'], 'pending'), edit: str(k.edit, 80) };
      });
    return {
      title: str(raw.title, 160),
      company: str(raw.company, 160),
      text: str(raw.text, 20000),
      keywords: kws,
      analyzedAt: Number.isFinite(raw.analyzedAt) ? raw.analyzedAt : 0
    };
  }

  function sanitizeSection(raw, warnings, migrating) {
    if (!raw || typeof raw !== 'object') return null;
    var kind = C.KINDS[raw.kind] ? raw.kind : 'custom';
    if (kind !== raw.kind) warnings.push(CM.t('Uma seção de tipo desconhecido foi convertida em "Seção personalizada".'));
    var schema = C.getSchema(kind);
    var sec = {
      id: str(raw.id, 60) || U.uid('sec'),
      kind: kind,
      title: str(raw.title, 120) || C.getKind(kind).title,
      visible: raw.visible !== false
    };
    // Chave do título no dicionário: permite traduzir títulos padrão ao trocar o idioma.
    if (validTitleKey(raw.titleKey)) {
      sec.titleKey = raw.titleKey;
    } else if (migrating && CM.l10n) {
      // Migração da versão 1: reconhece títulos padrão em pt-BR (títulos personalizados ficam sem chave)
      var L = CM.l10n;
      var t = String(sec.title).trim();
      if (t === L.sectionTitle(kind, 'pt-BR')) sec.titleKey = kind;
      else {
        var found = L.findTitleKey(t, 'pt-BR');
        if (found) sec.titleKey = found;
      }
    }
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
      return { doc: null, warnings: [CM.t('Documento inválido.')] };
    }
    if (!Array.isArray(raw.sections)) {
      return { doc: null, warnings: [CM.t('Documento sem a lista de seções.')] };
    }
    var templateIds = CM.templates ? CM.templates.ids() : [];
    var personal = {};
    var rawPersonal = raw.personal && typeof raw.personal === 'object' ? raw.personal : {};
    C.PERSONAL_FIELDS.forEach(function (f) { personal[f.key] = str(rawPersonal[f.key], MAX_SHORT); });
    personal.photo = safePhoto(rawPersonal.photo);
    if (rawPersonal.photo && !personal.photo) warnings.push(CM.t('A foto do documento era inválida ou grande demais e foi descartada.'));

    // Versão do esquema: documentos sem versão ou da versão 1 são migrados com segurança.
    var fromVersion = Number.isFinite(raw.schemaVersion) ? raw.schemaVersion : 1;
    var migrating = fromVersion < 2;
    var K = CM.countries;
    var country = K && K.has(raw.country) ? raw.country : 'BR';
    var locale = CM.i18n && CM.i18n.has(raw.locale) ? raw.locale : (migrating ? 'pt-BR' : (CM.countryRules ? CM.countryRules.defaultLanguage(country) : 'pt-BR'));
    var profile = K ? K.get(country) : null;
    var region = '';
    if (profile && profile.regions && typeof raw.region === 'string') {
      region = profile.regions.some(function (r) { return r.id === raw.region; }) ? raw.region : '';
    }

    var design = raw.design && typeof raw.design === 'object' ? raw.design : {};
    var doc = {
      id: str(raw.id, 60) || U.uid('doc'),
      schemaVersion: C.SCHEMA_VERSION || 2,
      country: country,
      locale: locale,
      region: region,
      name: str(raw.name, 120) || CM.t('Currículo importado'),
      type: C.TYPES[raw.type] ? raw.type : 'custom',
      template: templateIds.indexOf(raw.template) !== -1 ? raw.template : 'classic',
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
      design: {
        accent: CM.templates && CM.templates.ACCENTS[design.accent] ? design.accent : 'teal',
        fontScale: ['small', 'normal', 'large'].indexOf(design.fontScale) !== -1 ? design.fontScale : 'normal',
        density: ['compact', 'normal', 'relaxed'].indexOf(design.density) !== -1 ? design.density : 'normal',
        pageNumbers: design.pageNumbers !== false,
        paper: design.paper === 'Letter' ? 'Letter' : 'A4',
        showPhoto: design.showPhoto === true,
        signature: design.signature === true,
        privacyConsent: design.privacyConsent === true
      },
      personal: personal,
      sections: raw.sections.slice(0, MAX_SECTIONS)
        .map(function (s) { return sanitizeSection(s, warnings, migrating); })
        .filter(Boolean),
      companions: (Array.isArray(raw.companions) ? raw.companions : []).slice(0, 30)
        .map(sanitizeCompanion).filter(Boolean),
      job: sanitizeJob(raw.job)
    };
    if (migrating) doc.migratedFrom = fromVersion;
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
    var maxPages = CM.countryRules ? CM.countryRules.maxPages(doc) : type.maxPages;

    if (U.isBlank(p.fullName)) out.push({ level: 'warning', text: CM.t('Informe seu nome completo.'), target: 'p:fullName' });
    if (U.isBlank(p.email) && U.isBlank(p.phone)) {
      out.push({ level: 'warning', text: CM.t('Adicione pelo menos uma forma de contato (e-mail ou telefone).'), target: 'p:email' });
    }
    if (!isValidEmail(p.email)) out.push({ level: 'error', text: CM.t('O e-mail informado parece inválido.'), target: 'p:email' });
    if (!isValidPhone(p.phone)) out.push({ level: 'warning', text: CM.t('O telefone informado parece incompleto.'), target: 'p:phone' });
    ['linkedin', 'github', 'website'].forEach(function (k) {
      if (!isValidUrl(p[k])) out.push({ level: 'error', text: CM.t("O link em \"{0}\" é inválido e não aparecerá como link.", [labelFor(k)]), target: 'p:' + k });
    });

    var placeholderFound = false;
    var hasAnySection = false;
    doc.sections.forEach(function (sec) {
      var has = C.sectionHasContent(sec);
      if (has && sec.visible) hasAnySection = true;
      if (sec.kind === 'summary' && !has) {
        out.push({ level: 'info', text: CM.t("A seção \"{0}\" está vazia. Um texto curto ajuda a apresentar você.", [sec.title]), target: 's:' + sec.id });
      } else if (!has) {
        out.push({ level: 'info', text: CM.t("A seção \"{0}\" está vazia e não aparecerá no currículo.", [sec.title]), target: 's:' + sec.id });
      } else if (!sec.visible) {
        out.push({ level: 'info', text: CM.t("A seção \"{0}\" está oculta e não aparecerá no currículo.", [sec.title]), target: 's:' + sec.id });
      }
      var texts = [];
      if (sec.content) texts.push(sec.content);
      (sec.items || []).forEach(function (it) {
        var fields = C.fieldsFor(sec.kind);
        fields.forEach(function (f) {
          if (f.type === 'url' && !isValidUrl(it[f.key])) {
            out.push({ level: 'error', text: CM.t("Há um link inválido em \"{0}\".", [sec.title]), target: 'i:' + sec.id + ':' + it.id + ':' + f.key });
          }
          if (typeof it[f.key] === 'string') texts.push(it[f.key]);
        });
        var schema = C.getSchema(sec.kind);
        var titleKey = schema.titleKeys && schema.titleKeys[0];
        if (titleKey && C.itemHasContent(it, sec.kind) && U.isBlank(it[titleKey])) {
          out.push({ level: 'warning', text: CM.t("Um item em \"{0}\" está sem o campo \"{1}\".", [sec.title, fieldLabel(sec.kind, titleKey)]), target: 'i:' + sec.id + ':' + it.id + ':' + titleKey });
        }
      });
      (sec.tags || []).forEach(function (t) { texts.push(t); });
      if (texts.some(function (t) { return /\[[^\]]{2,}\]/.test(t); })) placeholderFound = true;
    });

    if (placeholderFound) {
      out.push({ level: 'warning', text: CM.t('Há trechos entre [colchetes] vindos de exemplos. Substitua-os por informações reais ou apague-os.') });
    }
    if (!hasAnySection) {
      out.push({ level: 'info', text: CM.t('Preencha pelo menos uma seção para que o currículo tenha conteúdo.') });
    }
    if (maxPages && pageCount > maxPages) {
      var where = CM.countryRules ? ' em ' + CM.countryRules.profileOf(doc).name : '';
      out.push({
        level: 'warning', group: 'length',
        text: CM.t("O currículo tem {0} páginas. Para \"{1}\"{2}, o recomendado é até {3}. Tente resumir descrições, usar o espaçamento compacto ou remover seções menos relevantes.", [pageCount, type.short, where, U.plural(maxPages, 'página', 'páginas')])
      });
    } else if (!maxPages && pageCount > 5) {
      out.push({ level: 'info', group: 'length', text: CM.t("O currículo está longo ({0} páginas). Verifique se todas as informações são relevantes.", [pageCount]) });
    }
    if (CM.countryRules) out = out.concat(CM.countryRules.reviewWarnings(doc));
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
    sanitizeCompanion: sanitizeCompanion,
    sanitizeJob: sanitizeJob,
    safePhoto: safePhoto,
    COMPANION_KINDS: COMPANION_KINDS,
    reviewDocument: reviewDocument,
    LIMITS: { MAX_TEXT: MAX_TEXT, MAX_SHORT: MAX_SHORT, MAX_ITEMS: MAX_ITEMS, MAX_SECTIONS: MAX_SECTIONS }
  };
})();
