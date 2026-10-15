/* CM Studio — perfil nacional: Estados Unidos. */
CM.countries.register({
  code: 'US', name: 'Estados Unidos', nameLocal: 'United States', region: 'América do Norte', popular: true,
  aliases: ['eua', 'usa', 'america', 'estados unidos da america'],
  status: 'verified', verifiedAt: '2026-10-15',
  statusNote: 'Orientações de résumé e CV acadêmico conferidas nos guias do serviço de carreiras da Universidade Harvard (FAS Mignone Center for Career Success). É uma fonte institucional universitária, não governamental. O portal usa.gov não foi consultado.',
  languages: ['en-US'], defaultLanguage: 'en-US',
  paper: 'Letter', paperNote: 'Nos EUA o papel padrão é o US Letter (8,5 × 11 pol.). Convenção não tratada nas fontes consultadas.',
  dateStyle: 'month-short',
  phone: { prefix: '+1', example: '+1 (617) 555-0100' },
  location: 'Cidade e estado (ex.: Boston, MA). Endereço completo é opcional.',
  terms: { cv: 'Résumé (ou CV acadêmico)', letter: 'Cover letter' },
  summary: 'Résumé conciso, em ordem cronológica inversa, sem foto, idade ou gênero e sem lista de referências. Para pesquisa e pós-graduação usa-se o CV acadêmico, mais longo.',
  templates: ['usResume', 'ats', 'classic', 'minimal', 'corporate', 'modern'],
  purposes: {
    professional: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 1, pagesHint: 'Conciso. Uma página é comum no início de carreira (convenção não fixada pela fonte).' },
    firstJob: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 1 },
    internship: { docLabel: 'Résumé', docTitleKey: 'resume', maxPages: 1 },
    school: { docLabel: 'Résumé estudantil', docTitleKey: 'resume', maxPages: 1 },
    academic: { docLabel: 'Résumé para admissão', docTitleKey: 'resume', templates: ['usResume', 'academic', 'classic'], maxPages: 1, note: 'Admissão em universidade não é candidatura a emprego: muitas instituições usam formulários próprios. Confirme se um currículo é aceito.' },
    scholarship: { docLabel: 'Résumé ou CV', templates: ['usResume', 'academic', 'classic'] },
    research: { docLabel: 'Curriculum Vitae (CV acadêmico)', docTitleKey: 'academicCV', templates: ['academicExtended', 'academic', 'classic'], maxPages: null, pagesHint: 'Sem limite de páginas; a maioria dos CVs de pós-graduação tem de 2 a 5 páginas (Harvard GSAS).' },
    academicExtended: { docLabel: 'Curriculum Vitae (CV acadêmico)', docTitleKey: 'academicCV', templates: ['academicExtended', 'academic'], maxPages: null, pagesHint: 'Sem limite de páginas; a maioria dos CVs de pós-graduação tem de 2 a 5 páginas (Harvard GSAS).' }
  },
  photo: { policy: 'avoid', note: 'O guia de Harvard orienta não incluir foto, idade ou gênero.' },
  personalFields: { birthDate: 'discouraged', nationality: 'hidden', address: 'optional', workPermit: 'optional', drivingLicense: 'hidden', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Cover letter', recommended: true, note: 'Carta curta e específica para a vaga, enviada com o résumé.' },
    { kind: 'publications', label: 'Lista de publicações', recommended: false, note: 'Para pesquisa e pós-graduação.' },
    { kind: 'project', label: 'Resumo de projeto', recommended: false, note: 'Para bolsas e seleções acadêmicas.' },
    { kind: 'portfolio', label: 'Portfólio', recommended: false, note: 'Para áreas criativas e de tecnologia.' }
  ],
  supportingDocs: [],
  tips: [
    'Use linguagem específica, ativa e baseada em fatos; quantifique e qualifique resultados reais.',
    'Não use pronomes pessoais, abreviações, gírias nem estilo narrativo.',
    'Não comece cada linha com a data; mantenha o formato consistente.',
    'Organize as seções por importância e em ordem cronológica inversa.',
    'Adapte o résumé ao tipo de vaga.'
  ],
  warnings: [
    'Não inclua foto, idade, data de nascimento ou gênero.',
    'Não liste referências no résumé; envie-as quando forem pedidas.'
  ],
  sources: [
    { title: 'Create a Strong Resume', publisher: 'Harvard FAS — Mignone Center for Career Success', url: 'https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/', accessed: '2026-10-15', supports: 'Linguagem, ordem cronológica inversa, sem foto/idade/gênero, sem referências, adaptar à vaga.' },
    { title: 'GSAS CV & Cover Letter Guide', publisher: 'Harvard FAS — Mignone Center for Career Success', url: 'https://careerservices.fas.harvard.edu/resources/gsas-cv-cover-letter-guide-2/', accessed: '2026-10-15', supports: 'Seções do CV acadêmico; sem limite de páginas (2 a 5 é o mais comum); margens de 3/4 a 1 pol.' }
  ],
  unverified: ['Papel US Letter como padrão.', 'Uma página para início de carreira.', 'Formato de data "Mar 2023".']
});
