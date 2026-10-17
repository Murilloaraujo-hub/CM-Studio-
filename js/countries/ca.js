/* CM Studio — perfil nacional: Canadá. */
CM.countries.register({
  code: 'CA', name: 'Canadá', nameLocal: 'Canada', region: 'América do Norte', popular: true,
  aliases: ['canada', 'quebec'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no Job Bank, do Governo do Canadá. O tamanho do papel não é tratado na fonte.',
  languages: ['en-CA', 'fr-CA'], defaultLanguage: 'en-CA',
  paper: 'Letter', paperNote: 'O Canadá usa o papel Letter no dia a dia (convenção não tratada na fonte).',
  dateStyle: 'month-short',
  phone: { prefix: '+1', example: '+1 (416) 555-0100' },
  location: 'Endereço ou cidade e província (ex.: Toronto, ON).',
  terms: { cv: 'Résumé / CV (en) · Curriculum vitæ (fr)', letter: 'Cover letter · Lettre de présentation' },
  summary: 'Currículo claro e conciso de até duas páginas, adaptado à vaga, sem foto e sem dados pessoais como idade, estado civil ou religião.',
  templates: ['ats', 'classic', 'usResume', 'minimal', 'corporate', 'modern'],
  purposes: {
    professional: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 2, pagesHint: 'Limite de duas páginas (Job Bank).' },
    firstJob: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 2, note: 'Inclua trabalho voluntário e não remunerado: o Job Bank recomenda.' },
    internship: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 2 },
    research: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null },
    academicExtended: { docLabel: 'Academic CV', docTitleKey: 'academicCV', maxPages: null }
  },
  photo: { policy: 'avoid', note: 'O Job Bank informa que incluir foto "não é a norma no Canadá".' },
  personalFields: { birthDate: 'discouraged', nationality: 'discouraged', address: 'optional', workPermit: 'optional', drivingLicense: 'hidden', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter / Lettre de présentation', recommended: true, note: 'Adaptada à vaga e enviada com o currículo.' },
    { kind: 'references', label: 'Folha de referências', recommended: false, note: 'O Job Bank recomenda não pôr referências no currículo e entregá-las em folha separada, quando pedidas.' }
  ],
  supportingDocs: [],
  tips: [
    'Limite o currículo a duas páginas e destaque o que é mais recente.',
    'Adapte o conteúdo usando a descrição da vaga.',
    'Quantifique conquistas reais e use verbos de ação, sem pronomes pessoais.',
    'Use 5 a 7 tópicos por seção.',
    'Hobbies só se tiverem relação com a vaga.'
  ],
  warnings: [
    'Nunca informe o número de seguro social (SIN).',
    'Não inclua idade, peso, altura, estado civil, religião ou opiniões políticas.',
    'Não inclua foto.'
  ],
  sources: [
    { title: 'How to write a good resume', publisher: 'Job Bank — Government of Canada', url: 'https://www.jobbank.gc.ca/findajob/resources/write-good-resume', accessed: '2026-10-15', supports: 'Duas páginas, adaptar à vaga, sem foto, sem dados pessoais, nunca o SIN, referências em folha separada, voluntariado.' }
  ],
  unverified: ['Papel Letter.', 'Formato de data "Mar 2023".']
});
