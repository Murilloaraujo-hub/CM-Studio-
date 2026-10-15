/* ==========================================================================
   CM Studio — library.js
   Biblioteca "Meus currículos": listar, buscar, abrir, renomear,
   duplicar, exportar e excluir documentos.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var el = U.el;

  var bound = false;

  function bind() {
    if (bound) return;
    bound = true;
    document.getElementById('lib-search').addEventListener('input', U.debounce(render, 120));
    document.getElementById('lib-sort').addEventListener('change', render);
    document.getElementById('lib-import').addEventListener('click', function () { CM.exportImport.pickAndImport(render); });
    document.getElementById('lib-import-empty').addEventListener('click', function () { CM.exportImport.pickAndImport(render); });
    document.getElementById('lib-export').addEventListener('click', function () { CM.exportImport.exportAll(); });
  }

  function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function render() {
    bind();
    var all = CM.storage.listDocs();
    var q = normalize(document.getElementById('lib-search').value);
    var sort = document.getElementById('lib-sort').value;
    var docs = all.filter(function (d) {
      if (!q) return true;
      var type = C.TYPES[d.type] || C.TYPES.custom;
      return normalize(d.name).indexOf(q) !== -1 || normalize(type.label).indexOf(q) !== -1;
    });
    docs.sort(function (a, b) {
      if (sort === 'name') return String(a.name).localeCompare(String(b.name), 'pt-BR');
      if (sort === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    var list = document.getElementById('lib-list');
    U.clear(list);
    document.getElementById('lib-empty').hidden = all.length > 0;
    document.getElementById('lib-toolbar').hidden = all.length === 0;
    document.getElementById('lib-noresults').hidden = !(all.length && !docs.length);
    document.getElementById('lib-count').textContent = all.length ? U.plural(docs.length, 'currículo exibido', 'currículos exibidos') : '';

    docs.forEach(function (d) { list.appendChild(row(d)); });
  }

  function row(d) {
    var type = C.TYPES[d.type] || C.TYPES.custom;
    var tpl = CM.templates.get(d.template);
    var name = d.name || 'Currículo sem nome';
    var titleId = 'doc-title-' + d.id;
    return el('li', { class: 'doc-row', attrs: { 'aria-labelledby': titleId } }, [
      el('a', { class: 'doc-main', attrs: { href: '#/editor/' + encodeURIComponent(d.id) } }, [
        el('span', { class: 'doc-icon' }, U.icon(type.icon)),
        el('span', { class: 'doc-text' }, [
          el('strong', { class: 'doc-name-text', id: titleId, text: name }),
          el('span', { class: 'doc-meta' }, [
            el('span', { class: 'badge badge--accent', text: type.short }),
            el('span', { text: 'Modelo ' + tpl.name }),
            el('span', { class: 'doc-time', attrs: { title: U.formatDateTime(d.updatedAt) } }, [U.icon('clock'), 'Alterado ' + U.relativeTime(d.updatedAt) + ' (' + U.formatDateTime(d.updatedAt) + ')'])
          ])
        ])
      ]),
      el('div', { class: 'doc-actions' }, [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '#/editor/' + encodeURIComponent(d.id), 'aria-label': 'Abrir ' + name }, text: 'Abrir' }),
        U.iconButton('edit', 'Renomear ' + name, { on: { click: function () { renameDoc(d); } } }),
        U.iconButton('copy', 'Duplicar ' + name, { on: { click: function () { duplicateDoc(d); } } }),
        U.iconButton('download', 'Exportar backup de ' + name, { on: { click: function () { exportDoc(d); } } }),
        U.iconButton('trash', 'Excluir ' + name, { class: 'btn-icon--danger', on: { click: function () { deleteDoc(d); } } })
      ])
    ]);
  }

  function renameDoc(entry) {
    CM.ui.prompt({ title: 'Renomear currículo', label: 'Novo nome', value: entry.name, confirmLabel: 'Renomear' }).then(function (name) {
      if (!name) return;
      var doc = CM.storage.loadDoc(entry.id);
      if (!doc) return CM.ui.toast('Currículo não encontrado.', { type: 'error' });
      doc.name = name.slice(0, 120);
      doc.updatedAt = Date.now();
      var r = CM.storage.saveDoc(doc);
      if (r.ok) { CM.ui.toast('Currículo renomeado.', { type: 'success' }); render(); }
      else CM.ui.toast(r.error.message, { type: 'error' });
    });
  }

  function duplicateDoc(entry) {
    var doc = CM.storage.loadDoc(entry.id);
    if (!doc) return;
    var copy = CM.exportImport.duplicateDocument(doc);
    if (copy) { CM.ui.toast('Cópia criada: "' + copy.name + '".', { type: 'success' }); render(); }
  }

  function exportDoc(entry) {
    var doc = CM.storage.loadDoc(entry.id);
    if (!doc) return;
    CM.exportImport.exportDocuments([doc], 'cm-studio-' + U.safeFileName(doc.name) + '-' + U.todayStamp() + '.json');
  }

  function deleteDoc(entry) {
    CM.ui.confirm({
      title: 'Excluir currículo?',
      message: '"' + (entry.name || 'Currículo sem nome') + '" será excluído permanentemente deste navegador. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir', danger: true,
      body: el('button', {
        class: 'btn btn--secondary btn--sm', type: 'button', text: 'Exportar backup deste currículo antes',
        on: { click: function () { exportDoc(entry); } }
      })
    }).then(function (ok) {
      if (!ok) return;
      CM.storage.deleteDoc(entry.id);
      CM.ui.toast('Currículo excluído.', { type: 'success' });
      render();
      var first = document.querySelector('#lib-list .doc-main');
      (first || document.getElementById('library-title')).focus();
    });
  }

  CM.library = { render: render };
})();
