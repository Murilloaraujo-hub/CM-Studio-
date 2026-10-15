/* CM Studio — perfil nacional: Irlanda (prioridade secundária). */
CM.countries.register({
  code: 'IE', name: 'Irlanda', nameLocal: 'Ireland / Éire', region: 'Europa', popular: true,
  aliases: ['ireland', 'eire', 'dublin'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no JobsIreland (Department of Social Protection). A fonte oficial não trata de foto nem de data de nascimento.',
  languages: ['en-IE'], defaultLanguage: 'en-IE',
  paper: 'A4', paperNote: 'A fonte recomenda 1 a 2 páginas A4.',
  dateStyle: 'month-short',
  phone: { prefix: '+353', example: '+353 1 234 5678' },
  location: 'Endereço ou cidade e condado.',
  terms: { cv: 'CV', letter: 'Cover letter' },
  summary: 'CV claro de 1 a 2 páginas A4, com experiência mais recente primeiro e títulos em negrito. Para vagas anunciadas, envie sempre uma cover letter.',
  templates: ['classic', 'ats', 'minimal', 'modern', 'corporate'],
  purposes: {
    professional: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 2, pagesHint: 'De 1 a 2 páginas A4 (JobsIreland).' }
  },
  photo: { policy: 'unverified', note: 'A fonte oficial não trata de foto. O CM Studio deixa desativado; confirme com o empregador.' },
  personalFields: { birthDate: 'hidden', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter', recommended: true, note: 'Envie sempre com o CV para vagas anunciadas; endereçada a uma pessoa; de preferência 1 página, nunca mais de 2.' }
  ],
  supportingDocs: [],
  tips: [
    'Na experiência, informe datas, cargo, empregador e responsabilidades, do mais recente ao mais antigo.',
    'Layout claro, sem erros, com títulos em negrito.'
  ],
  warnings: [],
  sources: [
    { title: 'Tips and Advice', publisher: 'JobsIreland — Department of Social Protection', url: 'https://jobsireland.ie/en-US/TipsandAdvicePage', accessed: '2026-10-15', supports: 'Conteúdo do CV, 1 a 2 páginas A4, ordem da experiência, cover letter sempre.' }
  ],
  unverified: ['Foto e data de nascimento (não tratadas na fonte).', 'Formato de data.']
});
