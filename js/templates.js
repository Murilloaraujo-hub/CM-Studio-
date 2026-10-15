/* ==========================================================================
   CM Studio — templates.js
   Definição dos modelos visuais de currículo. Cada modelo combina:
   - opções de estrutura usadas pelo renderizador (preview.js);
   - uma classe CSS própria (css/templates.css) com tipografia,
     espaçamentos e hierarquia visual.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});

  /** Cores de destaque sóbrias (o conteúdo nunca depende delas). */
  var ACCENTS = {
    teal: { label: 'Verde-azulado', value: '#0f6b6f' },
    blue: { label: 'Azul', value: '#1f4e8c' },
    graphite: { label: 'Grafite', value: '#36424e' },
    green: { label: 'Verde', value: '#2e6a45' },
    wine: { label: 'Vinho', value: '#7a2e3a' },
    sepia: { label: 'Sépia', value: '#7a5230' }
  };

  /*
    layout:        'single' (uma coluna) | 'sidebar' (barra lateral)
    dateLayout:    'inline' (datas à direita) | 'left' (datas em coluna à esquerda)
    tagStyle:      'comma' | 'chips' | 'columns' | 'list'
    contactStyle:  'line' | 'grid' | 'labeled' | 'stack'
    sideHeadings:  títulos de seção em coluna à esquerda
    runningHeader: nome repetido no topo das páginas seguintes
    usesAccent:    se a cor de destaque é usada
  */
  var LIST = [
    {
      id: 'classic', name: 'Clássico',
      description: 'Serifado, centralizado e tradicional. Funciona para quase tudo.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'comma', contactStyle: 'line', usesAccent: true
    },
    {
      id: 'minimal', name: 'Minimalista',
      description: 'Muito espaço em branco e títulos em coluna lateral.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'comma', contactStyle: 'line', sideHeadings: true, usesAccent: true
    },
    {
      id: 'corporate', name: 'Corporativo',
      description: 'Cabeçalho firme, faixas de título e leitura objetiva.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'columns', contactStyle: 'grid', usesAccent: true
    },
    {
      id: 'modern', name: 'Moderno',
      description: 'Barra lateral com contatos e habilidades; conteúdo principal amplo.',
      layout: 'sidebar', dateLayout: 'inline', tagStyle: 'list', contactStyle: 'stack', usesAccent: true
    },
    {
      id: 'academic', name: 'Acadêmico',
      description: 'Datas em coluna, serifado e sóbrio, para seleções acadêmicas.',
      layout: 'single', dateLayout: 'left', tagStyle: 'comma', contactStyle: 'line', usesAccent: true
    },
    {
      id: 'school', name: 'Escolar / estudantil',
      description: 'Claro e acolhedor, ideal para estudantes e uma página.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'chips', contactStyle: 'line', usesAccent: true
    },
    {
      id: 'firstJob', name: 'Primeiro emprego',
      description: 'Objetivo em destaque e seções diretas para quem está começando.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'columns', contactStyle: 'line', usesAccent: true
    },
    {
      id: 'ats', name: 'ATS (leitura automatizada)',
      description: 'Texto linear, sem colunas nem cores, com títulos convencionais.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'comma', contactStyle: 'labeled', usesAccent: false
    },
    {
      id: 'academicExtended', name: 'Acadêmico estendido',
      description: 'Várias páginas, cabeçalho corrido e publicações numeradas.',
      layout: 'single', dateLayout: 'left', tagStyle: 'comma', contactStyle: 'grid', runningHeader: true, usesAccent: true
    },
    /* ---- Modelos internacionais (Atualização internacional) ----
       scope: países em que o modelo é recomendado/compatível (null = todos).
       Fora do escopo, o modelo continua disponível em "Mostrar todos", com aviso.
       renderer: renderizador especial (js/renderers/*.js) que substitui os blocos padrão. */
    {
      id: 'usResume', name: 'Résumé norte-americano',
      description: 'Uma coluna, organização em destaque e datas à direita; foco em resultados e concisão.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'comma', contactStyle: 'line', usesAccent: false,
      orgFirst: true, intl: true
    },
    {
      id: 'lebenslauf', name: 'Lebenslauf tabular',
      description: 'Currículo em formato de tabela (período | conteúdo), com dados pessoais em bloco e espaço opcional para foto, local, data e assinatura.',
      layout: 'single', dateLayout: 'left', tagStyle: 'comma', contactStyle: 'labeled', usesAccent: true,
      personalBlock: true, photoSlot: true, signatureSlot: true, scope: ['DE', 'CH', 'XX'], intl: true
    },
    {
      id: 'europass', name: 'Estilo Europass',
      description: 'Inspirado na estrutura do CV Europass: rótulos à esquerda e conteúdo à direita. Não é o formulário oficial do Europass.',
      layout: 'single', dateLayout: 'left', tagStyle: 'comma', contactStyle: 'labeled', sideHeadings: true, usesAccent: true,
      personalBlock: true, photoSlot: true, scope: ['PT', 'ES', 'IT', 'FR', 'DE', 'IE', 'NL', 'CH', 'XX'], intl: true
    },
    {
      id: 'jpRirekisho', name: '履歴書 (rirekisho)',
      description: 'Layout em grade inspirado no formulário modelo japonês: dados, foto, 学歴・職歴 em linhas 年|月, 免許・資格, 志望動機 e 本人希望. Use o formulário da empresa, se houver.',
      layout: 'single', dateLayout: 'left', tagStyle: 'comma', contactStyle: 'labeled', usesAccent: false,
      renderer: 'jpRirekisho', photoSlot: true, scope: ['JP'], intl: true
    },
    {
      id: 'jpShokumu', name: '職務経歴書 (shokumu keirekisho)',
      description: 'Documento japonês de histórico profissional: 職務要約, 職務経歴 por empresa, スキル, 資格 e 自己PR. Normalmente de 1 a 2 páginas.',
      layout: 'single', dateLayout: 'inline', tagStyle: 'comma', contactStyle: 'line', usesAccent: false,
      renderer: 'jpShokumu', scope: ['JP'], intl: true
    }
  ];

  var BY_ID = {};
  LIST.forEach(function (t) { BY_ID[t.id] = t; });

  CM.templates = {
    ACCENTS: ACCENTS,
    list: LIST,
    get: function (id) { return BY_ID[id] || BY_ID.classic; },
    ids: function () { return LIST.map(function (t) { return t.id; }); },
    has: function (id) { return !!BY_ID[id]; },
    /** O modelo é compatível com o país? (sem escopo = compatível com todos) */
    fitsCountry: function (id, country) {
      var t = BY_ID[id];
      if (!t) return false;
      return !t.scope || t.scope.indexOf(country) !== -1;
    },
    accentValue: function (key) { return (ACCENTS[key] || ACCENTS.teal).value; }
  };
})();
