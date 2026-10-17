/* ==========================================================================
   CM Studio — letters.js
   Documentos complementares (carta de apresentação, lettre de motivation,
   Anschreiben, carta, resumo de projeto, lista de publicações, portfólio,
   referências, critérios de seleção).
   Cada documento tem idioma próprio, orientação própria e é impresso
   SEPARADAMENTE do currículo — nunca é mesclado ao currículo.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  /* Tipos. letter=true → tem destinatário, saudação e fecho. */
  var KINDS = {
    cover: { label: 'Carta de apresentação (cover letter)', letter: true, titleKey: 'coverTitle',
      guide: ['Uma página, adaptada à vaga e, se possível, endereçada a uma pessoa.', '1º parágrafo: a vaga e por que você se interessa. 2º–3º: o que você oferece, com exemplos verdadeiros ligados aos requisitos. Final: disponibilidade e agradecimento.'],
      sources: ['Queensland Government (AU): carta de 1 página, adaptada e endereçada a uma pessoa', 'JobsIreland (IE): sempre enviar carta com o CV; 1 página se possível, nunca mais que 2'] },
    lettre: { label: 'Lettre de motivation (França)', letter: true, titleKey: 'coverTitle',
      guide: ['Em francês, 1 página. Estrutura comum: você (a empresa e a vaga), eu (o que você traz, com exemplos), nós (o que farão juntos) e pedido de entrevista.', 'Use "Objet :" e uma fórmula de cortesia de fechamento.'],
      sources: ['Estrutura "vous–moi–nous" é uma convenção usual, NÃO verificada em fonte oficial nesta versão.'] },
    anschreiben: { label: 'Anschreiben (Alemanha / Suíça)', letter: true, titleKey: 'coverTitle',
      guide: ['Uma página: seu endereço, endereço da empresa, local e data, assunto (Betreff, sem a palavra "Betreff"), saudação, texto, fecho e assinatura.', 'Mencione a vaga, sua motivação e as qualificações mais relevantes; anexos (Lebenslauf, Zeugnisse) ao final.'],
      sources: ['arbeit.swiss (SECO): carta com endereços, data, assunto, saudação, fecho e assinatura', 'Make it in Germany: candidatura com carta, CV e certificados (Zeugnisse)'] },
    carta: { label: 'Carta de apresentação / motivação (Portugal, Espanha, Itália)', letter: true, titleKey: 'coverTitle',
      guide: ['Curta: no máximo 1 página A4. Mostre a relação entre o seu perfil e a vaga, com palavras-chave do anúncio.', 'Em Portugal, muitas vezes é substituída pelo texto do e-mail com o CV anexado.'],
      sources: ['EURES Portugal: cartas curtas, nunca mais que 1 página A4', 'EURES Espanha: carta mostra interesse e destaca aspectos do CV'] },
    project: { label: 'Resumo de projeto', letter: false,
      guide: ['Título, contexto, objetivo, o que você fez, método/ferramentas, resultado e aprendizados.', 'Use apenas resultados reais; indique se o projeto foi individual ou em equipe.'], sources: [] },
    publications: { label: 'Lista de publicações', letter: false,
      guide: ['Uma referência por linha (comece com "-"), no estilo de citação da sua área.', 'Separe por tipo se necessário (artigos, capítulos, apresentações). Não inclua trabalhos não aceitos como se fossem publicados.'], sources: [] },
    portfolio: { label: 'Portfólio (lista de trabalhos)', letter: false,
      guide: ['Para cada trabalho: título, ano, seu papel, ferramentas e link (se público).', 'Inclua apenas trabalhos que você pode mostrar e que são seus.'], sources: [] },
    references: { label: 'Folha de referências (referees)', letter: false,
      guide: ['Nome, cargo, organização, relação com você e contato — só com autorização da pessoa.', 'Em vários países, as referências são enviadas em folha separada, quando pedidas.'],
      sources: ['National Careers Service (UK) e Tahatū (NZ): "references available on request" é aceitável, salvo pedido do anúncio'] },
    criteria: { label: 'Resposta a critérios de seleção (Austrália)', letter: false,
      guide: ['Comum em vagas do governo australiano: um título por critério e uma resposta com exemplo concreto (situação, ação, resultado).'],
      sources: ['Queensland Government (AU): critérios de seleção em vagas do governo'] }
  };  if (CM.uiLang) CM.uiLang.registerTree(KINDS);


  function langOf(locale) { return String(locale || 'pt-BR').slice(0, 2); }

  /** Cria os dados iniciais de um novo documento complementar. */
  function create(kind, doc, locale) {
    var k = KINDS[kind] || KINDS.cover;
    locale = locale || doc.locale || 'pt-BR';
    var dict = CM.i18n.get(locale);
    var lt = dict.letter || {};
    var p = doc.personal || {};
    var data = {
      kind: KINDS[kind] ? kind : 'cover',
      locale: locale,
      title: k.letter ? (lt[k.titleKey] || CM.t('Carta')) : k.label.replace(/ \(.*\)$/, ''),
      senderBlock: [p.fullName, p.address || p.location, p.phone, p.email].filter(function (x) { return !U.isBlank(x); }).join('\n'),
      place: (p.location || '').split(/[,/]/)[0].trim(),
      date: longDate(locale),
      subject: k.letter ? (lt.defaultSubject || '') : '',
      salutation: k.letter ? (lt.salutation || '') : '',
      body: '',
      closing: k.letter ? (lt.closing || '') : '',
      signatureName: p.fullName || '',
      enclosures: k.letter ? (lt.enclosures || '') : ''
    };
    if (doc.job && (doc.job.title || doc.job.company)) {
      data.recipient = { name: '', org: doc.job.company || '', address: '' };
      if (doc.job.title && data.subject) data.subject = data.subject.replace(/\[[^\]]+\]/, doc.job.title);
    }
    return data;
  }

  /** Data de hoje por extenso no idioma do documento (ex.: "15. Oktober 2026"). */
  function longDate(locale) {
    var intl = (CM.i18n.get(locale).meta || {}).intl || locale;
    try { return new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); }
    catch (e) { var d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }
  }

  /* ---------------- Renderização em folhas (A4 / Letter) ---------------- */
  var host = null;
  function measureHost() {
    if (!host || !document.body.contains(host)) {
      host = el('div', { class: 'measure-host', attrs: { 'aria-hidden': 'true' } });
      document.body.appendChild(host);
    }
    return host;
  }

  function lines(text) {
    return String(text || '').split(/\r?\n/);
  }

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  /** Blocos da carta em ordem. */
  function blocks(c, doc) {
    var k = KINDS[c.kind] || KINDS.cover;
    var lg = langOf(c.locale);
    var lt = (CM.i18n.get(c.locale).letter) || {};
    var out = [];
    function block(cls, children) { out.push(el('div', { class: 'lb ' + cls }, children)); }
    function multiline(text, cls) {
      return el('div', { class: cls || '' }, lines(text).filter(function (l, i, arr) { return l.trim() || (i > 0 && i < arr.length - 1); }).map(function (l) { return el('div', { text: l || '\u00a0' }); }));
    }
    var dateRight = ['de', 'fr', 'it', 'es', 'ja', 'pt'].indexOf(lg) !== -1;
    if (k.letter) {
      if (!U.isBlank(c.senderBlock)) block('lb-sender' + (lg === 'fr' || lg === 'ja' ? ' is-left' : ''), multiline(c.senderBlock));
      var placeDate = [c.place, c.date].filter(function (x) { return !U.isBlank(x); }).join(lg === 'de' ? ', ' : (lg === 'fr' ? ', le ' : ', '));
      if (lg === 'en' && placeDate) block('lb-date', el('p', { text: c.date || placeDate }));
      var r = c.recipient || {};
      var rec = [r.name, r.org, r.address].filter(function (x) { return !U.isBlank(x); }).join('\n');
      if (rec) block('lb-recipient', multiline(rec));
      if (lg !== 'en' && placeDate) block('lb-date' + (dateRight ? ' is-right' : ''), el('p', { text: placeDate }));
      if (!U.isBlank(c.subject)) block('lb-subject', el('p', {}, [lt.subjectLabel ? lt.subjectLabel + ' ' : '', c.subject]));
      if (!U.isBlank(c.salutation)) block('lb-salutation', el('p', { text: c.salutation }));
    } else {
      block('lb-head', [
        el('h1', { class: 'lb-title', text: c.title || k.label }),
        !U.isBlank(c.signatureName) ? el('p', { class: 'lb-name', text: c.signatureName }) : null
      ]);
    }
    paragraphs(c.body).forEach(function (p) {
      var ls = p.split(/\n/);
      if (ls.every(function (l) { return /^\s*[-•*]\s+/.test(l); })) {
        block('lb-list', el('ul', {}, ls.map(function (l) { return el('li', { text: l.replace(/^\s*[-•*]\s+/, '') }); })));
      } else if (/^#+\s/.test(p)) {
        block('lb-h', el('h2', { text: p.replace(/^#+\s*/, '') }));
      } else {
        block('lb-p', ls.map(function (l) { return el('p', { text: l }); }));
      }
    });
    if (U.isBlank(c.body)) block('lb-p is-placeholder', el('p', { text: CM.t('O texto que você escrever aparecerá aqui.') }));
    if (k.letter) {
      if (!U.isBlank(c.closing)) block('lb-closing', el('p', { text: c.closing }));
      block('lb-sign', [el('div', { class: 'lb-sign-space' }), !U.isBlank(c.signatureName) ? el('p', { text: c.signatureName }) : null]);
      if (!U.isBlank(c.enclosures)) block('lb-enc', multiline(c.enclosures));
    }
    return out;
  }

  /** Renderiza o documento complementar em folhas no `target`. Retorna { root, pages }. */
  function render(c, doc, target) {
    var paper = doc.design && doc.design.paper === 'Letter' ? 'Letter' : 'A4';
    var paperCls = paper === 'Letter' ? 'paper-letter' : 'paper-a4';
    var h = measureHost();
    U.clear(h);
    h.className = 'measure-host ' + paperCls;
    var root = el('div', { class: 'resume-doc letter-doc tpl-classic ' + paperCls + ' lang-' + langOf(c.locale), attrs: { lang: c.locale, 'data-paper': paper } });
    h.appendChild(root);
    var pages = [];
    function newPage() {
      var col = el('div', { class: 'col col-main' });
      var page = el('div', { class: 'page' }, el('div', { class: 'page-inner' }, el('div', { class: 'page-cols' }, col)));
      root.appendChild(page);
      pages.push({ node: page, col: col });
      return col;
    }
    var col = newPage();
    blocks(c, doc).forEach(function (b) {
      col.appendChild(b);
      if (col.scrollHeight > col.clientHeight + 1 && col.children.length > 1) {
        col.removeChild(b);
        col = newPage();
        col.appendChild(b);
      }
    });
    if (pages.length > 1) {
      pages.forEach(function (pg, i) {
        pg.node.appendChild(el('div', { class: 'page-footer', text: CM.l10n.pageLabel(i + 1, pages.length, c.locale) }));
      });
    }
    if (target) { U.clear(target); target.appendChild(root); }
    return { root: root, pages: pages.length, paper: paper };
  }

  /** Imprime somente este documento complementar (separado do currículo). */
  function print(c, doc) {
    var r = document.getElementById('print-root');
    if (!r) return;
    if (CM.state.doc) CM.state.saveNow();
    CM.print.applyPageSize(doc.design && doc.design.paper === 'Letter' ? 'Letter' : 'A4');
    render(c, doc, r);
    r.querySelectorAll('.is-placeholder').forEach(function (n) { n.remove(); });
    document.body.classList.add('has-print-doc');
    var prevTitle = document.title;
    document.title = U.safeFileName(((doc.personal && doc.personal.fullName) || doc.name) + '-' + (c.title || 'carta'));
    setTimeout(function () {
      try { window.print(); } catch (e) { CM.ui.toast(CM.t('O navegador bloqueou a janela de impressão.'), { type: 'error' }); }
      setTimeout(function () { document.title = prevTitle; }, 500);
    }, 60);
  }

  CM.letters = { KINDS: KINDS, create: create, render: render, print: print, blocks: blocks };
})();
