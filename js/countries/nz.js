/* CM Studio — perfil nacional: Nova Zelândia (prioridade secundária). */
CM.countries.register({
  code: 'NZ', name: 'Nova Zelândia', nameLocal: 'New Zealand / Aotearoa', region: 'Oceania', popular: false,
  aliases: ['new zealand', 'aotearoa'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações conferidas no Tahatū Career Navigator, do Governo da Nova Zelândia (substituiu o careers.govt.nz).',
  languages: ['en-NZ'], defaultLanguage: 'en-NZ',
  paper: 'A4', paperNote: 'A4 é o papel padrão na Nova Zelândia (convenção não tratada na fonte).',
  dateStyle: 'month-short',
  phone: { prefix: '+64', example: '+64 21 123 4567' },
  location: 'Cidade (ex.: Wellington).',
  terms: { cv: 'CV', letter: 'Cover letter' },
  summary: 'CV de até 2 páginas, simples e sem imagens, com personal statement, key skills ligadas ao anúncio, histórico em ordem inversa e referees.',
  templates: ['ats', 'classic', 'minimal', 'modern'],
  purposes: {
    professional: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 2, pagesHint: 'Até 2 páginas, se possível (Tahatū).',
      sections: [['summary', 'personalPresentation'], ['skills', 'keySkills'], ['experience'], ['education'], ['certifications', 'trainings'], ['volunteer'], ['interests'], ['references', 'referees']] },
    firstJob: { docLabel: 'CV', docTitleKey: 'cv', maxPages: 2 }
  },
  photo: { policy: 'avoid', note: 'O Tahatū recomenda não usar imagens no CV.' },
  personalFields: { birthDate: 'hidden', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter', recommended: true, note: 'O CV é enviado junto com uma cover letter.' }
  ],
  supportingDocs: [],
  tips: [
    'Fonte simples (ex.: Calibri 11), tópicos, frases curtas, títulos em negrito e espaço em branco.',
    'Use palavras-chave do anúncio (cargo, setor, habilidades, ferramentas), que os sistemas de triagem procuram.',
    'Inclua treinamentos no trabalho e voluntariado.',
    'Indique 2 a 3 referees ou "Referees available on request".',
    'Envie em PDF, salvo pedido de Word; nome do arquivo: nome-sobrenome-CV.pdf.'
  ],
  warnings: ['O próprio Tahatū alerta: ao usar IA, peça que use apenas as suas informações e não invente detalhes.'],
  sources: [
    { title: 'How to write a CV', publisher: 'Tahatū Career Navigator — New Zealand Government', url: 'https://tahatu.govt.nz/work/applying-for-a-job/how-to-write-a-cv', accessed: '2026-10-15', supports: 'Duas páginas, sem imagens, personal statement, key skills, palavras-chave, referees, PDF.' }
  ],
  unverified: ['Papel A4.', 'Data de nascimento (não tratada na fonte).']
});
