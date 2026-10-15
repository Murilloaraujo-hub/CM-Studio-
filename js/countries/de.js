/* CM Studio — perfil nacional: Alemanha. */
CM.countries.register({
  code: 'DE', name: 'Alemanha', nameLocal: 'Deutschland', region: 'Europa', popular: true,
  aliases: ['germany', 'deutschland', 'alemao'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no portal oficial Make it in Germany, do Governo Federal. O portal da Agência Federal de Emprego (arbeitsagentur.de) não foi consultado.',
  languages: ['de-DE', 'en-GB'], defaultLanguage: 'de-DE',
  paper: 'A4', paperNote: 'A4 (DIN A4) é o papel padrão na Alemanha.',
  dateStyle: 'numeric-dot',
  phone: { prefix: '+49', example: '+49 30 123456' },
  location: 'Endereço com CEP e cidade (os dados pessoais costumam incluir o endereço).',
  terms: { cv: 'Lebenslauf (tabellarisch)', letter: 'Anschreiben' },
  summary: 'Lebenslauf em formato de tabela, com experiência e formação em ordem cronológica inversa, idiomas com níveis do QECR (ex.: Englisch C1) e, em geral, Anschreiben e certificados (Zeugnisse).',
  templates: ['lebenslauf', 'europass', 'classic', 'minimal', 'corporate'],
  purposes: {
    professional: { docLabel: 'Lebenslauf', docTitleKey: 'cv', maxPages: 2, pagesHint: 'A fonte não fixa número de páginas; 1 a 2 é comum (não verificado).',
      sections: [['experience'], ['education'], ['courses', 'trainings'], ['languages'], ['computerSkills'], ['skills', 'skillsGeneral'], ['volunteer'], ['interests']] },
    firstJob: { docLabel: 'Lebenslauf', docTitleKey: 'cv', maxPages: 1,
      sections: [['education', 'schoolEducation'], ['experience', 'experienceIfAny'], ['courses', 'trainings'], ['languages'], ['computerSkills'], ['volunteer'], ['interests']] },
    internship: { docLabel: 'Lebenslauf', docTitleKey: 'cv', maxPages: 1 },
    research: { docLabel: 'Wissenschaftlicher Lebenslauf', docTitleKey: 'academicCV', templates: ['academicExtended', 'lebenslauf', 'academic'], maxPages: null },
    academicExtended: { docLabel: 'Wissenschaftlicher Lebenslauf', docTitleKey: 'academicCV', templates: ['academicExtended', 'lebenslauf', 'academic'], maxPages: null }
  },
  photo: { policy: 'common', note: 'Segundo o Make it in Germany, é frequente esperar-se uma foto, mas há grandes diferenças entre setores. Continua opcional no CM Studio.' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'recommended', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  signature: { recommended: false, note: 'Local, data e assinatura ao final do Lebenslauf são uma prática tradicional (não verificada na fonte). Opcional.' },
  companions: [
    { kind: 'anschreiben', label: 'Anschreiben (carta de candidatura)', recommended: true, note: 'Os anúncios normalmente pedem carta, currículo e certificados.' },
    { kind: 'publications', label: 'Publikationsliste', recommended: false, note: 'Para candidaturas acadêmicas.' }
  ],
  supportingDocs: [
    'Certificados essenciais (formação profissional, escola, diplomas universitários).',
    'Referências / cartas de recomendação (Arbeitszeugnisse).',
    'Traduza os certificados para alemão ou inglês.'
  ],
  tips: [
    'Leia o anúncio: em geral pedem carta, currículo e certificados.',
    'Os documentos costumam ir em PDF por e-mail ou portal; envio por correio é raro.',
    'Informe idiomas com o nível do QECR (ex.: Englisch: C1).',
    'O Europass pode servir de guia, mas as empresas costumam valorizar um design próprio.'
  ],
  warnings: ['Não traduza o nome das suas instituições ou diplomas como se fossem equivalentes alemães; se quiser, acrescente uma tradução entre parênteses.'],
  sources: [
    { title: 'Applying for a job in Germany', publisher: 'Make it in Germany — Governo Federal da Alemanha', url: 'https://www.make-it-in-germany.com/en/working-in-germany/job/application', accessed: '2026-10-15', supports: 'Formato em tabela, cronologia inversa, foto frequente mas variável, idiomas com QECR, Europass como guia, certificados e traduções, envio em PDF.' }
  ],
  unverified: ['Número de páginas.', 'Assinatura e data ao final.', 'Formato de data MM.AAAA.']
});
