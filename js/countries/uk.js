/* CM Studio — perfil nacional: Reino Unido. Código 'UK' (ISO: GB) por ser o mais reconhecido. */
CM.countries.register({
  code: 'UK', iso: 'GB', name: 'Reino Unido', nameLocal: 'United Kingdom', region: 'Europa', popular: true,
  aliases: ['inglaterra', 'gra-bretanha', 'gra bretanha', 'great britain', 'england', 'escocia', 'gb'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Conteúdo e dados pessoais conferidos no National Careers Service (gov.uk). Foto e número de páginas não são tratados na página consultada.',
  languages: ['en-GB'], defaultLanguage: 'en-GB',
  paper: 'A4', paperNote: 'A4 é o papel padrão no Reino Unido (convenção não tratada na fonte).',
  dateStyle: 'month-short',
  phone: { prefix: '+44', example: '+44 20 7946 0000' },
  location: 'Cidade (ex.: Manchester). Endereço completo não é necessário.',
  terms: { cv: 'CV', letter: 'Cover letter' },
  summary: 'CV com seções claras (contato, apresentação, formação, experiência, referências), sem idade, data de nascimento, estado civil ou nacionalidade.',
  templates: ['classic', 'ats', 'minimal', 'modern', 'corporate'],
  purposes: {
    professional: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 2, pagesHint: 'Duas páginas é uma convenção comum (não fixada pela página consultada).',
      sections: [['summary', 'profile'], ['experience'], ['education'], ['skills', 'keySkills'], ['languages'], ['certifications', 'coursesCertifications'], ['projects'], ['interests'], ['references', 'referees']] },
    firstJob: { docLabel: 'CV', maxPages: 2, note: 'No início da carreira, a formação pode vir antes da experiência; mostre habilidades de projetos e voluntariado.',
      sections: [['summary', 'profile'], ['education'], ['skills', 'keySkills'], ['schoolProjects', 'schoolPersonalProjects'], ['volunteer'], ['experience', 'experienceIfAny'], ['interests'], ['references', 'referees']] },
    academicExtended: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null },
    research: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null }
  },
  photo: { policy: 'avoid', verified: false, note: 'A página consultada não trata de foto. Não incluir foto é a prática comum no Reino Unido (não verificado na fonte).' },
  personalFields: { birthDate: 'discouraged', nationality: 'discouraged', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter', recommended: true, note: 'O National Careers Service tem orientação própria para cover letters.' },
    { kind: 'publications', label: 'Lista de publicações', recommended: false, note: 'Para candidaturas acadêmicas.' },
    { kind: 'portfolio', label: 'Portfólio', recommended: false, note: 'Para áreas criativas.' }
  ],
  supportingDocs: [],
  tips: [
    'Use fonte clara (Arial, Calibri ou Times) em tamanho 11 ou maior, com títulos e tópicos.',
    'Adapte o CV ao anúncio da vaga.',
    'Experiência mais recente primeiro, com 2 a 3 linhas por cargo (método STAR).',
    'Hobbies e interesses só quando mostram habilidades.'
  ],
  warnings: [
    'Não inclua idade, data de nascimento, estado civil ou nacionalidade.',
    'Não coloque os contatos das referências; use "References available on request".'
  ],
  sources: [
    { title: 'CV sections', publisher: 'National Careers Service (gov.uk)', url: 'https://nationalcareers.service.gov.uk/careers-advice/cv-sections', accessed: '2026-10-15', supports: 'Seções, fonte e tamanho, dados pessoais que não devem constar, referências sob pedido, formação primeiro no início da carreira.' }
  ],
  unverified: ['Papel A4.', 'Duas páginas.', 'Não incluir foto.']
});
