/* ==========================================================================
   CM Studio — home.js
   Partes dinâmicas da página inicial: currículos recentes, tipos de
   currículo e galeria de modelos (miniaturas reais renderizadas com dados
   fictícios).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var el = U.el;

  var galleryRendered = false;
  var PAGE_PX = 793.7; // 210 mm em pixels CSS

  /** Renderiza a primeira página de um documento dentro de uma moldura reduzida. */
  function renderThumb(frame, doc) {
    var res = CM.preview.render(doc, frame, { placeholders: false });
    var root = res.root;
    // Mostra apenas a primeira página
    Array.prototype.slice.call(root.querySelectorAll('.page')).slice(1).forEach(function (p) { p.remove(); });
    fitThumb(frame);
  }

  function fitThumb(frame) {
    var root = frame.firstElementChild;
    if (!root) return;
    var scale = frame.clientWidth / PAGE_PX;
    root.style.transform = 'scale(' + scale + ')';
    root.style.transformOrigin = '0 0';
  }

  function refitAll() {
    document.querySelectorAll('.thumb-frame').forEach(fitThumb);
  }

  function render() {
    renderRecent();
    if (!galleryRendered) {
      renderTypes();
      renderGallery();
      galleryRendered = true;
    } else {
      refitAll();
    }
  }

  function renderRecent() {
    var docs = CM.storage.listDocs();
    var wrap = document.getElementById('home-recent-wrap');
    var list = document.getElementById('home-recent');
    var pill = document.getElementById('home-doc-count');
    pill.hidden = !docs.length;
    pill.textContent = docs.length ? String(docs.length) : '';
    pill.setAttribute('aria-label', docs.length + ' salvos');
    U.clear(list);
    wrap.hidden = !docs.length;
    docs.slice(0, 3).forEach(function (d) {
      var type = C.TYPES[d.type] || C.TYPES.custom;
      list.appendChild(el('li', {}, el('a', { class: 'recent-card', attrs: { href: '#/editor/' + encodeURIComponent(d.id) } }, [
        el('span', { class: 'recent-icon' }, U.icon(type.icon)),
        el('span', { class: 'recent-text' }, [
          el('strong', { text: d.name || 'Currículo sem nome' }),
          el('span', { text: type.short + ' · alterado ' + U.relativeTime(d.updatedAt) })
        ]),
        U.icon('chevron', 'recent-chevron')
      ])));
    });
  }

  function renderTypes() {
    var list = document.getElementById('home-types');
    U.clear(list);
    C.TYPE_ORDER.forEach(function (t) {
      var type = C.TYPES[t];
      list.appendChild(el('li', {}, el('a', { class: 'type-card', attrs: { href: '#/novo?tipo=' + t } }, [
        el('span', { class: 'type-icon' }, U.icon(type.icon)),
        el('span', { class: 'type-text' }, [el('strong', { text: type.label }), el('span', { text: type.description })])
      ])));
    });
  }

  function renderGallery() {
    var list = document.getElementById('home-templates');
    U.clear(list);
    CM.templates.list.forEach(function (t) {
      var frame = el('div', { class: 'thumb-frame' });
      var card = el('li', { class: 'template-card' }, el('a', {
        class: 'template-link', attrs: { href: '#/novo?modelo=' + t.id, 'aria-label': 'Criar currículo com o modelo ' + t.name }
      }, [
        el('div', { class: 'template-thumb', attrs: { 'aria-hidden': 'true' } }, frame),
        el('span', { class: 'template-name', text: t.name }),
        el('span', { class: 'template-desc', text: t.description })
      ]));
      list.appendChild(card);
      renderThumb(frame, CM.samples.forTemplate(t.id));
    });
    var hero = document.getElementById('hero-thumb');
    var heroBack = document.getElementById('hero-thumb-back');
    if (hero) renderThumb(hero, CM.samples.forTemplate('modern'));
    if (heroBack) renderThumb(heroBack, CM.samples.forTemplate('academic'));
  }

  window.addEventListener('resize', U.debounce(function () {
    var view = document.getElementById('view-home');
    if (view && !view.hidden) refitAll();
  }, 120));

  CM.home = { render: render, renderThumb: renderThumb, fitThumb: fitThumb };
})();
