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
  test('todos os 11 tipos criam documentos válidos', function () {
    eq(C.TYPE_ORDER.length, 11);
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
  test('renderização: todos os 9 modelos geram páginas A4', function () {
    CM.templates.ids().forEach(function (id) {
      var d = CM.samples.forTemplate(id);
      var host = document.createElement('div');
      document.body.appendChild(host);
      var r = CM.preview.render(d, host, {});
      assert(r.pages >= 1, id);
      var page = host.querySelector('.page');
      var w = page.getBoundingClientRect().width, h = page.getBoundingClientRect().height;
      assert(Math.abs(h / w - 297 / 210) < 0.01, 'proporção A4 em ' + id);
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
