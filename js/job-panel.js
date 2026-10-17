/* ==========================================================================
   CM Studio — job-panel.js
   Aba "Vaga": a pessoa cola a descrição da vaga e o CM Studio compara, no
   próprio navegador, os termos da vaga com o texto do currículo.
   Para cada termo ausente: Tenho isso (aceitar) / Editar / Ignorar.
   Nada é acrescentado ao currículo sem um clique explícito.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;
  var S = CM.state;
  var A = CM.state.actions;
  var J = CM.jobAnalyzer;

  var container = null;
  var draft = { title: '', company: '', text: '' };
  var draftDocId = null;
  var addedLog = [];   // termos adicionados nesta sessão (para o resumo)

  var SKILL_KINDS = ['skills', 'techSkills', 'computerSkills', 'softSkills'];

  function render(node) {
    container = node || container;
    if (!container || !S.doc) return;
    var doc = S.doc;
    if (draftDocId !== doc.id) {
      draftDocId = doc.id;
      addedLog = [];
      var j = doc.job || {};
      draft = { title: j.title || '', company: j.company || '', text: j.text || '' };
    }
    U.clear(container);

    container.appendChild(el('div', { class: 'panel-block' }, [
      el('h3', { class: 'panel-title', text: CM.t('Comparar com uma vaga') }),
      el('div', { class: 'callout callout--info' }, [U.icon('lock'), el('div', {}, [
        el('p', { text: CM.t('A análise é feita só neste navegador: o texto da vaga não é enviado para lugar nenhum.') }),
        el('p', { text: CM.t('Limites: é uma comparação de palavras. Não reconhece sinônimos, não avalia sua experiência real, não calcula nota e não garante aprovação em sistemas de triagem (ATS) nem em processos seletivos.') })
      ])]),
      el('div', { class: 'form-grid' }, [
        field('job-title', CM.t('Cargo da vaga (opcional)'), 'title', 'half'),
        field('job-company', CM.t('Empresa ou instituição (opcional)'), 'company', 'half'),
        el('div', { class: 'field field--full' }, [
          el('label', { class: 'label', attrs: { for: 'job-text' }, text: CM.t('Descrição da vaga') }),
          (function () {
            var ta = el('textarea', { class: 'input textarea', id: 'job-text', attrs: { rows: 8, maxlength: 20000, placeholder: CM.t('Cole aqui o texto do anúncio: requisitos, atividades, diferenciais...') } });
            ta.value = draft.text;
            ta.addEventListener('input', function () { draft.text = ta.value; });
            return ta;
          })()
        ])
      ]),
      el('div', { class: 'inline-row' }, [
        el('button', { class: 'btn btn--primary btn--sm', type: 'button', id: 'job-analyze', on: { click: analyzeNow } }, [U.icon('search'), CM.t('Analisar localmente')]),
        doc.job ? el('button', { class: 'btn btn--ghost btn--sm', type: 'button', id: 'job-clear', text: CM.t('Apagar análise'), on: { click: clearJob } }) : null
      ])
    ]));

    if (doc.job && doc.job.analyzedAt) renderResults(doc);
  }

  function field(id, label, key, width) {
    var input = el('input', { class: 'input', id: id, type: 'text', attrs: { maxlength: 160, autocomplete: 'off' } });
    input.value = draft[key];
    input.addEventListener('input', function () { draft[key] = input.value; });
    return el('div', { class: 'field field--' + width }, [el('label', { class: 'label', attrs: { for: id }, text: label }), input]);
  }

  function analyzeNow() {
    if (U.isBlank(draft.text) || draft.text.trim().length < 40) {
      CM.ui.toast(CM.t('Cole a descrição completa da vaga (pelo menos algumas frases).'), { type: 'error' });
      var ta = document.getElementById('job-text'); if (ta) ta.focus();
      return;
    }
    var res = J.analyze(draft.text, S.doc);
    var prev = (S.doc.job && S.doc.job.keywords) || [];
    var keywords = res.missing.map(function (m) {
      var old = prev.filter(function (k) { return k.term === m.term; })[0];
      return old ? old : { term: m.term, status: 'pending', edit: '' };
    });
    A.setJob({ title: draft.title, company: draft.company, text: draft.text, keywords: keywords, analyzedAt: Date.now() });
    render();
    CM.ui.announce(CM.t("Análise concluída: {0} de {1} termos já aparecem no currículo.", [res.found.length, res.total]));
    var r = document.getElementById('job-results'); if (r) r.focus();
  }

  function clearJob() {
    CM.ui.confirm({ title: CM.t('Apagar análise da vaga?'), message: CM.t('O texto da vaga e as marcações serão removidos deste currículo. O conteúdo do currículo não é alterado.'), confirmLabel: CM.t('Apagar análise'), danger: true })
      .then(function (ok) {
        if (!ok) return;
        A.setJob(null);
        draft = { title: '', company: '', text: '' };
        addedLog = [];
        render();
      });
  }

  function renderResults(doc) {
    var res = J.analyze(doc.job.text, doc);
    var kwMap = {};
    (doc.job.keywords || []).forEach(function (k) { kwMap[k.term] = k; });
    // termos marcados que entretanto passaram a existir no currículo
    var missing = (doc.job.keywords || []).filter(function (k) { return !J.presence(doc, k.status === 'edited' && k.edit ? k.edit : k.term).length; });
    var nowFound = (doc.job.keywords || []).filter(function (k) { return missing.indexOf(k) === -1; });
    var foundTerms = res.found.map(function (f) { return f.term; });

    var wrap = el('div', { class: 'panel-block job-results', id: 'job-results', attrs: { tabindex: '-1' } }, [
      el('h3', { class: 'panel-title', text: CM.t('Resultado') }),
      el('p', { class: 'job-summary' }, [
        el('strong', { text: CM.t("{0} de {1}", [foundTerms.length, res.total]) }),
        el('span', { text: CM.t(' termos frequentes da vaga já aparecem no seu currículo.') })
      ]),
      el('p', { class: 'muted small', text: CM.t('Isto não é uma nota nem uma previsão de aprovação: apenas indica palavras em comum. Inclua um termo somente se ele for verdadeiro para você.') })
    ]);

    if (foundTerms.length) {
      wrap.appendChild(el('h4', { class: 'review-group-title', text: CM.t('Encontrados no currículo') }));
      wrap.appendChild(el('ul', { class: 'kw-list kw-list--found' }, res.found.map(function (f) {
        return el('li', { class: 'kw-chip is-found', attrs: { title: CM.t("Aparece em: {0}", [f.where.join(', ')]) } }, [U.icon('check'), el('span', { text: f.term })]);
      })));
    }

    wrap.appendChild(el('h4', { class: 'review-group-title', text: CM.t("Ausentes no currículo ({0})", [missing.length]) }));
    if (!missing.length) wrap.appendChild(el('p', { class: 'muted small', text: CM.t('Nenhum termo frequente da vaga está ausente.') }));
    var list = el('ul', { class: 'kw-rows' });
    missing.forEach(function (k) {
      var shown = k.status === 'edited' && k.edit ? k.edit : k.term;
      var statusText = { pending: CM.t('Pendente'), accepted: CM.t('Você indicou que tem'), edited: CM.t('Editado: "{0}"', [k.edit]), ignored: CM.t('Ignorado') }[k.status];
      var actions = [];
      if (k.status === 'pending') {
        actions.push(btn(CM.t('Tenho isso'), 'kw-accept', function () { A.setKeywordStatus(k.term, 'accepted'); render(); focusRow(k.term); }));
        actions.push(btn(CM.t('Editar'), 'kw-edit', function () { editTerm(k); }));
        actions.push(btn(CM.t('Ignorar'), 'kw-ignore', function () { A.setKeywordStatus(k.term, 'ignored'); render(); focusRow(k.term); }));
      } else {
        if (k.status === 'accepted' || k.status === 'edited') {
          actions.push(btn(CM.t('Adicionar a Competências'), 'kw-add', function () { addToSkills(shown); }));
        }
        actions.push(btn(CM.t('Desfazer marcação'), 'kw-reset', function () { A.setKeywordStatus(k.term, 'pending', ''); render(); focusRow(k.term); }));
      }
      list.appendChild(el('li', { class: 'kw-row kw-row--' + k.status, attrs: { 'data-term': k.term } }, [
        el('div', { class: 'kw-row-text' }, [el('strong', { text: k.term }), el('span', { class: 'muted small', text: ' · ' + statusText })]),
        el('div', { class: 'kw-row-actions' }, actions)
      ]));
    });
    wrap.appendChild(list);

    // Resumo das alterações
    var acc = (doc.job.keywords || []).filter(function (k) { return k.status === 'accepted'; }).length;
    var edi = (doc.job.keywords || []).filter(function (k) { return k.status === 'edited'; }).length;
    var ign = (doc.job.keywords || []).filter(function (k) { return k.status === 'ignored'; }).length;
    var pen = missing.filter(function (k) { return k.status === 'pending'; }).length;
    wrap.appendChild(el('div', { class: 'job-changes' }, [
      el('h4', { class: 'review-group-title', text: CM.t('Resumo das alterações') }),
      el('ul', { class: 'plain-list' }, [
        el('li', { text: CM.t("{0} ao currículo nesta sessão{1}.", [U.plural(addedLog.length, 'termo adicionado', 'termos adicionados'), addedLog.length ? ': ' + addedLog.join(', ') : '']) }),
        el('li', { text: CM.t("{0} no currículo.", [U.plural(nowFound.length, 'termo marcado já aparece', 'termos marcados já aparecem')]) }),
        el('li', { text: CM.t("{0} aceitos · {1} editados · {2} ignorados · {3} pendentes.", [acc, edi, ign, pen]) })
      ]),
      el('p', { class: 'muted small', text: CM.t('Você também pode incluir um termo manualmente no texto das experiências — de preferência com um exemplo concreto e verdadeiro.') })
    ]));
    container.appendChild(wrap);
  }

  function btn(label, cls, fn) {
    return el('button', { class: 'btn btn--ghost btn--sm ' + cls, type: 'button', text: label, on: { click: fn } });
  }

  function focusRow(term) {
    setTimeout(function () {
      var row = container.querySelector('[data-term="' + (window.CSS && CSS.escape ? CSS.escape(term) : term) + '"] button');
      if (row) row.focus();
    }, 0);
  }

  function editTerm(k) {
    CM.ui.prompt({
      title: CM.t('Editar termo'), label: CM.t('Como esse termo deve aparecer no seu currículo?'), value: k.term, maxLength: 80,
      confirmLabel: CM.t('Salvar')
    }).then(function (v) {
      if (v == null || U.isBlank(v)) return;
      A.setKeywordStatus(k.term, 'edited', v.trim());
      render(); focusRow(k.term);
    });
  }

  function addToSkills(term) {
    var doc = S.doc;
    var sec = doc.sections.filter(function (s) { return SKILL_KINDS.indexOf(s.kind) !== -1; })[0];
    var sid = sec ? sec.id : A.addSection('skills');
    sec = S.findSection(sid);
    var tags = (sec.tags || []).slice();
    if (tags.map(function (x) { return x.toLowerCase(); }).indexOf(term.toLowerCase()) === -1) tags.push(term);
    A.setTags(sid, tags);
    addedLog.push(term);
    CM.ui.toast(CM.t("\"{0}\" adicionado à seção \"{1}\".", [term, sec.title]), { type: 'success', action: { label: CM.t('Desfazer'), onClick: function () { S.undo(); addedLog.pop(); render(); } } });
    render();
  }

  CM.jobPanel = { render: render };
})();
