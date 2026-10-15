/* CM Studio — perfil nacional: Japão.
   Três documentos distintos: 履歴書 (rirekisho), 職務経歴書 (shokumu keirekisho)
   e résumé em inglês. Os três usam as MESMAS seções, para que a troca de
   modelo não perca dados. */
(function () {
  var JP_SECTIONS = [
    ['summary', 'summary'], ['experience'], ['education'], ['certifications'], ['skills', 'skillsGeneral'],
    ['languages'], ['motivation'], ['selfPR'], ['personalWishes']
  ];
  var JP_SCHOOL = [
    ['education'], ['certifications'], ['subjects'], ['extracurricular'], ['motivation'], ['selfPR'], ['personalWishes']
  ];
  CM.countries.register({
    code: 'JP', name: 'Japão', nameLocal: '日本', region: 'Ásia', popular: true,
    aliases: ['japan', 'nihon', 'nippon', 'japones'],
    status: 'verified', verifiedAt: '2026-10-15',
    statusNote: 'Conferido na Hello Work (Ministério da Saúde, Trabalho e Bem-Estar — MHLW) e no Tokyo Career Guide (Governo Metropolitano de Tóquio). As mudanças no formulário modelo do MHLW foram confirmadas por fontes secundárias que citam o anúncio do ministério.',
    languages: ['ja-JP', 'en-US'], defaultLanguage: 'ja-JP',
    paper: 'A4', paperNote: 'O formulário modelo do MHLW existe em A3 (dobrado) e A4. O CM Studio usa A4.',
    dateStyle: 'ja',
    phone: { prefix: '+81', example: '+81 3-1234-5678 (de fora do Japão, inclua o código internacional)' },
    location: 'Endereço atual começando pelo país, se morar fora do Japão (Tokyo Career Guide).',
    terms: { cv: '履歴書 (rirekisho) + 職務経歴書 (shokumu keirekisho)', letter: '送付状 (folha de envio)' },
    summary: 'Dois documentos separados: o 履歴書 (formulário padronizado com dados, histórico escolar e profissional, licenças e motivação) e o 職務経歴書 (1 a 2 páginas detalhando a carreira). Quem tem bom inglês pode enviar também um résumé em inglês.',
    templates: ['jpRirekisho', 'jpShokumu', 'usResume', 'classic', 'minimal'],
    purposes: {
      professional: { docLabel: '履歴書 + 職務経歴書', docTitleKey: 'rirekisho', templates: ['jpRirekisho', 'jpShokumu', 'usResume'], maxPages: 2, pagesHint: '職務経歴書: 1 ou 2 páginas (Tokyo Career Guide).', sections: JP_SECTIONS,
        note: 'Crie dois documentos com os mesmos dados: um no modelo 履歴書 e outro no 職務経歴書 (use "Duplicar" e troque o modelo).' },
      firstJob: { docLabel: '履歴書', docTitleKey: 'rirekisho', templates: ['jpRirekisho', 'usResume'], maxPages: 2, sections: JP_SECTIONS },
      internship: { docLabel: '履歴書', docTitleKey: 'rirekisho', templates: ['jpRirekisho', 'usResume'], maxPages: 2, sections: JP_SECTIONS },
      school: { docLabel: '履歴書', docTitleKey: 'rirekisho', templates: ['jpRirekisho', 'school'], maxPages: 2, sections: JP_SCHOOL },
      exchange: { docLabel: '履歴書 ou résumé', templates: ['jpRirekisho', 'usResume', 'minimal'], sections: JP_SCHOOL.concat([['languages']]) },
      research: { docLabel: '研究業績書 / Academic CV', docTitleKey: 'academicCV', templates: ['academicExtended', 'academic'], maxPages: null, note: 'Universidades e institutos costumam fornecer formulários próprios para currículo e lista de publicações: use-os quando houver.' },
      academicExtended: { docLabel: '研究業績書 / Academic CV', docTitleKey: 'academicCV', templates: ['academicExtended', 'academic'], maxPages: null }
    },
    photo: { policy: 'common', note: 'O Tokyo Career Guide descreve foto no 履歴書 (fundo branco ou azul liso, traje formal). Continua opcional no CM Studio: siga o que a empresa pedir.' },
    personalFields: { birthDate: 'optional', nationality: 'hidden', address: 'recommended', workPermit: 'optional', drivingLicense: 'optional', furigana: 'recommended' },
    companions: [
      { kind: 'cover', label: '送付状 (folha de envio)', recommended: false, note: 'A Hello Work cita a folha de envio para documentos enviados. O Tokyo Career Guide informa que carta de apresentação não é exigida.' }
    ],
    supportingDocs: ['Certificados (JLPT, TOEIC etc.) com data e nome oficial correto.'],
    tips: [
      'Datas iguais nos dois documentos. Licenças e qualificações em ordem de obtenção.',
      'No 職務経歴書: visão geral da empresa (porte, ramo), números concretos, separe o resultado da empresa do seu e indique quantas pessoas você gerenciou.',
      'Cinco elementos: empregador, trabalho, esforços, resultados e aspirações futuras.',
      'Nomes de instituições podem ficar em inglês. O histórico escolar antes dos 18 anos pode ser omitido.',
      'Selo pessoal (hanko) não é necessário.'
    ],
    warnings: [
      'Não informe nacionalidade, religião, número de passaporte, conta bancária, altura, peso nem dados de familiares (Tokyo Career Guide).',
      'No formulário modelo do MHLW, o campo de gênero é opcional e foram removidos tempo de deslocamento, número de dependentes e cônjuge.',
      'Se a empresa fornecer formulário próprio, use o formulário dela: o modelo do CM Studio é uma referência, não o formulário oficial.'
    ],
    sources: [
      { title: '応募書類の作成 (履歴書・職務経歴書)', publisher: 'Hello Work — MHLW', url: 'https://www.hellowork.mhlw.go.jp/member/career_doc01.html', accessed: '2026-10-15', supports: '履歴書 como documento geral, 職務経歴書 cada vez mais pedido, folha de envio, formulário modelo do MHLW.' },
      { title: 'TOKYO CAREER GUIDE — Step 1', publisher: 'Tokyo Metropolitan Government', url: 'https://www.tdh.metro.tokyo.lg.jp/english/road_to_tokyo/step1.php', accessed: '2026-10-15', supports: 'Campos do 履歴書, foto, furigana, dados não exigidos, 職務経歴書 de 1 a 2 páginas, carta não exigida, résumé em inglês.' },
      { title: 'Mudanças no formulário modelo de 履歴書 do MHLW', publisher: 'Fontes secundárias (yodogawaroukyou.gr.jp, forest-sr.com) citando o anúncio do MHLW', url: '', accessed: '2026-10-15', supports: 'Campo de gênero opcional; remoção de deslocamento, dependentes e cônjuge. (Anúncio original não consultado diretamente.)' }
    ],
    unverified: ['Data de nascimento no modelo (o formulário do MHLW não foi aberto diretamente).']
  });
})();
