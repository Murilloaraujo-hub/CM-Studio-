/* ==========================================================================
   CM Studio — letters-ui.js
   Aba "Cartas" do editor: cria e edita documentos complementares
   (cartas e anexos). Cada um tem idioma e orientação próprios e é impresso
   separadamente; nada é inserido no currículo.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;
  var S = CM.state;
  var A = CM.state.actions;

  var container = null;
  var activeId = null;
  var listBox = null;
  var previewBox = null;

  function companions() { return (S.doc && S.doc.companions) || []; }
  function find(id) { return companions().filter(function (c) { return c.id === id; })[0]; }

  function render(node) {
    container = node || container;
    if (!container || !S.doc) return;
    if (activeId && !find(activeId)) activeId = null;
    U.clear(container);
    var doc = S.doc;
    var prof = CM.countries.get(doc.country);
    var K = CM.letters.KINDS;

    container.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: CM.t('Cartas e documentos complementares') }),
      el('p', { class: 'muted small', text: CM.t('Cada documento tem idioma e orientações próprios e é impresso separadamente. Nada daqui é inserido no currículo.') })
    ]));

    // Sugestões do país
    var sugg = (prof.companions || []).filter(function (c) { return K[c.kind]; });
    if (sugg.length) {
      container.appendChild(el('div', { class: 'panel-block' }, [
        el('h3', { class: 'panel-title', text: CM.t("Sugeridos para {0}", [prof.name]) }),
        el('ul', { class: 'companion-suggest' }, sugg.map(function (c) {
          return el('li', {}, [
            el('div', {}, [
              el('strong', { text: c.label }),
              c.recommended ? el('span', { class: 'badge badge--accent', text: CM.t('Comum') }) : null,
              c.note ? el('p', { class: 'muted small', text: c.note }) : null
            ]),
            el('button', { class: 'btn btn--secondary btn--sm', type: 'button', text: CM.t('Criar'), attrs: { 'data-create-kind': c.kind }, on: { click: function () { createNew(c.kind, doc.locale); } } })
          ]);
        }))
      ]));
    }

    // Criar outro tipo
    var kindSel = el('select', { class: 'input select', id: 'cmp-kind' });
    Object.keys(K).forEach(function (k) { kindSel.appendChild(el('option', { text: K[k].label, attrs: { value: k } })); });
    var locSel = el('select', { class: 'input select', id: 'cmp-locale' });
    CM.i18n.codes().forEach(function (c) {
      var o = el('option', { text: CM.l10n.localeName(c), attrs: { value: c } }); o.selected = c === doc.locale; locSel.appendChild(o);
    });
    container.appendChild(el('details', { class: 'panel-block cmp-other' }, [
      el('summary', { text: CM.t('Criar outro tipo de documento') }),
      el('div', { class: 'form-grid' }, [
        el('div', { class: 'field field--half' }, [el('label', { class: 'label', attrs: { for: 'cmp-kind' }, text: CM.t('Tipo') }), kindSel]),
        el('div', { class: 'field field--half' }, [el('label', { class: 'label', attrs: { for: 'cmp-locale' }, text: CM.t('Idioma') }), locSel])
      ]),
      el('button', { class: 'btn btn--secondary btn--sm', type: 'button', id: 'cmp-create', on: { click: function () { createNew(kindSel.value, locSel.value); } } }, [U.icon('plus'), CM.t('Criar documento')])
    ]));

    listBox = el('div', { class: 'panel-block' });
    container.appendChild(listBox);
    drawList();

    if (activeId) container.appendChild(renderEditor(find(activeId)));
  }

  function drawList() {
    if (!listBox) return;
    U.clear(listBox);
    var list = companions();
    listBox.appendChild(el('h3', { class: 'panel-title', text: CM.t("Seus documentos ({0})", [list.length]) }));
    if (!list.length) { listBox.appendChild(el('p', { class: 'muted small', text: CM.t('Nenhum documento complementar criado.') })); return; }
    listBox.appendChild(el('ul', { class: 'companion-list' }, list.map(function (c) {
      var k = CM.letters.KINDS[c.kind];
      return el('li', { class: 'companion-item' + (c.id === activeId ? ' is-active' : '') }, [
        el('div', {}, [el('strong', { text: c.title }), el('p', { class: 'muted small', text: (k ? k.label : c.kind) + ' · ' + CM.l10n.localeName(c.locale) })]),
        el('div', { class: 'companion-actions' }, [
          el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: c.id === activeId ? CM.t('Editando') : CM.t('Editar'), attrs: { 'aria-pressed': c.id === activeId ? 'true' : 'false', 'data-edit-companion': c.id }, on: { click: function () { activeId = c.id; render(); focusEditor(); } } }),
          el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: CM.t('Imprimir / PDF'), on: { click: function () { CM.letters.print(find(c.id), S.doc); } } }),
          U.iconButton('trash', CM.t('Excluir "{0}"', [c.title]), { class: 'btn-icon--danger', on: { click: function () { remove(c); } } })
        ])
      ]);
    })));
  }

  function refreshList() { drawList(); }

  function createNew(kind, locale) {
    var data = CM.letters.create(kind, S.doc, locale);
    activeId = A.addCompanion(data);
    render();
    focusEditor();
    CM.ui.toast(CM.t('Documento criado. Ele é separado do currículo.'), { type: 'success' });
  }

  function remove(c) {
    CM.ui.confirm({ title: CM.t('Excluir documento?'), message: CM.t("\"{0}\" será excluído. Você pode desfazer logo em seguida (Ctrl+Z).", [c.title]), confirmLabel: CM.t('Excluir'), danger: true })
      .then(function (ok) {
        if (!ok) return;
        if (activeId === c.id) activeId = null;
        A.removeCompanion(c.id);
        render();
      });
  }

  function focusEditor() {
    setTimeout(function () {
      var t = document.getElementById('cmp-f-title');
      if (t) { t.focus(); t.scrollIntoView({ block: 'nearest' }); }
    }, 0);
  }

  var schedulePreview = U.debounce(function () { drawPreview(); }, 200);

  function renderEditor(c) {
    var k = CM.letters.KINDS[c.kind] || CM.letters.KINDS.cover;
    var wrap = el('div', { class: 'panel-block companion-editor', attrs: { 'aria-label': CM.t("Editar {0}", [c.title]) } });
    wrap.appendChild(el('h3', { class: 'panel-title', text: CM.t("Editando: {0}", [k.label]) }));
    wrap.appendChild(el('div', { class: 'callout callout--info' }, [U.icon('info'), el('div', {},
      k.guide.map(function (g) { return el('p', { text: g }); }).concat(k.sources.length ? [el('p', { class: 'small' }, [el('strong', { text: CM.t('Base: ') }), el('span', { text: k.sources.join(' · ') })])] : [])
    )]));

    function input(key, label, opts) {
      opts = opts || {};
      var id = 'cmp-f-' + key.replace('.', '-');
      var val = key.indexOf('recipient.') === 0 ? (c.recipient || {})[key.slice(10)] : c[key];
      var ctrl = opts.multi
        ? el('textarea', { class: 'input textarea', id: id, attrs: { rows: opts.rows || 3, maxlength: opts.max || 600 } })
        : el('input', { class: 'input', id: id, type: 'text', attrs: { maxlength: opts.max || 300, autocomplete: 'off' } });
      ctrl.value = val || '';
      ctrl.addEventListener('input', function () { A.updateCompanion(c.id, key, ctrl.value); if (key === 'title') { var t = listBox && listBox.querySelector('.is-active strong'); if (t) t.textContent = ctrl.value; } schedulePreview(); });
      return el('div', { class: 'field field--' + (opts.width || 'full') }, [
        el('label', { class: 'label', attrs: { for: id }, text: label }), ctrl,
        opts.help ? el('p', { class: 'field-help', text: opts.help }) : null
      ]);
    }

    var grid = el('div', { class: 'form-grid' });
    grid.appendChild(input('title', CM.t("Título (aparece só na lista e no nome do arquivo{0}", [k.letter ? ')' : CM.t(' e no topo do documento)')]), { max: 120 }));
    var loc = el('select', { class: 'input select', id: 'cmp-f-locale' });
    CM.i18n.codes().forEach(function (code) { var o = el('option', { text: CM.l10n.localeName(code), attrs: { value: code } }); o.selected = code === c.locale; loc.appendChild(o); });
    loc.addEventListener('change', function () { A.updateCompanion(c.id, 'locale', loc.value); render(); });
    grid.appendChild(el('div', { class: 'field field--half' }, [el('label', { class: 'label', attrs: { for: 'cmp-f-locale' }, text: CM.t('Idioma deste documento') }), loc]));
    if (k.letter) {
      grid.appendChild(el('div', { class: 'field field--half field--action' }, [
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: CM.t('Usar saudação e fecho padrão do idioma'), on: { click: function () {
          var lt = CM.i18n.get(find(c.id).locale).letter || {};
          A.updateCompanion(c.id, 'salutation', lt.salutation || '');
          A.updateCompanion(c.id, 'closing', lt.closing || '');
          render(); focusEditor();
        } } })
      ]));
      grid.appendChild(input('senderBlock', CM.t('Seus dados (remetente)'), { multi: true, rows: 3, help: CM.t('Preenchido com os dados do currículo; edite à vontade.') }));
      grid.appendChild(input('recipient.name', CM.t('Destinatário: pessoa (se souber)'), { width: 'half', max: 160 }));
      grid.appendChild(input('recipient.org', CM.t('Empresa ou instituição'), { width: 'half', max: 160 }));
      grid.appendChild(input('recipient.address', CM.t('Endereço do destinatário (opcional)'), { multi: true, rows: 2, max: 400 }));
      grid.appendChild(input('place', CM.t('Local'), { width: 'half', max: 120 }));
      grid.appendChild(input('date', CM.t('Data'), { width: 'half', max: 60 }));
      grid.appendChild(input('subject', CM.t('Assunto'), { max: 300 }));
      grid.appendChild(input('salutation', CM.t('Saudação'), { max: 200 }));
    }
    grid.appendChild(input('body', k.letter ? CM.t('Texto da carta') : CM.t('Conteúdo'), { multi: true, rows: 12, max: 20000, help: CM.t('Deixe uma linha em branco entre parágrafos. Linhas iniciadas com "-" viram lista. O texto não é traduzido automaticamente.') }));
    if (k.letter) {
      grid.appendChild(input('closing', CM.t('Fecho'), { max: 300 }));
      grid.appendChild(input('signatureName', CM.t('Nome na assinatura'), { width: 'half', max: 160 }));
      grid.appendChild(input('enclosures', CM.t('Anexos (opcional)'), { width: 'half', max: 300 }));
    } else {
      grid.appendChild(input('signatureName', CM.t('Nome (aparece no topo)'), { width: 'half', max: 160 }));
    }
    wrap.appendChild(grid);

    previewBox = el('div', { class: 'thumb-frame companion-preview', attrs: { 'aria-hidden': 'true' } });
    wrap.appendChild(el('div', { class: 'companion-preview-wrap' }, [
      el('p', { class: 'label', text: CM.t("Pré-visualização ({0})", [S.doc.design.paper === 'Letter' ? 'Letter' : 'A4']) }),
      previewBox,
      el('p', { class: 'muted small', id: 'cmp-pages' })
    ]));
    wrap.appendChild(el('div', { class: 'inline-row' }, [
      el('button', { class: 'btn btn--primary btn--sm', type: 'button', id: 'cmp-print', on: { click: function () { CM.letters.print(find(c.id), S.doc); } } }, [U.icon('printer'), CM.t('Imprimir / Salvar como PDF')]),
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: CM.t('Fechar editor'), on: { click: function () { activeId = null; render(); } } })
    ]));
    setTimeout(drawPreview, 0);
    return wrap;
  }

  function drawPreview() {
    if (!previewBox || !activeId || !find(activeId) || !document.body.contains(previewBox)) return;
    var res = CM.letters.render(find(activeId), S.doc, previewBox);
    var page = res.root.querySelector('.page');
    var w = page ? page.offsetWidth : 794;
    var hgt = page ? page.offsetHeight : 1123;
    var scale = (previewBox.clientWidth || 260) / w;
    res.root.style.transform = 'scale(' + scale + ')';
    res.root.style.transformOrigin = '0 0';
    previewBox.style.aspectRatio = '';
    previewBox.style.height = Math.ceil((res.root.offsetHeight || hgt) * scale) + 'px';
    var info = document.getElementById('cmp-pages');
    if (info) info.textContent = U.plural(res.pages, 'página', 'páginas') + (res.pages > 1 && CM.letters.KINDS[find(activeId).kind].letter ? CM.t(' — cartas costumam ter 1 página.') : '');
  }

  CM.lettersUI = { render: render, refreshList: refreshList };
})();
