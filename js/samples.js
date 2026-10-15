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
    if (!sec) { sec = C.createSection(kind, null, doc.locale || 'pt-BR'); doc.sections.push(sec); }
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

  /* ---------------- Exemplos em outros idiomas (Atualização internacional) ----------------
     Também fictícios. Usados nas miniaturas dos modelos internacionais e na
     pré-visualização do assistente de criação. */
  function english() {
    var d = C.createDocument('professional', { name: 'Example', country: 'US', locale: 'en-US', paper: 'Letter' });
    d.personal = Object.assign(d.personal, {
      fullName: 'Jordan Example Reyes', headline: 'Operations Analyst',
      email: 'jordan@example.com', phone: '+1 (555) 010-0000', location: 'Example City, ST',
      linkedin: 'linkedin.com/in/example'
    });
    fill(d, 'summary', 'Operations analyst with experience in process documentation, scheduling and customer support. Fictional text used only to demonstrate the template.');
    fill(d, 'experience', [
      { title: 'Operations Assistant', org: 'Example Logistics Inc.', location: 'Example City, ST', start: '03/2022', current: true,
        description: '- Maintained shipment records and weekly status reports.\n- Coordinated schedules for a team of six.\n- Answered customer requests by phone and email.' },
      { title: 'Front Desk Associate', org: 'Sample Health Clinic', location: 'Example City, ST', start: '01/2020', end: '02/2022',
        description: '- Scheduled appointments and updated patient records.' }
    ]);
    fill(d, 'education', [{ course: 'B.S. in Business Administration', institution: 'Example State University', start: '2016', end: '2020', status: 'concluido' }]);
    fill(d, 'skills', ['Process documentation', 'Spreadsheets', 'Scheduling', 'Customer support']);
    fill(d, 'languages', [{ name: 'Spanish', level: 'Intermediário' }]);
    return d;
  }

  function german() {
    var d = C.createDocument('professional', { name: 'Beispiel', country: 'DE', locale: 'de-DE', template: 'lebenslauf' });
    d.personal = Object.assign(d.personal, {
      fullName: 'Lena Beispiel Hofmann', headline: '',
      email: 'lena@example.com', phone: '+49 30 0000000', location: 'Beispielstadt',
      address: 'Musterweg 1, 00000 Beispielstadt'
    });
    fill(d, 'experience', [
      { title: 'Sachbearbeiterin Einkauf', org: 'Beispiel GmbH', location: 'Beispielstadt', start: '04/2021', current: true,
        description: '- Angebotsvergleiche und Bestellabwicklung.\n- Pflege der Lieferantendaten.' },
      { title: 'Praktikantin Verwaltung', org: 'Muster AG', location: 'Beispielstadt', start: '09/2020', end: '02/2021' }
    ]);
    fill(d, 'education', [{ course: 'B.A. Betriebswirtschaftslehre', institution: 'Hochschule Beispiel', start: '2017', end: '2020', status: 'concluido' }]);
    fill(d, 'courses', [{ name: 'Tabellenkalkulation für Fortgeschrittene', institution: 'Beispiel-Akademie', date: '2022' }]);
    fill(d, 'languages', [{ name: 'Deutsch', level: 'Nativo' }, { name: 'Englisch', level: 'C1' }]);
    fill(d, 'computerSkills', ['Tabellenkalkulation', 'ERP-Systeme', 'Textverarbeitung']);
    fill(d, 'interests', ['Fotografie', 'Laufen']);
    return d;
  }

  function japanese() {
    var d = C.createDocument('professional', { name: '見本', country: 'JP', locale: 'ja-JP', template: 'jpRirekisho' });
    d.personal = Object.assign(d.personal, {
      fullName: '見本 花子', furigana: 'みほん はなこ',
      email: 'hanako@example.com', phone: '+81 3-0000-0000', location: '東京都 架空区', address: '東京都架空区見本町1-1'
    });
    fill(d, 'summary', '架空の会社で事務と顧客対応を担当しました。テンプレート確認用の架空の文章です。');
    fill(d, 'education', [{ course: '経営学部 経営学科', institution: '見本大学', start: '04/2015', end: '03/2019', status: 'concluido' }]);
    fill(d, 'experience', [
      { title: '総務担当', org: '株式会社見本', start: '04/2019', current: true,
        description: '- 社内書類の管理と発送業務を担当。\n- 月次報告資料の作成。' }
    ]);
    fill(d, 'certifications', [{ name: '日本語能力試験 N2（架空）', date: '07/2018' }]);
    fill(d, 'skills', ['表計算ソフト', '文書作成']);
    fill(d, 'motivation', '架空の志望動機です。貴社の事業内容に関心を持ち、これまでの事務経験を活かしたいと考えました。');
    fill(d, 'selfPR', '架空の自己PRです。正確な書類管理を心がけてきました。');
    fill(d, 'personalWishes', '貴社の規定に従います。（架空の例）');
    return d;
  }

  function europe() {
    var d = english();
    d.country = 'XX'; d.locale = 'en-GB'; d.design.paper = 'A4';
    d.personal.fullName = 'Alex Example Novak';
    d.personal.location = 'Example City, Country';
    d.personal.phone = '+00 000 000 000';
    CM.l10n.retitleSections(d, 'en-US', 'en-GB');
    return d;
  }

  /**
   * Retorna um documento fictício apropriado para o modelo informado.
   * opts (opcional): { country, locale, paper } — usados pela pré-visualização
   * do assistente para mostrar rótulos, datas e papel do país escolhido.
   */
  function forTemplate(tplId, opts) {
    opts = opts || {};
    var d;
    var lang = String(opts.locale || '').slice(0, 2);
    if (tplId === 'jpRirekisho' || tplId === 'jpShokumu') d = japanese();
    else if (tplId === 'lebenslauf') d = lang && lang !== 'de' ? english() : german();
    else if (tplId === 'usResume') d = english();
    else if (tplId === 'europass') d = europe();
    else if (lang === 'de') d = german();
    else if (lang === 'ja') d = japanese();
    else if (lang && lang !== 'pt') d = english();
    else if (tplId === 'school') d = student();
    else if (tplId === 'firstJob') d = firstJob();
    else if (tplId === 'academic' || tplId === 'academicExtended') d = academic();
    else d = professional();
    d.template = tplId;
    if (opts.country) d.country = opts.country;
    if (opts.paper) d.design.paper = opts.paper;
    if (opts.locale && opts.locale !== d.locale) {
      CM.l10n.retitleSections(d, d.locale, opts.locale);
      d.locale = opts.locale;
    }
    return d;
  }

  CM.samples = { forTemplate: forTemplate };
})();
