/* ==========================================================================
   CM Studio — country-rules.js
   Regras CENTRALIZADAS que combinam país + idioma + finalidade + modelo.
   O editor, o assistente de criação, a revisão e a impressão consultam
   apenas este módulo; nenhum deles conhece detalhes de um país específico.

   Princípios:
   - país, idioma e finalidade são independentes; trocar um não apaga dados;
   - orientações são convenções, não leis (salvo quando a fonte diz o contrário);
   - nada aqui é "garantia" de aprovação em processos seletivos.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var K = CM.countries;
  var L = CM.l10n;

  var POLICY_LABELS = {
    recommended: 'Recomendado neste país',
    optional: 'Opcional',
    discouraged: 'Não recomendado neste país',
    hidden: 'Normalmente não se usa'
  };

  var PHOTO_LABELS = {
    avoid: 'Não incluir foto (orientação da fonte)',
    optional: 'Foto opcional',
    common: 'Foto é comum, mas opcional',
    unverified: 'Sem orientação verificada sobre foto'
  };
  if (CM.uiLang) { CM.uiLang.registerTree(POLICY_LABELS); CM.uiLang.registerTree(PHOTO_LABELS); }

  /** Rótulo da orientação de foto: distingue o que a fonte diz do que é só prática comum. */
  function photoLabel(code) {
    var ph = photoPolicy(code);
    if (ph.verified === false && ph.policy === 'avoid') return CM.t('Normalmente sem foto (não verificado na fonte)');
    if (ph.verified === false) return CM.t("{0} (não verificado na fonte)", [PHOTO_LABELS[ph.policy] || '']);
    return PHOTO_LABELS[ph.policy] || '';
  }

  function codeOf(x) {
    if (!x) return K.DEFAULT;
    if (typeof x === 'string') return x;
    return x.country || K.DEFAULT;
  }

  function profileOf(x) { return K.get(codeOf(x)); }

  /** Configuração da finalidade (tipo) no país, já mesclada com os padrões do tipo. */
  function purposeConfig(country, typeId) {
    var code = codeOf(country);
    var p = profileOf(country);
    var type = C.TYPES[typeId] || C.TYPES.custom;
    var over = (p && p.purposes && p.purposes[typeId]) || {};
    var available = over.available != null ? over.available : (typeId !== 'apprentice');
    var maxPages = over.maxPages !== undefined ? over.maxPages : type.maxPages;
    return {
      typeId: typeId,
      available: available,
      docLabel: over.docLabel || (p && p.terms ? p.terms.cv : type.label),
      docTitleKey: over.docTitleKey || null,
      templates: over.templates || null,
      maxPages: maxPages,
      pagesHint: over.pagesHint || (maxPages && (code === 'BR' || code === 'XX') ? (maxPages > 1 ? CM.t("Referência de até {0} páginas usada pelo CM Studio (convenção, não verificada em fonte oficial).", [maxPages]) : CM.t("Referência de até 1 página usada pelo CM Studio (convenção, não verificada em fonte oficial).")) : ''),
      sections: over.sections || null,
      note: over.note || ''
    };
  }

  /** Finalidades disponíveis no país, na ordem padrão. */
  function purposesFor(country) {
    return C.TYPE_ORDER.filter(function (t) { return purposeConfig(country, t).available; });
  }

  /**
   * Modelos para país + finalidade:
   * - recommended: indicados pelo perfil (em ordem);
   * - compatible: os demais modelos compatíveis com o país;
   * - other: modelos fora do escopo do país (só aparecem em "Mostrar todos").
   */
  function templatesFor(country, typeId) {
    var code = codeOf(country);
    var p = profileOf(code);
    var cfg = purposeConfig(code, typeId);
    var type = C.TYPES[typeId] || C.TYPES.custom;
    var T = CM.templates;
    var rec = (cfg.templates || []).slice();
    if (!cfg.templates) {
      // Sem lista específica. Brasil (e modelos especializados, como escolar ou
      // acadêmico) mantêm o modelo do tipo em 1º lugar; nos demais países, os
      // modelos preferidos do perfil vêm primeiro.
      var specialized = ['school', 'firstJob', 'academic', 'academicExtended'].indexOf(type.template) !== -1;
      var typeFirst = code === 'BR' || specialized;
      if (typeFirst && T.fitsCountry(type.template, code)) rec.push(type.template);
      (p.templates || []).slice(0, 3).forEach(function (id) { if (rec.indexOf(id) === -1) rec.push(id); });
      if (!typeFirst && T.fitsCountry(type.template, code) && rec.indexOf(type.template) === -1) rec.push(type.template);
    }
    rec = rec.filter(function (id) { return T.has(id); });
    var compatible = T.ids().filter(function (id) { return rec.indexOf(id) === -1 && T.fitsCountry(id, code); });
    var other = T.ids().filter(function (id) { return rec.indexOf(id) === -1 && compatible.indexOf(id) === -1; });
    return { recommended: rec, compatible: compatible, other: other, first: rec[0] || compatible[0] || 'classic' };
  }

  /** Seções sugeridas pelo país para a finalidade (ou null para usar as do tipo). */
  function sectionsFor(country, typeId) {
    return purposeConfig(country, typeId).sections;
  }

  function fieldPolicy(country, key) {
    var p = profileOf(country);
    var pol = p && p.personalFields ? p.personalFields[key] : null;
    return pol || 'hidden';
  }

  function photoPolicy(country) {
    var p = profileOf(country);
    return (p && p.photo) || { policy: 'unverified', note: '' };
  }

  function paperFor(country) {
    var p = profileOf(country);
    return p && p.paper === 'Letter' ? 'Letter' : 'A4';
  }

  /** Idiomas sugeridos para o país (e região, quando houver). */
  function languagesFor(country, region) {
    var p = profileOf(country);
    var langs = (p.languages || []).slice();
    if (region && p.regions) {
      var r = p.regions.filter(function (x) { return x.id === region; })[0];
      if (r) {
        langs = [r.locale].concat(langs.filter(function (l) { return l !== r.locale; }));
      }
    }
    return langs.filter(function (l) { return CM.i18n.has(l); });
  }

  function defaultLanguage(country, region) {
    var langs = languagesFor(country, region);
    var p = profileOf(country);
    if (!region && p.defaultLanguage && CM.i18n.has(p.defaultLanguage)) return p.defaultLanguage;
    return langs[0] || 'en-US';
  }

  /** Estilo de data a usar: o do país quando o idioma é um dos sugeridos; senão, o do idioma. */
  function dateStyle(doc) {
    var p = profileOf(doc);
    var locale = doc.locale || 'pt-BR';
    if (p && p.dateStyle && (p.languages || []).indexOf(locale) !== -1) return p.dateStyle;
    return L.dateStyleFor(locale);
  }

  function maxPages(doc) {
    return purposeConfig(codeOf(doc), doc.type).maxPages;
  }

  /** Título principal impresso (ex.: "Lebenslauf", "履歴書") — usado por alguns modelos. */
  function docTitle(doc) {
    var cfg = purposeConfig(codeOf(doc), doc.type);
    var tpl = CM.templates.get(doc.template);
    var key = cfg.docTitleKey;
    if (tpl.id === 'jpShokumu') key = 'shokumu';
    else if (tpl.id === 'jpRirekisho') key = 'rirekisho';
    else if (tpl.id === 'lebenslauf' && !key) key = 'cv';
    if (!key) return '';
    return L.docTitle(key, doc.locale || 'pt-BR');
  }

  /* ---------------- Avisos de revisão dependentes do contexto ---------------- */
  function reviewWarnings(doc) {
    var out = [];
    var code = codeOf(doc);
    var p = profileOf(code);
    var locale = doc.locale || 'pt-BR';
    var design = doc.design || {};
    var personal = doc.personal || {};
    var cfg = purposeConfig(code, doc.type);
    var T = CM.templates;

    if (!p) return out;

    if (p.status === 'preliminary' || p.status === 'generic') {
      out.push({ level: 'info', group: 'country', text: CM.t("O perfil de {0} é {1}. Confirme as orientações com o empregador ou a instituição.", [p.name, K.STATUS[p.status].label.toLowerCase()]), action: 'country-info' });
    }

    if (!cfg.available) {
      out.push({ level: 'warning', group: 'country', text: CM.t("A finalidade \"{0}\" não se aplica a {1} no CM Studio. Considere outra finalidade.", [(C.TYPES[doc.type] || C.TYPES.custom).short, p.name]), action: 'change-type' });
    }

    var paper = design.paper === 'Letter' ? 'Letter' : 'A4';
    if (paper !== paperFor(code)) {
      out.push({ level: 'warning', group: 'paper', text: CM.t("O papel está em {0}, mas o padrão para {1} é {2}. Se for imprimir ou enviar em PDF, confira o tamanho.", [paperName(paper), p.name, paperName(paperFor(code))]), action: 'paper' });
    }

    var langs = languagesFor(code, doc.region);
    if (langs.indexOf(locale) === -1 && !p.anyLanguage) {
      out.push({ level: 'info', group: 'language', text: CM.t("O idioma do documento ({0}) não é um dos sugeridos para {1} ({2}). Isso é permitido; confirme se a vaga aceita esse idioma.", [L.localeName(locale), p.name, langs.map(L.localeName).join(', ')]), action: 'language' });
    }
    var comp = CM.i18n.completeness(locale);
    if (comp.document !== 'full') {
      out.push({ level: 'warning', group: 'language', text: CM.t("A tradução dos rótulos para {0} está incompleta ({1} itens usam inglês).", [L.localeName(locale), comp.missing.length]), action: 'language' });
    }
    if (locale !== 'pt-BR' && hasUserText(doc)) {
      out.push({ level: 'info', group: 'language', text: CM.t('O CM Studio traduz apenas títulos e rótulos. O texto que você escreveu não é traduzido: revise-o no idioma do documento. Nomes de instituições e cursos devem ficar no original (tradução opcional entre parênteses).') });
    }

    // Títulos de seções que ficaram em outro idioma
    var foreign = (doc.sections || []).filter(function (s) {
      if (!s.visible || !C.sectionHasContent(s) || !s.titleKey) return false;
      var cur = String(s.title || '').trim();
      var expected = L.sectionTitle(s.titleKey, locale);
      if (!cur || cur === expected) return false;
      // título padrão de OUTRO idioma?
      return CM.i18n.codes().some(function (c) { return c !== locale && L.sectionTitle(s.titleKey, c) === cur; });
    });
    if (foreign.length) {
      out.push({ level: 'warning', group: 'language', text: CM.t("{0} com título em outro idioma ({1}). Use \"Atualizar títulos para o idioma\" nas configurações do documento.", [U.plural(foreign.length, 'seção está', 'seções estão'), foreign.slice(0, 3).map(function (s) { return '"' + s.title + '"'; }).join(', ')]), action: 'retitle' });
    }

    // Campos pessoais sensíveis preenchidos
    C.EXTRA_PERSONAL_KEYS.forEach(function (key) {
      if (U.isBlank(personal[key])) return;
      var pol = fieldPolicy(code, key);
      if (pol === 'discouraged' || pol === 'hidden') {
        out.push({ level: 'warning', group: 'privacy', text: CM.t("\"{0}\" está preenchido, mas {1} em currículos para {2}. Remova, a menos que a vaga peça.", [labelOf(key), pol === 'discouraged' ? CM.t('não é recomendado') : CM.t('normalmente não é usado'), p.name]), target: 'p:' + key });
      }
    });

    // Foto
    var photo = photoPolicy(code);
    if (design.showPhoto && personal.photo) {
      if (photo.policy === 'avoid') {
        out.push({ level: 'warning', group: 'privacy', text: CM.t("A foto está ativada, mas a orientação para {0} é não incluir foto. {1}", [p.name, photo.note || '']), action: 'photo' });
      } else if (photo.policy === 'unverified') {
        out.push({ level: 'info', group: 'privacy', text: CM.t("A foto está ativada. Não há orientação verificada sobre foto para {0}.", [p.name]), action: 'photo' });
      }
      var tpl = T.get(doc.template);
      if (!tpl.photoSlot) {
        out.push({ level: 'info', group: 'design', text: CM.t("O modelo \"{0}\" não exibe foto. Modelos com foto: Lebenslauf, Estilo Europass e 履歴書.", [tpl.name]), action: 'template' });
      }
    }

    // Modelo fora do escopo
    if (!T.fitsCountry(doc.template, code)) {
      out.push({ level: 'warning', group: 'design', text: CM.t("O modelo \"{0}\" é específico de outro país e não é o mais indicado para {1}.", [T.get(doc.template).name, p.name]), action: 'template' });
    }

    // Declaração de privacidade (ex.: Itália)
    if (p.privacyConsent && p.privacyConsent.recommended && !design.privacyConsent) {
      out.push({ level: 'warning', group: 'country', text: p.privacyConsent.note, action: 'consent' });
    }

    // Telefone sem código internacional quando o destino é outro país
    if (code !== 'BR' && !U.isBlank(personal.phone) && String(personal.phone).trim().charAt(0) !== '+') {
      out.push({ level: 'info', group: 'country', text: CM.t("Para candidaturas em {0}, inclua o código internacional no telefone (ex.: +55 para números do Brasil).", [p.name]), target: 'p:phone' });
    }

    // Japão: furigana recomendada
    if (fieldPolicy(code, 'furigana') === 'recommended' && U.isBlank(personal.furigana) && /^jp/.test(doc.template)) {
      out.push({ level: 'info', group: 'country', text: CM.t('No 履歴書, a leitura do nome (ふりがな) costuma aparecer acima do nome.'), target: 'p:furigana' });
    }
    return out;
  }

  function hasUserText(doc) {
    return (doc.sections || []).some(function (s) { return s.visible && C.sectionHasContent(s); });
  }

  function labelOf(key) {
    var f = C.PERSONAL_FIELDS.filter(function (x) { return x.key === key; })[0];
    return f ? f.label : key;
  }

  function paperName(p) { return p === 'Letter' ? CM.t('Letter (216 × 279 mm)') : CM.t('A4 (210 × 297 mm)'); }

  /**
   * Descreve o que muda ao trocar de país (para o diálogo de confirmação).
   * Nada é apagado: dados pessoais desaconselhados ficam guardados, só o aviso muda.
   */
  function describeChange(doc, newCode) {
    var from = profileOf(doc);
    var to = profileOf(newCode);
    var changes = [];
    var paperNow = doc.design && doc.design.paper === 'Letter' ? 'Letter' : 'A4';
    if (paperFor(newCode) !== paperNow) changes.push({ key: 'paper', text: CM.t("Papel: {0} → {1}", [paperName(paperNow), paperName(paperFor(newCode))]), default: true });
    var newLang = defaultLanguage(newCode);
    if (newLang !== doc.locale) changes.push({ key: 'locale', text: CM.t("Idioma do documento: {0} → {1} (títulos padrão serão traduzidos; títulos personalizados e seu texto são mantidos)", [L.localeName(doc.locale), L.localeName(newLang)]), default: true });
    var tpls = templatesFor(newCode, doc.type);
    if (tpls.recommended.indexOf(doc.template) === -1) changes.push({ key: 'template', text: CM.t("Modelo: {0} → {1} (recomendado)", [CM.templates.get(doc.template).name, CM.templates.get(tpls.first).name]), default: !CM.templates.fitsCountry(doc.template, newCode) });
    var warnings = [];
    C.EXTRA_PERSONAL_KEYS.forEach(function (key) {
      if (U.isBlank((doc.personal || {})[key])) return;
      var pol = fieldPolicy(newCode, key);
      if (pol === 'discouraged' || pol === 'hidden') warnings.push(CM.t("\"{0}\" está preenchido e não é recomendado para {1}. Ele será mantido, mas você verá um aviso na revisão.", [labelOf(key), to.name]));
    });
    if (!purposeConfig(newCode, doc.type).available) warnings.push(CM.t("A finalidade atual não se aplica a {0}. Você poderá escolher outra depois.", [to.name]));
    if (from && to && from.code !== to.code && doc.design && doc.design.showPhoto && photoPolicy(newCode).policy === 'avoid') warnings.push(CM.t("A foto está ativada; para {0} a orientação é não incluir.", [to.name]));
    return { from: from, to: to, changes: changes, warnings: warnings };
  }

  CM.countryRules = {
    POLICY_LABELS: POLICY_LABELS,
    PHOTO_LABELS: PHOTO_LABELS,
    photoLabel: photoLabel,
    profileOf: profileOf,
    purposeConfig: purposeConfig,
    purposesFor: purposesFor,
    templatesFor: templatesFor,
    sectionsFor: sectionsFor,
    fieldPolicy: fieldPolicy,
    photoPolicy: photoPolicy,
    paperFor: paperFor,
    paperName: paperName,
    languagesFor: languagesFor,
    defaultLanguage: defaultLanguage,
    dateStyle: dateStyle,
    maxPages: maxPages,
    docTitle: docTitle,
    reviewWarnings: reviewWarnings,
    describeChange: describeChange
  };
})();
