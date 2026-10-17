/* CM Studio — perfil nacional: Itália (prioridade secundária). */
CM.countries.register({
  code: 'IT', name: 'Itália', nameLocal: 'Italia', region: 'Europa', popular: true,
  aliases: ['italy', 'italia', 'italiano'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações gerais do portal EURES (Comissão Europeia), obtidas por trecho de busca da página datada de julho de 2026. Perfil de profundidade menor.',
  languages: ['it-IT', 'en-GB'], defaultLanguage: 'it-IT',
  paper: 'A4', paperNote: 'A4 é o papel padrão na Itália.',
  dateStyle: 'numeric-slash',
  phone: { prefix: '+39', example: '+39 312 345 6789' },
  location: 'Cidade e província.',
  terms: { cv: 'Curriculum vitae', letter: 'Lettera di presentazione / motivazionale' },
  summary: 'CV atualizado e adaptado à vaga, com autorização para o tratamento de dados pessoais. Foto e certificados só se forem pedidos. O Europass é uma opção.',
  templates: ['europass', 'classic', 'minimal', 'modern', 'corporate', 'ats'],
  purposes: {
    professional: { docLabel: 'Curriculum vitae', docTitleKey: 'cv', maxPages: 2, pagesHint: 'A fonte não fixa número de páginas (2 é uma referência, não verificada).' }
  },
  photo: { policy: 'optional', note: 'Segundo o EURES, não é preciso anexar foto, salvo pedido específico.' },
  personalFields: { birthDate: 'optional', nationality: 'optional', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  privacyConsent: { recommended: true, note: 'O EURES informa que os CVs enviados a empresas devem conter autorização para o tratamento de dados pessoais, conforme a legislação de proteção de dados. Ative a declaração na aba Design.' },
  companions: [
    { kind: 'cover', label: 'Lettera di presentazione', recommended: true, note: 'O EURES cita carta de apresentação e/ou motivacional junto do CV.' }
  ],
  supportingDocs: ['Certificados e referências só se forem pedidos.'],
  tips: [
    'Adapte o CV à vaga.',
    'Os centros de emprego oferecem orientação; o portal cliclavoro.gov.it reúne serviços.',
    'O Europass é uma opção de modelo europeu, não uma obrigação.'
  ],
  warnings: ['Inclua a autorização de tratamento de dados (ative em Design → Declaração de privacidade).'],
  sources: [
    { title: 'Living and working conditions: Italy', publisher: 'EURES — Comissão Europeia', url: 'https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-italy_en', accessed: '2026-10-15', supports: 'CV adaptado com carta, autorização de tratamento de dados, foto e certificados só se pedidos, Europass. (Conteúdo obtido por trecho de busca.)' }
  ],
  unverified: ['Número de páginas.', 'Formato de data MM/AAAA.', 'Texto exato da autorização (o CM Studio oferece um texto genérico; confira se a empresa exige outro).']
});
