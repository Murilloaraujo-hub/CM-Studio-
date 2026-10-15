/* CM Studio — perfil nacional: Suíça (prioridade secundária; regiões linguísticas). */
CM.countries.register({
  code: 'CH', name: 'Suíça', nameLocal: 'Schweiz / Suisse / Svizzera', region: 'Europa', popular: false,
  aliases: ['switzerland', 'schweiz', 'suisse', 'svizzera', 'suico'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no arbeit.swiss (SECO, portal oficial; maio de 2026). Diferenças entre as regiões linguísticas não foram verificadas.',
  languages: ['de-CH', 'fr-CH', 'it-CH', 'en-GB'], defaultLanguage: 'de-CH',
  regions: [
    { id: 'de', label: 'Região de língua alemã', locale: 'de-CH' },
    { id: 'fr', label: 'Região de língua francesa', locale: 'fr-CH' },
    { id: 'it', label: 'Região de língua italiana', locale: 'it-CH' }
  ],
  paper: 'A4', paperNote: 'A4 é o papel padrão na Suíça (convenção não tratada na fonte).',
  dateStyle: 'numeric-dot',
  phone: { prefix: '+41', example: '+41 44 123 45 67' },
  location: 'Endereço postal (a carta de candidatura inclui o seu endereço).',
  terms: { cv: 'Lebenslauf / CV / Curriculum vitae', letter: 'Bewerbungsschreiben / lettre de motivation' },
  summary: 'Dossiê de candidatura com carta, CV completo e sem lacunas de até três páginas (com dados pessoais e foto) e certificados de trabalho, diplomas e certificados em um PDF.',
  templates: ['lebenslauf', 'classic', 'europass', 'minimal', 'corporate'],
  purposes: {
    professional: { docLabel: 'CV / Lebenslauf', docTitleKey: 'cv', maxPages: 3, pagesHint: 'No máximo três páginas (arbeit.swiss).',
      sections: [['experience'], ['education'], ['languages'], ['skills', 'skillsGeneral'], ['interests'], ['references']] }
  },
  photo: { policy: 'common', note: 'O arbeit.swiss lista os dados pessoais "incluindo fotografia". Continua opcional no CM Studio.' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'recommended', workPermit: 'recommended', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'anschreiben', label: 'Carta de candidatura / motivação', recommended: true, note: 'Com seu endereço, o da empresa, data, assunto, saudação, fechamento e assinatura.' }
  ],
  supportingDocs: ['Certificados de trabalho (Arbeitszeugnisse), diplomas e certificados: todos, em ordem cronológica, em um único PDF.'],
  tips: [
    'O CV deve ser completo e claro, sem lacunas, e em ordem cronológica (mais recente primeiro).',
    'Referências "sob pedido": leve uma folha de referências à entrevista.',
    'Escolha a região linguística: o idioma do documento muda conforme a região da vaga.'
  ],
  warnings: ['Explique lacunas no percurso: o arbeit.swiss pede um CV sem lacunas.'],
  sources: [
    { title: 'Tips on applying for jobs', publisher: 'arbeit.swiss — SECO', url: 'https://www.arbeit.swiss/en/jobseekers/tips-on-applying-for-jobs', accessed: '2026-10-15', supports: 'Carta, CV de até 3 páginas sem lacunas, dados pessoais com foto, seções, certificados em PDF, referências sob pedido.' }
  ],
  unverified: ['Papel A4.', 'Diferenças entre regiões linguísticas.']
});
