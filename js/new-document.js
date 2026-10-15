/* ==========================================================================
   CM Studio — new-document.js
   Criação guiada: escolha do objetivo (tipo), nome e modelo visual.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var el = U.el;

  var state = { type: 'professional', template: null, templateTouched: false };
  var bound = false;

  function render(params) {
    params = params || {};
    state.type = C.TYPES[params.tipo] ? params.tipo : 'professional';
    var preTpl = CM.templates.ids().indexOf(params.modelo) !== -1 ? params.modelo : null;
    state.template = preTpl || C.TYPES[state.type].template;
    state.templateTouched = !!preTpl;
    // Se veio de um modelo, sugere um tipo coerente
    if (preTpl && !params.tipo) {
      var match = C.TYPE_ORDER.filter(function (t) { return C.TYPES[t].template === preTpl; })[0];
      if (match) state.type = match;
    }
    document.getElementById('new-name').value = '';
    renderTypes();
    renderTemplates();
    if (!bound) {
      bound = true;
      document.getElementById('new-form').addEventListener('submit', function (e) {
        e.preventDefault();
        create();
      });
    }
  }

  function renderTypes() {
    var grid = document.getElementById('new-types');
    U.clear(grid);
    C.TYPE_ORDER.forEach(function (t) {
      var type = C.TYPES[t];
      var id = 'nt-' + t;
      var input = el('input', { type: 'radio', id: id, class: 'visually-hidden-input', attrs: { name: 'new-type', value: t } });
      input.checked = state.type === t;
      input.addEventListener('change', function () {
        state.type = t;
        if (!state.templateTouched) {
          state.template = type.template;
        }
        renderTemplates();
      });
      grid.appendChild(el('label', { class: 'type-choice', attrs: { for: id } }, [
        input,
        el('span', { class: 'type-choice-box' }, [
          el('span', { class: 'type-icon' }, U.icon(type.icon)),
          el('span', { class: 'type-text' }, [el('strong', { text: type.label }), el('span', { text: type.description })]),
          el('span', { class: 'type-check' }, U.icon('check'))
        ])
      ]));
    });
  }

  function renderTemplates() {
    var wrap = document.getElementById('new-templates');
    U.clear(wrap);
    var recommended = C.TYPES[state.type].template;
    CM.templates.list.forEach(function (t) {
      var id = 'ntpl-' + t.id;
      var input = el('input', { type: 'radio', id: id, attrs: { name: 'new-tpl', value: t.id } });
      input.checked = state.template === t.id;
      input.addEventListener('change', function () { state.template = t.id; state.templateTouched = true; });
      wrap.appendChild(el('label', { class: 'tpl-option', attrs: { for: id } }, [
        input,
        el('span', { class: 'tpl-swatch tpl-swatch--' + t.id, attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'tpl-option-text' }, [
          el('strong', {}, [t.name, t.id === recommended ? el('span', { class: 'badge badge--accent', text: 'Recomendado' }) : null]),
          el('span', { text: t.description })
        ])
      ]));
    });
  }

  function create() {
    var name = document.getElementById('new-name').value.trim();
    var doc = C.createDocument(state.type, { name: name || undefined, template: state.template });
    var r = CM.storage.saveDoc(doc);
    if (!r.ok) {
      CM.ui.toast(r.error.message, { type: 'error' });
      return;
    }
    CM.ui.toast('Currículo criado. As alterações são salvas automaticamente.', { type: 'success' });
    location.hash = '#/editor/' + encodeURIComponent(doc.id);
  }

  CM.newDocument = { render: render };
})();
