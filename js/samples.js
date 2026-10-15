/* ==========================================================================
   CM Studio — samples.js
   Documentos FICTÍCIOS usados apenas nas miniaturas da galeria de modelos.
   Nenhum dado real de pessoas é utilizado. Os e-mails usam o domínio
   reservado example.com.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var C = CM.catalog;

  function fill(doc, kind, data) {
    var sec = doc.sections.filter(function (s) { return s.kind === kind; })[0];
    if (!sec) { sec = C.createSection(kind); doc.sections.push(sec); }
    if (typeof data === 'string') sec.content = data;
    else if (Array.isArray(data) && typeof data[0] === 'string') sec.tags = data;
    else if (Array.isArray(data)) {
      sec.items = data.map(function (d) { return Object.assign(C.createItem(kind), d); });
    }
    return sec;
  }

  function professional() {
    var d = C.createDocument('professional', { name: 'Exemplo' });
    d.personal = {
      fullName: 'Marina Exemplo Duarte', headline: 'Analista Administrativa',
      email: 'marina@example.com', phone: '(00) 90000-0000', location: 'Cidade Exemplo/PR',
      linkedin: 'linkedin.com/in/exemplo', github: '', website: ''
    };
    fill(d, 'summary', 'Profissional com experiência em rotinas administrativas, atendimento e controle de documentos. Texto fictício usado apenas para demonstrar o modelo.');
    fill(d, 'experience', [
      { title: 'Assistente Administrativa', org: 'Empresa Fictícia Ltda.', location: 'Cidade Exemplo/PR', start: '03/2022', current: true,
        description: '- Organização de documentos e arquivos físicos e digitais.\n- Atendimento a clientes por telefone e e-mail.\n- Apoio no controle de contas a pagar.' },
      { title: 'Recepcionista', org: 'Clínica Modelo', location: 'Cidade Exemplo/PR', start: '01/2020', end: '02/2022',
        description: '- Agendamento de consultas e recepção de pacientes.\n- Atualização de cadastros no sistema.' }
    ]);
    fill(d, 'education', [{ course: 'Tecnólogo em Gestão Empresarial', institution: 'Faculdade Exemplo', start: '2019', end: '2021', status: 'concluido' }]);
    fill(d, 'skills', ['Rotinas administrativas', 'Planilhas eletrônicas', 'Atendimento ao cliente', 'Organização de arquivos', 'Redação de e-mails']);
    fill(d, 'languages', [{ name: 'Inglês', level: 'Intermediário' }, { name: 'Espanhol', level: 'Básico' }]);
    fill(d, 'certifications', [{ name: 'Excel Intermediário', institution: 'Escola Exemplo', workload: '30 h', date: '2023' }]);
    return d;
  }

  function student() {
    var d = C.createDocument('school', { name: 'Exemplo' });
    d.personal = {
      fullName: 'Lucas Exemplo Moreira', headline: 'Estudante do 2º ano do Ensino Médio',
      email: 'lucas@example.com', phone: '', location: 'Cidade Exemplo/PR', linkedin: '', github: '', website: ''
    };
    fill(d, 'summary', 'Estudante interessado em ciências e tecnologia, buscando participar de programas educacionais. Texto fictício de demonstração.');
    fill(d, 'education', [{ course: 'Ensino Médio — 2º ano', institution: 'Colégio Estadual Exemplo', start: '2025', end: '12/2027', status: 'cursando' }]);
    fill(d, 'schoolProjects', [
      { name: 'Horta escolar sustentável', role: 'Integrante da equipe', org: 'Disciplina de Biologia', start: '2025',
        description: '- Pesquisa sobre compostagem e apresentação para a turma.' }
    ]);
    fill(d, 'scienceFairs', [{ name: 'Filtro de água com materiais recicláveis', org: 'Feira de Ciências da escola', start: '2025' }]);
    fill(d, 'extracurricular', [{ title: 'Clube de xadrez', org: 'Colégio Estadual Exemplo', start: '2024', current: true }]);
    fill(d, 'languages', [{ name: 'Inglês', level: 'Básico' }]);
    fill(d, 'softSkills', ['Trabalho em equipe', 'Organização', 'Curiosidade']);
    fill(d, 'techSkills', ['Editor de textos', 'Apresentações de slides']);
    return d;
  }

  function firstJob() {
    var d = student();
    d.type = 'firstJob';
    d.personal.headline = 'Em busca do primeiro emprego';
    var s = d.sections.filter(function (x) { return x.kind === 'summary'; })[0];
    s.title = 'Objetivo profissional';
    s.content = 'Busco minha primeira oportunidade de trabalho como auxiliar administrativo. Texto fictício de demonstração.';
    fill(d, 'courses', [{ name: 'Informática básica', institution: 'Centro Exemplo', workload: '40 h', date: '2025' }]);
    return d;
  }

  function academic() {
    var d = C.createDocument('academicExtended', { name: 'Exemplo' });
    d.personal = {
      fullName: 'Helena Exemplo Prado', headline: 'Graduanda em Ciências Biológicas',
      email: 'helena@example.com', phone: '', location: 'Cidade Exemplo/PR', linkedin: '', github: '', website: 'lattes.example.com/exemplo'
    };
    fill(d, 'summary', 'Graduanda com interesse em ecologia de ambientes aquáticos. Texto fictício de demonstração.');
    fill(d, 'researchInterests', ['Ecologia aquática', 'Qualidade da água', 'Educação ambiental']);
    fill(d, 'education', [{ course: 'Bacharelado em Ciências Biológicas', institution: 'Universidade Exemplo', start: '2023', end: '12/2026', status: 'cursando' }]);
    fill(d, 'research', [{ name: 'Monitoramento de macroinvertebrados em riachos', role: 'Bolsista de iniciação científica', org: 'Laboratório Exemplo', start: '2024', current: false, end: '2025',
      description: '- Coleta e triagem de amostras em campo.\n- Organização de dados em planilhas.' }]);
    fill(d, 'publications', [{ authors: 'PRADO, H. E.; SILVA, A. B.', title: 'Título fictício de resumo expandido', venue: 'Anais do Congresso Exemplo', year: '2025' }]);
    fill(d, 'presentations', [{ title: 'Pôster: resultados preliminares', event: 'Semana Acadêmica Exemplo', date: '2025' }]);
    fill(d, 'languages', [{ name: 'Inglês', level: 'Avançado' }]);
    return d;
  }

  /** Retorna um documento fictício apropriado para o modelo informado. */
  function forTemplate(tplId) {
    var d;
    if (tplId === 'school') d = student();
    else if (tplId === 'firstJob') d = firstJob();
    else if (tplId === 'academic' || tplId === 'academicExtended') d = academic();
    else d = professional();
    d.template = tplId;
    return d;
  }

  CM.samples = { forTemplate: forTemplate };
})();
