/* ==========================================================================
   CM Studio — catalog.js
   Define o "vocabulário" do aplicativo:
   - SCHEMAS: estrutura dos campos de cada tipo de item;
   - KINDS: tipos de seção disponíveis (Experiência, Projetos escolares...);
   - TYPES: tipos de currículo (Profissional, Escolar, Acadêmico...),
     com as seções sugeridas, o modelo recomendado e orientações.
   Também cria documentos e seções novas (fábricas).
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;

  /* ---------------- Opções de listas ---------------- */
  var LANGUAGE_LEVELS = ['', 'Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'];
  var EDUCATION_STATUS = [
    { value: '', label: 'Não informar' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cursando', label: 'Cursando / em andamento' },
    { value: 'trancado', label: 'Trancado' },
    { value: 'interrompido', label: 'Interrompido' }
  ];

  /* ---------------- Esquemas de itens ----------------
     Cada campo: key, label, type (text|textarea|checkbox|select|url),
     placeholder, width (full|half|third) e opções. */
  var SCHEMAS = {
    text: { kind: 'text' },
    tags: { kind: 'tags' },
    entry: {
      kind: 'items',
      fields: [
        { key: 'title', label: 'Função ou atividade', type: 'text', width: 'half' },
        { key: 'org', label: 'Organização', type: 'text', width: 'half' },
        { key: 'location', label: 'Local', type: 'text', width: 'third', placeholder: 'Ex.: Curitiba/PR ou Remoto' },
        { key: 'start', label: 'Início', type: 'text', width: 'third', placeholder: 'Ex.: 03/2023' },
        { key: 'end', label: 'Término', type: 'text', width: 'third', placeholder: 'Ex.: 12/2024' },
        { key: 'current', label: 'Em andamento (atual)', type: 'checkbox', width: 'full' },
        { key: 'description', label: 'Descrição', type: 'textarea', width: 'full' }
      ],
      titleKeys: ['title', 'org'],
      dateKeys: ['start', 'end']
    },
    education: {
      kind: 'items',
      fields: [
        { key: 'course', label: 'Curso, série ou nível', type: 'text', width: 'half', placeholder: 'Ex.: Ensino Médio — 2º ano' },
        { key: 'institution', label: 'Instituição de ensino', type: 'text', width: 'half', placeholder: 'Ex.: Escola Estadual ...' },
        { key: 'location', label: 'Cidade/UF', type: 'text', width: 'third' },
        { key: 'start', label: 'Início', type: 'text', width: 'third', placeholder: 'Ex.: 2024' },
        { key: 'end', label: 'Conclusão (ou previsão)', type: 'text', width: 'third', placeholder: 'Ex.: 12/2026' },
        { key: 'status', label: 'Situação', type: 'select', width: 'half', options: EDUCATION_STATUS },
        { key: 'description', label: 'Detalhes (opcional)', type: 'textarea', width: 'full', placeholder: 'Ex.: Ênfase, trabalho de conclusão, destaques reais.' }
      ],
      titleKeys: ['course', 'institution'],
      dateKeys: ['start', 'end']
    },
    course: {
      kind: 'items',
      fields: [
        { key: 'name', label: 'Nome do curso', type: 'text', width: 'half' },
        { key: 'institution', label: 'Instituição ou plataforma', type: 'text', width: 'half' },
        { key: 'workload', label: 'Carga horária', type: 'text', width: 'third', placeholder: 'Ex.: 40 h' },
        { key: 'date', label: 'Data de conclusão', type: 'text', width: 'third', placeholder: 'Ex.: 2025' },
        { key: 'description', label: 'Descrição (opcional)', type: 'textarea', width: 'full' }
      ],
      titleKeys: ['name', 'institution'],
      dateKeys: ['date']
    },
    project: {
      kind: 'items',
      fields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', width: 'half' },
        { key: 'role', label: 'Sua participação', type: 'text', width: 'half', placeholder: 'Ex.: Integrante, responsável pela pesquisa' },
        { key: 'org', label: 'Contexto ou instituição', type: 'text', width: 'third', placeholder: 'Ex.: Disciplina de Biologia' },
        { key: 'start', label: 'Início', type: 'text', width: 'third' },
        { key: 'end', label: 'Término', type: 'text', width: 'third' },
        { key: 'link', label: 'Link (opcional)', type: 'url', width: 'full', placeholder: 'https://...' },
        { key: 'description', label: 'Descrição', type: 'textarea', width: 'full' }
      ],
      titleKeys: ['name', 'role'],
      dateKeys: ['start', 'end']
    },
    award: {
      kind: 'items',
      fields: [
        { key: 'title', label: 'Título', type: 'text', width: 'half' },
        { key: 'issuer', label: 'Concedido por / resultado', type: 'text', width: 'half' },
        { key: 'date', label: 'Ano ou data', type: 'text', width: 'third' },
        { key: 'description', label: 'Descrição (opcional)', type: 'textarea', width: 'full' }
      ],
      titleKeys: ['title', 'issuer'],
      dateKeys: ['date']
    },
    event: {
      kind: 'items',
      fields: [
        { key: 'title', label: 'Título da apresentação', type: 'text', width: 'half' },
        { key: 'event', label: 'Evento', type: 'text', width: 'half' },
        { key: 'location', label: 'Local', type: 'text', width: 'third' },
        { key: 'date', label: 'Data', type: 'text', width: 'third' },
        { key: 'description', label: 'Descrição (opcional)', type: 'textarea', width: 'full' }
      ],
      titleKeys: ['title', 'event'],
      dateKeys: ['date']
    },
    publication: {
      kind: 'items',
      fields: [
        { key: 'authors', label: 'Autores', type: 'text', width: 'full', placeholder: 'Ex.: SOBRENOME, Nome; SOBRENOME, Nome' },
        { key: 'title', label: 'Título', type: 'text', width: 'full' },
        { key: 'venue', label: 'Revista, anais ou editora', type: 'text', width: 'half' },
        { key: 'year', label: 'Ano', type: 'text', width: 'third' },
        { key: 'link', label: 'Link ou DOI (opcional)', type: 'url', width: 'full', placeholder: 'https://doi.org/...' }
      ],
      titleKeys: ['title', 'venue'],
      dateKeys: ['year']
    },
    language: {
      kind: 'items',
      fields: [
        { key: 'name', label: 'Idioma', type: 'text', width: 'third', placeholder: 'Ex.: Inglês' },
        { key: 'level', label: 'Nível', type: 'select', width: 'third', options: LANGUAGE_LEVELS.map(function (l) { return { value: l, label: l || 'Não informar' }; }) },
        { key: 'note', label: 'Certificado ou observação', type: 'text', width: 'third', placeholder: 'Opcional' }
      ],
      titleKeys: ['name', 'level']
    },
    link: {
      kind: 'items',
      fields: [
        { key: 'label', label: 'Nome do link', type: 'text', width: 'third', placeholder: 'Ex.: Portfólio' },
        { key: 'url', label: 'Endereço (URL)', type: 'url', width: 'full', placeholder: 'https://...' }
      ],
      titleKeys: ['label', 'url']
    },
    reference: {
      kind: 'items',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', width: 'half' },
        { key: 'relation', label: 'Relação / cargo', type: 'text', width: 'half', placeholder: 'Ex.: Orientadora de iniciação científica' },
        { key: 'contact', label: 'Contato (com autorização)', type: 'text', width: 'full' }
      ],
      titleKeys: ['name', 'relation']
    }
  };

  /* ---------------- Tipos de seção ----------------
     schema: chave em SCHEMAS. labels: substitui rótulos de campos.
     side: pode ir para a coluna lateral em modelos com barra lateral.
     group: agrupamento no diálogo "Adicionar seção". */
  var KINDS = {
    summary: {
      title: 'Objetivo', schema: 'text', group: 'essenciais', icon: 'target',
      hint: 'Duas a quatro frases sobre o que você busca e o que pode oferecer. Seja específico e verdadeiro.',
      placeholder: 'Ex.: Busco oportunidade de [área] para aplicar [conhecimentos reais]...'
    },
    experience: {
      title: 'Experiência profissional', schema: 'entry', group: 'essenciais', icon: 'briefcase',
      labels: { title: 'Cargo', org: 'Empresa ou organização', current: 'Trabalho atual', description: 'Atividades e resultados' },
      placeholders: { description: 'Uma atividade por linha. Comece linhas com "-" para criar tópicos.' },
      hint: 'Liste do mais recente para o mais antigo. Descreva atividades e resultados reais.',
      suggest: 'experience'
    },
    education: {
      title: 'Formação', schema: 'education', group: 'essenciais', icon: 'school',
      hint: 'Inclua o ensino atual ou mais recente. Para quem ainda estuda, informe a previsão de conclusão.'
    },
    courses: {
      title: 'Cursos', schema: 'course', group: 'essenciais', icon: 'book',
      hint: 'Cursos livres, presenciais ou on-line que você realmente concluiu ou está cursando.',
      suggest: 'course'
    },
    certifications: {
      title: 'Certificações', schema: 'course', group: 'essenciais', icon: 'badge',
      labels: { name: 'Certificação', institution: 'Emissor' }
    },
    skills: {
      title: 'Competências', schema: 'tags', group: 'essenciais', icon: 'spark', side: true,
      hint: 'Digite e pressione Enter (ou vírgula) para adicionar. Inclua só o que você domina.',
      suggest: 'skills'
    },
    techSkills: {
      title: 'Habilidades técnicas', schema: 'tags', group: 'essenciais', icon: 'code', side: true,
      hint: 'Ferramentas, programas, linguagens ou técnicas que você sabe usar.',
      suggest: 'techSkills'
    },
    computerSkills: {
      title: 'Conhecimentos de informática', schema: 'tags', group: 'essenciais', icon: 'monitor', side: true,
      hint: 'Ex.: editor de textos, planilhas, apresentações, e-mail, digitação.',
      suggest: 'computerSkills'
    },
    softSkills: {
      title: 'Habilidades pessoais', schema: 'tags', group: 'essenciais', icon: 'people', side: true,
      hint: 'Prefira habilidades que você consegue demonstrar com exemplos reais.',
      suggest: 'softSkills'
    },
    languages: {
      title: 'Idiomas', schema: 'language', group: 'essenciais', icon: 'globe', side: true,
      hint: 'Informe o nível com honestidade. Português pode ser omitido em vagas no Brasil.'
    },
    projects: {
      title: 'Projetos', schema: 'project', group: 'essenciais', icon: 'layers',
      hint: 'Projetos pessoais, acadêmicos ou profissionais. Explique o objetivo e a sua participação.',
      suggest: 'project'
    },
    schoolProjects: {
      title: 'Projetos escolares', schema: 'project', group: 'escolar', icon: 'layers',
      hint: 'Trabalhos, pesquisas ou projetos feitos na escola. Diga qual foi a sua participação.',
      suggest: 'schoolProject'
    },
    scienceFairs: {
      title: 'Feiras de ciências', schema: 'project', group: 'escolar', icon: 'flask',
      labels: { name: 'Projeto apresentado', org: 'Feira ou evento' },
      suggest: 'schoolProject'
    },
    olympiads: {
      title: 'Olimpíadas acadêmicas', schema: 'award', group: 'escolar', icon: 'medal',
      labels: { title: 'Olimpíada', issuer: 'Resultado (ex.: participação, menção honrosa)' }
    },
    clubs: {
      title: 'Clubes e grupos de estudo', schema: 'entry', group: 'escolar', icon: 'people',
      labels: { title: 'Grupo ou clube', org: 'Instituição' },
      suggest: 'extracurricular'
    },
    studentOrgs: {
      title: 'Grêmio estudantil e organizações', schema: 'entry', group: 'escolar', icon: 'flag',
      labels: { title: 'Função', org: 'Organização' },
      suggest: 'extracurricular'
    },
    extracurricular: {
      title: 'Atividades extracurriculares', schema: 'entry', group: 'escolar', icon: 'star',
      labels: { title: 'Atividade', org: 'Local ou organização' },
      hint: 'Esportes, música, oficinas, monitorias voluntárias, competições e outras atividades reais.',
      suggest: 'extracurricular'
    },
    volunteer: {
      title: 'Voluntariado', schema: 'entry', group: 'escolar', icon: 'heart',
      labels: { title: 'Função ou atividade', org: 'Organização ou projeto' },
      hint: 'Trabalho voluntário é experiência real, mas não deve ser apresentado como emprego formal.',
      suggest: 'volunteer'
    },
    subjects: {
      title: 'Disciplinas de interesse', schema: 'tags', group: 'escolar', icon: 'book', side: true
    },
    monitoring: {
      title: 'Monitoria', schema: 'entry', group: 'academico', icon: 'people',
      labels: { title: 'Disciplina', org: 'Instituição' }
    },
    research: {
      title: 'Projetos de pesquisa', schema: 'project', group: 'academico', icon: 'search',
      labels: { name: 'Título da pesquisa', role: 'Sua função (ex.: bolsista de IC)', org: 'Instituição / orientação' },
      suggest: 'research'
    },
    publications: {
      title: 'Publicações', schema: 'publication', group: 'academico', icon: 'file',
      hint: 'Liste apenas trabalhos publicados ou aceitos. Siga a norma pedida (ABNT, APA etc.).'
    },
    presentations: {
      title: 'Apresentações e eventos', schema: 'event', group: 'academico', icon: 'mic'
    },
    awards: {
      title: 'Prêmios e reconhecimentos', schema: 'award', group: 'academico', icon: 'medal'
    },
    scholarships: {
      title: 'Bolsas e auxílios', schema: 'award', group: 'academico', icon: 'badge',
      labels: { title: 'Bolsa ou auxílio', issuer: 'Agência ou instituição' }
    },
    researchInterests: {
      title: 'Interesses de pesquisa', schema: 'tags', group: 'academico', icon: 'search', side: true
    },
    interests: {
      title: 'Interesses', schema: 'tags', group: 'outros', icon: 'compass', side: true
    },
    links: {
      title: 'Portfólio e links', schema: 'link', group: 'outros', icon: 'link', side: true,
      hint: 'Portfólio, GitHub, Lattes, ORCID ou outros links relevantes. Use endereços completos.'
    },
    additional: {
      title: 'Informações adicionais', schema: 'text', group: 'outros', icon: 'info',
      placeholder: 'Ex.: disponibilidade de horário, CNH, disponibilidade para viagens (apenas se for relevante).'
    },
    references: {
      title: 'Referências', schema: 'reference', group: 'outros', icon: 'people',
      hint: 'Inclua apenas se o processo pedir, e somente com autorização das pessoas indicadas.'
    },
    custom: {
      title: 'Seção personalizada', schema: 'entry', group: 'outros', icon: 'plus',
      hint: 'Use para qualquer conteúdo que não se encaixe nas outras seções. Renomeie o título.'
    }
  };

  var GROUPS = [
    { id: 'essenciais', label: 'Essenciais' },
    { id: 'escolar', label: 'Escolar e extracurricular' },
    { id: 'academico', label: 'Acadêmico' },
    { id: 'outros', label: 'Outros' }
  ];

  /* ---------------- Tipos de currículo ---------------- */
  var NOTICE_RULES = 'Confira sempre as regras da instituição, do edital ou do processo seletivo: elas têm prioridade sobre qualquer modelo.';

  var TYPES = {
    professional: {
      label: 'Currículo profissional', short: 'Profissional', icon: 'briefcase',
      description: 'Para quem já tem experiência de trabalho e quer destacar resultados.',
      template: 'corporate', maxPages: 2, summaryKey: 'professionalSummary', headline: 'Cargo ou área desejada',
      sections: [
        ['summary', 'Resumo profissional'], ['experience'], ['education'], ['skills'], ['languages'],
        ['certifications', 'Cursos e certificações'], ['projects'], ['links'], ['additional']
      ],
      tips: [
        'Coloque primeiro as experiências mais relevantes para a vaga.',
        'Prefira resultados concretos e verificáveis a adjetivos.',
        'Duas páginas costumam ser suficientes para a maioria das vagas.'
      ]
    },
    firstJob: {
      label: 'Primeiro emprego', short: 'Primeiro emprego', icon: 'rocket',
      description: 'Para quem ainda não teve emprego formal e quer valorizar estudos, cursos e projetos.',
      template: 'firstJob', maxPages: 1, summaryKey: 'firstJob', headline: 'Ex.: Em busca do primeiro emprego na área administrativa',
      sections: [
        ['summary', 'Objetivo profissional'], ['education', 'Formação escolar'], ['courses'], ['computerSkills'],
        ['languages'], ['schoolProjects', 'Projetos escolares e pessoais'], ['extracurricular'], ['volunteer'],
        ['softSkills', 'Habilidades'], ['links', 'Portfólio']
      ],
      tips: [
        'Não ter experiência formal é normal: valorize estudos, cursos, projetos e voluntariado reais.',
        'Nunca apresente atividades escolares ou voluntárias como se fossem empregos.',
        'Uma página bem organizada é o ideal.'
      ]
    },
    apprentice: {
      label: 'Jovem aprendiz', short: 'Jovem aprendiz', icon: 'spark',
      description: 'Para programas de aprendizagem: destaque escola, disponibilidade e vontade de aprender.',
      template: 'firstJob', maxPages: 1, summaryKey: 'apprentice', headline: 'Ex.: Candidato(a) ao programa Jovem Aprendiz',
      sections: [
        ['summary', 'Objetivo'], ['education', 'Formação escolar'], ['courses'], ['computerSkills'],
        ['softSkills', 'Habilidades'], ['schoolProjects'], ['extracurricular'], ['volunteer'], ['languages'],
        ['additional', 'Disponibilidade e informações adicionais']
      ],
      tips: [
        'Informe a série/ano e o turno em que estuda — isso ajuda a empresa a organizar sua jornada.',
        'Não é necessário colocar CPF, RG, foto ou endereço completo no currículo.',
        NOTICE_RULES
      ]
    },
    school: {
      label: 'Escolar / estudantil', short: 'Escolar', icon: 'school',
      description: 'Para trabalhos escolares, feiras, programas educacionais e processos seletivos de estudantes.',
      template: 'school', maxPages: 1, summaryKey: 'schoolObjective', headline: 'Ex.: Estudante do 2º ano do Ensino Médio',
      sections: [
        ['summary', 'Objetivo escolar'], ['education', 'Formação escolar'], ['subjects'], ['schoolProjects'],
        ['scienceFairs'], ['olympiads'], ['clubs'], ['studentOrgs'], ['extracurricular'], ['volunteer'],
        ['courses', 'Cursos livres'], ['languages'], ['techSkills'], ['softSkills'], ['awards'],
        ['links', 'Portfólio e links'], ['additional']
      ],
      tips: [
        'Todas as seções são opcionais. Seções vazias não aparecem no currículo.',
        'Remova as seções que não fazem sentido para você — não é preciso preencher tudo.',
        NOTICE_RULES
      ]
    },
    academic: {
      label: 'Faculdade / processo seletivo acadêmico', short: 'Acadêmico', icon: 'cap',
      description: 'Versão resumida para inscrições em faculdades, programas e seleções acadêmicas.',
      template: 'academic', maxPages: 2, summaryKey: 'academicObjective', headline: 'Ex.: Estudante de Engenharia Ambiental',
      sections: [
        ['summary', 'Objetivo acadêmico'], ['education', 'Formação acadêmica'], ['research', 'Projetos e pesquisas'],
        ['presentations'], ['awards', 'Prêmios e bolsas'], ['courses', 'Cursos e certificações'], ['languages'],
        ['techSkills'], ['volunteer'], ['links', 'Portfólio e links acadêmicos']
      ],
      tips: [
        'Para a versão completa (publicações, monitoria, referências), troque o tipo para "Acadêmico estendido".',
        'Não inclua publicações ou pesquisas que ainda não existem.',
        NOTICE_RULES
      ]
    },
    internship: {
      label: 'Estágio', short: 'Estágio', icon: 'layers',
      description: 'Para vagas de estágio: curso, período, projetos acadêmicos e habilidades.',
      template: 'modern', maxPages: 1, summaryKey: 'internship', headline: 'Ex.: Estudante de Administração — 4º semestre',
      sections: [
        ['summary', 'Objetivo'], ['education'], ['courses'], ['techSkills'], ['languages'],
        ['projects', 'Projetos acadêmicos e pessoais'], ['experience', 'Experiência (se houver)'], ['extracurricular'],
        ['volunteer'], ['softSkills'], ['links']
      ],
      tips: [
        'Informe o semestre atual, o turno e a previsão de formatura.',
        'Projetos de disciplinas contam — explique o que você fez neles.',
        NOTICE_RULES
      ]
    },
    scholarship: {
      label: 'Bolsa de estudos', short: 'Bolsa', icon: 'badge',
      description: 'Para concorrer a bolsas: trajetória escolar, conquistas e atividades.',
      template: 'academic', maxPages: 2, summaryKey: 'presentation', headline: 'Ex.: Estudante candidato(a) à bolsa ...',
      sections: [
        ['summary', 'Apresentação pessoal'], ['education'], ['awards'], ['olympiads'],
        ['research', 'Projetos e pesquisas'], ['extracurricular'], ['volunteer'], ['languages'], ['courses'],
        ['additional']
      ],
      tips: [
        'Cada programa de bolsa tem regras próprias — leia o edital antes de enviar.',
        'Destaque conquistas reais e o impacto das suas atividades.',
        NOTICE_RULES
      ]
    },
    exchange: {
      label: 'Intercâmbio', short: 'Intercâmbio', icon: 'globe',
      description: 'Para programas de intercâmbio: idiomas, estudos e atividades.',
      template: 'minimal', maxPages: 2, summaryKey: 'presentation', headline: 'Ex.: Estudante interessado(a) em intercâmbio acadêmico',
      sections: [
        ['summary', 'Apresentação pessoal'], ['education'], ['languages'], ['extracurricular'], ['volunteer'],
        ['courses'], ['awards'], ['interests'], ['experience', 'Experiência (se houver)'], ['additional']
      ],
      tips: [
        'Programas internacionais podem exigir currículo em outro idioma — confirme antes.',
        'Informe certificados de proficiência apenas se você os possui.',
        NOTICE_RULES
      ]
    },
    volunteerType: {
      label: 'Voluntariado', short: 'Voluntariado', icon: 'heart',
      description: 'Para candidaturas a trabalhos voluntários e projetos sociais.',
      template: 'minimal', maxPages: 1, summaryKey: 'presentation', headline: 'Ex.: Interessado(a) em atuar como voluntário(a)',
      sections: [
        ['summary', 'Apresentação'], ['volunteer', 'Experiência voluntária'], ['education'], ['softSkills', 'Habilidades'],
        ['courses'], ['languages'], ['experience', 'Experiência profissional (se houver)'],
        ['additional', 'Disponibilidade e informações adicionais']
      ],
      tips: [
        'Informe sua disponibilidade de dias e horários.',
        'Mencione causas e atividades com que você realmente se identifica.'
      ]
    },
    academicExtended: {
      label: 'Acadêmico estendido', short: 'Acadêmico estendido', icon: 'file',
      description: 'Versão completa para pesquisa, pós-graduação e programas acadêmicos.',
      template: 'academicExtended', maxPages: null, summaryKey: 'academicSummary', headline: 'Ex.: Mestrando(a) em Ciências Biológicas',
      sections: [
        ['summary', 'Resumo acadêmico'], ['researchInterests'], ['education', 'Formação acadêmica'], ['research'],
        ['publications'], ['presentations'], ['scholarships'], ['awards'], ['monitoring'], ['experience'],
        ['courses', 'Cursos e certificações'], ['languages'], ['techSkills'], ['volunteer'],
        ['links', 'Links acadêmicos'], ['references']
      ],
      tips: [
        'Esta versão pode ter várias páginas. Para uma versão curta, troque para "Faculdade / processo seletivo acadêmico".',
        'Padronize a norma de citação das publicações.',
        NOTICE_RULES
      ]
    },
    custom: {
      label: 'Personalizado', short: 'Personalizado', icon: 'plus',
      description: 'Comece com o básico e monte as seções do seu jeito.',
      template: 'classic', maxPages: null, summaryKey: 'presentation', headline: 'Título ou área (opcional)',
      sections: [['summary', 'Apresentação'], ['education'], ['skills']],
      tips: ['Use "Adicionar seção" para montar o currículo do seu jeito. Renomeie títulos livremente.']
    }
  };

  var TYPE_ORDER = ['professional', 'firstJob', 'apprentice', 'school', 'academic', 'internship',
    'scholarship', 'exchange', 'volunteerType', 'academicExtended', 'custom'];

  /* ---------------- Campos pessoais ---------------- */
  var PERSONAL_FIELDS = [
    { key: 'fullName', label: 'Nome completo', type: 'text', width: 'full', autocomplete: 'name' },
    { key: 'headline', label: 'Título ou apresentação curta', type: 'text', width: 'full' },
    { key: 'email', label: 'E-mail', type: 'email', width: 'half', autocomplete: 'email', placeholder: 'nome@exemplo.com' },
    { key: 'phone', label: 'Telefone', type: 'tel', width: 'half', autocomplete: 'tel', placeholder: '(00) 00000-0000' },
    { key: 'location', label: 'Cidade e estado', type: 'text', width: 'half', placeholder: 'Ex.: Maringá/PR' },
    { key: 'linkedin', label: 'LinkedIn', type: 'url', width: 'half', placeholder: 'linkedin.com/in/seu-perfil' },
    { key: 'github', label: 'GitHub', type: 'url', width: 'half', placeholder: 'github.com/seu-usuario' },
    { key: 'website', label: 'Site, portfólio ou Lattes', type: 'url', width: 'half', placeholder: 'https://...' }
  ];

  /* ---------------- Fábricas ---------------- */
  function getKind(kind) { return KINDS[kind] || KINDS.custom; }
  function getSchema(kind) { return SCHEMAS[getKind(kind).schema]; }

  /** Campos do item já com rótulos/placeholders específicos da seção. */
  function fieldsFor(kind) {
    var def = getKind(kind);
    var schema = getSchema(kind);
    if (!schema.fields) return [];
    return schema.fields.map(function (f) {
      var copy = Object.assign({}, f);
      if (def.labels && def.labels[f.key]) copy.label = def.labels[f.key];
      if (def.placeholders && def.placeholders[f.key]) copy.placeholder = def.placeholders[f.key];
      return copy;
    });
  }

  function createItem(kind) {
    var item = { id: U.uid('it') };
    fieldsFor(kind).forEach(function (f) {
      item[f.key] = f.type === 'checkbox' ? false : '';
    });
    return item;
  }

  function createSection(kind, title) {
    var def = getKind(kind);
    var schema = getSchema(kind);
    var sec = {
      id: U.uid('sec'),
      kind: KINDS[kind] ? kind : 'custom',
      title: title || def.title,
      visible: true
    };
    if (schema.kind === 'text') sec.content = '';
    else if (schema.kind === 'tags') sec.tags = [];
    else sec.items = [createItem(kind)];
    return sec;
  }

  function createDocument(typeId, opts) {
    opts = opts || {};
    var type = TYPES[typeId] || TYPES.custom;
    var now = Date.now();
    var personal = {};
    PERSONAL_FIELDS.forEach(function (f) { personal[f.key] = ''; });
    return {
      id: U.uid('doc'),
      schemaVersion: 1,
      name: opts.name || (type.short + ' — ' + new Date(now).toLocaleDateString('pt-BR')),
      type: TYPES[typeId] ? typeId : 'custom',
      template: opts.template || type.template,
      createdAt: now,
      updatedAt: now,
      design: { accent: 'teal', fontScale: 'normal', density: 'normal', pageNumbers: true },
      personal: personal,
      sections: type.sections.map(function (s) { return createSection(s[0], s[1]); })
    };
  }

  /** Verifica se um item tem algum conteúdo preenchido. */
  function itemHasContent(item, kind) {
    return fieldsFor(kind).some(function (f) {
      if (f.type === 'checkbox') return false;
      return !U.isBlank(item[f.key]);
    });
  }

  function sectionHasContent(sec) {
    var schema = getSchema(sec.kind);
    if (schema.kind === 'text') return !U.isBlank(sec.content);
    if (schema.kind === 'tags') return (sec.tags || []).some(function (t) { return !U.isBlank(t); });
    return (sec.items || []).some(function (it) { return itemHasContent(it, sec.kind); });
  }

  CM.catalog = {
    SCHEMAS: SCHEMAS,
    KINDS: KINDS,
    GROUPS: GROUPS,
    TYPES: TYPES,
    TYPE_ORDER: TYPE_ORDER,
    PERSONAL_FIELDS: PERSONAL_FIELDS,
    LANGUAGE_LEVELS: LANGUAGE_LEVELS,
    EDUCATION_STATUS: EDUCATION_STATUS,
    getKind: getKind,
    getSchema: getSchema,
    fieldsFor: fieldsFor,
    createItem: createItem,
    createSection: createSection,
    createDocument: createDocument,
    itemHasContent: itemHasContent,
    sectionHasContent: sectionHasContent
  };
})();
