/* ==========================================================================
   CM Studio — testes unitários (executam no navegador, sem dependências).
   Abra tests/unit-tests.html no navegador para ver o resultado.
   Os testes usam um prefixo de armazenamento isolado? Não: eles usam o
   mesmo localStorage do app, por isso salvam e restauram os dados
   existentes antes/depois da execução.
   ========================================================================== */
(function () {
  'use strict';

  var results = [];
  function test(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, error: e && e.message ? e.message : String(e) }); }
  }
  function assert(cond, msg) { if (!cond) throw new Error(msg || 'asserção falhou'); }
  function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'valores diferentes') + ': esperado ' + JSON.stringify(b) + ', obtido ' + JSON.stringify(a)); }

  // Preserva os dados reais do usuário durante os testes
  var backup = {};
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k.indexOf('cmstudio.v1.') === 0) backup[k] = localStorage.getItem(k);
  }
  CM.storage.clearAll();

  var C = CM.catalog, V = CM.validation, S = CM.storage, U = CM.utils;

  /* ---------- Validação ---------- */
  test('e-mail válido e inválido', function () {
    assert(V.isValidEmail('nome@example.com'));
    assert(V.isValidEmail(''), 'campo vazio é opcional');
    assert(!V.isValidEmail('nome@'), 'sem domínio');
    assert(!V.isValidEmail('nome example.com'), 'sem @');
    assert(!V.isValidEmail('a@b'), 'sem TLD');
  });
  test('URLs: normaliza e bloqueia protocolos perigosos', function () {
    eq(V.safeUrl('github.com/usuario'), 'https://github.com/usuario');
    eq(V.safeUrl('javascript:alert(1)'), '');
    eq(V.safeUrl('data:text/html,oi'), '');
    eq(V.safeUrl('ftp://exemplo.com'), '');
    eq(V.safeUrl('nada'), '', 'sem ponto no domínio');
    eq(V.safeUrl('https://exa mple.com'), '', 'com espaço');
    eq(V.displayUrl('https://www.linkedin.com/in/x/'), 'linkedin.com/in/x');
  });
  test('telefone', function () {
    assert(V.isValidPhone('(44) 99999-0000'));
    assert(!V.isValidPhone('123'));
    assert(!V.isValidPhone('abc12345678'));
  });

  /* ---------- Catálogo ---------- */
  test('todos os 12 tipos (finalidades) criam documentos válidos', function () {
    eq(C.TYPE_ORDER.length, 12);
    C.TYPE_ORDER.forEach(function (t) {
      var d = C.createDocument(t);
      eq(d.type, t);
      assert(d.sections.length > 0, 'tipo ' + t + ' sem seções');
      assert(CM.templates.ids().indexOf(d.template) !== -1, 'modelo inválido em ' + t);
      d.sections.forEach(function (s) { assert(C.KINDS[s.kind], 'seção desconhecida ' + s.kind); });
    });
  });
  test('modo escolar não exige experiência profissional', function () {
    var d = C.createDocument('school');
    assert(!d.sections.some(function (s) { return s.kind === 'experience'; }));
    ['schoolProjects', 'scienceFairs', 'olympiads', 'clubs', 'studentOrgs', 'extracurricular', 'volunteer', 'subjects']
      .forEach(function (k) { assert(d.sections.some(function (s) { return s.kind === k; }), 'falta ' + k); });
  });
  test('modo acadêmico estendido inclui publicações e monitoria', function () {
    var d = C.createDocument('academicExtended');
    ['publications', 'monitoring', 'researchInterests', 'scholarships', 'references'].forEach(function (k) {
      assert(d.sections.some(function (s) { return s.kind === k; }), 'falta ' + k);
    });
  });
  test('seções vazias são detectadas', function () {
    var d = C.createDocument('professional');
    assert(d.sections.every(function (s) { return !C.sectionHasContent(s); }));
    d.sections[0].content = 'Texto';
    assert(C.sectionHasContent(d.sections[0]));
  });

  /* ---------- Sanitização ---------- */
  test('sanitização remove campos desconhecidos e converte tipos', function () {
    var res = V.sanitizeDocument({
      name: '<img src=x onerror=alert(1)>', type: 'hacker', template: 'nao-existe',
      personal: { fullName: { evil: true }, email: 'a@b.com', extra: 'x' },
      sections: [{ kind: 'desconhecido', title: 'T', items: [{ title: 123, malicious: 'x' }] }, 'lixo', null],
      __proto__: { polluted: true }
    });
    var d = res.doc;
    assert(d, 'documento deveria ser aceito');
    eq(d.type, 'custom');
    eq(d.template, 'classic');
    eq(d.personal.fullName, '');
    eq(d.personal.extra, undefined);
    eq(d.sections.length, 1);
    eq(d.sections[0].kind, 'custom');
    eq(d.sections[0].items[0].title, '123');
    eq(d.sections[0].items[0].malicious, undefined);
    eq(d.name, '<img src=x onerror=alert(1)>', 'texto preservado (será inserido via textContent)');
  });
  test('backup inválido gera mensagens claras', function () {
    assert(CM.exportImport.parseBackup('{oi').error, 'JSON quebrado');
    assert(CM.exportImport.parseBackup('[]').error, 'array');
    assert(CM.exportImport.parseBackup('{"format":"outro"}').error, 'formato errado');
    assert(CM.exportImport.parseBackup('{"format":"cmstudio-backup","version":99,"documents":[]}').error, 'versão futura');
    assert(CM.exportImport.parseBackup('{"format":"cmstudio-backup","version":1,"documents":[{}]}').error, 'sem docs válidos');
  });
  test('backup válido é lido', function () {
    var d = C.createDocument('firstJob');
    var json = JSON.stringify(CM.exportImport.buildBackup([d]));
    var r = CM.exportImport.parseBackup(json);
    assert(!r.error, r.error);
    eq(r.docs.length, 1);
    eq(r.docs[0].id, d.id);
  });

  /* ---------- Armazenamento ---------- */
  test('salvar, listar, carregar e excluir documentos independentes', function () {
    var a = C.createDocument('professional', { name: 'A' });
    var b = C.createDocument('school', { name: 'B' });
    assert(S.saveDoc(a).ok && S.saveDoc(b).ok);
    eq(S.listDocs().length, 2);
    var la = S.loadDoc(a.id);
    la.personal.fullName = 'Alterado';
    S.saveDoc(la);
    eq(S.loadDoc(b.id).personal.fullName, '', 'editar A não altera B');
    S.deleteDoc(a.id);
    eq(S.listDocs().length, 1);
    eq(S.loadDoc(a.id), null);
  });
  test('importação: mesclar não sobrescreve IDs existentes', function () {
    S.clearAll();
    var a = C.createDocument('professional', { name: 'Original' });
    S.saveDoc(a);
    var r = CM.exportImport.applyImport([U.deepClone(a)], 'merge');
    eq(r.saved, 1);
    eq(S.listDocs().length, 2);
    eq(S.loadDoc(a.id).name, 'Original');
  });
  test('importação: substituir apaga os anteriores', function () {
    var x = C.createDocument('school', { name: 'Novo' });
    CM.exportImport.applyImport([x], 'replace');
    eq(S.listDocs().length, 1);
    eq(S.listDocs()[0].name, 'Novo');
  });

  /* ---------- Estado / desfazer ---------- */
  test('estado: editar, desfazer e refazer', function () {
    S.clearAll();
    var d = C.createDocument('professional');
    S.saveDoc(d);
    assert(CM.state.open(d.id));
    CM.state.actions.setPersonal('fullName', 'Fulana');
    eq(CM.state.doc.personal.fullName, 'Fulana');
    var sid = CM.state.actions.addSection('awards');
    assert(CM.state.findSection(sid));
    CM.state.undo();
    assert(!CM.state.findSection(sid), 'desfazer remove a seção');
    CM.state.redo();
    assert(CM.state.findSection(sid), 'refazer devolve a seção');
    CM.state.saveNow();
    eq(S.loadDoc(d.id).personal.fullName, 'Fulana');
    CM.state.close();
  });
  test('trocar tipo preserva dados preenchidos', function () {
    var d = C.createDocument('professional');
    d.sections[1].items[0].title = 'Cargo real';
    S.saveDoc(d);
    CM.state.open(d.id);
    CM.state.actions.changeType('school', { applyTemplate: true, removeEmpty: true });
    var exp = CM.state.doc.sections.filter(function (s) { return s.kind === 'experience'; })[0];
    assert(exp && exp.items[0].title === 'Cargo real', 'experiência preenchida mantida');
    assert(CM.state.doc.sections.some(function (s) { return s.kind === 'scienceFairs'; }), 'seções escolares adicionadas');
    assert(!CM.state.doc.sections.some(function (s) { return s.kind === 'certifications'; }), 'seção vazia fora do tipo removida');
    eq(CM.state.doc.template, 'school');
    CM.state.close();
  });
  test('ordenar itens por data (mais recente primeiro)', function () {
    var d = C.createDocument('professional');
    var exp = d.sections.filter(function (s) { return s.kind === 'experience'; })[0];
    exp.items = [
      Object.assign(C.createItem('experience'), { title: 'Antigo', start: '2018', end: '2019' }),
      Object.assign(C.createItem('experience'), { title: 'Atual', start: '03/2023', current: true }),
      Object.assign(C.createItem('experience'), { title: 'Médio', start: '01/2020', end: '12/2022' })
    ];
    S.saveDoc(d);
    CM.state.open(d.id);
    CM.state.actions.sortItemsByDate(exp.id);
    var titles = CM.state.findSection(exp.id).items.map(function (i) { return i.title; });
    eq(titles.join(','), 'Atual,Médio,Antigo');
    CM.state.close();
  });

  /* ---------- Renderização ---------- */
  test('renderização: seções vazias não aparecem e texto é seguro', function () {
    var d = C.createDocument('school');
    d.personal.fullName = '<script>window.__xss=1</script>';
    var host = document.createElement('div');
    document.body.appendChild(host);
    var r = CM.preview.render(d, host, {});
    eq(r.pages, 1);
    eq(host.querySelectorAll('.rs-title').length, 0, 'nenhuma seção vazia exibida');
    eq(host.querySelectorAll('script').length, 0, 'nenhum script injetado');
    assert(host.textContent.indexOf('<script>') !== -1, 'nome exibido como texto literal');
    assert(!window.__xss);
    host.remove();
  });
  test('renderização: todos os modelos geram folhas na proporção do papel', function () {
    CM.templates.ids().forEach(function (id) {
      var d = CM.samples.forTemplate(id);
      var host = document.createElement('div');
      document.body.appendChild(host);
      var r = CM.preview.render(d, host, {});
      assert(r.pages >= 1, id);
      var page = host.querySelector('.page');
      var w = page.getBoundingClientRect().width, h = page.getBoundingClientRect().height;
      var ratio = d.design.paper === 'Letter' ? 279.4 / 215.9 : 297 / 210;
      assert(Math.abs(h / w - ratio) < 0.01, 'proporção ' + d.design.paper + ' em ' + id);
      assert(host.querySelector('.tpl-' + id), 'classe do modelo ' + id);
      host.remove();
    });
  });
  test('paginação: conteúdo longo gera várias páginas sem estourar', function () {
    var d = C.createDocument('professional');
    d.personal.fullName = 'Teste Longo';
    var exp = d.sections.filter(function (s) { return s.kind === 'experience'; })[0];
    exp.items = [];
    for (var n = 0; n < 14; n++) {
      exp.items.push(Object.assign(C.createItem('experience'), {
        title: 'Cargo ' + n, org: 'Empresa ' + n, start: '2010', end: '2011',
        description: '- Atividade um com texto razoavelmente longo para ocupar espaço na linha\n- Atividade dois\n- Atividade três\n- Atividade quatro'
      }));
    }
    var host = document.createElement('div');
    document.body.appendChild(host);
    var r = CM.preview.render(d, host, {});
    assert(r.pages >= 2, 'esperava 2+ páginas, obteve ' + r.pages);
    assert(!r.oversize, 'nenhum bloco maior que a página');
    host.querySelectorAll('.col').forEach(function (col) {
      var cb = col.getBoundingClientRect().bottom;
      Array.prototype.forEach.call(col.children, function (b) {
        assert(b.getBoundingClientRect().bottom <= cb + 1, 'bloco ultrapassa a página');
      });
    });
    // títulos nunca ficam sozinhos: cada .rs-title está no mesmo bloco que conteúdo
    host.querySelectorAll('.rs-title').forEach(function (t) {
      assert(t.parentElement.querySelector('.rb-body').textContent.trim().length > 0, 'título isolado');
    });
    eq(host.querySelectorAll('.page-footer').length, r.pages, 'numeração em todas as páginas');
    host.remove();
  });
  test('revisão aponta problemas reais', function () {
    var d = C.createDocument('firstJob');
    d.personal.email = 'invalido';
    d.sections[0].content = 'Busco vaga em [área]';
    var list = V.reviewDocument(d, 3);
    var text = list.map(function (x) { return x.text; }).join(' | ');
    assert(/nome completo/.test(text), 'nome');
    assert(/e-mail informado/.test(text), 'email');
    assert(/colchetes/.test(text), 'colchetes');
    assert(/3 páginas/.test(text), 'páginas');
  });
  test('nome oficial CM Studio presente e nome antigo ausente', function () {
    var html = document.documentElement.outerHTML;
    assert(html.indexOf('CM Studio') !== -1);
    assert(html.indexOf('CV' + ' Studio') === -1);
  });


  /* ================= Atualização internacional ================= */
  var K = CM.countries, R = CM.countryRules, L = CM.l10n;

  test('16 perfis (15 países + Outros) com status, data e fontes bem formadas', function () {
    var codes = K.list().map(function (p) { return p.code; }).sort().join(',');
    eq(codes, 'AU,BR,CA,CH,DE,ES,FR,IE,IT,JP,NL,NZ,PT,UK,US,XX');
    K.list().forEach(function (p) {
      assert(K.STATUS[p.status], 'status em ' + p.code);
      assert(p.name && p.summary, 'nome/resumo em ' + p.code);
      if (p.status === 'generic') { eq((p.sources || []).length, 0, 'genérico sem fontes'); return; }
      assert(/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt), 'data em ' + p.code);
      assert((p.sources || []).length >= 1, 'fontes em ' + p.code);
      p.sources.forEach(function (s) {
        assert(s.title && s.publisher && s.supports, 'campos da fonte em ' + p.code);
        assert(/^\d{4}-\d{2}-\d{2}$/.test(s.accessed), 'data da fonte em ' + p.code);
        assert(s.url === '' || /^https:\/\//.test(s.url), 'url da fonte em ' + p.code);
      });
    });
    eq(K.get('NL').status, 'preliminary');
    eq(K.get('BR').status, 'partial');
    eq(K.get('XX').status, 'generic');
  });

  test('fontes NÃO consultadas não são citadas', function () {
    K.list().forEach(function (p) {
      (p.sources || []).forEach(function (s) {
        assert(!/arbeitsagentur\.de/.test(s.url), 'arbeitsagentur citado em ' + p.code);
        assert(!/(^|\/\/)(www\.)?usa\.gov/.test(s.url), 'usa.gov citado em ' + p.code);
        assert(!/europass\.europa\.eu\/[a-z]{2}\/create-europass-cv/.test(s.url), 'página Europass citada em ' + p.code);
        assert(!/^https:\/\/www\.gov\.br\/?$/.test(s.url), 'raiz gov.br citada em ' + p.code);
      });
    });
  });

  test('sem estatísticas inventadas nos perfis (nenhum percentual)', function () {
    K.list().forEach(function (p) {
      var txt = JSON.stringify([p.summary, p.tips, p.warnings, p.statusNote, p.purposes]);
      assert(!/\d+\s?%/.test(txt), 'percentual em ' + p.code);
    });
  });

  test('regras por país: papel, foto, idioma e campos', function () {
    eq(R.paperFor('US'), 'Letter'); eq(R.paperFor('CA'), 'Letter'); eq(R.paperFor('UK'), 'A4'); eq(R.paperFor('BR'), 'A4');
    eq(R.photoPolicy('CA').policy, 'avoid'); eq(R.photoPolicy('BR').policy, 'avoid');
    assert(/não verificado/.test(R.photoLabel('UK')), 'foto no Reino Unido marcada como não verificada na fonte');
    assert(/orientação da fonte/.test(R.photoLabel('US')), 'foto nos EUA conferida na fonte');
    eq(R.defaultLanguage('BR'), 'pt-BR'); eq(R.defaultLanguage('DE'), 'de-DE'); eq(R.defaultLanguage('JP'), 'ja-JP');
    eq(R.defaultLanguage('CH', 'fr'), 'fr-CH');
    eq(R.fieldPolicy('US', 'birthDate') === 'recommended', false);
    eq(R.fieldPolicy('BR', 'birthDate'), 'discouraged');
    eq(R.fieldPolicy('XX', 'inexistente'), 'hidden');
    eq(R.templatesFor('US', 'professional').first, 'usResume');
    eq(R.templatesFor('DE', 'professional').first, 'lebenslauf');
    eq(R.templatesFor('JP', 'professional').first, 'jpRirekisho');
    eq(R.templatesFor('BR', 'school').first, 'school');
    eq(R.templatesFor('BR', 'professional').first, 'corporate');
    assert(R.purposesFor('BR').indexOf('apprentice') !== -1, 'jovem aprendiz no Brasil');
  });

  test('criação com país, idioma e papel', function () {
    var d = C.createDocument('professional', { country: 'US', locale: 'en-US', paper: 'Letter', template: 'usResume' });
    eq(d.country, 'US'); eq(d.locale, 'en-US'); eq(d.design.paper, 'Letter'); eq(d.template, 'usResume');
    eq(d.schemaVersion, 2);
    var exp = d.sections.filter(function (s) { return s.kind === 'experience'; })[0];
    eq(exp.title, L.sectionTitle('experience', 'en-US'));
  });

  test('migração v1 → v2: Brasil, pt-BR, títulos preservados, nada perdido', function () {
    var v1 = { id: 'doc_v1test', schemaVersion: 1, name: 'Antigo', type: 'professional', template: 'classic', createdAt: 1, updatedAt: 2,
      design: { accent: 'teal', fontScale: 'normal', density: 'normal', pageNumbers: true },
      personal: { fullName: 'Pessoa Antiga', email: 'a@example.com' },
      sections: [
        { id: 's1', kind: 'summary', title: 'Objetivo', visible: true, content: 'Texto antigo' },
        { id: 's2', kind: 'experience', title: 'Minha trajetória', visible: true, items: [{ id: 'i1', title: 'Cargo', org: 'Empresa', start: '01/2020', current: true }] }
      ] };
    var r = V.sanitizeDocument(JSON.parse(JSON.stringify(v1)));
    var d = r.doc || r;
    eq(d.schemaVersion, 2); eq(d.country, 'BR'); eq(d.locale, 'pt-BR'); eq(d.design.paper, 'A4');
    eq(d.personal.fullName, 'Pessoa Antiga');
    eq(d.sections[0].title, 'Objetivo'); eq(d.sections[0].titleKey, 'summary'); eq(d.sections[0].content, 'Texto antigo');
    eq(d.sections[1].title, 'Minha trajetória');
    eq(d.sections[1].items[0].org, 'Empresa');
    // via armazenamento: abre, migra, salva e guarda cópia do original
    localStorage.setItem('cmstudio.v1.doc.doc_v1test', JSON.stringify(v1));
    S._rebuildIndex();
    assert(CM.state.open('doc_v1test'), 'abriu documento v1');
    eq(CM.state.doc.schemaVersion, 2);
    CM.state.close();
    var legacy = S.loadLegacy('doc_v1test');
    assert(legacy && legacy.schemaVersion === 1, 'cópia do original v1 guardada');
    S.deleteDoc('doc_v1test');
  });

  test('trocar país e idioma preserva todos os dados (BR → US → JP → BR)', function () {
    var d = C.createDocument('professional', { country: 'BR' });
    d.personal.fullName = 'Maria Teste'; d.personal.email = 'maria@example.com'; d.personal.birthDate = '01/01/2000';
    var exp = d.sections.filter(function (s) { return s.kind === 'experience'; })[0];
    exp.items = [{ id: 'it1', title: 'Assistente', org: 'Universidade Federal Exemplo', start: '03/2021', current: true, description: '- Atendimento' }];
    var custom = d.sections.filter(function (s) { return s.kind === 'skills'; })[0];
    custom.title = 'Minhas ferramentas';
    S.saveDoc(d);
    CM.state.open(d.id);
    var A = CM.state.actions;
    var before = JSON.stringify({ p: CM.state.doc.personal, items: CM.state.doc.sections.map(function (s) { return [s.id, s.kind, s.items || s.tags || s.content]; }) });
    A.changeCountry('US', { locale: true, paper: true, template: true });
    eq(CM.state.doc.country, 'US'); eq(CM.state.doc.locale, 'en-US'); eq(CM.state.doc.design.paper, 'Letter');
    eq(CM.state.doc.sections.filter(function (s) { return s.kind === 'experience'; })[0].title, L.sectionTitle('experience', 'en-US'));
    eq(CM.state.doc.sections.filter(function (s) { return s.kind === 'skills'; })[0].title, 'Minhas ferramentas', 'título personalizado mantido');
    A.changeCountry('JP', { locale: true, paper: true, template: true });
    eq(CM.state.doc.template, 'jpRirekisho'); eq(CM.state.doc.locale, 'ja-JP');
    A.changeCountry('BR', { locale: true, paper: true, template: true });
    var after = JSON.stringify({ p: CM.state.doc.personal, items: CM.state.doc.sections.map(function (s) { return [s.id, s.kind, s.items || s.tags || s.content]; }) });
    eq(after, before, 'dados idênticos após as trocas');
    eq(CM.state.doc.sections.filter(function (s) { return s.kind === 'experience'; })[0].title, 'Experiência profissional');
    eq(CM.state.doc.personal.birthDate, '01/01/2000', 'campo desaconselhado não é apagado');
    CM.state.close();
    S.deleteDoc(d.id);
  });

  test('idioma independente do país (Portugal em alemão) e aviso de idioma', function () {
    var d = C.createDocument('professional', { country: 'PT', locale: 'de-DE' });
    d.personal.fullName = 'Ana';
    var host = document.createElement('div'); document.body.appendChild(host);
    var r = CM.preview.render(d, host, {});
    eq(r.root.getAttribute('lang'), 'de-DE');
    host.remove();
    var w = R.reviewWarnings(d).filter(function (x) { return x.group === 'language'; });
    assert(w.length >= 1, 'aviso de idioma não sugerido');
  });

  test('A4 ↔ Letter: folha muda de proporção e aviso de papel diferente', function () {
    var d = C.createDocument('professional', { country: 'US', locale: 'en-US', paper: 'A4' });
    d.personal.fullName = 'Sam';
    var host = document.createElement('div'); document.body.appendChild(host);
    CM.preview.render(d, host, {});
    var pg = host.querySelector('.page').getBoundingClientRect();
    assert(Math.abs(pg.height / pg.width - 297 / 210) < 0.01, 'A4');
    assert(R.reviewWarnings(d).some(function (x) { return x.group === 'paper'; }), 'aviso de papel');
    d.design.paper = 'Letter';
    CM.preview.render(d, host, {});
    pg = host.querySelector('.page').getBoundingClientRect();
    assert(Math.abs(pg.height / pg.width - 279.4 / 215.9) < 0.01, 'Letter');
    assert(!R.reviewWarnings(d).some(function (x) { return x.group === 'paper'; }), 'sem aviso no padrão');
    host.remove();
  });

  test('dados sensíveis: aviso quando preenchidos em país que desaconselha', function () {
    var d = C.createDocument('professional', { country: 'UK', locale: 'en-GB' });
    d.personal.birthDate = '01/01/1990';
    assert(R.reviewWarnings(d).some(function (x) { return x.group === 'privacy' && x.target === 'p:birthDate'; }), 'aviso de data de nascimento');
  });

  test('履歴書 e 職務経歴書 têm estruturas diferentes e sem campos proibidos', function () {
    var d = CM.samples.forTemplate('jpRirekisho');
    var host = document.createElement('div'); document.body.appendChild(host);
    CM.preview.render(d, host, {});
    assert(host.querySelector('.jp-row'), 'tabela 年|月 no rirekisho');
    var t1 = host.textContent;
    assert(t1.indexOf('履歴書') !== -1, 'título rirekisho');
    ['国籍', '宗教', '家族', '口座', '配偶者'].forEach(function (w) { assert(t1.indexOf(w) === -1, 'campo indevido ' + w); });
    d.template = 'jpShokumu';
    CM.preview.render(d, host, {});
    assert(!host.querySelector('.jp-row'), 'shokumu sem tabela do rirekisho');
    assert(host.textContent.indexOf('職務経歴書') !== -1, 'título shokumu');
    host.remove();
  });

  test('analisador local: encontra, aponta ausentes e não inventa', function () {
    var d = C.createDocument('professional', { country: 'US', locale: 'en-US' });
    d.sections.filter(function (s) { return s.kind === 'skills'; })[0].tags = ['Excel', 'Customer service'];
    var job = 'Looking for an analyst with Excel and SQL. SQL daily. Power BI dashboards and Power BI reports. Excel required.';
    var r = CM.jobAnalyzer.analyze(job, d);
    assert(r.found.some(function (f) { return f.term === 'Excel'; }), 'Excel encontrado');
    assert(r.missing.some(function (f) { return f.term === 'SQL'; }), 'SQL ausente');
    assert(r.missing.some(function (f) { return f.term === 'Power BI'; }), 'Power BI como termo composto');
    eq(d.sections.filter(function (s) { return s.kind === 'skills'; })[0].tags.length, 2, 'currículo não foi alterado');
  });

  test('assistente de conquistas não inventa números', function () {
    var line = CM.writingAssistant.build('pt-BR', { verb: 'Organizei', what: 'o estoque', how: 'planilhas', result: '', number: '' });
    eq(line, '- Organizei o estoque, usando planilhas.');
    assert(!/\d/.test(line), 'sem números');
    var l2 = CM.writingAssistant.build('en-US', { verb: 'Reduced', what: 'response time', number: '20 tickets/day' });
    eq(l2, '- Reduced response time (20 tickets/day).');
    eq(CM.writingAssistant.build('en-US', { what: '' }), '');
  });

  test('cartas: idioma próprio, separadas do currículo', function () {
    var d = C.createDocument('professional', { country: 'DE', locale: 'de-DE' });
    d.personal.fullName = 'Lena Beispiel';
    var c = CM.letters.create('anschreiben', d);
    eq(c.locale, 'de-DE'); eq(c.salutation, 'Sehr geehrte Damen und Herren,');
    var sc = V.sanitizeCompanion(Object.assign({}, c, { body: 'Absatz eins.\n\nAbsatz zwei.' }));
    var host = document.createElement('div'); document.body.appendChild(host);
    var r = CM.letters.render(sc, d, host);
    eq(r.pages, 1);
    assert(host.textContent.indexOf('Absatz zwei.') !== -1);
    host.remove();
    var host2 = document.createElement('div'); document.body.appendChild(host2);
    d.companions = [sc];
    CM.preview.render(d, host2, {});
    assert(host2.textContent.indexOf('Absatz zwei.') === -1, 'carta não aparece no currículo');
    host2.remove();
  });

  test('foto: só data URL de imagem segura é aceita', function () {
    assert(!V.safePhoto('javascript:alert(1)'));
    assert(!V.safePhoto('data:image/svg+xml;base64,PHN2Zz4='));
    assert(V.safePhoto('data:image/png;base64,iVBORw0KGgo='));
  });

  test('traduções: idiomas completos e títulos japoneses sem tradução', function () {
    CM.i18n.codes().forEach(function (c) { eq(CM.i18n.completeness(c).document, 'full', 'completude ' + c); });
    eq(L.docTitle('rirekisho', 'en-US'), '履歴書');
  });

  /* ---------- Idioma da interface (Fase 3) ---------- */
  var UI = CM.uiLang;
  var MSGS = window.CM_UI_MESSAGES || [];
  function ph(x) { return (String(x).match(/\{\w+\}/g) || []).sort().join(','); }
  function tg(x) { return (String(x).match(/<\/?[a-z]+/g) || []).sort().join(','); }

  test('interface: catálogo inteiro traduzido em en-US, de-DE, fr-FR e ja-JP', function () {
    assert(MSGS.length > 1400, 'catálogo carregado (' + MSGS.length + ')');
    ['en-US', 'de-DE', 'fr-FR', 'ja-JP'].forEach(function (c) {
      var miss = MSGS.filter(function (m) { return UI.lookup(c, m) == null; });
      eq(miss.length, 0, c + ' sem tradução: ' + miss.slice(0, 3).join(' | '));
    });
  });

  test('interface: marcadores {0} e marcação HTML preservados em todos os idiomas', function () {
    UI.codes().forEach(function (c) {
      MSGS.forEach(function (m) {
        var v = UI.lookup(c, m);
        if (v == null) return;
        eq(ph(v), ph(m), c + ' marcadores: ' + m.slice(0, 40));
        eq(tg(v), tg(m), c + ' tags: ' + m.slice(0, 40));
      });
    });
  });

  test('interface: idioma parcial cai no inglês, nunca em chave técnica nem em português', function () {
    var m = MSGS.filter(function (x) { return UI.lookup('es-ES', x) == null && UI.lookup('en-US', x) !== x; })[0];
    assert(m, 'há mensagem sem tradução em es-ES');
    UI.set('es-ES', { force: true });
    eq(UI.t(m), UI.lookup('en-US', m));
    eq(UI.t('Mensagem fora do catálogo'), 'Mensagem fora do catálogo');
    UI.set('pt-PT', { force: true });
    eq(UI.t('Configurações'), 'Definições');
    UI.set('pt-BR', { force: true });
  });

  test('interface: situação declarada de cada idioma', function () {
    eq(UI.status('pt-BR'), 'source');
    ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'en-GB', 'de-CH', 'fr-CA'].forEach(function (c) { eq(UI.status(c), 'complete', c); });
    ['es-ES', 'it-IT', 'nl-NL', 'it-CH'].forEach(function (c) { eq(UI.status(c), 'partial', c); });
    eq(UI.status('pt-PT'), 'adapted');
    var cov = UI.coverage('es-ES');
    assert(cov && cov.translated < cov.total, 'cobertura parcial registrada');
  });

  test('interface: variantes regionais', function () {
    eq(UI.lookup('en-GB', 'Meus currículos'), 'My CVs');
    eq(UI.lookup('en-AU', 'Meus currículos'), 'My resumes');
    eq(UI.lookup('en-GB', 'Résumé norte-americano'), UI.lookup('en-US', 'Résumé norte-americano'));
    assert(MSGS.every(function (m) { var v = UI.lookup('de-CH', m); return v == null || v.indexOf('ß') === -1; }), 'de-CH sem ß');
    eq(UI.lookup('en-GB', 'Ex.: 14/05/2001'), 'e.g. 14/05/2001');
  });

  test('interface: html lang e plural japonês', function () {
    UI.set('ja-JP', { force: true });
    eq(document.documentElement.lang, 'ja-JP');
    eq(CM.utils.plural(3, 'fonte', 'fontes'), '3件の情報源');
    UI.set('de-DE', { force: true });
    eq(CM.utils.plural(1, 'fonte', 'fontes'), '1 Quelle');
    UI.set('pt-BR', { force: true });
    eq(document.documentElement.lang, 'pt-BR');
  });

  test('interface: trocar o idioma não altera as regras dos países', function () {
    function rules() {
      return CM.countries.list().map(function (p) {
        return [p.code, CM.countryRules.paperFor(p.code), CM.countryRules.languagesFor(p.code).join(','), p.defaultLanguage, JSON.stringify(p.photo && p.photo.policy)].join('|');
      }).join('\n');
    }
    var before = rules();
    UI.set('fr-FR', { force: true });
    var during = rules();
    UI.set('pt-BR', { force: true });
    eq(during, before);
  });

  /* ---------- Restaura dados do usuário ---------- */
  CM.state.close();
  CM.storage.clearAll();
  Object.keys(backup).forEach(function (k) { localStorage.setItem(k, backup[k]); });

  /* ---------- Saída ---------- */
  var passed = results.filter(function (r) { return r.ok; }).length;
  window.__TEST_RESULTS__ = { total: results.length, passed: passed, failed: results.length - passed, results: results };
  var out = document.getElementById('results');
  var summary = document.getElementById('summary');
  summary.textContent = passed + ' de ' + results.length + ' testes aprovados';
  summary.className = passed === results.length ? 'ok' : 'fail';
  results.forEach(function (r) {
    var li = document.createElement('li');
    li.className = r.ok ? 'ok' : 'fail';
    li.textContent = (r.ok ? '✔ ' : '✘ ') + r.name + (r.ok ? '' : ' — ' + r.error);
    out.appendChild(li);
  });
})();
