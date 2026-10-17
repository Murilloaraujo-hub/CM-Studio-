/* CM Studio — perfil nacional: Austrália. */
CM.countries.register({
  code: 'AU', name: 'Austrália', nameLocal: 'Australia', region: 'Oceania', popular: true,
  aliases: ['australia'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no site do Governo de Queensland (governo estadual; página atualizada em 27/04/2022). Não foi consultada fonte federal. A fonte não trata de foto nem de dados pessoais sensíveis.',
  languages: ['en-AU'], defaultLanguage: 'en-AU',
  paper: 'A4', paperNote: 'A4 é o papel padrão na Austrália (convenção não tratada na fonte).',
  dateStyle: 'month-short',
  phone: { prefix: '+61', example: '+61 7 3000 0000' },
  location: 'Cidade e estado (ex.: Brisbane, QLD).',
  terms: { cv: 'Resume ou CV', letter: 'Cover letter' },
  summary: 'Resume de 1 a 3 páginas, conforme o tempo de experiência, com títulos e tópicos, pontos fortes de carreira e referees (pessoas de referência).',
  templates: ['classic', 'ats', 'minimal', 'modern', 'corporate'],
  purposes: {
    professional: { docLabel: 'Resume', docTitleKey: 'resume', maxPages: 3, pagesHint: 'De 1 a 3 páginas, conforme o tempo de experiência (Governo de Queensland).',
      sections: [['summary', 'profile'], ['skills', 'keySkills'], ['experience'], ['education'], ['certifications', 'coursesCertifications'], ['languages'], ['volunteer'], ['references', 'referees']] },
    firstJob: { docLabel: 'Resume', docTitleKey: 'resume', maxPages: 1 },
    internship: { docLabel: 'Resume', docTitleKey: 'resume', maxPages: 2 },
    research: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null },
    academicExtended: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null }
  },
  photo: { policy: 'unverified', note: 'A fonte consultada não trata de foto. Na dúvida, não inclua (o CM Studio deixa desativado).' },
  personalFields: { birthDate: 'discouraged', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter', recommended: true, note: 'Uma página, adaptada e endereçada à pessoa de contato.' },
    { kind: 'criteria', label: 'Resposta aos critérios de seleção', recommended: false, note: 'Vagas do governo costumam pedir respostas aos "selection criteria".' }
  ],
  supportingDocs: [],
  tips: [
    'Os empregadores procuram: contato, pontos fortes de carreira, histórico de emprego, formação e treinamentos, e referees.',
    'Use títulos e tópicos curtos.',
    'Os termos resume e CV são usados na Austrália; o CV costuma ser mais longo e detalhado.'
  ],
  warnings: ['Peça autorização antes de indicar alguém como referee.'],
  sources: [
    { title: 'Write a resume', publisher: 'Queensland Government', url: 'https://www.qld.gov.au/jobs/finding/resume', accessed: '2026-10-15', supports: 'Resume vs CV, 1 a 3 páginas, títulos e tópicos, conteúdo esperado, referees, cover letter de uma página, critérios de seleção.' }
  ],
  unverified: ['Papel A4.', 'Não incluir foto e data de nascimento.']
});
