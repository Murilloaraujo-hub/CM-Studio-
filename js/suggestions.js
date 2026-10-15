/* ==========================================================================
   CM Studio — suggestions.js
   Biblioteca LOCAL de exemplos de texto (não usa inteligência artificial
   nem serviços externos). Os exemplos têm trechos entre [colchetes] que o
   usuário deve substituir por informações reais — ou apagar.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});

  var TEXTS = {
    professionalSummary: [
      'Profissional da área de [área] com [tempo] de experiência em [principais atividades]. Busco contribuir com [o que você oferece] em uma equipe que valorize [valor ou objetivo].',
      'Atuo com [atividade principal] desde [ano], com experiência em [ferramentas ou processos]. Tenho interesse em oportunidades de [cargo ou área] para aplicar [competência real].',
      'Experiência em [setor], com foco em [especialidade]. Entre os resultados recentes, [resultado real e verificável].'
    ],
    firstJob: [
      'Busco minha primeira oportunidade como [cargo ou área], para aplicar o que aprendi em [curso ou escola] e desenvolver novas habilidades na prática.',
      'Estudante de [curso ou série], em busca do primeiro emprego na área de [área]. Tenho facilidade com [habilidade real] e disponibilidade no período [turno].',
      'Quero iniciar minha trajetória profissional em [área], contribuindo com [habilidade real] e aprendendo com a equipe.'
    ],
    apprentice: [
      'Candidato(a) ao programa Jovem Aprendiz, cursando o [série/ano] do [nível de ensino] no período [turno]. Tenho interesse em aprender sobre [área] e desenvolver responsabilidade e organização.',
      'Busco uma vaga de Jovem Aprendiz para conhecer o ambiente de trabalho na área de [área], conciliando com meus estudos no [turno].'
    ],
    schoolObjective: [
      'Estudante do [série/ano] do [nível de ensino], interessado(a) em participar de [programa, feira ou projeto] para aprofundar meus conhecimentos em [disciplina ou tema].',
      'Busco participar de [programa ou atividade] para desenvolver [habilidade] e contribuir com [tema ou causa] na minha escola e comunidade.'
    ],
    academicObjective: [
      'Estudante de [curso] com interesse em [área de estudo]. Busco ingressar em [programa ou instituição] para aprofundar meus estudos em [tema].',
      'Tenho interesse em [área] e desejo participar de [programa, bolsa ou seleção] para desenvolver [competência ou projeto].'
    ],
    academicSummary: [
      '[Nível de formação] em [área], com experiência em [linha de pesquisa ou método]. Meus interesses incluem [temas]. Atualmente desenvolvo [projeto real] sob orientação de [nome, se desejar informar].',
      'Pesquisador(a) em formação na área de [área], com atuação em [atividades reais: iniciação científica, monitoria, extensão].'
    ],
    internship: [
      'Estudante de [curso], no [semestre] semestre, em busca de estágio na área de [área]. Tenho conhecimentos em [ferramentas ou conteúdos reais] e disponibilidade no período [turno].',
      'Busco estágio em [área] para aplicar conhecimentos adquiridos em [disciplinas ou projetos] e desenvolver experiência prática.'
    ],
    presentation: [
      'Sou [estudante/profissional] de [curso ou área], com interesse em [tema]. Participei de [atividade real] e busco [oportunidade] para [objetivo].',
      'Tenho interesse em [causa, área ou programa] e gostaria de contribuir com [habilidade real]. Tenho disponibilidade [dias e horários].'
    ],
    experience: [
      '- [Verbo de ação] [tarefa] para [objetivo], resultando em [resultado real].',
      '- Responsável por [atividade] utilizando [ferramenta ou método].',
      '- Atendimento a [público] por [canal], com foco em [aspecto].',
      '- Apoio à equipe de [área] em [processo].'
    ],
    schoolProject: [
      'Projeto desenvolvido na disciplina de [disciplina] sobre [tema]. Minha participação: [o que você fez — pesquisa, montagem, apresentação].',
      '- Pesquisa sobre [tema] e apresentação para [turma, escola ou banca].\n- Responsável por [parte do projeto].',
      'Trabalho em grupo com [número] integrantes para [objetivo do projeto]. Aprendi [aprendizado real].'
    ],
    project: [
      'Projeto [pessoal/acadêmico] para [objetivo], desenvolvido com [ferramentas]. Minha participação: [atividades].',
      '- [Verbo de ação] [funcionalidade ou etapa] usando [ferramenta].\n- Resultado: [resultado real].'
    ],
    research: [
      'Pesquisa sobre [tema], com o objetivo de [objetivo]. Atividades: [revisão bibliográfica, coleta de dados, análise].',
      '- Participação em [etapa da pesquisa] sob orientação de [nome ou cargo].\n- Apresentação dos resultados em [evento], se houver.'
    ],
    extracurricular: [
      'Participação semanal em [atividade], desenvolvendo [habilidade].',
      '- Organização de [evento ou atividade] com [colegas, grupo].\n- Representação da turma em [ocasião].'
    ],
    volunteer: [
      'Atuação voluntária em [organização], apoiando [atividade] com [frequência].',
      '- Apoio em [atividade] para [público atendido].\n- Organização de [campanha ou evento].'
    ],
    course: [
      'Conteúdos: [principais temas aprendidos].',
      'Curso [on-line/presencial] com foco em [tema]. Projeto final: [descrição, se houver].'
    ]
  };

  /** Listas de habilidades comuns — o usuário escolhe somente as que possui. */
  var TAGS = {
    softSkills: ['Comunicação', 'Trabalho em equipe', 'Organização', 'Pontualidade', 'Responsabilidade', 'Proatividade',
      'Facilidade de aprendizado', 'Resolução de problemas', 'Empatia', 'Criatividade', 'Gestão do tempo', 'Adaptabilidade'],
    computerSkills: ['Editor de textos', 'Planilhas eletrônicas', 'Apresentações de slides', 'E-mail e agenda on-line',
      'Digitação', 'Navegação e pesquisa na internet', 'Armazenamento em nuvem', 'Videochamadas'],
    techSkills: ['Planilhas (fórmulas e gráficos)', 'Edição de imagens', 'Edição de vídeo', 'HTML e CSS', 'JavaScript',
      'Python', 'Git e GitHub', 'Banco de dados (SQL)', 'Design gráfico', 'Pesquisa bibliográfica', 'Análise de dados'],
    skills: ['Atendimento ao cliente', 'Rotinas administrativas', 'Gestão de projetos', 'Negociação', 'Vendas',
      'Liderança de equipes', 'Análise de dados', 'Controle financeiro', 'Redação profissional', 'Planejamento']
  };

  /** Contexto de sugestão para o resumo depende do tipo do documento. */
  function summaryKeyFor(doc) {
    var type = CM.catalog.TYPES[doc.type] || CM.catalog.TYPES.custom;
    return type.summaryKey || 'presentation';
  }

  function textsFor(key) { return TEXTS[key] || []; }
  function tagsFor(key) { return TAGS[key] || []; }

  CM.suggestions = {
    TEXTS: TEXTS,
    TAGS: TAGS,
    textsFor: textsFor,
    tagsFor: tagsFor,
    summaryKeyFor: summaryKeyFor
  };
})();
