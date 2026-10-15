/* CM Studio — perfil nacional: França. */
CM.countries.register({
  code: 'FR', name: 'França', nameLocal: 'France', region: 'Europa', popular: true,
  aliases: ['france', 'frances'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Regras conferidas no Service-Public.fr (ficha F33336, verificada pela DILA em 20/02/2026). A ficha trata do conteúdo e dos limites legais, não do layout.',
  languages: ['fr-FR', 'en-GB'], defaultLanguage: 'fr-FR',
  paper: 'A4', paperNote: 'A4 é o papel padrão na França.',
  dateStyle: 'numeric-slash',
  phone: { prefix: '+33', example: '+33 1 23 45 67 89' },
  location: 'Cidade, ou endereço completo se quiser (as coordenadas podem incluir o endereço).',
  terms: { cv: 'CV', letter: 'Lettre de motivation' },
  summary: 'CV livre: não é obrigatório e a lei não define conteúdo. Costuma trazer coordenadas, percurso profissional e formação; a foto é opcional. As informações devem ter ligação direta com a vaga.',
  templates: ['classic', 'modern', 'minimal', 'europass', 'corporate', 'ats'],
  purposes: {
    professional: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 2, pagesHint: 'A fonte não fixa número de páginas; 1 página é comum no início de carreira (não verificado).' },
    firstJob: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 1 },
    internship: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 1 },
    research: { docLabel: 'CV académique', docTitleKey: 'academicCV', maxPages: null },
    academicExtended: { docLabel: 'CV académique', docTitleKey: 'academicCV', maxPages: null }
  },
  photo: { policy: 'optional', note: 'O Service-Public menciona "eventualmente uma fotografia de identidade": é opcional.' },
  personalFields: { birthDate: 'optional', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'lettre', label: 'Lettre de motivation', recommended: false, note: 'Carta comum em candidaturas na França; confirme se a vaga pede.' }
  ],
  supportingDocs: ['O empregador pode verificar os diplomas.'],
  tips: [
    'Inclua apenas informações com ligação direta com a vaga.',
    'Você pode listar só o percurso relacionado à vaga e a formação mais alta ou relacionada.'
  ],
  warnings: [
    'Você não precisa informar saúde, gravidez nem convicções sindicais, políticas ou religiosas. O empregador não pode pedir informações discriminatórias.',
    'Informações falsas podem levar à demissão por falta grave: seja exato.'
  ],
  sources: [
    { title: 'Curriculum vitae (CV) : quelles sont les règles ? (F33336)', publisher: 'Service-Public.fr — DILA', url: 'https://www.service-public.fr/particuliers/vosdroits/F33336', accessed: '2026-10-15', supports: 'CV não obrigatório, sem menções legais obrigatórias, foto eventual, ligação direta com a vaga, informações discriminatórias, boa-fé.' }
  ],
  unverified: ['Número de páginas.', 'Formato de data MM/AAAA.']
});
