/* ==========================================================================
   CM Studio — editor-context.js
   Barra de contexto do editor: mostra (e permite trocar) país de destino,
   idioma do documento, finalidade, modelo, papel e avisos.
   Também implementa o diálogo "Configurações do documento", que troca país,
   região, idioma e papel SEM apagar nenhum dado.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;
  var S = CM.state;
  var A = CM.state.actions;

  function R() { return CM.countryRules; }

  /**
   * Desenha a barra. handlers: { onType, onTemplate, onReview }
   */
  function render(container, doc, handlers, warnCount) {
    if (!container || !doc) return;
    handlers = handlers || {};
    U.clear(container);
    var prof = CM.countries.get(doc.country);
    var type = CM.catalog.TYPES[doc.type] || CM.catalog.TYPES.custom;
    var tpl = CM.templates.get(doc.template);
    var paper = doc.design.paper === 'Letter' ? 'Letter' : 'A4';
    var paperMismatch = paper !== R().paperFor(doc.country);
    var langMismatch = R().languagesFor(doc.country, doc.region).indexOf(doc.locale) === -1 && !prof.anyLanguage;

    function chip(label, value, opts) {
      opts = opts || {};
      return el('button', {
        class: 'ctx-chip' + (opts.warn ? ' is-warn' : ''), type: 'button',
        attrs: { 'aria-label': label + ': ' + value + '. ' + (opts.hint || 'Alterar'), 'data-ctx': opts.key || null, title: opts.hint || 'Alterar' },
        on: { click: opts.onClick }
      }, [
        opts.flag || (opts.icon ? U.icon(opts.icon) : null),
        el('span', { class: 'ctx-text' }, [
          el('span', { class: 'ctx-label', text: label }),
          el('span', { class: 'ctx-value', text: value })
        ]),
        opts.warn ? U.icon('alert', 'ctx-warn') : null
      ]);
    }

    var openSettings = function (focus) { return function () { openDocSettings(focus, handlers); }; };
    container.appendChild(el('div', { class: 'ctx-row' }, [
      chip('País de destino', prof.name, { key: 'country', flag: CM.flags.svg(prof.code), onClick: openSettings('country'), hint: 'Trocar o país (seus dados são mantidos)' }),
      chip('Idioma', CM.l10n.localeName(doc.locale), { key: 'locale', icon: 'globe', warn: langMismatch, onClick: openSettings('locale') }),
      chip('Finalidade', type.short || type.label, { key: 'type', icon: type.icon, onClick: handlers.onType }),
      chip('Modelo', tpl.name, { key: 'template', icon: 'layers', warn: !CM.templates.fitsCountry(tpl.id, doc.country), onClick: handlers.onTemplate }),
      chip('Papel', paper, { key: 'paper', icon: 'file', warn: paperMismatch, onClick: openSettings('paper'), hint: paperMismatch ? 'Diferente do padrão do país' : 'Alterar' }),
      chip('Avisos', warnCount ? String(warnCount) : 'Nenhum', { key: 'review', icon: warnCount ? 'alert' : 'check', warn: !!warnCount, onClick: handlers.onReview, hint: 'Abrir a revisão' }),
      el('span', { class: 'ctx-status' }, [CM.countrySelector.statusBadge(prof)])
    ]));
  }

  /* ---------------- Diálogo de configurações do documento ---------------- */
  function openDocSettings(focus, handlers) {
    var doc = S.doc;
    if (!doc) return;
    handlers = handlers || {};
    var choice = { country: doc.country, region: doc.region || '', locale: doc.locale, paper: doc.design.paper === 'Letter' ? 'Letter' : 'A4' };
    var touched = { locale: false, paper: false };

    var pickerBox = el('div', { class: 'ds-picker' });
    var changeBox = el('div', { class: 'ds-changes', attrs: { 'aria-live': 'polite' } });
    var regionWrap = el('div', { class: 'field field--half' });
    var localeSel = el('select', { class: 'input select', id: 'ds-locale' });
    var retitle = el('input', { type: 'checkbox', id: 'ds-retitle' }); retitle.checked = true;
    var paperGroup = el('div', { class: 'segmented', attrs: { role: 'radiogroup', 'aria-label': 'Tamanho do papel' } });
    var paperHelp = el('p', { class: 'field-help' });
    var tplApply = el('input', { type: 'checkbox', id: 'ds-template' });
    var tplWrap = el('div', {});

    var countryBlock = el('details', { class: 'ds-country', attrs: { open: focus === 'country' ? true : null } }, [
      el('summary', {}, [el('strong', { text: 'País de destino: ' }), el('span', { class: 'ds-country-name' })]),
      el('p', { class: 'field-help', text: 'O país é o destino da candidatura, não a sua nacionalidade. Trocar o país não apaga nenhum dado.' }),
      pickerBox
    ]);

    function updateCountryName() { countryBlock.querySelector('.ds-country-name').textContent = CM.countries.get(choice.country).name; }

    function drawRegion() {
      U.clear(regionWrap);
      var prof = CM.countries.get(choice.country);
      regionWrap.hidden = !prof.regions;
      if (!prof.regions) return;
      if (!choice.region) choice.region = prof.regions[0].id;
      var sel = el('select', { class: 'input select', id: 'ds-region' });
      prof.regions.forEach(function (r) {
        var o = el('option', { text: r.label, attrs: { value: r.id } }); o.selected = r.id === choice.region; sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        choice.region = sel.value;
        if (!touched.locale) choice.locale = R().defaultLanguage(choice.country, choice.region);
        drawLocale(); drawChanges();
      });
      regionWrap.appendChild(el('label', { class: 'label', attrs: { for: 'ds-region' }, text: 'Região linguística' }));
      regionWrap.appendChild(sel);
    }

    function drawLocale() {
      U.clear(localeSel);
      var prof = CM.countries.get(choice.country);
      var sug = R().languagesFor(choice.country, choice.region);
      var g1 = el('optgroup', { attrs: { label: 'Sugeridos para ' + prof.name } });
      var g2 = el('optgroup', { attrs: { label: 'Outros idiomas' } });
      CM.i18n.codes().forEach(function (c) {
        var comp = CM.i18n.completeness(c);
        var o = el('option', { text: CM.l10n.localeName(c) + (comp.document !== 'full' ? ' (tradução incompleta)' : ''), attrs: { value: c } });
        o.selected = c === choice.locale;
        (sug.indexOf(c) !== -1 ? g1 : g2).appendChild(o);
      });
      localeSel.appendChild(g1); localeSel.appendChild(g2);
    }
    localeSel.addEventListener('change', function () { choice.locale = localeSel.value; touched.locale = true; drawChanges(); });

    function drawPaper() {
      U.clear(paperGroup);
      ['A4', 'Letter'].forEach(function (p) {
        var id = 'ds-paper-' + p;
        var input = el('input', { type: 'radio', id: id, attrs: { name: 'ds-paper', value: p } });
        input.checked = choice.paper === p;
        input.addEventListener('change', function () { choice.paper = p; touched.paper = true; drawPaperHelp(); drawChanges(); });
        paperGroup.appendChild(input);
        paperGroup.appendChild(el('label', { attrs: { for: id }, text: p === 'Letter' ? 'Letter (Carta)' : 'A4' }));
      });
      drawPaperHelp();
    }
    function drawPaperHelp() {
      var def = R().paperFor(choice.country);
      paperHelp.textContent = 'Padrão para ' + CM.countries.get(choice.country).name + ': ' + R().paperName(def) + '.' +
        (choice.paper !== def ? ' Você escolheu um tamanho diferente do padrão — é permitido, mas confira antes de imprimir.' : '');
    }

    function drawChanges() {
      U.clear(changeBox);
      U.clear(tplWrap);
      var items = [];
      var warns = [];
      if (choice.country !== doc.country) {
        var d = R().describeChange(doc, choice.country);
        warns = d.warnings;
        var tplChange = d.changes.filter(function (c) { return c.key === 'template'; })[0];
        if (tplChange) {
          tplApply.checked = tplChange.default;
          tplWrap.appendChild(el('label', { class: 'check', attrs: { for: 'ds-template' } }, [tplApply, el('span', { text: tplChange.text })]));
        }
        items.push('País: ' + CM.countries.get(doc.country).name + ' → ' + CM.countries.get(choice.country).name);
      }
      if (choice.locale !== doc.locale) items.push('Idioma: ' + CM.l10n.localeName(doc.locale) + ' → ' + CM.l10n.localeName(choice.locale));
      var curPaper = doc.design.paper === 'Letter' ? 'Letter' : 'A4';
      if (choice.paper !== curPaper) items.push('Papel: ' + curPaper + ' → ' + choice.paper);
      if (CM.i18n.completeness(choice.locale).document !== 'full') warns = warns.concat(['A tradução dos rótulos para ' + CM.l10n.localeName(choice.locale) + ' está incompleta; alguns rótulos aparecerão em inglês.']);
      if (!items.length) {
        changeBox.appendChild(el('p', { class: 'muted small', text: 'Nenhuma alteração selecionada.' }));
        return;
      }
      changeBox.appendChild(el('div', { class: 'callout callout--info' }, [U.icon('info'), el('div', {}, [
        el('p', {}, el('strong', { text: 'O que vai mudar:' })),
        el('ul', { class: 'plain-list' }, items.map(function (t) { return el('li', { text: t }); })),
        el('p', { text: 'Nenhum dado preenchido será apagado. O texto que você escreveu não é traduzido.' })
      ])]));
      warns.forEach(function (w) { changeBox.appendChild(el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('p', { text: w })])); });
    }

    CM.countrySelector.mount(pickerBox, {
      value: choice.country, name: 'ds-country', idPrefix: 'dsc',
      onChange: function (code) {
        choice.country = code;
        var prof = CM.countries.get(code);
        choice.region = prof.regions ? prof.regions[0].id : '';
        if (!touched.locale) choice.locale = R().defaultLanguage(code, choice.region);
        if (!touched.paper) choice.paper = R().paperFor(code);
        updateCountryName(); drawRegion(); drawLocale(); drawPaper(); drawChanges();
      }
    });
    updateCountryName(); drawRegion(); drawLocale(); drawPaper(); drawChanges();

    var body = [
      countryBlock,
      el('div', { class: 'form-grid' }, [
        regionWrap,
        el('div', { class: 'field field--half' }, [
          el('label', { class: 'label', attrs: { for: 'ds-locale' }, text: 'Idioma do documento' }),
          localeSel,
          el('label', { class: 'check', attrs: { for: 'ds-retitle' } }, [retitle, el('span', { text: 'Traduzir os títulos padrão das seções (títulos personalizados são mantidos)' })])
        ]),
        el('div', { class: 'field field--half' }, [el('span', { class: 'label', text: 'Tamanho do papel' }), paperGroup, paperHelp])
      ]),
      tplWrap,
      changeBox
    ];

    CM.ui.modal({
      title: 'Configurações do documento', body: body, size: 'lg',
      onOpen: function (dlg) {
        var target = focus === 'locale' ? localeSel : focus === 'paper' ? paperGroup.querySelector('input:checked') : null;
        if (target) setTimeout(function () { target.focus(); }, 30);
      },
      actions: [
        { label: 'Cancelar', value: null, variant: 'ghost' },
        { label: 'Aplicar', variant: 'primary', submit: true, value: function () { return true; } }
      ]
    }).then(function (ok) {
      if (!ok) return;
      var msgs = [];
      if (choice.country !== doc.country) {
        var tplTarget = tplApply.checked ? R().templatesFor(choice.country, doc.type).first : undefined;
        A.changeCountry(choice.country, { locale: choice.locale, paper: choice.paper, template: tplTarget, region: choice.region, retitle: retitle.checked });
        msgs.push('País alterado para ' + CM.countries.get(choice.country).name + '.');
      } else {
        if (choice.region !== (doc.region || '')) A.setRegion(choice.region);
        if (choice.locale !== doc.locale) {
          var r = A.setLocale(choice.locale, { retitle: retitle.checked });
          msgs.push('Idioma alterado para ' + CM.l10n.localeName(choice.locale) + (r && r.kept ? ' (' + U.plural(r.kept, 'título personalizado mantido', 'títulos personalizados mantidos') + ')' : '') + '.');
        }
        if (choice.paper !== (doc.design.paper === 'Letter' ? 'Letter' : 'A4')) { A.setPaper(choice.paper); msgs.push('Papel: ' + choice.paper + '.'); }
      }
      if (handlers.onApplied) handlers.onApplied();
      if (msgs.length) CM.ui.toast(msgs.join(' ') + ' Seus dados foram preservados.', { type: 'success' });
    });
  }

  CM.editorContext = { render: render, openDocSettings: openDocSettings };
})();
