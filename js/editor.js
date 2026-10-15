/* ==========================================================================
   CM Studio — editor.js
   Tela do editor: formulário (Conteúdo, Design, Revisão), barra superior,
   pré-visualização em tempo real e atalhos de teclado.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var V = CM.validation;
  var S = CM.state;
  var A = CM.state.actions;
  var el = U.el;

  var dom = {};
  var expanded = {};          // seções abertas no formulário
  var collapsedItems = {};    // itens recolhidos
  var activeTab = 'content';
  var zoom = 'fit';
  var lastRender = { pages: 1, oversize: false };
  var initialized = false;
  var unsubscribers = [];
  var showAllExtras = false;     // mostrar todos os campos pessoais adicionais
  var showAllTemplates = false;  // mostrar modelos de outros países

  function $(id) { return document.getElementById(id); }
  function settings() { return CM.storage.getSettings(); }

  /* ======================================================================
     Inicialização (uma única vez)
     ====================================================================== */
  function init() {
    if (initialized) return;
    initialized = true;
    dom.view = $('view-editor');
    dom.name = $('doc-name');
    dom.status = $('save-status');
    dom.statusText = $('save-status-text');
    dom.undo = $('btn-undo');
    dom.redo = $('btn-redo');
    dom.panelContent = $('panel-content');
    dom.panelDesign = $('panel-design');
    dom.panelReview = $('panel-review');
    dom.reviewBadge = $('review-badge');
    dom.stage = $('preview-stage');
    dom.scroll = $('preview-scroll');
    dom.pageCount = $('preview-pages');
    dom.zoomLabel = $('zoom-label');
    dom.layout = $('editor-layout');
    dom.panelJob = $('panel-job');
    dom.panelLetters = $('panel-letters');
    dom.context = $('editor-context');
    dom.lettersBadge = $('letters-badge');

    dom.name.addEventListener('input', function () { A.rename(dom.name.value); });
    dom.name.addEventListener('blur', function () {
      if (U.isBlank(dom.name.value)) { dom.name.value = 'Currículo sem nome'; A.rename(dom.name.value); }
    });
    dom.undo.addEventListener('click', function () { doUndo(); });
    dom.redo.addEventListener('click', function () { doRedo(); });
    $('btn-print').addEventListener('click', function () { CM.print.printDocument(S.doc); });
    $('btn-export-doc').addEventListener('click', function () {
      S.saveNow();
      CM.exportImport.exportDocuments([S.doc], 'cm-studio-' + U.safeFileName(S.doc.name) + '-' + U.todayStamp() + '.json');
    });
    $('btn-duplicate-doc').addEventListener('click', duplicateCurrent);

    // Abas do painel
    document.querySelectorAll('[data-editor-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTab(btn.getAttribute('data-editor-tab')); });
      btn.addEventListener('keydown', tabKeyNav);
    });
    // Alternância Editar/Visualizar (celular)
    document.querySelectorAll('[data-mobile-view]').forEach(function (btn) {
      btn.addEventListener('click', function () { setMobileView(btn.getAttribute('data-mobile-view')); });
    });
    // Zoom
    $('zoom-out').addEventListener('click', function () { stepZoom(-1); });
    $('zoom-in').addEventListener('click', function () { stepZoom(1); });
    $('zoom-fit').addEventListener('click', function () { zoom = 'fit'; applyZoom(); });

    // Formulário: delegação de eventos
    dom.panelContent.addEventListener('input', onFieldInput);
    dom.panelContent.addEventListener('change', onFieldChange);
    dom.panelContent.addEventListener('focusout', onFieldBlur);

    document.addEventListener('keydown', onShortcut);

    if (window.ResizeObserver) {
      new ResizeObserver(U.debounce(function () { if (isActive()) applyZoom(); }, 60)).observe(dom.scroll);
    } else {
      window.addEventListener('resize', U.debounce(function () { if (isActive()) applyZoom(); }, 100));
    }

    S.on('status', renderStatus);
    S.on('change', onStateChange);
  }

  function isActive() { return dom.view && !dom.view.hidden && !!S.doc; }

  /* ======================================================================
     Abrir / fechar documento
     ====================================================================== */
  function open(id) {
    init();
    if (!S.open(id)) return false;
    var s = settings();
    s.lastDocId = id;
    CM.storage.saveSettings(s);
    expanded = { personal: true };
    collapsedItems = {};
    showAllExtras = false;
    showAllTemplates = false;
    var firstSection = S.doc.sections[0];
    if (firstSection) expanded[firstSection.id] = true;
    zoom = s.previewZoom || 'fit';
    dom.name.value = S.doc.name;
    setTab('content', true);
    setMobileView('edit');
    renderAll();
    renderStatus(S.status);
    return true;
  }

  function close() {
    S.close();
  }

  function onStateChange(evt) {
    if (!S.doc) return;
    if (evt.source === 'undo' || evt.source === 'redo') {
      dom.name.value = S.doc.name;
      renderAll(true);
      return;
    }
    if (evt.structural) {
      renderContent(true);
      if (activeTab !== 'design') renderDesign();
      if (activeTab === 'letters' && CM.lettersUI) CM.lettersUI.refreshList();
    }
    schedulePreview();
    updateUndoButtons();
  }

  var schedulePreview = U.debounce(function () { renderPreview(); renderReview(); refreshMetas(); renderContext(); }, 140);

  /** Barra de contexto (país, idioma, finalidade, modelo, papel, avisos). */
  function renderContext() {
    if (!S.doc || !CM.editorContext) return;
    var count = reviewItems().filter(function (x) { return x.level !== 'info'; }).length;
    CM.editorContext.render(dom.context, S.doc, contextHandlers, count);
    var n = (S.doc.companions || []).length;
    dom.lettersBadge.textContent = n ? String(n) : '';
    dom.lettersBadge.hidden = !n;
  }

  var contextHandlers = {
    onType: function () { openChangeType(); },
    onTemplate: function () { setTab('design'); var c = dom.panelDesign.querySelector('input[name="tpl"]:checked'); if (c) c.focus(); },
    onReview: function () { setTab('review'); },
    onApplied: function () { renderAll(true); }
  };

  /** Atualiza contadores/selos dos cartões sem redesenhar o formulário (preserva o foco). */
  function refreshMetas() {
    var doc = S.doc;
    if (!doc) return;
    doc.sections.forEach(function (sec) {
      var card = dom.panelContent.querySelector('[data-card="' + cssEscape(sec.id) + '"]');
      var meta = card && card.querySelector('.sec-meta');
      if (!meta) return;
      U.clear(meta);
      U.appendChildren(meta, sectionMeta(sec));
      var note = card.querySelector('.empty-note');
      if (note) note.hidden = C.sectionHasContent(sec);
    });
    var pcard = dom.panelContent.querySelector('[data-card="personal"] .sec-meta');
    if (pcard) {
      var base = C.PERSONAL_FIELDS.filter(function (f) { return !f.extra; });
      var filled = base.filter(function (f) { return !U.isBlank(doc.personal[f.key]); }).length;
      pcard.textContent = filled + ' de ' + base.length + ' preenchidos';
    }
  }

  function renderAll(keepFocus) {
    renderContent(keepFocus);
    renderDesign();
    renderPreview();
    renderReview();
    renderContext();
    if (activeTab === 'job' && CM.jobPanel) CM.jobPanel.render(dom.panelJob);
    if (activeTab === 'letters' && CM.lettersUI) CM.lettersUI.render(dom.panelLetters);
    updateUndoButtons();
  }

  /* ======================================================================
     Status de salvamento e desfazer/refazer
     ====================================================================== */
  function renderStatus(st) {
    if (!dom.status) return;
    dom.status.setAttribute('data-state', st.state);
    var text = st.state === 'pending' ? 'Salvando…' : st.state === 'error' ? 'Erro ao salvar' : (st.message || 'Salvo');
    dom.statusText.textContent = text;
    dom.status.title = st.message || text;
    if (st.state === 'error') {
      CM.ui.toast(st.message + ' Exporte um backup para não perder suas alterações.', { type: 'error', duration: 0 });
    }
  }

  function updateUndoButtons() {
    dom.undo.disabled = !S.canUndo();
    dom.redo.disabled = !S.canRedo();
  }

  function doUndo() {
    if (S.undo()) CM.ui.announce('Alteração desfeita');
    updateUndoButtons();
  }
  function doRedo() {
    if (S.redo()) CM.ui.announce('Alteração refeita');
    updateUndoButtons();
  }

  function onShortcut(e) {
    if (!isActive()) return;
    if (document.querySelector('dialog[open]')) return;
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
    else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); doRedo(); }
    else if (key === 's') {
      e.preventDefault();
      var r = S.saveNow();
      if (r.ok) CM.ui.toast('Currículo salvo neste navegador.', { type: 'success' });
    } else if (key === 'p') {
      e.preventDefault();
      CM.print.printDocument(S.doc);
    }
  }

  function duplicateCurrent() {
    S.saveNow();
    var copy = CM.exportImport.duplicateDocument(S.doc);
    if (!copy) return;
    CM.ui.toast('Cópia "' + copy.name + '" criada em Meus currículos.', {
      type: 'success',
      action: { label: 'Abrir cópia', onClick: function () { location.hash = '#/editor/' + copy.id; } }
    });
  }

  /* ======================================================================
     Abas e visualização no celular
     ====================================================================== */
  function setTab(tab, silent) {
    activeTab = tab;
    document.querySelectorAll('[data-editor-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-editor-tab') === tab;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    dom.panelContent.hidden = tab !== 'content';
    dom.panelDesign.hidden = tab !== 'design';
    dom.panelReview.hidden = tab !== 'review';
    dom.panelJob.hidden = tab !== 'job';
    dom.panelLetters.hidden = tab !== 'letters';
    if (S.doc && tab === 'design') renderDesign();
    if (S.doc && tab === 'job' && CM.jobPanel) CM.jobPanel.render(dom.panelJob);
    if (S.doc && tab === 'letters' && CM.lettersUI) CM.lettersUI.render(dom.panelLetters);
    if (!silent) {
      var btn = document.querySelector('[data-editor-tab="' + tab + '"]');
      if (btn && document.activeElement !== btn) btn.focus();
    }
  }

  function tabKeyNav(e) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-editor-tab]'));
    var i = tabs.indexOf(e.currentTarget);
    var next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) { e.preventDefault(); setTab(next.getAttribute('data-editor-tab')); }
  }

  function setMobileView(view) {
    dom.layout.setAttribute('data-mobile', view);
    document.querySelectorAll('[data-mobile-view]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-mobile-view') === view ? 'true' : 'false');
    });
    if (view === 'preview') { renderPreview(); }
  }

  /* ======================================================================
     Campos de formulário
     ====================================================================== */
  function fieldId(path) { return 'f-' + path.replace(/[^a-zA-Z0-9_-]/g, '-'); }

  /**
   * Cria um campo com rótulo, dica e mensagem de erro acessíveis.
   * field: { key, label, type, placeholder, width, options, hint }
   */
  function buildField(field, value, path, extra) {
    extra = extra || {};
    var id = fieldId(path);
    var errId = id + '-err';
    var hintId = id + '-hint';
    var describedBy = [errId];
    if (field.hint) describedBy.push(hintId);
    var wrap = el('div', { class: 'field field--' + (field.width || 'full') + (field.type === 'checkbox' ? ' field--check' : '') });
    var control;

    if (field.type === 'checkbox') {
      control = el('input', { type: 'checkbox', id: id, attrs: { 'data-path': path } });
      control.checked = !!value;
      wrap.appendChild(el('label', { class: 'check', attrs: { for: id } }, [control, el('span', { text: field.label })]));
      return wrap;
    }

    var labelRow = el('div', { class: 'label-row' }, el('label', { class: 'label', attrs: { for: id }, text: field.label }));
    if (extra.suggestKey && CM.suggestions.textsFor(extra.suggestKey).length) {
      labelRow.appendChild(el('button', {
        class: 'link-btn', type: 'button', text: 'Ver exemplos',
        attrs: { 'aria-label': 'Ver exemplos de texto para ' + field.label, 'data-focus-key': 'sug:' + path },
        on: { click: function () { openTextSuggestions(extra.suggestKey, path, field.label); } }
      }));
    }
    wrap.appendChild(labelRow);

    var common = {
      id: id,
      attrs: {
        'data-path': path,
        'data-validate': ['email', 'url', 'tel'].indexOf(field.type) !== -1 ? field.type : null,
        'aria-describedby': describedBy.join(' '),
        placeholder: field.placeholder || null,
        autocomplete: field.autocomplete || 'off',
        maxlength: field.type === 'textarea' ? V.LIMITS.MAX_TEXT : V.LIMITS.MAX_SHORT,
        spellcheck: field.type === 'email' || field.type === 'url' ? 'false' : null,
        inputmode: field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'tel' ? 'tel' : null
      }
    };

    if (field.type === 'textarea') {
      control = el('textarea', Object.assign({ class: 'input textarea' }, common));
      control.rows = extra.rows || 3;
      control.value = value || '';
    } else if (field.type === 'select') {
      control = el('select', Object.assign({ class: 'input select' }, common));
      (field.options || []).forEach(function (o) {
        var opt = el('option', { text: o.label, attrs: { value: o.value } });
        control.appendChild(opt);
      });
      control.value = value || '';
    } else {
      // e-mail/url usam type="text" com validação própria para aceitar "github.com/usuario"
      control = el('input', Object.assign({ class: 'input', type: field.type === 'tel' ? 'tel' : 'text' }, common));
      control.value = value || '';
    }
    if (extra.disabled) control.disabled = true;
    wrap.appendChild(control);
    if (field.hint) wrap.appendChild(el('p', { class: 'field-hint', id: hintId, text: field.hint }));
    var err = el('p', { class: 'field-error', id: errId, attrs: { 'aria-live': 'polite' } });
    wrap.appendChild(err);
    // Mostra erro já existente (ex.: dado importado inválido)
    var msg = V.fieldError(field.type, value);
    if (msg) { err.textContent = msg; control.setAttribute('aria-invalid', 'true'); }
    return wrap;
  }

  function autoGrow(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight + 2, 600) + 'px';
  }

  function validateControl(ctrl, showMessage) {
    var type = ctrl.getAttribute('data-validate');
    if (!type) return;
    var msg = V.fieldError(type, ctrl.value);
    var err = document.getElementById(ctrl.id + '-err');
    if (!msg) {
      ctrl.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    } else if (showMessage) {
      ctrl.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    }
  }

  function applyPath(path, value, opts) {
    var parts = path.split(':');
    if (parts[0] === 'p') A.setPersonal(parts[1], value);
    else if (parts[0] === 's' && parts[2] === 'title') {
      A.setSectionTitle(parts[1], value);
      var t = document.querySelector('[data-sec-title="' + parts[1] + '"]');
      if (t) t.textContent = value || 'Seção sem título';
    } else if (parts[0] === 's' && parts[2] === 'content') A.setSectionContent(parts[1], value, opts);
    else if (parts[0] === 'i') {
      A.setItemField(parts[1], parts[2], parts[3], value, opts);
      refreshItemHeader(parts[1], parts[2]);
    }
  }

  function onFieldInput(e) {
    var t = e.target;
    var path = t.getAttribute && t.getAttribute('data-path');
    if (!path || t.type === 'checkbox' || t.tagName === 'SELECT') return;
    if (t.tagName === 'TEXTAREA') autoGrow(t);
    applyPath(path, t.value);
    validateControl(t, false);
  }

  function onFieldChange(e) {
    var t = e.target;
    var path = t.getAttribute && t.getAttribute('data-path');
    if (!path) return;
    if (t.type === 'checkbox') {
      applyPath(path, t.checked, { noCoalesce: true });
      // "Atual" desativa o campo de término
      var parts = path.split(':');
      if (parts[0] === 'i' && parts[3] === 'current') {
        var end = document.getElementById(fieldId('i:' + parts[1] + ':' + parts[2] + ':end'));
        if (end) end.disabled = t.checked;
      }
    } else if (t.tagName === 'SELECT') {
      applyPath(path, t.value, { noCoalesce: true });
    }
  }

  function onFieldBlur(e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-validate')) validateControl(t, true);
  }

  /* ======================================================================
     Painel "Conteúdo"
     ====================================================================== */
  function captureFocus() {
    var a = document.activeElement;
    if (!a || !dom.panelContent.contains(a)) return null;
    return {
      key: a.getAttribute('data-focus-key') || a.getAttribute('data-path'),
      start: a.selectionStart, end: a.selectionEnd
    };
  }

  function restoreFocus(f) {
    if (!f || !f.key) return;
    var sel = '[data-focus-key="' + cssEscape(f.key) + '"], [data-path="' + cssEscape(f.key) + '"]';
    var target = dom.panelContent.querySelector(sel);
    if (target) {
      try {
        target.focus({ preventScroll: true });
        if (f.start != null && typeof target.setSelectionRange === 'function' && /^(text|tel|search|url|email)$|^$/.test(target.type || '')) {
          target.setSelectionRange(f.start, f.end);
        }
      } catch (e) { /* ignora */ }
    }
  }

  function cssEscape(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');
  }

  function renderContent(keepFocus) {
    var doc = S.doc;
    if (!doc) return;
    var focus = keepFocus ? captureFocus() : null;
    var scrollTop = dom.panelContent.scrollTop;
    U.clear(dom.panelContent);

    dom.panelContent.appendChild(renderTypeBanner(doc));
    dom.panelContent.appendChild(renderPersonalCard(doc));
    var list = el('div', { class: 'sec-list', attrs: { role: 'list', 'aria-label': 'Seções do currículo' } });
    doc.sections.forEach(function (sec, i) {
      list.appendChild(renderSectionCard(sec, i, doc.sections.length));
    });
    dom.panelContent.appendChild(list);
    dom.panelContent.appendChild(el('div', { class: 'add-section-row' }, [
      el('button', {
        class: 'btn btn--secondary btn--block', type: 'button',
        attrs: { 'data-focus-key': 'add-section' },
        on: { click: openAddSection }
      }, [U.icon('plus'), 'Adicionar seção'])
    ]));

    dom.panelContent.scrollTop = scrollTop;
    dom.panelContent.querySelectorAll('textarea').forEach(autoGrow);
    if (focus) restoreFocus(focus);
  }

  function renderTypeBanner(doc) {
    var type = C.TYPES[doc.type] || C.TYPES.custom;
    var box = el('div', { class: 'type-banner' }, [
      el('div', { class: 'type-banner-main' }, [
        el('span', { class: 'type-banner-icon' }, U.icon(type.icon)),
        el('div', {}, [
          el('p', { class: 'type-banner-label', text: 'Finalidade · ' + CM.countries.get(doc.country).name }),
          el('p', { class: 'type-banner-name', text: type.label + (doc.country !== 'BR' ? ' — ' + CM.countryRules.purposeConfig(doc.country, doc.type).docLabel : '') })
        ]),
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Trocar finalidade', attrs: { 'data-focus-key': 'change-type' }, on: { click: openChangeType } })
      ])
    ]);
    if (settings().showTips) {
      var prof = CM.countries.get(doc.country);
      var cfg = CM.countryRules.purposeConfig(doc.country, doc.type);
      // Brasil mantém as dicas originais do tipo; outros países mostram as dicas do perfil.
      var tips = doc.country === 'BR' ? (type.tips || []).slice() : (prof.tips || []).slice(0, 4);
      if (cfg.note) tips.unshift(cfg.note);
      if (cfg.pagesHint) tips.unshift(cfg.pagesHint);
      if (tips.length) {
        box.appendChild(el('ul', { class: 'type-tips' }, tips.map(function (t) {
          return el('li', {}, [U.icon('info'), el('span', { text: t })]);
        })));
      }
      if (doc.country !== 'BR') {
        box.appendChild(el('p', { class: 'type-banner-src' }, [
          el('a', { text: 'Fontes e detalhes do perfil ' + prof.name, attrs: { href: '#/ajuda/paises', 'data-country-info': prof.code } })
        ]));
      }
    }
    return box;
  }

  function cardShell(opts) {
    var isOpen = !!expanded[opts.key];
    var bodyId = 'body-' + opts.key;
    var toggle = el('button', {
      class: 'sec-toggle', type: 'button',
      attrs: { 'aria-expanded': isOpen ? 'true' : 'false', 'aria-controls': bodyId, 'data-focus-key': 'toggle:' + opts.key },
      on: {
        click: function () {
          expanded[opts.key] = !expanded[opts.key];
          var now = !!expanded[opts.key];
          toggle.setAttribute('aria-expanded', now ? 'true' : 'false');
          body.hidden = !now;
          card.classList.toggle('is-open', now);
          if (now) body.querySelectorAll('textarea').forEach(autoGrow);
        }
      }
    }, [
      U.icon('chevron', 'sec-chevron'),
      el('span', { class: 'sec-icon' }, U.icon(opts.icon)),
      el('span', { class: 'sec-name' }, [
        el('span', { class: 'sec-title', text: opts.title, attrs: { 'data-sec-title': opts.key } }),
        opts.meta ? el('span', { class: 'sec-meta' }, opts.meta) : null
      ])
    ]);
    var head = el('div', { class: 'sec-head' }, [toggle, opts.actions ? el('div', { class: 'sec-actions' }, opts.actions) : null]);
    var body = el('div', { class: 'sec-body', id: bodyId, attrs: { hidden: !isOpen } });
    var card = el('section', {
      class: 'sec-card' + (isOpen ? ' is-open' : '') + (opts.muted ? ' is-muted' : ''),
      attrs: { 'data-card': opts.key, role: opts.role || null, 'aria-label': opts.title }
    }, [head, body]);
    return { card: card, body: body };
  }

  function renderPersonalCard(doc) {
    var type = C.TYPES[doc.type] || C.TYPES.custom;
    var R = CM.countryRules;
    var prof = CM.countries.get(doc.country);
    var base = C.PERSONAL_FIELDS.filter(function (f) { return !f.extra; });
    var filled = base.filter(function (f) { return !U.isBlank(doc.personal[f.key]); }).length;
    var shell = cardShell({
      key: 'personal', title: 'Dados pessoais e contato', icon: 'user',
      meta: el('span', { text: filled + ' de ' + base.length + ' preenchidos' })
    });
    var grid = el('div', { class: 'form-grid' });
    base.forEach(function (f) {
      var field = Object.assign({}, f);
      if (f.key === 'headline') field.placeholder = type.headline;
      if (f.key === 'phone') {
        if (doc.country !== 'BR' && prof.phone) field.placeholder = prof.phone.example;
        if (doc.type === 'school' || doc.type === 'academic') field.hint = 'Opcional — informe apenas quando for apropriado.';
        else if (doc.country !== 'BR') field.hint = 'Use o código internacional (ex.: +55 para números do Brasil).';
      }
      if (f.key === 'location' && doc.country !== 'BR') { field.label = 'Cidade e país/região'; field.hint = prof.location || ''; field.placeholder = ''; }
      if (f.key === 'website' && doc.country !== 'BR') field.label = 'Site ou portfólio';
      grid.appendChild(buildField(field, doc.personal[f.key], 'p:' + f.key));
    });
    shell.body.appendChild(grid);

    // Campos adicionais conforme a política do país (nada é obrigatório)
    var extras = C.PERSONAL_FIELDS.filter(function (f) { return f.extra; });
    var visible = extras.filter(function (f) {
      var pol = R.fieldPolicy(doc.country, f.key);
      return showAllExtras || pol === 'recommended' || pol === 'optional' || !U.isBlank(doc.personal[f.key]);
    });
    var hiddenCount = extras.length - visible.length;
    var xgrid = el('div', { class: 'form-grid' });
    visible.forEach(function (f) {
      var pol = R.fieldPolicy(doc.country, f.key);
      var wrap = buildField(Object.assign({}, f, { hint: R.POLICY_LABELS[pol] + (f.sensitive ? ' · dado pessoal: inclua só se necessário' : '') }), doc.personal[f.key], 'p:' + f.key);
      wrap.classList.add('field--policy-' + pol);
      xgrid.appendChild(wrap);
    });
    var xblock = el('div', { class: 'extras-block' }, [
      el('h3', { class: 'extras-title', text: 'Dados adicionais (opcionais para ' + prof.name + ')' }),
      visible.length ? xgrid : el('p', { class: 'muted small', text: 'Para ' + prof.name + ', nenhum dado pessoal adicional é recomendado.' }),
      hiddenCount || showAllExtras ? el('button', {
        class: 'link-btn', type: 'button', attrs: { 'data-focus-key': 'extras-toggle', 'aria-expanded': showAllExtras ? 'true' : 'false' },
        text: showAllExtras ? 'Ocultar campos não usados neste país' : 'Mostrar outros campos (' + hiddenCount + ') — normalmente não usados em ' + prof.name,
        on: { click: function () { showAllExtras = !showAllExtras; renderContent(); focusKey('extras-toggle'); } }
      }) : null
    ]);
    shell.body.appendChild(xblock);
    shell.body.appendChild(CM.photo.control(doc, function () { renderContent(true); }));

    var privacy = doc.country === 'BR'
      ? 'Não é necessário informar CPF, RG, foto, estado civil ou endereço completo. Inclua somente o que o processo seletivo pedir.'
      : ((prof.warnings || [])[0] || 'Inclua apenas os dados pessoais pedidos pelo processo seletivo.') + ' Estas são convenções, não exigências legais.';
    shell.body.appendChild(el('p', { class: 'privacy-note' }, [U.icon('shield'), el('span', { text: privacy })]));
    return shell.card;
  }

  function sectionMeta(sec) {
    var schema = C.getSchema(sec.kind);
    var has = C.sectionHasContent(sec);
    var parts = [];
    if (schema.kind === 'items') {
      var n = (sec.items || []).filter(function (it) { return C.itemHasContent(it, sec.kind); }).length;
      parts.push(el('span', { text: U.plural(n, 'item', 'itens') }));
    } else if (schema.kind === 'tags') {
      parts.push(el('span', { text: U.plural((sec.tags || []).length, 'item', 'itens') }));
    }
    if (!has) parts.push(el('span', { class: 'badge badge--muted', text: 'Vazia' }));
    if (!sec.visible) parts.push(el('span', { class: 'badge badge--warn', text: 'Oculta' }));
    return parts;
  }

  function renderSectionCard(sec, index, total) {
    var def = C.getKind(sec.kind);
    var schema = C.getSchema(sec.kind);
    var actions = [
      U.iconButton('arrow-up', 'Mover seção "' + sec.title + '" para cima', {
        attrs: { disabled: index === 0, 'data-focus-key': 'sec-up:' + sec.id },
        on: { click: function () { A.moveSection(sec.id, -1); focusAfter('sec-up:' + sec.id, 'sec-down:' + sec.id); } }
      }),
      U.iconButton('arrow-down', 'Mover seção "' + sec.title + '" para baixo', {
        attrs: { disabled: index === total - 1, 'data-focus-key': 'sec-down:' + sec.id },
        on: { click: function () { A.moveSection(sec.id, 1); focusAfter('sec-down:' + sec.id, 'sec-up:' + sec.id); } }
      }),
      U.iconButton(sec.visible ? 'eye' : 'eye-off', sec.visible ? 'Ocultar seção "' + sec.title + '" do currículo' : 'Mostrar seção "' + sec.title + '" no currículo', {
        attrs: { 'aria-pressed': sec.visible ? 'false' : 'true', 'data-focus-key': 'sec-vis:' + sec.id },
        on: { click: function () { A.toggleSection(sec.id); focusAfter('sec-vis:' + sec.id); } }
      }),
      U.iconButton('copy', 'Duplicar seção "' + sec.title + '"', {
        attrs: { 'data-focus-key': 'sec-dup:' + sec.id },
        on: {
          click: function () {
            var nid = A.duplicateSection(sec.id);
            if (nid) { expanded[nid] = true; renderContent(); focusKey('toggle:' + nid); CM.ui.toast('Seção duplicada.', { type: 'success' }); }
          }
        }
      }),
      U.iconButton('trash', 'Excluir seção "' + sec.title + '"', {
        class: 'btn-icon--danger',
        on: { click: function () { deleteSection(sec); } }
      })
    ];

    var shell = cardShell({
      key: sec.id, title: sec.title || 'Seção sem título', icon: def.icon || 'file',
      meta: sectionMeta(sec), actions: actions, muted: !sec.visible, role: 'listitem'
    });
    var body = shell.body;

    body.appendChild(buildField({ key: 'title', label: 'Título da seção', type: 'text', width: 'full' }, sec.title, 's:' + sec.id + ':title'));
    if (settings().showTips && def.hint) body.appendChild(el('p', { class: 'sec-hint' }, [U.icon('info'), el('span', { text: def.hint })]));

    if (schema.kind === 'text') {
      var key = sec.kind === 'summary' ? CM.suggestions.summaryKeyFor(S.doc) : def.suggest;
      body.appendChild(buildField({
        key: 'content', label: 'Texto', type: 'textarea', width: 'full',
        placeholder: def.placeholder || '', hint: 'Dica: comece uma linha com "-" para criar um tópico.'
      }, sec.content, 's:' + sec.id + ':content', { suggestKey: key, rows: 4 }));
    } else if (schema.kind === 'tags') {
      body.appendChild(renderTagsEditor(sec, def));
    } else {
      body.appendChild(renderItems(sec, def, schema));
    }
    if (!C.sectionHasContent(sec)) {
      body.appendChild(el('p', { class: 'empty-note' }, [U.icon('info'), el('span', { text: 'Seção vazia: ela não aparece no currículo até ser preenchida.' })]));
    }
    return shell.card;
  }

  function renderItems(sec, def, schema) {
    var wrap = el('div', { class: 'items' });
    var fields = C.fieldsFor(sec.kind);
    (sec.items || []).forEach(function (it, idx) {
      wrap.appendChild(renderItem(sec, def, fields, it, idx, sec.items.length));
    });
    var row = el('div', { class: 'items-actions' }, [
      el('button', {
        class: 'btn btn--ghost btn--sm', type: 'button', attrs: { 'data-focus-key': 'add-item:' + sec.id },
        on: {
          click: function () {
            var nid = A.addItem(sec.id);
            if (nid) {
              var firstKey = fields[0].key;
              focusKey('i:' + sec.id + ':' + nid + ':' + firstKey);
            }
          }
        }
      }, [U.icon('plus'), 'Adicionar item'])
    ]);
    if (schema.dateKeys && (sec.items || []).length > 1) {
      row.appendChild(el('button', {
        class: 'btn btn--ghost btn--sm', type: 'button', attrs: { 'data-focus-key': 'sort:' + sec.id },
        on: {
          click: function () {
            A.sortItemsByDate(sec.id);
            focusKey('sort:' + sec.id);
            CM.ui.toast('Itens ordenados do mais recente para o mais antigo. Use Ctrl+Z para desfazer.', { type: 'success' });
          }
        }
      }, [U.icon('sort'), 'Ordenar por data']));
    }
    wrap.appendChild(row);
    return wrap;
  }

  function itemLabel(sec, it, idx) {
    var schema = C.getSchema(sec.kind);
    var parts = (schema.titleKeys || []).map(function (k) { return it[k]; }).filter(function (v) { return !U.isBlank(v); });
    return (idx + 1) + '. ' + (parts.length ? parts.join(' — ') : 'Novo item (vazio)');
  }

  function refreshItemHeader(sid, iid) {
    var sec = S.findSection(sid);
    if (!sec) return;
    var idx = (sec.items || []).findIndex(function (x) { return x.id === iid; });
    var node = document.querySelector('[data-item-label="' + iid + '"]');
    if (node && idx !== -1) node.textContent = itemLabel(sec, sec.items[idx], idx);
  }

  function renderItem(sec, def, fields, it, idx, total) {
    var collapsed = !!collapsedItems[it.id];
    var bodyId = 'item-body-' + it.id;
    var labelText = itemLabel(sec, it, idx);
    var toggle = el('button', {
      class: 'item-toggle', type: 'button',
      attrs: { 'aria-expanded': collapsed ? 'false' : 'true', 'aria-controls': bodyId, 'data-focus-key': 'item-toggle:' + it.id },
      on: {
        click: function () {
          collapsedItems[it.id] = !collapsedItems[it.id];
          var c = !!collapsedItems[it.id];
          toggle.setAttribute('aria-expanded', c ? 'false' : 'true');
          ibody.hidden = c;
          if (!c) ibody.querySelectorAll('textarea').forEach(autoGrow);
        }
      }
    }, [U.icon('chevron', 'sec-chevron'), el('span', { class: 'item-label', text: labelText, attrs: { 'data-item-label': it.id } })]);

    var actions = el('div', { class: 'item-actions' }, [
      U.iconButton('arrow-up', 'Mover item para cima', {
        attrs: { disabled: idx === 0, 'data-focus-key': 'it-up:' + it.id },
        on: { click: function () { A.moveItem(sec.id, it.id, -1); focusAfter('it-up:' + it.id, 'it-down:' + it.id); } }
      }),
      U.iconButton('arrow-down', 'Mover item para baixo', {
        attrs: { disabled: idx === total - 1, 'data-focus-key': 'it-down:' + it.id },
        on: { click: function () { A.moveItem(sec.id, it.id, 1); focusAfter('it-down:' + it.id, 'it-up:' + it.id); } }
      }),
      U.iconButton('copy', 'Duplicar item', {
        attrs: { 'data-focus-key': 'it-dup:' + it.id },
        on: { click: function () { var nid = A.duplicateItem(sec.id, it.id); if (nid) focusKey('item-toggle:' + nid); } }
      }),
      U.iconButton('trash', 'Excluir item', { class: 'btn-icon--danger', on: { click: function () { deleteItem(sec, it); } } })
    ]);

    var grid = el('div', { class: 'form-grid' });
    var abroad = S.doc && S.doc.country !== 'BR';
    fields.forEach(function (f) {
      var path = 'i:' + sec.id + ':' + it.id + ':' + f.key;
      var extra = {};
      // Fora do Brasil, "UF" não se aplica
      if (abroad && /UF/.test(f.label || '')) f = Object.assign({}, f, { label: f.label.replace('Cidade/UF', 'Cidade e país').replace('/UF', '') });
      if (abroad && /UF/.test(f.placeholder || '')) f = Object.assign({}, f, { placeholder: '' });
      if (f.type === 'textarea') {
        extra.suggestKey = def.suggest;
        extra.rows = 3;
        f = Object.assign({}, f, { hint: f.hint || 'Uma informação por linha. Use "-" no início para tópicos.' });
      }
      if (f.key === 'end' && it.current) extra.disabled = true;
      var fieldNode = buildField(f, it[f.key], path, extra);
      if (f.type === 'textarea' && CM.writingAssistant && CM.writingAssistant.KINDS.indexOf(sec.kind) !== -1) {
        fieldNode.appendChild(el('button', {
          class: 'link-btn wa-btn', type: 'button', attrs: { 'data-focus-key': 'wa:' + path },
          on: { click: function () { openWritingAssistant(path); } }
        }, [U.icon('spark'), 'Ajuda para descrever uma conquista']));
      }
      grid.appendChild(fieldNode);
    });
    var ibody = el('div', { class: 'item-body', id: bodyId, attrs: { hidden: collapsed } }, grid);
    return el('div', { class: 'item-card' }, [el('div', { class: 'item-head' }, [toggle, actions]), ibody]);
  }

  /** Assistente de resultados: monta um tópico só com o que a pessoa informar. */
  function openWritingAssistant(path) {
    CM.writingAssistant.open({ locale: S.doc.locale }).then(function (line) {
      if (!line) return;
      var ctrl = dom.panelContent.querySelector('[data-path="' + cssEscape(path) + '"]');
      if (!ctrl) return;
      var v = U.isBlank(ctrl.value) ? line : ctrl.value.replace(/\s+$/, '') + '\n' + line;
      ctrl.value = v;
      applyPath(path, v, { noCoalesce: true });
      autoGrow(ctrl);
      ctrl.focus();
      CM.ui.toast('Tópico inserido. Revise o texto antes de enviar.', { type: 'success' });
    });
  }

  /* ---------------- Editor de listas (habilidades, interesses) ---------------- */
  function renderTagsEditor(sec, def) {
    var inputId = fieldId('tags:' + sec.id);
    var listNode = el('ul', { class: 'tags-list', attrs: { 'aria-label': 'Itens de ' + sec.title } });
    var input = el('input', {
      class: 'input', id: inputId, type: 'text',
      attrs: { placeholder: 'Digite e pressione Enter', maxlength: 120, autocomplete: 'off', 'data-focus-key': 'tags:' + sec.id }
    });

    function current() { var s = S.findSection(sec.id); return s ? (s.tags || []).slice() : []; }
    function drawChips() {
      U.clear(listNode);
      current().forEach(function (t, i) {
        listNode.appendChild(el('li', { class: 'tag-chip' }, [
          el('span', { text: t }),
          U.iconButton('close', 'Remover "' + t + '"', {
            class: 'tag-remove',
            on: {
              click: function () {
                var arr = current(); arr.splice(i, 1);
                A.setTags(sec.id, arr); drawChips(); input.focus();
                CM.ui.announce('"' + t + '" removido');
              }
            }
          })
        ]));
      });
      if (!current().length) listNode.appendChild(el('li', { class: 'tags-empty', text: 'Nenhum item adicionado.' }));
    }
    function addValues(raw) {
      var values = String(raw).split(/[,;\n]/).map(function (v) { return v.trim(); }).filter(Boolean);
      if (!values.length) return;
      var arr = current();
      var lower = arr.map(function (x) { return x.toLowerCase(); });
      var added = 0;
      values.forEach(function (v) {
        v = v.slice(0, 120);
        if (lower.indexOf(v.toLowerCase()) === -1) { arr.push(v); lower.push(v.toLowerCase()); added++; }
      });
      if (added) { A.setTags(sec.id, arr); drawChips(); CM.ui.announce(U.plural(added, 'item adicionado', 'itens adicionados')); }
      input.value = '';
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addValues(input.value); }
    });
    input.addEventListener('paste', function (e) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (/[,;\n]/.test(text)) { e.preventDefault(); addValues(text); }
    });
    input.addEventListener('blur', function () { if (!U.isBlank(input.value)) addValues(input.value); });
    drawChips();

    var labelRow = el('div', { class: 'label-row' }, el('label', { class: 'label', attrs: { for: inputId }, text: 'Adicionar item' }));
    if (def.suggest && CM.suggestions.tagsFor(def.suggest).length) {
      labelRow.appendChild(el('button', {
        class: 'link-btn', type: 'button', text: 'Ver sugestões',
        on: { click: function () { openTagSuggestions(sec, def.suggest, drawChips); } }
      }));
    }
    return el('div', { class: 'tags-editor' }, [
      labelRow,
      el('div', { class: 'tags-input-row' }, [
        input,
        el('button', { class: 'btn btn--secondary btn--sm', type: 'button', text: 'Adicionar', on: { click: function () { addValues(input.value); input.focus(); } } })
      ]),
      el('p', { class: 'field-hint', text: 'Separe vários itens com vírgula. Eles aparecem no currículo na ordem em que foram adicionados.' }),
      listNode
    ]);
  }

  /* ---------------- Foco após re-renderização ---------------- */
  function focusKey(key) {
    setTimeout(function () {
      var t = dom.panelContent.querySelector('[data-focus-key="' + cssEscape(key) + '"], [data-path="' + cssEscape(key) + '"]');
      if (t) { t.focus({ preventScroll: false }); if (t.scrollIntoView) t.scrollIntoView({ block: 'nearest' }); }
    }, 0);
  }
  /** Foca o botão; se estiver desativado (ex.: chegou ao topo), foca a alternativa. */
  function focusAfter(key, fallback) {
    setTimeout(function () {
      var t = dom.panelContent.querySelector('[data-focus-key="' + cssEscape(key) + '"]');
      if ((!t || t.disabled) && fallback) t = dom.panelContent.querySelector('[data-focus-key="' + cssEscape(fallback) + '"]');
      if (t) t.focus();
    }, 0);
  }

  /* ---------------- Exclusões com confirmação ---------------- */
  function deleteSection(sec) {
    var has = C.sectionHasContent(sec);
    var proceed = has
      ? CM.ui.confirm({
        title: 'Excluir seção?',
        message: 'A seção "' + sec.title + '" e todo o seu conteúdo serão removidos deste currículo. Você pode desfazer logo em seguida (Ctrl+Z).',
        confirmLabel: 'Excluir seção', danger: true
      })
      : Promise.resolve(true);
    proceed.then(function (ok) {
      if (!ok) return;
      A.removeSection(sec.id);
      CM.ui.toast('Seção "' + sec.title + '" excluída.', { type: 'success', action: { label: 'Desfazer', onClick: doUndo } });
      focusKey('add-section');
    });
  }

  function deleteItem(sec, it) {
    var has = C.itemHasContent(it, sec.kind);
    var proceed = has && settings().confirmItemDelete
      ? CM.ui.confirm({ title: 'Excluir item?', message: 'Este item será removido da seção "' + sec.title + '".', confirmLabel: 'Excluir item', danger: true })
      : Promise.resolve(true);
    proceed.then(function (ok) {
      if (!ok) return;
      A.removeItem(sec.id, it.id);
      CM.ui.toast('Item excluído.', { type: 'success', action: { label: 'Desfazer', onClick: doUndo } });
      focusKey('add-item:' + sec.id);
    });
  }

  /* ---------------- Diálogo: adicionar seção ---------------- */
  function openAddSection() {
    var doc = S.doc;
    var present = {};
    doc.sections.forEach(function (s) { present[s.kind] = true; });
    var body = el('div', { class: 'kind-groups' });
    var finishRef = null;
    C.GROUPS.forEach(function (g) {
      var kinds = Object.keys(C.KINDS).filter(function (k) { return C.KINDS[k].group === g.id; });
      var grid = el('div', { class: 'kind-grid' });
      kinds.forEach(function (k) {
        var def = C.KINDS[k];
        grid.appendChild(el('button', {
          class: 'kind-option', type: 'button',
          attrs: { 'aria-label': 'Adicionar seção ' + def.title + (present[k] ? ' (já existe no currículo)' : '') },
          on: { click: function () { if (finishRef) finishRef(k); } }
        }, [
          el('span', { class: 'kind-icon' }, U.icon(def.icon || 'file')),
          el('span', { class: 'kind-title', text: def.title }),
          present[k] ? el('span', { class: 'badge badge--muted', text: 'Já adicionada' }) : null
        ]));
      });
      body.appendChild(el('div', { class: 'kind-group' }, [el('h3', { class: 'kind-group-title', text: g.label }), grid]));
    });
    CM.ui.modal({
      title: 'Adicionar seção',
      description: 'Escolha o tipo de seção. Ela será adicionada ao final e você pode reordená-la depois.',
      body: body, size: 'lg',
      onOpen: function (dlg, finish) { finishRef = finish; },
      actions: [{ label: 'Cancelar', value: null, variant: 'ghost' }]
    }).then(function (kind) {
      if (!kind) return;
      var sid = A.addSection(kind);
      expanded[sid] = true;
      renderContent();
      focusKey('s:' + sid + ':title');
      var card = dom.panelContent.querySelector('[data-card="' + sid + '"]');
      if (card && card.scrollIntoView) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
      CM.ui.toast('Seção "' + C.KINDS[kind].title + '" adicionada.', { type: 'success' });
    });
  }

  /* ---------------- Diálogo: trocar tipo ---------------- */
  function openChangeType() {
    var doc = S.doc;
    var selected = doc.type;
    var radios = el('div', { class: 'type-radio-list', attrs: { role: 'radiogroup', 'aria-label': 'Tipos de currículo' } });
    CM.countryRules.purposesFor(doc.country).forEach(function (t) {
      var type = C.TYPES[t];
      var id = 'ct-' + t;
      var input = el('input', { type: 'radio', id: id, attrs: { name: 'change-type', value: t } });
      input.checked = t === doc.type;
      input.addEventListener('change', function () { selected = t; });
      radios.appendChild(el('label', { class: 'type-radio', attrs: { for: id } }, [
        input,
        el('span', { class: 'type-radio-text' }, [el('strong', { text: type.label }), el('span', { text: type.description })])
      ]));
    });
    var optTemplate = el('input', { type: 'checkbox', id: 'ct-template' }); optTemplate.checked = true;
    var optReorder = el('input', { type: 'checkbox', id: 'ct-reorder' });
    var optRemove = el('input', { type: 'checkbox', id: 'ct-remove' });
    var body = el('div', {}, [
      el('div', { class: 'callout callout--info' }, [
        U.icon('info'),
        el('div', {}, [
          el('p', { text: 'Nenhuma informação preenchida será apagada.' }),
          el('p', { text: 'As seções sugeridas para o novo tipo que ainda não existem serão adicionadas vazias — elas só aparecem no currículo depois de preenchidas.' })
        ])
      ]),
      radios,
      el('fieldset', { class: 'fieldset' }, [
        el('legend', { text: 'Opções' }),
        el('label', { class: 'check', attrs: { for: 'ct-template' } }, [optTemplate, el('span', { text: 'Aplicar o modelo recomendado para o novo tipo neste país' })]),
        el('label', { class: 'check', attrs: { for: 'ct-reorder' } }, [optReorder, el('span', { text: 'Reorganizar a ordem das seções conforme o novo tipo' })]),
        el('label', { class: 'check', attrs: { for: 'ct-remove' } }, [optRemove, el('span', { text: 'Remover seções VAZIAS que não fazem parte do novo tipo' })])
      ])
    ]);
    CM.ui.modal({
      title: 'Trocar finalidade do currículo', body: body, size: 'lg',
      actions: [
        { label: 'Cancelar', value: null, variant: 'ghost' },
        { label: 'Aplicar', variant: 'primary', submit: true, value: function () { return selected; } }
      ]
    }).then(function (t) {
      if (!t) return;
      A.changeType(t, { applyTemplate: optTemplate.checked, reorder: optReorder.checked, removeEmpty: optRemove.checked });
      renderDesign();
      CM.ui.toast('Tipo alterado para "' + C.TYPES[t].label + '". Seus dados foram preservados.', { type: 'success', action: { label: 'Desfazer', onClick: doUndo } });
    });
  }

  /* ---------------- Diálogos de sugestões ---------------- */
  /** Os exemplos existem apenas em português do Brasil: avisa quando o documento está em outro idioma. */
  function langNote() {
    var loc = (S.doc && S.doc.locale) || 'pt-BR';
    if (loc === 'pt-BR') return null;
    var msg = loc === 'pt-PT'
      ? 'Os exemplos foram escritos em português do Brasil. Adapte ao português europeu (ex.: "equipa", "telemóvel") antes de usar.'
      : 'Os exemplos estão em português. Seu documento está em ' + CM.l10n.localeName(loc) + ': use-os só como ideia e escreva o texto no idioma do documento. O CM Studio não traduz automaticamente.';
    return el('div', { class: 'callout callout--info' }, [U.icon('info'), el('p', { text: msg })]);
  }

  function openTextSuggestions(key, path, label) {
    var texts = CM.suggestions.textsFor(key);
    var finishRef = null;
    var list = el('ul', { class: 'suggest-list' }, texts.map(function (t, i) {
      return el('li', { class: 'suggest-item' }, [
        el('p', { class: 'suggest-text', text: t }),
        el('div', { class: 'suggest-actions' }, [
          el('button', { class: 'btn btn--secondary btn--sm', type: 'button', text: 'Inserir no campo', attrs: { 'aria-label': 'Inserir exemplo ' + (i + 1) + ' no campo' }, on: { click: function () { finishRef(t); } } })
        ])
      ]);
    }));
    CM.ui.modal({
      title: 'Exemplos para "' + label + '"',
      body: [
        el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('p', { text: 'São apenas modelos. Substitua os trechos entre [colchetes] por informações verdadeiras sobre você e apague o que não se aplicar.' })]),
        langNote(),
        list
      ],
      size: 'lg',
      onOpen: function (d, finish) { finishRef = finish; },
      actions: [{ label: 'Fechar', value: null, variant: 'ghost' }]
    }).then(function (text) {
      if (!text) return;
      var ctrl = dom.panelContent.querySelector('[data-path="' + cssEscape(path) + '"]');
      if (!ctrl) return;
      var newValue = U.isBlank(ctrl.value) ? text : ctrl.value.replace(/\s+$/, '') + '\n' + text;
      ctrl.value = newValue;
      applyPath(path, newValue, { noCoalesce: true });
      autoGrow(ctrl);
      ctrl.focus();
      var pos = newValue.indexOf('[');
      if (pos !== -1 && ctrl.setSelectionRange) {
        var endPos = newValue.indexOf(']', pos);
        ctrl.setSelectionRange(pos, endPos + 1);
      }
      CM.ui.toast('Exemplo inserido. Edite os trechos entre colchetes.', { type: 'info' });
    });
  }

  function openTagSuggestions(sec, key, redraw) {
    var tags = CM.suggestions.tagsFor(key);
    var grid = el('div', { class: 'suggest-tags' });
    function draw() {
      U.clear(grid);
      var s = S.findSection(sec.id);
      var cur = (s && s.tags || []).map(function (x) { return x.toLowerCase(); });
      tags.forEach(function (t) {
        var on = cur.indexOf(t.toLowerCase()) !== -1;
        grid.appendChild(el('button', {
          class: 'chip-toggle' + (on ? ' is-on' : ''), type: 'button',
          attrs: { 'aria-pressed': on ? 'true' : 'false' },
          on: {
            click: function () {
              var s2 = S.findSection(sec.id);
              var arr = (s2.tags || []).slice();
              var i = arr.map(function (x) { return x.toLowerCase(); }).indexOf(t.toLowerCase());
              if (i === -1) arr.push(t); else arr.splice(i, 1);
              A.setTags(sec.id, arr);
              draw();
              redraw();
              var b = grid.querySelectorAll('button')[tags.indexOf(t)];
              if (b) b.focus();
            }
          }
        }, [U.icon(on ? 'check' : 'plus'), el('span', { text: t })]));
      });
    }
    draw();
    CM.ui.modal({
      title: 'Sugestões para "' + sec.title + '"',
      body: [
        el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('p', { text: 'Selecione apenas o que você realmente sabe fazer. Você pode remover qualquer item depois.' })]),
        langNote(),
        grid
      ],
      size: 'lg',
      actions: [{ label: 'Concluir', value: null, variant: 'primary' }]
    });
  }

  /* ======================================================================
     Painel "Design"
     ====================================================================== */
  function renderDesign() {
    var doc = S.doc;
    if (!doc) return;
    U.clear(dom.panelDesign);
    var type = C.TYPES[doc.type] || C.TYPES.custom;

    // Tipo
    dom.panelDesign.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'País, idioma e finalidade' }),
      el('div', { class: 'inline-row' }, [
        el('p', { class: 'muted', text: CM.countries.get(doc.country).name + ' · ' + CM.l10n.localeName(doc.locale) + ' · ' + type.label }),
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'País e idioma', on: { click: function () { CM.editorContext.openDocSettings('country', contextHandlers); } } }),
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Trocar finalidade', on: { click: openChangeType } })
      ])
    ]));

    // Modelos (recomendados e compatíveis com o país; os demais sob demanda)
    var groups = CM.countryRules.templatesFor(doc.country, doc.type);
    var profName = CM.countries.get(doc.country).name;
    var tplGroup = el('div', { class: 'tpl-options', attrs: { role: 'radiogroup', 'aria-label': 'Modelo visual' } });
    var shown = groups.recommended.concat(groups.compatible).concat(showAllTemplates ? groups.other : []);
    if (shown.indexOf(doc.template) === -1) shown.push(doc.template);
    shown.forEach(function (tid) {
      var t = CM.templates.get(tid);
      var id = 'tpl-opt-' + t.id;
      var input = el('input', { type: 'radio', id: id, attrs: { name: 'tpl', value: t.id } });
      input.checked = doc.template === t.id;
      input.addEventListener('change', function () {
        A.setTemplate(t.id);
        renderDesign();
        var again = document.getElementById(id);
        if (again) again.focus();
        CM.ui.announce('Modelo ' + t.name + ' aplicado. Seus dados foram preservados.');
      });
      var badge = groups.recommended.indexOf(t.id) !== -1 ? el('span', { class: 'badge badge--accent', text: 'Recomendado para ' + profName })
        : groups.other.indexOf(t.id) !== -1 ? el('span', { class: 'badge badge--warn', text: 'De outro país' }) : null;
      tplGroup.appendChild(el('label', { class: 'tpl-option', attrs: { for: id } }, [
        input,
        el('span', { class: 'tpl-swatch tpl-swatch--' + t.id, attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'tpl-option-text' }, [
          el('strong', {}, [t.name, badge]),
          el('span', { text: t.description })
        ])
      ]));
    });
    var showAll = el('input', { type: 'checkbox', id: 'opt-alltpl' });
    showAll.checked = showAllTemplates;
    showAll.addEventListener('change', function () { showAllTemplates = showAll.checked; renderDesign(); var x = $('opt-alltpl'); if (x) x.focus(); });
    dom.panelDesign.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'Modelo visual' }),
      el('p', { class: 'muted small', text: 'Trocar o modelo muda a aparência e a estrutura impressa: nenhum dado é perdido.' }),
      tplGroup,
      groups.other.length ? el('label', { class: 'check', attrs: { for: 'opt-alltpl' } }, [showAll, el('span', { text: 'Mostrar também modelos específicos de outros países (' + groups.other.length + ')' })]) : null
    ]));

    // Papel
    var R = CM.countryRules;
    var defPaper = R.paperFor(doc.country);
    var curPaper = doc.design.paper === 'Letter' ? 'Letter' : 'A4';
    var paperBlock = segmentedCustom('Tamanho do papel', 'paper', [['A4', 'A4 (210 × 297 mm)'], ['Letter', 'Letter (216 × 279 mm)']], curPaper, function (v) { A.setPaper(v); renderDesign(); var x = $('seg-paper-' + v); if (x) x.focus(); });
    paperBlock.appendChild(el('p', { class: curPaper !== defPaper ? 'callout callout--warn' : 'muted small' }, [
      curPaper !== defPaper ? U.icon('alert') : null,
      el('span', { text: 'Padrão para ' + profName + ': ' + R.paperName(defPaper) + '.' + (curPaper !== defPaper ? ' O papel escolhido é diferente; confirme antes de imprimir ou gerar o PDF.' : '') })
    ]));
    dom.panelDesign.appendChild(paperBlock);

    // Cor
    var tpl = CM.templates.get(doc.template);
    var colorGroup = el('div', { class: 'swatches', attrs: { role: 'radiogroup', 'aria-label': 'Cor de destaque' } });
    Object.keys(CM.templates.ACCENTS).forEach(function (k) {
      var acc = CM.templates.ACCENTS[k];
      var id = 'acc-' + k;
      var input = el('input', { type: 'radio', id: id, attrs: { name: 'accent', value: k, disabled: !tpl.usesAccent } });
      input.checked = doc.design.accent === k;
      input.addEventListener('change', function () { A.setDesign('accent', k); });
      var sw = el('span', { class: 'swatch-dot', attrs: { 'aria-hidden': 'true' } });
      sw.style.background = acc.value;
      colorGroup.appendChild(el('label', { class: 'swatch', attrs: { for: id } }, [input, sw, el('span', { text: acc.label })]));
    });
    dom.panelDesign.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'Cor de destaque' }),
      !tpl.usesAccent ? el('p', { class: 'muted small', text: 'O modelo ATS não usa cores, para máxima compatibilidade.' }) : el('p', { class: 'muted small', text: 'Usada com moderação. O conteúdo continua legível em impressão preto e branco.' }),
      colorGroup
    ]));

    dom.panelDesign.appendChild(segmented('Tamanho do texto', 'fontScale', [
      ['small', 'Pequeno'], ['normal', 'Normal'], ['large', 'Grande']
    ], doc.design.fontScale));
    dom.panelDesign.appendChild(segmented('Espaçamento', 'density', [
      ['compact', 'Compacto'], ['normal', 'Normal'], ['relaxed', 'Amplo']
    ], doc.design.density));

    var pn = el('input', { type: 'checkbox', id: 'opt-pagenum' });
    pn.checked = doc.design.pageNumbers !== false;
    pn.addEventListener('change', function () { A.setDesign('pageNumbers', pn.checked); });
    dom.panelDesign.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'Páginas' }),
      el('label', { class: 'check', attrs: { for: 'opt-pagenum' } }, [pn, el('span', { text: 'Numerar páginas quando houver mais de uma' })])
    ]));

    // Elementos opcionais ligados a convenções de alguns países
    var prof = CM.countries.get(doc.country);
    var tplNow = CM.templates.get(doc.template);
    var opts = [];
    var ph = el('input', { type: 'checkbox', id: 'opt-photo' });
    ph.checked = !!doc.design.showPhoto && !!doc.personal.photo;
    ph.disabled = !doc.personal.photo;
    ph.addEventListener('change', function () { A.setDesign('showPhoto', ph.checked); });
    opts.push(el('label', { class: 'check', attrs: { for: 'opt-photo' } }, [ph, el('span', { text: 'Mostrar foto' + (doc.personal.photo ? '' : ' (adicione uma foto em Dados pessoais)') + (tplNow.photoSlot ? '' : ' — o modelo atual não exibe foto') })]));
    var sg = el('input', { type: 'checkbox', id: 'opt-signature' });
    sg.checked = !!doc.design.signature;
    sg.addEventListener('change', function () { A.setDesign('signature', sg.checked); });
    opts.push(el('label', { class: 'check', attrs: { for: 'opt-signature' } }, [sg, el('span', { text: 'Linha de local, data e assinatura no final' + (tplNow.signatureSlot ? '' : ' (exibida apenas no modelo Lebenslauf)') })]));
    var pc = el('input', { type: 'checkbox', id: 'opt-consent' });
    pc.checked = !!doc.design.privacyConsent;
    pc.addEventListener('change', function () { A.setDesign('privacyConsent', pc.checked); });
    opts.push(el('label', { class: 'check', attrs: { for: 'opt-consent' } }, [pc, el('span', { text: 'Declaração de autorização para tratamento de dados pessoais' })]));
    if (prof.privacyConsent && prof.privacyConsent.note) opts.push(el('p', { class: 'muted small', text: prof.privacyConsent.note }));
    dom.panelDesign.appendChild(el('div', { class: 'panel-block' }, [el('h3', { class: 'panel-title', text: 'Elementos opcionais' })].concat(opts)));
  }

  /** Controle segmentado com callback próprio. */
  function segmentedCustom(title, key, options, value, onPick) {
    var name = 'seg-' + key;
    var group = el('div', { class: 'segmented', attrs: { role: 'radiogroup', 'aria-label': title } });
    options.forEach(function (o) {
      var id = name + '-' + o[0];
      var input = el('input', { type: 'radio', id: id, attrs: { name: name, value: o[0] } });
      input.checked = value === o[0];
      input.addEventListener('change', function () { onPick(o[0]); });
      group.appendChild(input);
      group.appendChild(el('label', { attrs: { for: id }, text: o[1] }));
    });
    return el('div', { class: 'panel-block' }, [el('h3', { class: 'panel-title', text: title }), group]);
  }

  function segmented(title, key, options, value) {
    var name = 'seg-' + key;
    var group = el('div', { class: 'segmented', attrs: { role: 'radiogroup', 'aria-label': title } });
    options.forEach(function (o) {
      var id = name + '-' + o[0];
      var input = el('input', { type: 'radio', id: id, attrs: { name: name, value: o[0] } });
      input.checked = value === o[0];
      input.addEventListener('change', function () { A.setDesign(key, o[0]); });
      group.appendChild(input);
      group.appendChild(el('label', { attrs: { for: id }, text: o[1] }));
    });
    return el('div', { class: 'panel-block' }, [el('h3', { class: 'panel-title', text: title }), group]);
  }

  /* ======================================================================
     Pré-visualização
     ====================================================================== */
  function renderPreview() {
    if (!S.doc || !dom.stage) return;
    lastRender = CM.preview.render(S.doc, dom.stage, { placeholders: true });
    var maxP = CM.countryRules.maxPages(S.doc);
    var over = maxP && lastRender.pages > maxP;
    var paper = S.doc.design.paper === 'Letter' ? 'Letter' : 'A4';
    U.clear(dom.pageCount);
    if (over) dom.pageCount.appendChild(U.icon('alert'));
    dom.pageCount.appendChild(document.createTextNode(U.plural(lastRender.pages, 'página', 'páginas') + ' ' + paper + (over ? ' (recomendado: até ' + maxP + ')' : '')));
    dom.pageCount.classList.toggle('is-warn', !!over);
    applyZoom();
  }

  var ZOOM_STEPS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25];

  function stepZoom(dir) {
    var cur = currentScale();
    var next;
    if (dir > 0) next = ZOOM_STEPS.filter(function (z) { return z > cur + 0.01; })[0] || ZOOM_STEPS[ZOOM_STEPS.length - 1];
    else next = ZOOM_STEPS.filter(function (z) { return z < cur - 0.01; }).pop() || ZOOM_STEPS[0];
    zoom = String(Math.round(next * 100));
    applyZoom();
  }

  function currentScale() {
    if (zoom === 'fit') {
      var avail = dom.scroll.clientWidth - 40;
      var page = dom.stage.querySelector('.page');
      var pageW = page && page.offsetWidth ? page.offsetWidth : 793.7; // largura real da folha (A4 ou Letter)
      return Math.max(0.25, Math.min(1.25, avail / pageW));
    }
    return (parseInt(zoom, 10) || 100) / 100;
  }

  function applyZoom() {
    var root = dom.stage.firstElementChild;
    if (!root) return;
    var s = currentScale();
    root.style.transform = 'scale(' + s + ')';
    root.style.transformOrigin = '0 0';
    dom.stage.style.width = (root.offsetWidth * s) + 'px';
    dom.stage.style.height = (root.offsetHeight * s) + 'px';
    dom.zoomLabel.textContent = Math.round(s * 100) + '%';
  }

  /* ======================================================================
     Painel "Revisão"
     ====================================================================== */
  /** Lista combinada: verificações gerais + avisos do país/idioma/papel. */
  function reviewItems() {
    if (!S.doc) return [];
    var list = V.reviewDocument(S.doc, lastRender.pages).map(function (x) { return Object.assign({ group: 'content' }, x); });
    if (lastRender.oversize) {
      list.unshift({ level: 'warning', group: 'content', text: 'Um trecho de texto é maior que uma página inteira e pode ser cortado. Divida-o em linhas ou tópicos menores.' });
    }
    return list.concat(CM.countryRules.reviewWarnings(S.doc));
  }

  var REVIEW_GROUPS = [
    ['country', 'País de destino'], ['language', 'Idioma'], ['privacy', 'Dados pessoais e foto'],
    ['paper', 'Papel e impressão'], ['design', 'Modelo'], ['content', 'Conteúdo']
  ];

  function runReviewAction(action) {
    var R = CM.countryRules;
    switch (action) {
      case 'country-info': CM.countrySelector.openDetails(S.doc.country); break;
      case 'change-type': openChangeType(); break;
      case 'paper': CM.editorContext.openDocSettings('paper', contextHandlers); break;
      case 'language': CM.editorContext.openDocSettings('locale', contextHandlers); break;
      case 'retitle':
        var n = A.retitleAll();
        CM.ui.toast(n ? U.plural(n, 'título atualizado', 'títulos atualizados') + ' para ' + CM.l10n.localeName(S.doc.locale) + '.' : 'Nenhum título padrão para atualizar.', { type: 'success', action: n ? { label: 'Desfazer', onClick: doUndo } : null });
        break;
      case 'photo': goTo('p:fullName'); setTimeout(function () { var b = dom.panelContent.querySelector('#photo-show'); if (b) { b.scrollIntoView({ block: 'center' }); b.focus(); } }, 30); break;
      case 'template': setTab('design'); break;
      case 'consent': setTab('design'); setTimeout(function () { var c = $('opt-consent'); if (c) c.focus(); }, 30); break;
    }
  }

  var ACTION_LABELS = {
    'country-info': 'Ver fontes do perfil', 'change-type': 'Trocar finalidade', paper: 'Ajustar papel',
    language: 'Ajustar idioma', retitle: 'Atualizar títulos para o idioma', photo: 'Ir para a foto',
    template: 'Escolher modelo', consent: 'Ativar declaração'
  };

  function renderReview() {
    if (!S.doc) return;
    var list = reviewItems();
    var important = list.filter(function (x) { return x.level !== 'info'; }).length;
    dom.reviewBadge.textContent = important ? String(important) : '';
    dom.reviewBadge.hidden = !important;
    dom.reviewBadge.setAttribute('aria-label', important ? important + ' avisos' : '');

    U.clear(dom.panelReview);
    var maxP = CM.countryRules.maxPages(S.doc);
    var prof = CM.countries.get(S.doc.country);
    dom.panelReview.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'Resumo' }),
      el('ul', { class: 'stats' }, [
        el('li', {}, [el('strong', { text: String(lastRender.pages) }), el('span', { text: lastRender.pages === 1 ? ' página' : ' páginas' })]),
        el('li', {}, [el('strong', { text: String(S.doc.sections.filter(function (s) { return s.visible && C.sectionHasContent(s); }).length) }), el('span', { text: ' seções no currículo' })]),
        el('li', {}, [el('strong', { text: maxP ? 'até ' + maxP : 'livre' }), el('span', { text: ' páginas sugeridas (' + prof.name + ')' })])
      ])
    ]));

    var LEVEL = { error: ['Erro', 'alert'], warning: ['Atenção', 'alert'], info: ['Dica', 'info'] };
    var block = el('div', { class: 'panel-block' }, el('h3', { class: 'panel-title', text: 'Verificação' }));
    if (!list.length) {
      block.appendChild(el('p', { class: 'callout callout--ok' }, [U.icon('check'), el('span', { text: 'Nenhum problema encontrado. Revise o texto com calma antes de enviar.' })]));
    } else {
      REVIEW_GROUPS.forEach(function (g) {
        var items = list.filter(function (w) { return (w.group || 'content') === g[0]; });
        if (!items.length) return;
        block.appendChild(el('h4', { class: 'review-group-title', text: g[1] }));
        var ul = el('ul', { class: 'review-list' });
        items.forEach(function (w) {
          var lv = LEVEL[w.level] || LEVEL.info;
          var li = el('li', { class: 'review-item review-item--' + w.level }, [
            U.icon(lv[1]),
            el('div', {}, [
              el('strong', { class: 'review-level', text: lv[0] + ': ' }),
              el('span', { text: w.text })
            ])
          ]);
          if (w.target) {
            li.appendChild(el('button', { class: 'link-btn', type: 'button', text: 'Ir para o campo', on: { click: function () { goTo(w.target); } } }));
          } else if (w.action && ACTION_LABELS[w.action]) {
            li.appendChild(el('button', { class: 'link-btn', type: 'button', text: ACTION_LABELS[w.action], attrs: { 'data-review-action': w.action }, on: { click: function () { runReviewAction(w.action); } } }));
          }
          ul.appendChild(li);
        });
        block.appendChild(ul);
      });
    }
    dom.panelReview.appendChild(block);

    dom.panelReview.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: 'Antes de enviar' }),
      el('ul', { class: 'plain-list' }, [
        el('li', { text: 'Leia o currículo inteiro na pré-visualização e corrija erros de digitação.' }),
        el('li', { text: 'Confirme que todas as informações são verdadeiras.' }),
        el('li', { text: 'Siga as regras da vaga, instituição ou edital (formato, idioma, número de páginas). Elas valem mais que as orientações gerais do país.' }),
        el('li', { text: 'Para gerar o PDF, use "Imprimir / Salvar como PDF", escolha "Salvar como PDF" e confira o tamanho do papel (' + (S.doc.design.paper === 'Letter' ? 'Letter' : 'A4') + ').' })
      ])
    ]));
  }

  /** Leva o usuário até um campo citado na revisão. */
  function goTo(target) {
    var parts = target.split(':');
    setTab('content', true);
    setMobileView('edit');
    var key;
    if (parts[0] === 'p') { expanded.personal = true; key = target; }
    else if (parts[0] === 's') { expanded[parts[1]] = true; key = 's:' + parts[1] + ':title'; }
    else if (parts[0] === 'i') { expanded[parts[1]] = true; collapsedItems[parts[2]] = false; key = target; }
    renderContent();
    var node = dom.panelContent.querySelector('[data-path="' + cssEscape(key) + '"]');
    if (node) {
      node.scrollIntoView({ block: 'center' });
      node.focus({ preventScroll: true });
    }
  }

  CM.editor = {
    open: open,
    close: close,
    renderPreview: renderPreview,
    _goTo: goTo
  };
})();
