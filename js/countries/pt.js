/* CM Studio — perfil nacional: Portugal. */
CM.countries.register({
  code: 'PT', name: 'Portugal', nameLocal: 'Portugal', region: 'Europa', popular: true,
  aliases: ['portugues europeu', 'lisboa'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no portal EURES (Comissão Europeia), página sobre condições de vida e de trabalho em Portugal, datada de 03/07/2026.',
  languages: ['pt-PT', 'en-GB'], defaultLanguage: 'pt-PT',
  paper: 'A4', paperNote: 'A4 é o papel padrão em Portugal.',
  dateStyle: 'numeric-slash',
  phone: { prefix: '+351', example: '+351 912 345 678' },
  location: 'Local de residência: cidade e país (não a morada completa).',
  terms: { cv: 'Curriculum Vitae', letter: 'Carta de apresentação' },
  summary: 'CV em ordem cronológica inversa, com 1 a 2 páginas, maiores realizações na metade superior da 1.ª página e formação profissional separada da educação. A fotografia é muitas vezes valorizada.',
  templates: ['classic', 'europass', 'modern', 'minimal', 'corporate', 'ats'],
  purposes: {
    professional: { docLabel: 'Curriculum Vitae', docTitleKey: 'cv', maxPages: 2, pagesHint: 'De 1 a 2 páginas (EURES).',
      sections: [['summary', 'professionalSummary'], ['experience'], ['education'], ['courses', 'trainings'], ['languages'], ['computerSkills'], ['skills'], ['volunteer'], ['interests'], ['additional']] },
    firstJob: { docLabel: 'Curriculum Vitae', docTitleKey: 'cv', maxPages: 1, note: 'Para jovens, modelos funcionais ou infográficos de 1 página estão a ser cada vez mais usados (EURES).' },
    internship: { docLabel: 'Curriculum Vitae', docTitleKey: 'cv', maxPages: 1 }
  },
  photo: { policy: 'common', note: 'Segundo o EURES, "a inclusão de fotografia é muitas vezes valorizada". Continua opcional.' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'discouraged', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Carta de apresentação', recommended: false, note: 'Curta, nunca mais de 1 página A4. Cada vez mais substituída pelo texto do e-mail com o CV em anexo.' }
  ],
  supportingDocs: ['Diplomas, certificados de trabalho e recomendações só quando pedidos.'],
  tips: [
    'Use português europeu (telemóvel, morada, formação profissional, carta de condução).',
    'Coloque as maiores realizações na metade superior da primeira página.',
    'Separe a formação profissional (cursos, estágios, carteira profissional ou Ordem) da educação.',
    'Carta de condução só se for requisito da vaga.',
    'Sem domínio do português, envie o CV em inglês.'
  ],
  warnings: ['Não indique a morada completa; basta a cidade e o país.'],
  sources: [
    { title: 'Condições de vida e de trabalho: Portugal', publisher: 'EURES — Comissão Europeia', url: 'https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-portugal_pt', accessed: '2026-10-15', supports: 'Cronologia inversa, 1 a 2 páginas, estrutura do CV, local de residência sem morada, fotografia valorizada, carta de 1 página, documentos só quando pedidos.' }
  ],
  unverified: ['Formato de data MM/AAAA.']
});
