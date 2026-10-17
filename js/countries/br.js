/* CM Studio — perfil nacional: Brasil (padrão do aplicativo). */
CM.countries.register({
  code: 'BR', name: 'Brasil', nameLocal: 'Brasil', region: 'América do Sul', popular: true,
  aliases: ['brazil', 'brasileiro'],
  status: 'partial', verifiedAt: '2026-10-15',
  statusNote: 'Não foi encontrada uma orientação federal (gov.br) sobre formato de currículo. As regras do programa Jovem Aprendiz vêm do Ministério do Trabalho; as recomendações de conteúdo vêm de um guia da Prefeitura de São Paulo. O restante segue as convenções do CM Studio, indicadas como não verificadas.',
  languages: ['pt-BR'], defaultLanguage: 'pt-BR',
  paper: 'A4', paperNote: 'A4 é o tamanho de papel usado no Brasil.',
  dateStyle: 'numeric-slash',
  phone: { prefix: '+55', example: '(44) 90000-0000 ou +55 44 90000-0000' },
  location: 'Cidade e estado (ex.: Maringá/PR). Endereço completo não é necessário.',
  terms: { cv: 'Currículo', letter: 'Carta de apresentação' },
  summary: 'Currículo objetivo, normalmente de 1 a 2 páginas, sem foto e sem documentos pessoais. Direcione o conteúdo para a vaga.',
  templates: ['classic', 'corporate', 'modern', 'minimal', 'ats', 'firstJob', 'school', 'academic', 'academicExtended'],
  purposes: {
    apprentice: { available: true, note: 'Programa de aprendizagem (Lei 10.097/2000): de 14 anos completos a 24 incompletos, com frequência escolar obrigatória para quem não concluiu o ensino médio.' },
    academicExtended: { note: 'Para seleções acadêmicas no Brasil, o Currículo Lattes (CNPq) é uma plataforma separada. O CM Studio não substitui o Lattes; inclua o link dele, se tiver.' },
    research: { note: 'Muitas seleções de pós-graduação no Brasil pedem o Currículo Lattes. Este documento é complementar e não o substitui.' }
  },
  photo: { policy: 'avoid', note: 'Foto não é exigida. O guia da Prefeitura de São Paulo recomenda não incluir foto. Inclua só se o processo pedir.' },
  personalFields: { birthDate: 'discouraged', nationality: 'hidden', address: 'discouraged', workPermit: 'hidden', drivingLicense: 'optional', furigana: 'hidden' },
  companions: [
    { kind: 'cover', label: 'Carta de apresentação', recommended: false, note: 'Opcional. Útil quando a vaga pede ou quando o envio é por e-mail.' },
    { kind: 'project', label: 'Resumo de projeto', recommended: false, note: 'Para processos escolares, acadêmicos ou de bolsa.' },
    { kind: 'publications', label: 'Lista de publicações', recommended: false, note: 'Para seleções acadêmicas, se pedida.' },
    { kind: 'portfolio', label: 'Portfólio', recommended: false, note: 'Para áreas criativas e de tecnologia.' }
  ],
  supportingDocs: ['Comprovantes (diplomas, certificados) só quando solicitados.'],
  tips: [
    'Direcione o currículo para a vaga e coloque um objetivo claro.',
    'Não use pronomes pessoais nem enfeites; revise a ortografia.',
    'Pretensão salarial só se a vaga pedir.',
    'Telefone com DDD; para vagas no exterior, use +55.'
  ],
  warnings: [
    'Não inclua CPF, RG, número da CNH, estado civil ou endereço completo.',
    'Foto, idade e estado civil não são necessários.'
  ],
  sources: [
    { title: 'Aprendizagem profissional: regras, direitos e funcionamento do contrato de aprendizagem', publisher: 'Ministério do Trabalho e Emprego (gov.br)', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/julho/aprendizagem-profissional-regras-direitos-e-funcionamento-do-contrato-de-aprendizagem', accessed: '2026-10-15', supports: 'Faixa etária, duração e jornada do contrato de aprendizagem; frequência escolar.' },
    { title: 'Como preparar um currículo', publisher: 'Prefeitura de São Paulo — SMDET', url: 'https://prefeitura.sp.gov.br/web/desenvolvimento/w/dicas/preparar_um_curriculo/619', accessed: '2026-10-15', supports: 'Direcionar para a vaga; evitar foto, pretensão salarial, RG, CNH e CPF; não usar pronomes pessoais. (Página antiga, cerca de 2009.)' }
  ],
  unverified: ['Tamanho de 1 a 2 páginas.', 'Não informar estado civil e idade.', 'Formato de data MM/AAAA.']
});
