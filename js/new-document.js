/* ==========================================================================
   CM Studio — new-document.js
   Assistente de criação em 4 etapas:
     1. País de destino (onde a pessoa vai se candidatar — não a nacionalidade)
     2. Finalidade (profissional, primeiro emprego, estágio, escolar...)
     3. Modelo (recomendados para país + finalidade, com pré-visualização)
     4. Detalhes (nome do documento, idioma, região, papel)
   Parâmetros aceitos na rota: #/novo?pais=US&tipo=professional&modelo=usResume
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var el = U.el;

  var state = {
    step: 1, country: 'BR', type: 'professional', template: null, templateTouched: false,
    locale: null, localeTouched: false, paper: null, paperTouched: false, region: '', showAll: false
  };
  var bound = false;
  var picker = null;

  function $(id) { return document.getElementById(id); }
  function R() { return CM.countryRules; }

  function render(params) {
    params = params || {};
    var settings = CM.storage.getSettings();
    var remembered = settings.rememberCountry !== false && settings.lastCountry;
    var initialCountry = CM.countries.has(params.pais) ? params.pais
      : (CM.countries.has(remembered) ? remembered : (CM.countries.has(settings.defaultCountry) ? settings.defaultCountry : 'BR'));
    state.step = 1;
    state.country = initialCountry;
    state.type = C.TYPES[params.tipo] ? params.tipo : 'professional';
    var preTpl = CM.templates.has(params.modelo) ? params.modelo : null;
    state.template = preTpl;
    state.templateTouched = !!preTpl;
    if (preTpl && !params.tipo) {
      var match = C.TYPE_ORDER.filter(function (t) { return C.TYPES[t].template === preTpl; })[0];
      if (match) state.type = match;
    }
    state.locale = null; state.localeTouched = false;
    state.paper = null; state.paperTouched = false;
    state.region = '';
    state.showAll = false;
    $('new-show-all').checked = false;
    $('new-name').value = '';

    picker = CM.countrySelector.mount($('new-country-picker'), {
      value: state.country, name: 'new-country', idPrefix: 'nc',
      onChange: function (code) { setCountry(code); }
    });
    applyCountryDefaults();
    renderCountrySummary();
    bind();
    goStep(1, true);
    // Link com ?pais=XX: no modo automático a interface passa ao idioma do país
    if (params.pais && CM.countries.has(params.pais) && CM.uiLanguage) CM.uiLanguage.countryChanged(state.country, state.region);
  }

  /** Redesenha a etapa atual no idioma da interface, mantendo todas as escolhas. */
  function refresh() {
    picker = CM.countrySelector.mount($('new-country-picker'), {
      value: state.country, name: 'new-country', idPrefix: 'nc',
      onChange: function (code) { setCountry(code); }
    });
    renderCountrySummary();
    goStep(state.step, true);
  }

  function bind() {
    if (bound) return;
    bound = true;
    $('new-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.step < 4) { next(); return; }
      create();
    });
    $('new-next').addEventListener('click', next);
    $('new-back').addEventListener('click', function () { goStep(state.step - 1); });
    $('new-show-all').addEventListener('change', function (e) { state.showAll = e.target.checked; renderTemplates(); });
    $('new-locale').addEventListener('change', function (e) { state.locale = e.target.value; state.localeTouched = true; renderReview(); });
    $('new-region').addEventListener('change', function (e) {
      state.region = e.target.value;
      if (!state.localeTouched) state.locale = R().defaultLanguage(state.country, state.region);
      renderDetails();
      if (CM.uiLanguage) CM.uiLanguage.countryChanged(state.country, state.region);
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="new-paper"]'), function (r) {
      r.addEventListener('change', function () { state.paper = r.value; state.paperTouched = true; renderDetails(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-step-ind]'), function (li) {
      li.addEventListener('click', function () {
        var n = parseInt(li.getAttribute('data-step-ind'), 10);
        if (n < state.step) goStep(n);
      });
    });
  }

  function setCountry(code) {
    var changed = code !== state.country;
    state.country = code;
    if (changed) {
      state.region = '';
      if (!state.localeTouched) state.locale = null;
      if (!state.paperTouched) state.paper = null;
    }
    applyCountryDefaults();
    renderCountrySummary();
    if (changed && CM.uiLanguage) CM.uiLanguage.countryChanged(code, state.region);
  }

  function applyCountryDefaults() {
    var prof = CM.countries.get(state.country);
    if (prof.regions && !state.region) state.region = prof.regions[0].id;
    if (!state.locale) state.locale = R().defaultLanguage(state.country, state.region);
    if (!state.paper) state.paper = R().paperFor(state.country);
    if (!R().purposeConfig(state.country, state.type).available) state.type = R().purposesFor(state.country)[0];
    var tpls = R().templatesFor(state.country, state.type);
    if (!state.templateTouched || !state.template || !CM.templates.fitsCountry(state.template, state.country)) {
      state.template = tpls.first;
      state.templateTouched = false;
    }
  }

  function renderCountrySummary() {
    var box = $('new-country-summary');
    U.clear(box);
    box.appendChild(CM.countrySelector.summaryCard(state.country));
    box.appendChild(el('p', { class: 'field-help', text: CM.t('O país é o destino da candidatura. Brasil é o padrão. Você poderá trocar o país, o idioma e o modelo a qualquer momento no editor.') }));
  }

  /* ---------------- Etapa 2 ---------------- */
  function renderTypes() {
    var grid = $('new-types');
    U.clear(grid);
    var prof = CM.countries.get(state.country);
    $('new-purpose-help').textContent = CM.t("Finalidades disponíveis para {0}. A finalidade define as seções sugeridas e as orientações. Admissão em faculdade é diferente de candidatura a emprego.", [prof.name]);
    R().purposesFor(state.country).forEach(function (t) {
      var type = C.TYPES[t];
      var cfg = R().purposeConfig(state.country, t);
      var id = 'nt-' + t;
      var input = el('input', { type: 'radio', id: id, class: 'visually-hidden-input', attrs: { name: 'new-type', value: t } });
      input.checked = state.type === t;
      input.addEventListener('change', function () {
        state.type = t;
        if (!state.templateTouched) state.template = R().templatesFor(state.country, t).first;
        renderPurposeNote();
      });
      var docLabel = cfg.docLabel && state.country !== 'BR' ? el('span', { class: 'type-doc', text: CM.t("Documento: {0}", [cfg.docLabel]) }) : null;
      grid.appendChild(el('label', { class: 'type-choice', attrs: { for: id } }, [
        input,
        el('span', { class: 'type-choice-box' }, [
          el('span', { class: 'type-icon' }, U.icon(type.icon)),
          el('span', { class: 'type-text' }, [el('strong', { text: type.label }), el('span', { text: type.description }), docLabel]),
          el('span', { class: 'type-check' }, U.icon('check'))
        ])
      ]));
    });
    renderPurposeNote();
  }

  function renderPurposeNote() {
    var box = $('new-purpose-note');
    var cfg = R().purposeConfig(state.country, state.type);
    var bits = [];
    if (cfg.pagesHint) bits.push(cfg.pagesHint);
    if (cfg.note) bits.push(cfg.note);
    U.clear(box);
    box.hidden = !bits.length;
    if (bits.length) {
      box.appendChild(U.icon('info'));
      box.appendChild(el('div', {}, bits.map(function (b) { return el('p', { text: b }); })));
    }
  }

  /* ---------------- Etapa 3 ---------------- */
  function renderTemplates() {
    var wrap = $('new-templates');
    U.clear(wrap);
    var tpls = R().templatesFor(state.country, state.type);
    var prof = CM.countries.get(state.country);
    var ids = tpls.recommended.concat(tpls.compatible).concat(state.showAll ? tpls.other : []);
    if (ids.indexOf(state.template) === -1) ids.push(state.template);
    ids.forEach(function (tid) {
      var t = CM.templates.get(tid);
      var id = 'ntpl-' + t.id;
      var input = el('input', { type: 'radio', id: id, attrs: { name: 'new-tpl', value: t.id } });
      input.checked = state.template === t.id;
      input.addEventListener('change', function () { state.template = t.id; state.templateTouched = true; renderTplPreview(); });
      var badge = null;
      if (tpls.recommended.indexOf(t.id) !== -1) badge = el('span', { class: 'badge badge--accent', text: CM.t("Recomendado para {0}", [prof.name]) });
      else if (tpls.other.indexOf(t.id) !== -1) badge = el('span', { class: 'badge badge--warn', text: CM.t('Específico de outro país') });
      wrap.appendChild(el('label', { class: 'tpl-option', attrs: { for: id } }, [
        input,
        el('span', { class: 'tpl-swatch tpl-swatch--' + t.id, attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'tpl-option-text' }, [
          el('strong', {}, [t.name, badge]),
          el('span', { text: t.description })
        ])
      ]));
    });
    renderTplPreview();
  }

  function renderTplPreview() {
    var frame = $('new-tpl-preview');
    var sample = CM.samples.forTemplate(state.template, { country: state.country, locale: state.locale, paper: state.paper });
    var res = CM.preview.render(sample, frame, { placeholders: false });
    Array.prototype.slice.call(res.root.querySelectorAll('.page')).slice(1).forEach(function (p) { p.remove(); });
    var pageW = res.root.querySelector('.page') ? res.root.querySelector('.page').offsetWidth : 794;
    var pageH = res.root.querySelector('.page') ? res.root.querySelector('.page').offsetHeight : 1123;
    var scale = (frame.clientWidth || 300) / (pageW || 794);
    res.root.style.transform = 'scale(' + scale + ')';
    res.root.style.transformOrigin = '0 0';
    frame.style.aspectRatio = pageW + ' / ' + pageH;
    $('new-tpl-caption').textContent = CM.t("Pré-visualização com dados fictícios · {0} · {1} · {2}", [CM.templates.get(state.template).name, state.paper === 'Letter' ? 'Letter' : 'A4', CM.l10n.localeName(state.locale)]);
  }

  /* ---------------- Etapa 4 ---------------- */
  function renderDetails() {
    var prof = CM.countries.get(state.country);
    // Região (ex.: Suíça)
    var regField = $('new-region-field');
    var regSel = $('new-region');
    U.clear(regSel);
    regField.hidden = !prof.regions;
    (prof.regions || []).forEach(function (r) {
      var o = el('option', { text: r.label, attrs: { value: r.id } });
      o.selected = r.id === state.region;
      regSel.appendChild(o);
    });
    // Idiomas: sugeridos primeiro, depois todos
    var sel = $('new-locale');
    U.clear(sel);
    var suggested = R().languagesFor(state.country, state.region);
    var g1 = el('optgroup', { attrs: { label: CM.t("Sugeridos para {0}", [prof.name]) } });
    var g2 = el('optgroup', { attrs: { label: CM.t('Outros idiomas') } });
    CM.i18n.codes().forEach(function (code) {
      var o = el('option', { text: CM.l10n.localeName(code), attrs: { value: code } });
      o.selected = code === state.locale;
      (suggested.indexOf(code) !== -1 ? g1 : g2).appendChild(o);
    });
    sel.appendChild(g1);
    sel.appendChild(g2);
    // Papel
    Array.prototype.forEach.call(document.querySelectorAll('input[name="new-paper"]'), function (r) { r.checked = r.value === state.paper; });
    var def = R().paperFor(state.country);
    $('new-paper-help').textContent = (prof.paperNote || '') + (state.paper !== def ? CM.t(" Atenção: você escolheu {0}, diferente do padrão ({1}).", [state.paper, def]) : '');
    renderReview();
  }

  function renderReview() {
    var box = $('new-review');
    U.clear(box);
    var prof = CM.countries.get(state.country);
    var cfg = R().purposeConfig(state.country, state.type);
    var rows = [
      [CM.t('País de destino'), prof.name],
      [CM.t('Finalidade'), C.TYPES[state.type].label + (cfg.docLabel && state.country !== 'BR' ? ' (' + cfg.docLabel + ')' : '')],
      [CM.t('Modelo'), CM.templates.get(state.template).name],
      [CM.t('Idioma do documento'), CM.l10n.localeName(state.locale)],
      [CM.t('Papel'), R().paperName(state.paper)]
    ];
    box.appendChild(el('h3', { class: 'panel-title', text: CM.t('Resumo') }));
    box.appendChild(el('dl', { class: 'summary-list' }, rows.map(function (r) { return el('div', {}, [el('dt', { text: r[0] }), el('dd', { text: r[1] })]); })));
    var warns = [];
    if (R().languagesFor(state.country, state.region).indexOf(state.locale) === -1 && !prof.anyLanguage) warns.push(CM.t("O idioma escolhido não é um dos sugeridos para {0}. É permitido; confirme se a vaga aceita.", [prof.name]));
    if (CM.i18n.completeness(state.locale).document !== 'full') warns.push(CM.t('A tradução dos rótulos para este idioma está incompleta.'));
    if (!CM.templates.fitsCountry(state.template, state.country)) warns.push(CM.t('O modelo escolhido é específico de outro país.'));
    if (prof.status === 'preliminary' || prof.status === 'generic') warns.push(CM.countries.STATUS[prof.status].description);
    warns.forEach(function (w) {
      box.appendChild(el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('p', { text: w })]));
    });
  }

  /* ---------------- Navegação ---------------- */
  function goStep(n, silent) {
    n = Math.max(1, Math.min(4, n));
    state.step = n;
    // Mostra a etapa ANTES de desenhar (a pré-visualização precisa medir a largura)
    Array.prototype.forEach.call(document.querySelectorAll('#new-form .wizard-step'), function (s) {
      s.hidden = String(n) !== s.getAttribute('data-step');
    });
    if (n === 2) renderTypes();
    if (n === 3) renderTemplates();
    if (n === 4) renderDetails();
    Array.prototype.forEach.call(document.querySelectorAll('[data-step-ind]'), function (li) {
      var i = parseInt(li.getAttribute('data-step-ind'), 10);
      li.classList.toggle('is-current', i === n);
      li.classList.toggle('is-done', i < n);
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('new-back').hidden = n === 1;
    $('new-next').hidden = n === 4;
    $('new-submit').hidden = n !== 4;
    if (!silent) {
      var h = document.querySelector('#new-step-' + n + ' .step-heading');
      if (h) h.focus();
      window.scrollTo(0, 0);
    }
  }

  function next() {
    if (state.step === 1) {
      state.country = picker ? picker.getValue() : state.country;
      applyCountryDefaults();
    }
    goStep(state.step + 1);
  }

  function create() {
    var name = $('new-name').value.trim();
    var doc = C.createDocument(state.type, {
      name: name || undefined, template: state.template, country: state.country,
      locale: state.locale, paper: state.paper, region: state.region
    });
    var r = CM.storage.saveDoc(doc);
    if (!r.ok) {
      CM.ui.toast(r.error.message, { type: 'error' });
      return;
    }
    var s = CM.storage.getSettings();
    if (s.rememberCountry !== false) { s.lastCountry = state.country; CM.storage.saveSettings(s); }
    CM.ui.toast(CM.t("Currículo criado para {0}. As alterações são salvas automaticamente.", [CM.countries.get(state.country).name]), { type: 'success' });
    location.hash = '#/editor/' + encodeURIComponent(doc.id);
  }

  CM.newDocument = { render: render, refresh: refresh, _state: state };
})();
