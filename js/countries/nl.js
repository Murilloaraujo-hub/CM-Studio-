/* CM Studio — perfil nacional: Países Baixos (PRELIMINAR). */
CM.countries.register({
  code: 'NL', name: 'Países Baixos', nameLocal: 'Nederland', region: 'Europa', popular: false,
  aliases: ['holanda', 'netherlands', 'nederland', 'holandes', 'neerlandes'],
  status: 'preliminary', verifiedAt: '2026-10-15',
  statusNote: 'Não foi obtida orientação nacional oficial (werk.nl/UWV). Este perfil usa apenas o portal de informações de um município (Krimpen aan den IJssel) e deve ser confirmado.',
  languages: ['nl-NL', 'en-GB'], defaultLanguage: 'nl-NL',
  paper: 'A4', paperNote: 'A fonte municipal cita no máximo 2 folhas A4.',
  dateStyle: 'month-short',
  phone: { prefix: '+31', example: '+31 6 12345678' },
  location: 'Cidade de residência (em CVs on-line, sem endereço completo).',
  terms: { cv: 'Cv', letter: 'Sollicitatiebrief / motivatiebrief' },
  summary: 'Perfil preliminar: CV de até 2 páginas A4, informações mais importantes primeiro, cronologia inversa e adaptado a cada vaga. Foto não obrigatória, mas habitual segundo a fonte municipal.',
  templates: ['classic', 'europass', 'minimal', 'modern', 'ats'],
  purposes: {
    professional: { docLabel: 'Curriculum vitae', docTitleKey: 'cv', maxPages: 2, pagesHint: 'No máximo 2 páginas A4 (fonte municipal).' }
  },
  photo: { policy: 'common', note: 'A fonte municipal diz que a foto profissional não é obrigatória, mas é habitual. Fonte não nacional: confirme.' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Sollicitatiebrief', recommended: false, note: 'Não verificado em fonte oficial.' }
  ],
  supportingDocs: [],
  tips: ['Envie em PDF.', 'Adapte o CV a cada vaga.', 'O CV pode ser em neerlandês ou inglês, conforme a vaga.'],
  warnings: ['Perfil preliminar: as orientações não vêm de fonte nacional oficial.'],
  sources: [
    { title: 'Cv maken', publisher: 'Krimpenwijzer — Gemeente Krimpen aan den IJssel', url: 'https://www.krimpenwijzer.nl/is/een-vraag-over/werk-geld-en-uitkering/solliciteren/cv-maken', accessed: '2026-10-15', supports: 'Dados pessoais, foto habitual não obrigatória, no máximo 2 folhas A4, cronologia inversa, PDF. (Fonte municipal.)' }
  ],
  unverified: ['Praticamente todo o perfil: falta fonte nacional.']
});
