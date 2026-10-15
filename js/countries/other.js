/* CM Studio — "Outros países": perfil genérico, NÃO verificado. */
CM.countries.register({
  code: 'XX', name: 'Outros países', nameLocal: 'Other countries', region: 'Genérico', popular: false,
  aliases: ['outro', 'other', 'internacional', 'generico'],
  status: 'generic', verifiedAt: '',
  statusNote: 'Modelo neutro para países sem perfil próprio. Não há verificação de regras locais: confirme com o empregador, a instituição ou o serviço público de emprego do país.',
  languages: ['en-US', 'en-GB'], defaultLanguage: 'en-GB', anyLanguage: true,
  paper: 'A4', paperNote: 'A4 é o tamanho mais usado no mundo; troque para Letter se o destino usar esse padrão.',
  dateStyle: null,
  phone: { prefix: '', example: 'Inclua o código internacional do país (ex.: +55).' },
  location: 'Cidade e país.',
  terms: { cv: 'CV / résumé', letter: 'Cover letter' },
  summary: 'Currículo neutro, sem foto e sem dados sensíveis por padrão. Ajuste conforme as orientações do país de destino.',
  templates: ['classic', 'ats', 'minimal', 'modern', 'europass', 'corporate', 'usResume'],
  purposes: {},
  photo: { policy: 'unverified', note: 'Sem orientação verificada. O CM Studio deixa a foto desativada.' },
  personalFields: { birthDate: 'hidden', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Carta de apresentação', recommended: false, note: 'Confirme se o processo pede.' }
  ],
  supportingDocs: [],
  tips: ['Procure o serviço público de emprego do país de destino e siga as orientações dele.'],
  warnings: ['Perfil genérico: não reflete as regras de nenhum país específico.'],
  sources: [],
  unverified: ['Todo o perfil.']
});
