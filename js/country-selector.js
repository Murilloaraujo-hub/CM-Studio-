/* ==========================================================================
   CM Studio — country-selector.js
   Componente de escolha do PAÍS DE DESTINO (reutilizado no assistente de
   criação e nas configurações do documento):
   - busca por nome em português, nome local, código ou idioma;
   - países mais usados + lista completa em ordem alfabética;
   - nome completo sempre visível (a bandeira é só complementar);
   - selo do status de verificação de cada perfil.
   Também oferece o "cartão de resumo" do perfil (padrão, idioma, papel,
   foto, fontes) usado em várias telas.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;
  var K = CM.countries;

  function statusBadge(profile) {
    var st = K.STATUS[profile.status] || K.STATUS.generic;
    return el('span', { class: 'status-badge status-badge--' + st.tone, text: st.short, attrs: { title: st.label } });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : iso;
  }

  function optionLabel(p) {
    return el('span', { class: 'country-opt-text' }, [
      el('strong', { class: 'country-opt-name', text: p.name }),
      p.nameLocal && p.nameLocal !== p.name ? el('span', { class: 'country-opt-local', text: p.nameLocal }) : null
    ]);
  }

  /**
   * Monta o seletor dentro de `container`.
   * opts: { value, onChange(code), name, idPrefix }
   */
  function mount(container, opts) {
    opts = opts || {};
    var name = opts.name || 'country';
    var prefix = opts.idPrefix || 'cs';
    var value = K.has(opts.value) ? opts.value : K.DEFAULT;
    U.clear(container);

    var searchId = prefix + '-search';
    var search = el('input', {
      class: 'input', id: searchId, type: 'search',
      attrs: { placeholder: CM.t('Buscar país (ex.: Portugal, Japão, Deutschland)'), autocomplete: 'off', 'aria-describedby': prefix + '-search-help' }
    });
    var results = el('div', { class: 'country-results', attrs: { 'aria-live': 'polite' } });
    var listWrap = el('div', { class: 'country-lists' });

    container.appendChild(el('div', { class: 'country-selector' }, [
      el('div', { class: 'search-field country-search' }, [
        el('label', { class: 'sr-only', attrs: { for: searchId }, text: CM.t('Buscar país') }),
        U.icon('search'),
        search
      ]),
      el('p', { class: 'field-help', id: prefix + '-search-help', text: CM.t('Você também pode buscar pelo idioma (ex.: "francês") ou pelo nome no idioma local.') }),
      results,
      listWrap
    ]));

    function option(p) {
      var id = prefix + '-opt-' + p.code;
      var input = el('input', { type: 'radio', id: id, class: 'visually-hidden-input', attrs: { name: name, value: p.code } });
      input.checked = p.code === value;
      input.addEventListener('change', function () {
        if (!input.checked) return;
        value = p.code;
        if (opts.onChange) opts.onChange(p.code);
      });
      return el('label', { class: 'country-opt', attrs: { for: id, 'data-country': p.code } }, [
        input,
        el('span', { class: 'country-opt-box' }, [
          CM.flags.svg(p.code),
          optionLabel(p),
          statusBadge(p)
        ])
      ]);
    }

    function group(title, items, cls) {
      if (!items.length) return null;
      return el('div', { class: 'country-group' + (cls ? ' ' + cls : '') }, [
        el('h3', { class: 'country-group-title', text: title }),
        el('div', { class: 'country-grid', attrs: { role: 'radiogroup', 'aria-label': title } }, items.map(option))
      ]);
    }

    function draw() {
      U.clear(listWrap);
      var q = search.value.trim();
      if (q) {
        var found = K.search(q);
        results.textContent = found.length ? U.plural(found.length, 'país encontrado', 'países encontrados') : CM.t('Nenhum país encontrado. Use "Outros países" para um modelo genérico.');
        var list = found.length ? found : [K.get(K.OTHER)];
        U.appendChildren(listWrap, group(CM.t('Resultado da busca'), list));
        return;
      }
      results.textContent = '';
      var popular = K.popular();
      var popCodes = popular.map(function (p) { return p.code; });
      var rest = K.list().filter(function (p) { return popCodes.indexOf(p.code) === -1; });
      U.appendChildren(listWrap, [
        group(CM.t('Países mais usados'), popular, 'country-group--popular'),
        group(CM.t('Todos os outros países e opções'), rest)
      ]);
    }

    search.addEventListener('input', U.debounce(draw, 120));
    draw();

    return {
      getValue: function () { return value; },
      setValue: function (code) { if (K.has(code)) { value = code; draw(); } },
      focusSearch: function () { search.focus(); }
    };
  }

  /** Cartão de resumo do perfil nacional. opts: { compact } */
  function summaryCard(code, opts) {
    opts = opts || {};
    var p = K.get(code);
    var R = CM.countryRules;
    var st = K.STATUS[p.status] || K.STATUS.generic;
    var langs = R.languagesFor(p.code).map(CM.l10n.localeName);
    var photo = R.photoPolicy(p.code);
    var rows = [
      [CM.t('Documento'), p.terms && p.terms.cv],
      [CM.t('Idioma sugerido'), langs.join(' · ')],
      [CM.t('Papel'), R.paperName(R.paperFor(p.code))],
      [CM.t('Foto'), R.photoLabel(p.code)]
    ];
    var srcCount = (p.sources || []).length;
    return el('div', { class: 'country-card' + (opts.compact ? ' country-card--compact' : '') }, [
      el('div', { class: 'country-card-head' }, [
        CM.flags.svg(p.code, 'flag--lg'),
        el('div', {}, [
          el('h3', { class: 'country-card-title', text: p.name + (p.nameLocal && p.nameLocal !== p.name ? ' — ' + p.nameLocal : '') }),
          el('p', { class: 'country-card-status' }, [statusBadge(p), el('span', { text: ' ' + st.label + (p.verifiedAt ? CM.t(" · consulta em {0}", [formatDate(p.verifiedAt)]) : '') })])
        ])
      ]),
      el('p', { class: 'country-card-summary', text: p.summary }),
      el('dl', { class: 'country-card-facts' }, rows.filter(function (r) { return r[1]; }).map(function (r) {
        return el('div', {}, [el('dt', { text: r[0] }), el('dd', { text: r[1] })]);
      })),
      opts.compact ? null : el('p', { class: 'country-card-note', text: p.statusNote }),
      el('p', { class: 'country-card-sources' }, [
        U.icon('book'),
        el('span', { text: srcCount ? U.plural(srcCount, 'fonte consultada', 'fontes consultadas') + ' — ' : CM.t('Sem fontes: perfil genérico. ') }),
        srcCount ? el('a', { text: CM.t('ver fontes e detalhes'), attrs: { href: '#/ajuda/paises', 'data-country-info': p.code } }) : null
      ])
    ]);
  }

  /** Diálogo com todos os detalhes e fontes de um perfil. */
  function openDetails(code) {
    var p = K.get(code);
    var body = [summaryCard(code)];
    function list(title, items) {
      if (!items || !items.length) return;
      body.push(el('h3', { class: 'dialog-subtitle', text: title }));
      body.push(el('ul', { class: 'plain-list' }, items.map(function (t) { return el('li', { text: t }); })));
    }
    list(CM.t('Dicas'), p.tips);
    list(CM.t('Atenção'), p.warnings);
    list(CM.t('Documentos de apoio'), p.supportingDocs);
    list(CM.t('Convenções usadas SEM verificação na fonte'), p.unverified);
    body.push(el('h3', { class: 'dialog-subtitle', text: CM.t('Fontes') }));
    if (!(p.sources || []).length) body.push(el('p', { text: CM.t('Este perfil não tem fontes: é genérico.') }));
    (p.sources || []).forEach(function (s) {
      var safe = s.url ? CM.validation.safeUrl(s.url) : '';
      body.push(el('div', { class: 'source-item' }, [
        el('p', { class: 'source-title' }, safe
          ? el('a', { text: s.title, attrs: { href: safe, target: '_blank', rel: 'noopener noreferrer' } })
          : el('span', { text: s.title })),
        el('p', { class: 'source-meta', text: CM.t("{0} · consultado em {1}", [s.publisher, formatDate(s.accessed)]) }),
        el('p', { class: 'source-supports', text: CM.t("Embasa: {0}", [s.supports]) })
      ]));
    });
    body.push(el('p', { class: 'field-help', text: CM.t('Orientações de currículo são convenções e podem mudar. Não constituem aconselhamento jurídico. Quando a vaga ou a instituição der instruções próprias, siga-as.') }));
    return CM.ui.modal({ title: CM.t("Perfil: {0}", [p.name]), body: body, size: 'wide' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-country-info]');
    if (!a) return;
    e.preventDefault();
    openDetails(a.getAttribute('data-country-info'));
  });

  /** Tabela de perfis na Central de ajuda (gerada a partir dos próprios perfis). */
  function renderHelpTable(table) {
    if (!table) return;
    var R = CM.countryRules;
    Array.prototype.slice.call(table.querySelectorAll('thead, tbody')).forEach(function (n) { n.remove(); });
    var head = el('thead', {}, el('tr', {}, [CM.t('País'), CM.t('Status'), CM.t('Idiomas sugeridos'), CM.t('Papel'), CM.t('Foto'), CM.t('Fontes')].map(function (h) { return el('th', { attrs: { scope: 'col' }, text: h }); })));
    var body = el('tbody');
    K.list().forEach(function (p) {
      body.appendChild(el('tr', {}, [
        el('th', { attrs: { scope: 'row' } }, [CM.flags.svg(p.code), ' ', p.name]),
        el('td', {}, statusBadge(p)),
        el('td', { text: R.languagesFor(p.code).map(CM.l10n.localeName).join(', ') }),
        el('td', { text: R.paperFor(p.code) }),
        el('td', { text: R.photoLabel(p.code) }),
        el('td', {}, (p.sources || []).length
          ? el('button', { class: 'link-btn', type: 'button', text: U.plural(p.sources.length, 'fonte', 'fontes'), attrs: { 'data-country-info': p.code } })
          : el('span', { class: 'muted', text: CM.t('nenhuma') }))
      ]));
    });
    table.appendChild(head);
    table.appendChild(body);
  }

  CM.countrySelector = { renderHelpTable: renderHelpTable, mount: mount, summaryCard: summaryCard, statusBadge: statusBadge, openDetails: openDetails, formatDate: formatDate };
})();
