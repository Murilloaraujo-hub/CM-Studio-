/* ==========================================================================
   CM Studio — renderers/jp-rirekisho.js
   Renderizador do modelo 履歴書 (rirekisho), inspirado na estrutura do
   formulário modelo japonês: dados pessoais com foto, tabela 年 | 月 | 学歴・職歴,
   免許・資格, 志望の動機 / 自己PR e 本人希望記入欄.

   Importante:
   - NÃO é o formulário oficial. Se a empresa fornecer formulário próprio, use-o.
   - Não há campos de nacionalidade, religião, família, gênero obrigatório,
     conta bancária etc. (dados não exigidos segundo o Tokyo Career Guide).
   - Cada linha da tabela é um bloco: a paginação comum do CM Studio continua valendo.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  CM.renderers = CM.renderers || {};

  function J() { return CM.i18n.get('ja-JP').labels; }

  function firstSection(doc, kind) {
    return (doc.sections || []).filter(function (s) { return s.kind === kind && s.visible; })[0] || null;
  }

  function todayJa() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' + J().asOf;
  }

  /** Linha da tabela de histórico: 年 | 月 | conteúdo. */
  function row(h, y, m, text, cls) {
    return h.el('div', { class: 'jp-row' + (cls ? ' ' + cls : '') }, [
      h.el('div', { class: 'jp-c jp-y', text: y ? String(y) : '' }),
      h.el('div', { class: 'jp-c jp-m', text: m ? String(m) : '' }),
      h.el('div', { class: 'jp-c jp-t', text: text || '' })
    ]);
  }

  function headRow(h, label) {
    return h.el('div', { class: 'jp-row jp-row--head' }, [
      h.el('div', { class: 'jp-c jp-y', text: J().year }),
      h.el('div', { class: 'jp-c jp-m', text: J().month }),
      h.el('div', { class: 'jp-c jp-t', text: label })
    ]);
  }

  function block(h, node, extra) {
    return Object.assign({ region: 'main', node: h.el('div', { class: 'rb jp-block' }, node) }, extra || {});
  }

  function ym(h, v) { return h.L.parseDate(v) || {}; }

  function joinName(a, b) {
    return [a, b].filter(function (x) { return x && String(x).trim(); }).map(function (x) { return String(x).trim(); }).join('　');
  }

  function educationRows(h, sec) {
    var out = [];
    var j = J();
    (sec ? sec.items : []).filter(function (it) { return h.C.itemHasContent(it, 'education'); }).forEach(function (it) {
      var name = joinName(it.institution, it.course);
      var s = ym(h, it.start), e = ym(h, it.end);
      if (s.y) out.push(row(h, s.y, s.m, name + '　' + j.enrolled));
      var endWord = null;
      if (it.status === 'cursando') endWord = e.y ? j.graduated + h.L.label('expected', 'ja-JP') : h.L.label('inProgress', 'ja-JP');
      else if (it.status === 'trancado') endWord = CM.i18n.get('ja-JP').status.trancado;
      else if (it.status === 'interrompido') endWord = CM.i18n.get('ja-JP').status.interrompido;
      else if (e.y || it.status === 'concluido') endWord = j.graduated;
      if (e.y || endWord) out.push(row(h, e.y, e.m, name + '　' + (endWord || '')));
      if (!s.y && !e.y && !endWord) out.push(row(h, '', '', name));
    });
    return out;
  }

  function workRows(h, sec) {
    var out = [];
    var j = J();
    var anyCurrent = false;
    (sec ? sec.items : []).filter(function (it) { return h.C.itemHasContent(it, 'experience'); }).forEach(function (it) {
      var org = (it.org || '').trim();
      var role = (it.title || '').trim();
      var label = org + (role ? '（' + role + '）' : '');
      var s = ym(h, it.start), e = ym(h, it.end);
      out.push(row(h, s.y, s.m, label + '　' + j.joined));
      if (it.current) anyCurrent = true;
      else if (e.y) out.push(row(h, e.y, e.m, org + '　' + j.left));
    });
    if (anyCurrent) out.push(row(h, '', '', j.currentlyEmployed, 'jp-row--right'));
    return out;
  }

  function licenseRows(h, doc) {
    var out = [];
    var sec = firstSection(doc, 'certifications');
    (sec ? sec.items : []).filter(function (it) { return h.C.itemHasContent(it, 'certifications'); }).forEach(function (it) {
      var d = ym(h, it.date);
      out.push(row(h, d.y, d.m, joinName(it.name, it.institution ? '（' + it.institution.trim() + '）' : '')));
    });
    var p = doc.personal || {};
    if (p.drivingLicense && p.drivingLicense.trim()) out.push(row(h, '', '', J().drivingLicense ? CM.i18n.get('ja-JP').labels.drivingLicense + '　' + p.drivingLicense.trim() : p.drivingLicense.trim()));
    return out;
  }

  /** Caixa de texto livre (志望の動機, 自己PR, 本人希望...). */
  function textBox(h, title, lines, opts) {
    var body = h.el('div', { class: 'jp-box-body' });
    lines.forEach(function (n) { body.appendChild(n); });
    return h.el('div', { class: 'jp-box' + (opts && opts.placeholder ? ' is-placeholder' : '') }, [
      h.el('div', { class: 'jp-box-title', text: title }),
      body
    ]);
  }

  function blocks(doc, tpl, h, opts) {
    opts = opts || {};
    var j = J();
    var p = doc.personal || {};
    var design = doc.design || {};
    var out = [];

    /* ---- Cabeçalho: título, data, dados pessoais e foto ---- */
    var photo = h.photoNode(p, design, tpl);
    var photoCell = photo
      ? h.el('div', { class: 'jp-photo' }, photo)
      : h.el('div', { class: 'jp-photo jp-photo--empty is-placeholder' }, h.el('span', { text: j.photo + '（任意）' }));
    var nameEmpty = !p.fullName || !p.fullName.trim();
    var rows = [
      h.el('div', { class: 'jp-f jp-f--furi' }, [h.el('span', { class: 'jp-f-l', text: j.furigana }), h.el('span', { class: 'jp-f-v', text: (p.furigana || '').trim() })]),
      h.el('div', { class: 'jp-f jp-f--name' }, [h.el('span', { class: 'jp-f-l', text: j.name }), h.el('span', { class: 'jp-f-v' + (nameEmpty && opts.placeholders ? ' is-placeholder' : ''), text: nameEmpty ? (opts.placeholders ? CM.t('Seu nome') : '') : p.fullName.trim() })])
    ];
    if (p.birthDate && p.birthDate.trim()) {
      rows.push(h.el('div', { class: 'jp-f' }, [h.el('span', { class: 'jp-f-l', text: j.birthDate }), h.el('span', { class: 'jp-f-v', text: p.birthDate.trim() })]));
    }
    var addr = (p.address && p.address.trim()) || (p.location && p.location.trim()) || '';
    rows.push(h.el('div', { class: 'jp-f' }, [h.el('span', { class: 'jp-f-l', text: j.address }), h.el('span', { class: 'jp-f-v', text: addr })]));
    var contactBits = [];
    if (p.phone && p.phone.trim()) contactBits.push(j.phone + '：' + p.phone.trim());
    if (p.email && p.email.trim()) contactBits.push(j.email + '：' + p.email.trim());
    rows.push(h.el('div', { class: 'jp-f' }, [h.el('span', { class: 'jp-f-l', text: j.contact }), h.el('span', { class: 'jp-f-v', text: contactBits.join('　') })]));
    if (p.workPermit && p.workPermit.trim()) {
      rows.push(h.el('div', { class: 'jp-f' }, [h.el('span', { class: 'jp-f-l', text: j.workPermit }), h.el('span', { class: 'jp-f-v', text: p.workPermit.trim() })]));
    }

    var header = h.el('div', { class: 'jp-head' }, [
      h.el('div', { class: 'jp-title-row' }, [
        h.el('h1', { class: 'jp-title', text: CM.i18n.get('ja-JP').docTitles.rirekisho }),
        h.el('div', { class: 'jp-date', text: todayJa() })
      ]),
      h.el('div', { class: 'jp-id' }, [h.el('div', { class: 'jp-fields' }, rows), photoCell])
    ]);
    out.push({ region: 'main', header: true, node: h.el('div', { class: 'rb rb--header jp-block' }, header) });

    /* ---- 学歴・職歴 ---- */
    var edu = firstSection(doc, 'education');
    var work = firstSection(doc, 'experience');
    var eduRows = educationRows(h, edu);
    var workRowsList = workRows(h, work);
    if (eduRows.length || workRowsList.length) {
      out.push(block(h, headRow(h, j.eduHistory), { cls: 'start' }));
      out.push(block(h, row(h, '', '', j.eduHeader, 'jp-row--center')));
      eduRows.forEach(function (r) { out.push(block(h, r)); });
      out.push(block(h, row(h, '', '', j.workHeader, 'jp-row--center')));
      if (workRowsList.length) workRowsList.forEach(function (r) { out.push(block(h, r)); });
      else out.push(block(h, row(h, '', '', 'なし')));
      out.push(block(h, row(h, '', '', j.end, 'jp-row--right')));
    }

    /* ---- 免許・資格 ---- */
    var lic = licenseRows(h, doc);
    if (lic.length) {
      out.push(block(h, headRow(h, j.licenses), { gap: true }));
      lic.forEach(function (r) { out.push(block(h, r)); });
    }

    /* ---- 志望の動機・自己PR・特技など ---- */
    ['motivation', 'selfPR'].forEach(function (kind) {
      var sec = firstSection(doc, kind);
      if (!sec || !h.C.sectionHasContent(sec)) return;
      out.push(block(h, textBox(h, sec.title || h.L.sectionTitle(kind, 'ja-JP'), h.splitLines(sec.content).map(h.lineNode))));
    });
    // Habilidades, idiomas e matérias preferidas: uma linha cada
    var extraLines = [];
    ['skills', 'techSkills', 'computerSkills', 'subjects'].forEach(function (kind) {
      var sec = firstSection(doc, kind);
      if (!sec || !h.C.sectionHasContent(sec)) return;
      extraLines.push(h.el('p', { class: 'r-p', text: (sec.title || '') + '：' + sec.tags.filter(Boolean).join('、') }));
    });
    var langs = firstSection(doc, 'languages');
    if (langs && h.C.sectionHasContent(langs)) {
      var txt = langs.items.filter(function (it) { return h.C.itemHasContent(it, 'languages'); }).map(function (it) {
        return (it.name || '').trim() + (it.level ? '（' + h.L.levelLabel(it.level, doc.locale) + '）' : '') + (it.note ? ' ' + it.note.trim() : '');
      }).join('、');
      extraLines.push(h.el('p', { class: 'r-p', text: (langs.title || '') + '：' + txt }));
    }
    if (extraLines.length) out.push(block(h, textBox(h, '特技・スキル', extraLines)));

    /* ---- 本人希望記入欄 ---- */
    var wishes = firstSection(doc, 'personalWishes');
    if (wishes && h.C.sectionHasContent(wishes)) {
      out.push(block(h, textBox(h, wishes.title || h.L.sectionTitle('personalWishes', 'ja-JP'), h.splitLines(wishes.content).map(h.lineNode))));
    }

    /* ---- Seções que este modelo não exibe (aviso só na tela) ---- */
    var shown = { education: 1, experience: 1, certifications: 1, motivation: 1, selfPR: 1, skills: 1, techSkills: 1, computerSkills: 1, subjects: 1, languages: 1, personalWishes: 1 };
    var hidden = (doc.sections || []).filter(function (s) { return s.visible && !shown[s.kind] && h.C.sectionHasContent(s); });
    if (hidden.length && opts.placeholders) {
      out.push(block(h, h.el('div', { class: 'jp-note is-placeholder' }, [
        h.el('p', { text: CM.t('Não exibido no 履歴書 (aparece no 職務経歴書 ou em outros modelos): {0}.', [hidden.map(function (s) { return s.title; }).join(', ')]) }),
        h.el('p', { text: CM.t('Este aviso não é impresso.') })
      ])));
    }
    return out;
  }

  CM.renderers.jpRirekisho = { blocks: blocks };
})();
