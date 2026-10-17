/* ==========================================================================
   CM Studio — settings.js
   Tela de Configurações: tema, preferências do editor e dados locais.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  var bound = false;

  function $(id) { return document.getElementById(id); }

  function update(patch) {
    var s = Object.assign(CM.storage.getSettings(), patch);
    var r = CM.storage.saveSettings(s);
    if (!r.ok) CM.ui.toast(r.error.message, { type: 'error' });
    return s;
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.querySelectorAll('input[name="theme"]').forEach(function (r) {
      r.addEventListener('change', function () {
        update({ theme: r.value });
        CM.app.applyTheme();
        CM.ui.announce(CM.t('Tema atualizado'));
      });
    });
    $('set-tips').addEventListener('change', function (e) { update({ showTips: e.target.checked }); });
    $('set-country').addEventListener('change', function (e) {
      update({ defaultCountry: e.target.value });
      CM.ui.announce(CM.t('País padrão atualizado'));
      if (CM.uiLanguage) CM.uiLanguage.countryChanged(e.target.value, '');
    });
    $('set-remember-country').addEventListener('change', function (e) { update({ rememberCountry: e.target.checked }); });
    $('set-confirm-item').addEventListener('change', function (e) { update({ confirmItemDelete: e.target.checked }); });
    $('set-print-tip').addEventListener('change', function (e) { update({ printTipSeen: !e.target.checked }); });
    $('set-zoom').addEventListener('change', function (e) { update({ previewZoom: e.target.value }); });
    $('set-export').addEventListener('click', function () { CM.exportImport.exportAll(); });
    $('set-import').addEventListener('click', function () { CM.exportImport.pickAndImport(render); });
    $('set-clear').addEventListener('click', clearAll);
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (b / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';
  }

  function render() {
    bind();
    var s = CM.storage.getSettings();
    var themeInput = document.querySelector('input[name="theme"][value="' + s.theme + '"]');
    if (themeInput) themeInput.checked = true;
    $('set-tips').checked = !!s.showTips;
    var sel = $('set-country');
    U.clear(sel);
    CM.countries.list().forEach(function (p) {
      var o = el('option', { text: p.name + ' — ' + CM.countries.STATUS[p.status].short, attrs: { value: p.code } });
      o.selected = p.code === (s.defaultCountry || 'BR');
      sel.appendChild(o);
    });
    $('set-remember-country').checked = s.rememberCountry !== false;
    $('set-confirm-item').checked = !!s.confirmItemDelete;
    $('set-print-tip').checked = !s.printTipSeen;
    $('set-zoom').value = s.previewZoom || 'fit';
    $('set-doc-count').textContent = String(CM.storage.listDocs().length);
    $('set-usage').textContent = formatBytes(CM.storage.usageBytes());
    if (CM.uiLanguage) CM.uiLanguage.syncControls();
    $('set-persist').textContent = CM.storage.isPersistent() ? CM.t('Local (neste navegador)') : CM.t('Temporário — não persistente');
  }

  function clearAll() {
    var count = CM.storage.listDocs().length;
    CM.ui.confirm({
      title: CM.t('Apagar todos os dados?'),
      message: CM.t("Isso remove {0} e todas as preferências do CM Studio deste navegador. A ação não pode ser desfeita.", [U.plural(count, 'currículo', 'currículos')]),
      confirmLabel: CM.t('Apagar tudo'), danger: true,
      body: count ? el('div', { class: 'callout callout--warn' }, [
        U.icon('alert'),
        el('div', {}, [
          el('p', { text: CM.t('Recomendamos exportar um backup antes de continuar.') }),
          el('button', { class: 'btn btn--secondary btn--sm', type: 'button', text: CM.t('Exportar backup agora'), on: { click: function () { CM.exportImport.exportAll(); } } })
        ])
      ]) : null
    }).then(function (ok) {
      if (!ok) return;
      CM.state.close();
      CM.storage.clearAll();
      CM.app.applyTheme();
      render();
      CM.ui.toast(CM.t('Todos os dados locais do CM Studio foram apagados.'), { type: 'success' });
    });
  }

  CM.settings = { render: render };
})();
