/* ==========================================================================
   CM Studio — renderers/jp-shokumu.js
   Renderizador do 職務経歴書 (shokumu keirekisho): documento de histórico
   profissional detalhado, normalmente de 1 a 2 páginas (Tokyo Career Guide).
   Estrutura: título + data/nome, 職務要約, 職務経歴 (um bloco por empresa com
   期間 e 会社名), depois as demais seções do documento (habilidades, 資格,
   語学, 自己PR...). 志望の動機 e 本人希望 ficam no 履歴書 e não aparecem aqui.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  CM.renderers = CM.renderers || {};

  var SKIP = { motivation: 1, personalWishes: 1 };

  function J() { return CM.i18n.get('ja-JP').labels; }

  function todayJa() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' + J().asOf;
  }

  function experienceBlocks(sec, h) {
    var out = [];
    var j = J();
    var items = (sec.items || []).filter(function (it) { return h.C.itemHasContent(it, 'experience'); });
    if (!items.length) return out;
    var first = true;
    items.forEach(function (it) {
      var period = h.range(it.start, it.end, it.current);
      var node = h.el('div', { class: 'rb ' + (first ? 'rb--start' : 'rb--item') + ' rb--k-experience sk-company' });
      if (first) node.appendChild(h.el('h2', { class: 'rs-title' }, h.el('span', { text: sec.title })));
      node.appendChild(h.el('div', { class: 'sk-bar' }, [
        h.el('span', { class: 'sk-period', text: period ? j.period + '：' + period : '' }),
        h.el('span', { class: 'sk-org', text: it.org ? j.companyName + '：' + it.org.trim() : '' })
      ]));
      var body = h.el('div', { class: 'sk-body' });
      if (it.title || it.location) {
        body.appendChild(h.el('div', { class: 'sk-role' }, [
          it.title ? h.el('strong', { text: it.title.trim() }) : null,
          it.location ? h.el('span', { class: 'ri-meta', text: '　' + it.location.trim() }) : null
        ]));
      }
      var lines = h.splitLines(it.description);
      if (lines.length) {
        body.appendChild(h.el('div', { class: 'sk-duties-label', text: j.duties }));
        lines.slice(0, 1).forEach(function (l) { body.appendChild(h.lineNode(l)); });
      }
      node.appendChild(body);
      out.push({ region: 'main', node: node });
      // Linhas restantes como blocos de continuação (paginação por linha)
      lines.slice(1).forEach(function (l) {
        out.push({ region: 'main', node: h.el('div', { class: 'rb rb--cont sk-cont' }, h.lineNode(l)) });
      });
      first = false;
    });
    return out;
  }

  function blocks(doc, tpl, h, opts) {
    opts = opts || {};
    var p = doc.personal || {};
    var j = J();
    var out = [];
    var nameEmpty = !p.fullName || !p.fullName.trim();
    var header = h.el('div', { class: 'sk-head' }, [
      h.el('h1', { class: 'sk-title', text: CM.i18n.get('ja-JP').docTitles.shokumu }),
      h.el('div', { class: 'sk-meta' }, [
        h.el('div', { text: todayJa() }),
        h.el('div', { class: nameEmpty && opts.placeholders ? 'is-placeholder' : '', text: j.name + '　' + (nameEmpty ? (opts.placeholders ? CM.t('Seu nome') : '') : p.fullName.trim()) })
      ])
    ]);
    out.push({ region: 'main', header: true, node: h.el('div', { class: 'rb rb--header' }, header) });

    (doc.sections || []).forEach(function (sec) {
      if (!sec.visible || SKIP[sec.kind] || !h.C.sectionHasContent(sec)) return;
      if (sec.kind === 'experience') out = out.concat(experienceBlocks(sec, h));
      else out = out.concat(h.sectionBlocks(sec, tpl));
    });
    out.push({ region: 'main', node: h.el('div', { class: 'rb sk-end' }, h.el('p', { class: 'sk-ijo', text: j.end })) });
    return out;
  }

  CM.renderers.jpShokumu = { blocks: blocks };
})();
