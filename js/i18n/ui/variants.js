/* CM Studio — variantes regionais da INTERFACE.
   Cada variante herda de um idioma-base e aplica um ajuste automático (transform).
   Uma tradução escrita à mão no dicionário da variante sempre tem prioridade.
   Ver docs/IDIOMAS.md (seção "Variantes regionais"). */
(function () {
  'use strict';
  var L = CM.uiLang;

  /* Aplica pares [regex, substituição] em sequência. */
  function apply(text, rules) {
    for (var i = 0; i < rules.length; i++) text = text.replace(rules[i][0], rules[i][1]);
    return text;
  }

  /* Mensagens-fonte que citam o nome do documento ("résumé norte-americano", "Résumé"…)
     mantêm a palavra résumé: ali ela é o nome de um tipo de documento, não um termo genérico. */
  function namesResume(msg) { return /r[ée]sum[ée]/i.test(msg); }

  /* ---------------- Inglês: grafia britânica/da Commonwealth ---------------- */
  var COMMONWEALTH = [
    [/\bcolor/g, 'colour'], [/\bColor/g, 'Colour'],
    [/\borganiz/g, 'organis'], [/\bOrganiz/g, 'Organis'],
    [/\brecogniz/g, 'recognis'], [/\bcustomiz/g, 'customis'], [/\bstandardiz/g, 'standardis'],
    [/\banalyz/g, 'analys'], [/\bAnalyz/g, 'Analys'],
    [/\bcenter/g, 'centre'], [/\bCenter\b(?! for Career)/g, 'Centre'],
    [/\bhonors\b/g, 'honours'], [/\bHonors\b/g, 'Honours'], [/\bhonorable\b/g, 'honourable'],
    [/\bfavorite/g, 'favourite'], [/\bbehavior/g, 'behaviour'],
    [/\bDriver's license\b/g, 'Driving licence'], [/\bdriver's license\b/g, 'driving licence'],
    [/\bLicenses\b/g, 'Licences'], [/\blicenses\b/g, 'licences'], [/\blicense\b/g, 'licence'],
    [/\bdependants\b/g, 'dependants'],
    // datas mm/dd/aaaa → dd/mm/aaaa
    [/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, '$2/$1/$3']
  ];
  var PROGRAMME = [[/\bprograms\b/g, 'programmes'], [/\bprogram\b/g, 'programme'], [/\bPrograms\b/g, 'Programmes'], [/\bProgram\b/g, 'Programme']];
  var TO_CV = [
    [/\bMy résumés\b/g, 'My CVs'], [/\brésumés\b/g, 'CVs'], [/\bRésumés\b/g, 'CVs'],
    [/\brésumé\b/g, 'CV'], [/\bRésumé\b/g, 'CV'], [/\ban CV\b/g, 'a CV']
  ];
  var TO_RESUME = [[/\brésumés\b/g, 'resumes'], [/\bRésumés\b/g, 'Resumes'], [/\brésumé\b/g, 'resume'], [/\bRésumé\b/g, 'Resume']];
  // "a résumé" vira "a CV": o artigo continua correto em inglês.

  function english(opts) {
    return function (text, msg) {
      var out = apply(text, COMMONWEALTH);
      if (opts.programme) out = apply(out, PROGRAMME);
      if (!namesResume(msg)) {
        if (opts.doc === 'cv') out = apply(out, TO_CV);
        else if (opts.doc === 'resume') out = apply(out, TO_RESUME);
      }
      return out;
    };
  }

  L.register('en-GB', {}, { base: 'en-US', transform: english({ doc: 'cv', programme: true }) });
  L.register('en-IE', {}, { base: 'en-US', transform: english({ doc: 'cv', programme: true }) });
  L.register('en-NZ', {}, { base: 'en-US', transform: english({ doc: 'cv', programme: true }) });
  L.register('en-AU', {}, { base: 'en-US', transform: english({ doc: 'resume', programme: false }) });
  // Canadá: o Job Bank usa "resume"; grafia canadense mistura formas britânicas e americanas.
  L.register('en-CA', {}, {
    base: 'en-US',
    transform: function (text, msg) {
      var out = apply(text, [[/\bcolor/g, 'colour'], [/\bColor/g, 'Colour'], [/\bcenter/g, 'centre'], [/\bCenter\b(?! for Career)/g, 'Centre'], [/\bhonors\b/g, 'honours'], [/\bhonorable\b/g, 'honourable']]);
      return namesResume(msg) ? out : apply(out, TO_RESUME);
    }
  });

  /* ---------------- Alemão suíço: sem ß ---------------- */
  L.register('de-CH', {}, { base: 'de-DE', transform: function (text) { return text.replace(/ß/g, 'ss'); } });

  /* ---------------- Francês do Canadá e da Suíça ---------------- */
  L.register('fr-CA', {}, {
    base: 'fr-FR',
    transform: function (text) {
      return apply(text, [[/\bE-mail\b/g, 'Courriel'], [/\be-mail\b/g, 'courriel'], [/\bl’e-mail\b/g, 'le courriel']]);
    }
  });
  L.register('fr-CH', {}, { base: 'fr-FR' });

  /* ---------------- Italiano da Suíça ---------------- */
  L.register('it-CH', {}, { base: 'it-IT' });

  /* ---------------- Português europeu (adaptação automática do pt-BR) ----------------
     Ajuste de vocabulário frequente. NÃO é uma tradução revisada: a documentação
     classifica o pt-PT como "adaptado automaticamente — revisão humana recomendada". */
  var PT_PT = [
    [/\bSalvando…/g, 'A guardar…'], [/\bEditando: /g, 'A editar: '], [/^Editando$/g, 'A editar'],
    [/\bCursando \/ em andamento\b/g, 'A frequentar / em curso'],
    [/\bSalvar\b/g, 'Guardar'], [/\bsalvar\b/g, 'guardar'],
    [/\bSalvos?\b(?! (?:pedido|necessidade|se|quando))/g, function (m) { return m === 'Salvo' ? 'Guardado' : 'Guardados'; }],
    [/\bsalvos?\b(?! (?:pedido|necessidade|se|quando))/g, function (m) { return m === 'salvo' ? 'guardado' : 'guardados'; }],
    [/\bsalvas?\b/g, function (m) { return m === 'salva' ? 'guardada' : 'guardadas'; }],
    [/\bExcluir\b/g, 'Eliminar'], [/\bexcluir\b/g, 'eliminar'],
    [/\bexcluíd([oa]s?)\b/g, 'eliminad$1'], [/\bExcluíd([oa]s?)\b/g, 'Eliminad$1'], [/\bexcluí-l([oa]s?)\b/g, 'eliminá-l$1'],
    [/\barquivos\b/g, 'ficheiros'], [/\barquivo\b/g, 'ficheiro'], [/\bArquivo\b/g, 'Ficheiro'],
    [/\bConfigurações\b/g, 'Definições'], [/\bconfigurações\b/g, 'definições'],
    [/\bequipe\b/g, 'equipa'], [/\bEquipe\b/g, 'Equipa'],
    [/\bcontatos\b/g, 'contactos'], [/\bcontato\b/g, 'contacto'], [/\bContato\b/g, 'Contacto'],
    [/\busuários?\b/g, function (m) { return m === 'usuário' ? 'utilizador' : 'utilizadores'; }],
    [/\bcelular\b/g, 'telemóvel'],
    [/\bbaixar\b/g, 'transferir'],
    [/\bregistro\b/g, 'registo'], [/\bcadastro\b/g, 'registo'], [/\bCadastro\b/g, 'Registo'],
    [/\bPlanilhas eletrônicas\b/g, 'Folhas de cálculo'], [/\bPlanilhas\b/g, 'Folhas de cálculo'], [/\bplanilhas\b/g, 'folhas de cálculo'], [/\bplanilha\b/g, 'folha de cálculo'],
    [/\bgerenciamento\b/g, 'gestão'], [/\bgerenciou\b/g, 'geriu'],
    [/\bCarteira de motorista\b/g, 'Carta de condução'],
    [/\bEnsino Médio\b/g, 'Ensino Secundário'], [/\bensino médio\b/g, 'ensino secundário'],
    [/\bum pendrive\b/g, 'uma pen USB'],
    [/\b([Nn])a aba\b/g, '$1o separador'], [/\b([Dd])a aba\b/g, '$1o separador'], [/\bA aba\b/g, 'O separador'], [/\ba aba\b/g, 'o separador'],
    [/\b([Nn]?)esta aba\b/g, '$1este separador'], [/\boutra aba\b/g, 'outro separador'], [/\buma aba\b/g, 'um separador'], [/\bnas abas\b/g, 'nos separadores'], [/\bas abas\b/g, 'os separadores'], [/\bAs abas\b/g, 'Os separadores'],
    [/\babas\b/g, 'separadores'], [/\baba\b/g, 'separador'], [/\bAba\b/g, 'Separador'],
    [/\bTela\b/g, 'Ecrã'], [/\btela\b/g, 'ecrã'],
    [/\beletrônic/g, 'eletrónic'], [/\bSalve\b/g, 'Guarde'], [/\bsalve\b/g, 'guarde'], [/\bônibus\b/g, 'autocarro']
  ];
  L.register('pt-PT', {}, {
    base: 'pt-BR',
    meta: { adapted: true },
    transform: function (text) { return apply(text, PT_PT); }
  });
})();
