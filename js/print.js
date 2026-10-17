/* ==========================================================================
   CM Studio — print.js
   Impressão e "Salvar como PDF" usando a janela de impressão do navegador.
   O currículo é renderizado em folhas A4 ou Letter (conforme o documento) dentro de #print-root, e as regras
   de css/print.css escondem toda a interface do aplicativo.
   Observação: o CM Studio não gera PDF por biblioteca; o PDF é criado pelo
   próprio navegador ao escolher "Salvar como PDF" como destino.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  function root() { return document.getElementById('print-root'); }

  /* Tamanho de página dinâmico: A4 ou Letter conforme o documento.
     O print.css define A4 por padrão; esta regra é inserida por último e prevalece. */
  var PAGE_SIZES = {
    A4: { css: 'A4 portrait', width: '210mm', label: 'A4' },
    Letter: { css: 'letter portrait', width: '215.9mm', label: 'Letter (Carta)' }
  };

  function paperOf(doc) { return doc && doc.design && doc.design.paper === 'Letter' ? 'Letter' : 'A4'; }

  function applyPageSize(paper) {
    var size = PAGE_SIZES[paper] || PAGE_SIZES.A4;
    var style = document.getElementById('cm-page-size');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cm-page-size';
      document.head.appendChild(style);
    }
    style.textContent = '@page { size: ' + size.css + '; margin: 0; }\n' +
      '@media print { html, body { width: ' + size.width + ' !important; } }';
    document.body.setAttribute('data-paper', paper);
  }

  function prepare(doc) {
    var r = root();
    if (!r || !doc) return null;
    applyPageSize(paperOf(doc));
    var res = CM.preview.render(doc, r, { placeholders: false });
    document.body.classList.add('has-print-doc');
    var title = CM.t("{0}Currículo", [doc.personal && doc.personal.fullName ? doc.personal.fullName.trim() + ' — ' : '']);
    document.documentElement.setAttribute('data-print-title', title);
    return res;
  }

  function cleanup() {
    var r = root();
    if (r) U.clear(r);
    document.body.classList.remove('has-print-doc');
  }

  var originalTitle = document.title;
  var printing = false;
  /* Sufixo do nome sugerido do arquivo, conforme o modelo e o idioma do documento (somente ASCII). */
  var SUFFIX_BY_TEMPLATE = { jpRirekisho: 'rirekisho', jpShokumu: 'shokumu-keirekisho', lebenslauf: 'lebenslauf', europass: 'europass-cv' };
  var SUFFIX_BY_LANG = { pt: 'curriculo', en: 'resume', de: 'lebenslauf', fr: 'cv', es: 'cv', it: 'cv', nl: 'cv', ja: 'resume' };
  function fileSuffix(doc) {
    if (SUFFIX_BY_TEMPLATE[doc.template]) return SUFFIX_BY_TEMPLATE[doc.template];
    if (doc.template === 'academic' || doc.template === 'academicExtended') return 'cv';
    if (doc.locale === 'en-GB' || doc.locale === 'en-IE' || doc.locale === 'en-AU' || doc.locale === 'en-NZ') return 'cv';
    return SUFFIX_BY_LANG[String(doc.locale || 'pt-BR').slice(0, 2)] || 'curriculo';
  }

  function doPrint(doc) {
    prepare(doc);
    // O título da página vira o nome sugerido do arquivo PDF na maioria dos navegadores.
    if (!printing) originalTitle = document.title;
    printing = true;
    document.title = U.safeFileName((doc.personal && doc.personal.fullName) || doc.name) + '-' + fileSuffix(doc);
    setTimeout(function () {
      try { window.print(); } catch (e) { CM.ui.toast(CM.t('O navegador bloqueou a janela de impressão.'), { type: 'error' }); }
    }, 60);
  }

  /** Mostra uma orientação na primeira vez e então abre a janela de impressão. */
  function printDocument(doc) {
    if (!doc) return;
    if (CM.state.doc) CM.state.saveNow();
    var settings = CM.storage.getSettings();
    if (settings.printTipSeen) { doPrint(doc); return; }
    // (o tamanho do papel é mostrado na orientação abaixo)
    var dontShow = el('input', { type: 'checkbox', id: 'print-tip-dismiss' });
    CM.ui.modal({
      title: CM.t('Imprimir ou salvar como PDF'),
      body: [
        el('p', { text: CM.t('A janela de impressão do navegador será aberta. Para obter um PDF:') }),
        el('ol', { class: 'steps-list' }, [
          el('li', { text: CM.t('Em "Destino" (ou "Impressora"), escolha "Salvar como PDF".') }),
          el('li', { text: CM.t("Confira se o tamanho do papel é {0} (o papel deste documento) e a escala está em 100% (ou \"Padrão\").", [PAGE_SIZES[paperOf(doc)].label]) }),
          el('li', { text: CM.t('Em "Margens", use "Nenhuma" ou "Padrão" — o currículo já tem margens próprias.') }),
          el('li', { text: CM.t('Desative "Cabeçalhos e rodapés" para não imprimir data e endereço da página.') }),
          el('li', { text: CM.t('Opcional: ative "Gráficos de plano de fundo" para manter cores suaves.') })
        ]),
        el('label', { class: 'check', attrs: { for: 'print-tip-dismiss' } }, [dontShow, el('span', { text: CM.t('Não mostrar estas orientações novamente') })])
      ],
      actions: [
        { label: CM.t('Cancelar'), value: false, variant: 'ghost' },
        { label: CM.t('Abrir impressão'), value: true, variant: 'primary', submit: true, autofocus: true }
      ]
    }).then(function (ok) {
      if (dontShow.checked) {
        var s = CM.storage.getSettings();
        s.printTipSeen = true;
        CM.storage.saveSettings(s);
      }
      if (ok) doPrint(doc);
    });
  }

  // Atalho Ctrl+P fora do botão: garante que o currículo aberto seja impresso.
  window.addEventListener('beforeprint', function () {
    var r = root();
    if (r && !r.firstChild && CM.state.doc && location.hash.indexOf('#/editor/') === 0) prepare(CM.state.doc);
  });
  window.addEventListener('afterprint', function () {
    if (printing) document.title = originalTitle || CM.t('CM Studio');
    printing = false;
    if (CM.app && CM.app.refreshTitle) CM.app.refreshTitle();
    setTimeout(cleanup, 300);
  });

  CM.print = { printDocument: printDocument, prepare: prepare, cleanup: cleanup, applyPageSize: applyPageSize, PAGE_SIZES: PAGE_SIZES,
    fileSuffix: fileSuffix };
})();
