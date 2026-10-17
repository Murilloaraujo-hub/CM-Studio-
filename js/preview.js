/* ==========================================================================
   CM Studio — preview.js
   Renderiza o currículo em folhas A4 reais (210 × 297 mm) e faz a paginação.

   Como funciona:
   1. O documento é convertido em "blocos" (cabeçalho, início de seção,
      itens e linhas de descrição).
   2. O título de cada seção fica sempre no mesmo bloco que o primeiro item,
      evitando títulos isolados no fim da página.
   3. Os blocos são distribuídos em páginas medindo a altura real em um
      contêiner invisível com as dimensões de impressão; quando um bloco não
      cabe, ele vai para a página seguinte.
   O mesmo resultado é usado na pré-visualização e na impressão, o que torna
   a pré-visualização fiel ao PDF (dentro dos limites de cada navegador).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var C = CM.catalog;
  var V = CM.validation;
  var el = U.el;

  var measureHost = null;

  function getMeasureHost() {
    if (!measureHost || !document.body.contains(measureHost)) {
      measureHost = el('div', { class: 'measure-host', attrs: { 'aria-hidden': 'true' } });
      document.body.appendChild(measureHost);
    }
    return measureHost;
  }

  /* ---------------- Contexto de renderização ----------------
     Idioma e estilo de data do documento em renderização. Tudo o que vai
     impresso (rótulos, datas, níveis, numeração) usa este contexto. */
  var L = CM.l10n;
  var ctx = { locale: 'pt-BR', dateStyle: null, doc: null, tpl: null };

  /* ---------------- Formatação de datas e textos ---------------- */
  function range(start, end, current) {
    return L.formatRange(start, end, current, ctx.locale, ctx.dateStyle);
  }

  function educationWhen(it) {
    return L.educationWhen(it, ctx.locale, ctx.dateStyle);
  }

  function oneDate(v) { return L.formatDate(v, ctx.locale, ctx.dateStyle); }

  /** Divide a descrição em linhas: "- texto" vira tópico; o resto, parágrafo. */
  function splitLines(text) {
    if (U.isBlank(text)) return [];
    return String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var m = l.match(/^[-•*–·]\s*(.*)$/);
      return m ? { bullet: true, text: m[1] } : { bullet: false, text: l };
    }).filter(function (l) { return l.text; });
  }

  function lineNode(line) {
    if (line.bullet) return el('ul', { class: 'r-ul' }, el('li', { text: line.text }));
    return el('p', { class: 'r-p', text: line.text });
  }

  function joinNonEmpty(parts, sep) {
    return parts.filter(function (p) { return !U.isBlank(p); }).map(function (p) { return String(p).trim(); }).join(sep);
  }

  function linkNode(url, cls, text) {
    var safe = V.safeUrl(url);
    if (!safe) return el('span', { class: cls, text: text || String(url).trim() });
    return el('a', { class: cls, text: text || V.displayUrl(url), attrs: { href: safe, rel: 'noopener noreferrer', target: '_blank' } });
  }

  /* ---------------- Modelo de item (independente do visual) ---------------- */
  function itemModel(sec, it) {
    var schemaName = C.getKind(sec.kind).schema;
    var m = { title: '', subtitle: '', meta: '', when: '', link: '', lines: splitLines(it.description) };
    switch (schemaName) {
      case 'entry':
        m.title = it.title; m.subtitle = it.org; m.meta = it.location; m.when = range(it.start, it.end, it.current); break;
      case 'education':
        m.title = it.course; m.subtitle = it.institution; m.meta = it.location; m.when = educationWhen(it); break;
      case 'course':
        m.title = it.name; m.subtitle = it.institution; m.meta = it.workload; m.when = oneDate(it.date); break;
      case 'project':
        m.title = it.name; m.subtitle = joinNonEmpty([it.role, it.org], ' · '); m.when = range(it.start, it.end); m.link = it.link; break;
      case 'award':
        m.title = it.title; m.subtitle = it.issuer; m.when = oneDate(it.date); break;
      case 'event':
        m.title = it.title; m.subtitle = it.event; m.meta = it.location; m.when = oneDate(it.date); break;
    }
    // Résumé norte-americano: organização em destaque, cargo/curso na linha de baixo
    if (ctx.tpl && ctx.tpl.orgFirst && (schemaName === 'entry' || schemaName === 'education') && !U.isBlank(m.subtitle)) {
      var tmp = m.title; m.title = m.subtitle; m.subtitle = tmp || '';
      m.swapped = true;
    }
    if (U.isBlank(m.title) && !U.isBlank(m.subtitle)) { m.title = m.subtitle; m.subtitle = ''; }
    return m;
  }

  /** Bloco de item: cabeçalho + primeira linha da descrição; demais linhas viram blocos de continuação. */
  function entryNodes(sec, it) {
    var m = itemModel(sec, it);
    var main = el('div', { class: 'ri-main' });
    var head = el('div', { class: 'ri-head' }, [
      el('span', { class: 'ri-title', text: m.title || '' }),
      m.when ? el('span', { class: 'ri-when', text: m.when }) : null
    ]);
    main.appendChild(head);
    if (!U.isBlank(m.subtitle) || !U.isBlank(m.meta)) {
      main.appendChild(el('div', { class: 'ri-sub' }, [
        !U.isBlank(m.subtitle) ? el('span', { class: 'ri-org', text: m.subtitle }) : null,
        !U.isBlank(m.meta) ? el('span', { class: 'ri-meta', text: m.meta }) : null
      ]));
    }
    if (!U.isBlank(m.link)) main.appendChild(el('div', { class: 'ri-link' }, linkNode(m.link, 'r-a')));
    var lines = m.lines.slice();
    if (lines.length) main.appendChild(lineNode(lines.shift()));
    var first = el('div', { class: 'ri' }, [
      el('div', { class: 'ri-date', text: m.when || '' }),
      main
    ]);
    var nodes = [first];
    lines.forEach(function (l) { nodes.push(el('div', { class: 'ri-cont' }, lineNode(l))); });
    return nodes;
  }

  /* ---------------- Conteúdo de cada seção ---------------- */
  function sectionBodies(sec, tpl, region) {
    var schemaName = C.getKind(sec.kind).schema;
    var schema = C.getSchema(sec.kind);

    if (schema.kind === 'text') {
      return splitLines(sec.content).map(lineNode);
    }

    if (schema.kind === 'tags') {
      var tags = (sec.tags || []).filter(function (t) { return !U.isBlank(t); });
      if (!tags.length) return [];
      var style = region === 'side' ? 'list' : tpl.tagStyle;
      if (style === 'comma') return [el('p', { class: 'r-tags r-tags--comma', text: tags.join(', ') + '.' })];
      return [el('ul', { class: 'r-tags r-tags--' + style }, tags.map(function (t) { return el('li', { text: t }); }))];
    }

    var items = (sec.items || []).filter(function (it) { return C.itemHasContent(it, sec.kind); });
    if (!items.length) return [];

    if (schemaName === 'language') {
      return [el('ul', { class: 'r-langs' }, items.map(function (it) {
        return el('li', { class: 'r-lang' }, [
          el('span', { class: 'r-lang-name', text: it.name || '' }),
          !U.isBlank(it.level) ? el('span', { class: 'r-lang-level', text: L.levelLabel(it.level, ctx.locale) }) : null,
          !U.isBlank(it.note) ? el('span', { class: 'r-lang-note', text: it.note }) : null
        ]);
      }))];
    }

    if (schemaName === 'link') {
      return [el('ul', { class: 'r-links' }, items.map(function (it) {
        return el('li', { class: 'r-linkitem' }, [
          !U.isBlank(it.label) ? el('span', { class: 'r-link-label', text: it.label }) : null,
          !U.isBlank(it.url) ? linkNode(it.url, 'r-a') : null
        ]);
      }))];
    }

    if (schemaName === 'publication') {
      return items.map(function (it, i) {
        var p = el('p', { class: 'r-pub' });
        if (tpl.numberPublications !== false && (tpl.id === 'academicExtended' || tpl.id === 'academic')) {
          p.appendChild(el('span', { class: 'r-pub-n', text: '[' + (i + 1) + '] ' }));
        }
        if (!U.isBlank(it.authors)) p.appendChild(el('span', { class: 'r-pub-authors', text: it.authors.trim().replace(/\.$/, '') + '. ' }));
        if (!U.isBlank(it.title)) p.appendChild(el('span', { class: 'r-pub-title', text: it.title.trim().replace(/\.$/, '') + '. ' }));
        var tail = joinNonEmpty([it.venue, it.year], ', ');
        if (tail) p.appendChild(el('span', { class: 'r-pub-venue', text: tail + '. ' }));
        if (!U.isBlank(it.link)) p.appendChild(linkNode(it.link, 'r-a'));
        return p;
      });
    }

    if (schemaName === 'reference') {
      return items.map(function (it) {
        return el('div', { class: 'r-ref' }, [
          el('div', { class: 'r-ref-name', text: it.name || '' }),
          !U.isBlank(it.relation) ? el('div', { class: 'r-ref-rel', text: it.relation }) : null,
          !U.isBlank(it.contact) ? el('div', { class: 'r-ref-contact', text: it.contact }) : null
        ]);
      });
    }

    // entry, education, course, project, award, event
    var out = [];
    items.forEach(function (it) {
      entryNodes(sec, it).forEach(function (n, idx) {
        n.__cont = idx > 0;
        out.push(n);
      });
    });
    return out;
  }

  /** Converte uma seção em blocos de paginação. */
  function sectionBlocks(sec, tpl) {
    if (!sec.visible || !C.sectionHasContent(sec)) return [];
    var def = C.getKind(sec.kind);
    var region = tpl.layout === 'sidebar' && def.side ? 'side' : 'main';
    var bodies = sectionBodies(sec, tpl, region);
    if (!bodies.length) return [];
    var schemaName = def.schema;
    var baseClass = 'rb rb--k-' + sec.kind + ' rb--s-' + schemaName;
    return bodies.map(function (body, i) {
      var cls = baseClass + (i === 0 ? ' rb--start' : (body.__cont ? ' rb--cont' : ' rb--item'));
      var node = el('div', { class: cls });
      if (i === 0) {
        node.appendChild(el('h2', { class: 'rs-title' }, el('span', { text: sec.title || def.title })));
      }
      node.appendChild(el('div', { class: 'rb-body' }, body));
      return { region: region, node: node };
    });
  }

  /* ---------------- Cabeçalho ---------------- */
  var CONTACT_KEYS = ['email', 'phone', 'location', 'linkedin', 'github', 'website'];
  /* Campos adicionais impressos (somente se preenchidos). A leitura do nome (furigana) vai junto do nome. */
  var EXTRA_PRINT_KEYS = ['birthDate', 'nationality', 'address', 'workPermit', 'drivingLicense'];

  function extraItems(p) {
    return EXTRA_PRINT_KEYS.filter(function (k) { return !U.isBlank(p[k]); }).map(function (k) {
      return { key: k, label: L.label(k, ctx.locale), value: String(p[k]).trim() };
    });
  }

  function photoNode(p, design, tpl) {
    if (!design.showPhoto || !tpl.photoSlot || !p.photo) return null;
    var safe = V.safePhoto(p.photo);
    if (!safe) return null;
    return el('img', { class: 'r-photo', attrs: { src: safe, alt: L.label('photo', ctx.locale) === 'photo' ? CM.t('Foto') : L.label('photo', ctx.locale) } });
  }

  function contactItems(p) {
    var items = [];
    CONTACT_KEYS.forEach(function (k) {
      var v = p[k];
      if (U.isBlank(v)) return;
      var valueNode;
      if (k === 'email') {
        valueNode = V.isValidEmail(v)
          ? el('a', { class: 'r-a', text: v.trim(), attrs: { href: 'mailto:' + v.trim() } })
          : el('span', { text: v.trim() });
      } else if (k === 'phone' || k === 'location') {
        valueNode = el('span', { text: v.trim() });
      } else {
        valueNode = linkNode(v, 'r-a');
      }
      items.push(el('li', { class: 'r-contact r-contact--' + k }, [
        el('span', { class: 'r-c-label', text: L.label(k, ctx.locale) + ': ' }),
        valueNode
      ]));
    });
    return items;
  }

  function headerBlocks(doc, tpl, opts) {
    var p = doc.personal || {};
    var design = doc.design || {};
    var blocks = [];
    var nameEmpty = U.isBlank(p.fullName);
    var title = CM.countryRules ? CM.countryRules.docTitle(doc) : '';
    var photo = photoNode(p, design, tpl);
    var header = el('header', { class: 'r-header' + (photo ? ' has-photo' : '') }, [
      tpl.personalBlock && title ? el('div', { class: 'r-doctitle', text: title }) : null,
      !U.isBlank(p.furigana) ? el('div', { class: 'r-furigana', text: p.furigana.trim() }) : null,
      el('h1', { class: 'r-name' + (nameEmpty && opts.placeholders ? ' is-placeholder' : ''), text: nameEmpty ? (opts.placeholders ? CM.t('Seu nome') : '') : p.fullName.trim() }),
      !U.isBlank(p.headline) ? el('p', { class: 'r-headline', text: p.headline.trim() }) : null,
      photo
    ]);
    var contacts = contactItems(p);
    var extras = extraItems(p);
    // Modelos com bloco de dados pessoais (Lebenslauf, Europass): tabela rótulo | valor
    if (tpl.personalBlock) {
      var rows = contacts.length || extras.length ? [] : null;
      if (rows) {
        CONTACT_KEYS.concat(EXTRA_PRINT_KEYS).forEach(function (k) {
          if (U.isBlank(p[k])) return;
          var vnode;
          if (k === 'email' && V.isValidEmail(p[k])) vnode = el('a', { class: 'r-a', text: p[k].trim(), attrs: { href: 'mailto:' + p[k].trim() } });
          else if (k === 'linkedin' || k === 'github' || k === 'website') vnode = linkNode(p[k], 'r-a');
          else vnode = el('span', { text: String(p[k]).trim() });
          rows.push(el('div', { class: 'r-pd-row' }, [el('div', { class: 'r-pd-label', text: L.label(k, ctx.locale) }), el('div', { class: 'r-pd-value' }, vnode)]));
        });
      }
      blocks.push({ region: 'main', node: el('div', { class: 'rb rb--header' }, header) });
      if (rows && rows.length) {
        blocks.push({ region: 'main', node: el('div', { class: 'rb rb--start rb--k-personal' }, [
          el('h2', { class: 'rs-title' }, el('span', { text: L.sectionTitle('personalData', ctx.locale) })),
          el('div', { class: 'rb-body' }, el('div', { class: 'r-pd' }, rows))
        ]) });
      }
      return blocks;
    }
    extras.forEach(function (x) {
      contacts.push(el('li', { class: 'r-contact r-contact--' + x.key }, [
        el('span', { class: 'r-c-label r-c-label--show', text: x.label + ': ' }),
        el('span', { text: x.value })
      ]));
    });
    if (tpl.layout === 'sidebar') {
      blocks.push({ region: 'main', node: el('div', { class: 'rb rb--header' }, header) });
      if (contacts.length) {
        var cnode = el('div', { class: 'rb rb--start rb--k-contact' }, [
          el('h2', { class: 'rs-title' }, el('span', { text: L.label('contact', ctx.locale) })),
          el('div', { class: 'rb-body' }, el('ul', { class: 'r-contacts r-contacts--stack' }, contacts))
        ]);
        blocks.push({ region: 'side', node: cnode });
      }
    } else {
      if (contacts.length) header.appendChild(el('ul', { class: 'r-contacts r-contacts--' + tpl.contactStyle }, contacts));
      blocks.push({ region: 'main', node: el('div', { class: 'rb rb--header' }, header) });
    }
    return blocks;
  }

  /* ---------------- Páginas ---------------- */
  function createPage(tpl, index) {
    var main = el('div', { class: 'col col-main' });
    var side = tpl.layout === 'sidebar' ? el('div', { class: 'col col-side' }) : null;
    var cols = el('div', { class: 'page-cols' }, [side, main]);
    var page = el('div', { class: 'page', attrs: { 'data-page': index + 1 } }, el('div', { class: 'page-inner' }, cols));
    return { node: page, cols: { main: main, side: side || main } };
  }

  /** O bloco ultrapassa a área útil da coluna (descontando o padding inferior)? */
  function overflows(col, node) {
    var padBottom = parseFloat(window.getComputedStyle(col).paddingBottom) || 0;
    var colBottom = col.getBoundingClientRect().bottom - padBottom;
    return node.getBoundingClientRect().bottom > colBottom + 0.5;
  }

  /**
   * Renderiza o documento no elemento de destino.
   * opts.placeholders: mostra textos de orientação quando vazio (não impressos).
   * Retorna { pages, oversize }.
   */
  /** Blocos finais opcionais: declaração de privacidade e local/data/assinatura. */
  function closingBlocks(doc, tpl) {
    var design = doc.design || {};
    var out = [];
    if (design.privacyConsent) {
      out.push({ region: 'main', node: el('div', { class: 'rb rb--start rb--consent' }, el('p', { class: 'r-consent', text: L.label('privacyConsent', ctx.locale) })) });
    }
    if (design.signature) {
      out.push({ region: 'main', node: el('div', { class: 'rb rb--start rb--signature' }, el('div', { class: 'r-sign' }, [
        el('div', { class: 'r-sign-cell' }, [el('div', { class: 'r-sign-line' }), el('div', { class: 'r-sign-label', text: L.label('placeDate', ctx.locale) })]),
        el('div', { class: 'r-sign-cell' }, [el('div', { class: 'r-sign-line' }), el('div', { class: 'r-sign-label', text: L.label('signature', ctx.locale) })])
      ])) });
    }
    return out;
  }

  /** Funções compartilhadas com os renderizadores especiais (js/renderers/*.js). */
  function helpers() {
    return {
      ctx: ctx, el: el, L: L, U: U, C: C, V: V,
      range: range, educationWhen: educationWhen, oneDate: oneDate,
      splitLines: splitLines, lineNode: lineNode, linkNode: linkNode, itemModel: itemModel,
      sectionBlocks: sectionBlocks, contactItems: contactItems, photoNode: photoNode,
      closingBlocks: closingBlocks, extraItems: extraItems
    };
  }

  function paperClass(design) { return design.paper === 'Letter' ? 'paper-letter' : 'paper-a4'; }

  function render(doc, target, opts) {
    opts = opts || {};
    var tpl = CM.templates.get(doc.template);
    var design = doc.design || {};
    var host = getMeasureHost();
    U.clear(host);
    ctx.locale = CM.i18n && CM.i18n.has(doc.locale) ? doc.locale : 'pt-BR';
    ctx.dateStyle = CM.countryRules ? CM.countryRules.dateStyle(doc) : null;
    ctx.doc = doc;
    ctx.tpl = tpl;
    host.className = 'measure-host ' + paperClass(design);

    var root = el('div', {
      class: [
        'resume-doc', 'tpl-' + tpl.id,
        tpl.dateLayout === 'left' ? 'dl' : 'di',
        'fs-' + (design.fontScale || 'normal'),
        'dens-' + (design.density || 'normal'),
        tpl.usesAccent ? 'has-accent' : 'no-accent',
        paperClass(design),
        tpl.renderer ? 'has-renderer' : ''
      ].join(' ').trim(),
      attrs: { lang: ctx.locale, 'data-paper': design.paper === 'Letter' ? 'Letter' : 'A4' }
    });
    root.style.setProperty('--r-accent', tpl.usesAccent ? CM.templates.accentValue(design.accent) : '#111111');
    host.appendChild(root);

    var blocks;
    var contentBlocks = [];
    var special = tpl.renderer && CM.renderers && CM.renderers[tpl.renderer];
    if (special) {
      // Renderizador especial (ex.: 履歴書): produz os próprios blocos; a paginação é a mesma.
      blocks = special.blocks(doc, tpl, helpers(), opts) || [];
      contentBlocks = blocks.filter(function (b) { return !b.header; });
      if (!(doc.sections || []).some(function (s) { return s.visible && C.sectionHasContent(s); })) contentBlocks = [];
    } else {
      blocks = headerBlocks(doc, tpl, opts);
      (doc.sections || []).forEach(function (sec) {
        contentBlocks = contentBlocks.concat(sectionBlocks(sec, tpl));
      });
      blocks = blocks.concat(contentBlocks);
      if (contentBlocks.length) blocks = blocks.concat(closingBlocks(doc, tpl));
    }
    if (!contentBlocks.length && opts.placeholders) {
      blocks.push({
        region: 'main',
        node: el('div', { class: 'rb rb--start is-placeholder r-empty' }, el('div', { class: 'rb-body' }, [
          el('p', { text: CM.t('Seu currículo aparecerá aqui conforme você preencher as seções ao lado.') }),
          el('p', { text: CM.t('Seções vazias não são exibidas nem impressas.') })
        ]))
      });
    }

    var pages = [];
    var cursor = { main: 0, side: 0 };
    var oversize = false;
    function ensurePage(i) {
      while (pages.length <= i) {
        var pg = createPage(tpl, pages.length);
        pages.push(pg);
        root.appendChild(pg.node);
      }
      return pages[i];
    }
    ensurePage(0);

    blocks.forEach(function (b) {
      var region = tpl.layout === 'sidebar' && b.region === 'side' ? 'side' : 'main';
      var col = ensurePage(cursor[region]).cols[region];
      col.appendChild(b.node);
      if (overflows(col, b.node)) {
        if (col.children.length > 1) {
          col.removeChild(b.node);
          cursor[region] += 1;
          col = ensurePage(cursor[region]).cols[region];
          col.appendChild(b.node);
          if (overflows(col, b.node)) oversize = true;
        } else {
          oversize = true;
        }
      }
    });

    // Cabeçalho corrido e numeração de páginas
    var total = pages.length;
    var name = (doc.personal && doc.personal.fullName || '').trim();
    pages.forEach(function (pg, i) {
      if (tpl.runningHeader && i > 0 && name) {
        var dt = (CM.countryRules && CM.countryRules.docTitle(doc)) || L.docTitle('cv', ctx.locale);
        pg.node.appendChild(el('div', { class: 'page-running', text: name + ' — ' + dt }));
      }
      if (design.pageNumbers !== false && total > 1) {
        pg.node.appendChild(el('div', { class: 'page-footer', text: L.pageLabel(i + 1, total, ctx.locale) }));
      }
    });

    // Move o resultado do contêiner de medição para o destino
    host.removeChild(root);
    if (target) {
      U.clear(target);
      target.appendChild(root);
    }
    return { pages: total, oversize: oversize, root: root };
  }

  CM.preview = {
    render: render,
    _splitLines: splitLines,
    _range: range,
    _educationWhen: educationWhen,
    _withLocale: function (locale, fn) {
      var prev = ctx.locale; ctx.locale = locale;
      try { return fn(); } finally { ctx.locale = prev; }
    }
  };
})();
