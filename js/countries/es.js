/* CM Studio — perfil nacional: Espanha (prioridade secundária). */
CM.countries.register({
  code: 'ES', name: 'Espanha', nameLocal: 'España', region: 'Europa', popular: true,
  aliases: ['spain', 'espana', 'espanhol'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações gerais conferidas no portal EURES (Comissão Europeia). Perfil de profundidade menor que os prioritários.',
  languages: ['es-ES', 'en-GB'], defaultLanguage: 'es-ES',
  paper: 'A4', paperNote: 'A fonte recomenda limitar o CV a duas páginas A4.',
  dateStyle: 'numeric-slash',
  phone: { prefix: '+34', example: '+34 612 345 678' },
  location: 'Cidade e província.',
  terms: { cv: 'Currículum vítae', letter: 'Carta de presentación' },
  summary: 'Não há modelo único: adapte o CV a cada oferta, de preferência em até duas páginas A4. Modelos cronológico, funcional ou europeu (Europass); foto não obrigatória.',
  templates: ['classic', 'europass', 'minimal', 'modern', 'corporate', 'ats'],
  purposes: {
    professional: { docLabel: 'Currículum vítae', docTitleKey: 'cv', maxPages: 2, pagesHint: 'Até duas páginas A4 (EURES).' },
    firstJob: { docLabel: 'Currículum vítae', docTitleKey: 'cv', maxPages: 1, note: 'Com pouca experiência, o EURES menciona o modelo cronológico crescente.' }
  },
  photo: { policy: 'optional', note: 'Não é obrigatória, embora possa ser útil para algumas vagas (EURES).' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Carta de presentación', recommended: false, note: 'Mostre interesse e destaque os pontos do CV que importam à empresa.' }
  ],
  supportingDocs: ['Cópias de títulos só quando pedidas (normalmente levadas à entrevista).'],
  tips: [
    'Adapte o CV a cada oferta; você pode pôr a experiência antes da formação.',
    'Use linguagem direta e frases simples; evite siglas e abreviações.',
    'O Europass é uma alternativa europeia padronizada, não uma obrigação.'
  ],
  warnings: [],
  sources: [
    { title: 'Living and working conditions: Spain', publisher: 'EURES — Comissão Europeia', url: 'https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-spain_en', accessed: '2026-10-15', supports: 'Sem modelo único, quatro modelos, duas páginas A4, foto não obrigatória, cópias só quando pedidas, linguagem direta, Europass como alternativa.' }
  ],
  unverified: ['Formato de data MM/AAAA.']
});
