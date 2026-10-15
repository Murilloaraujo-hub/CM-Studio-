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
    }
  ];

  var BY_ID = {};
  LIST.forEach(function (t) { BY_ID[t.id] = t; });

  CM.templates = {
    ACCENTS: ACCENTS,
    list: LIST,
    get: function (id) { return BY_ID[id] || BY_ID.classic; },
    ids: function () { return LIST.map(function (t) { return t.id; }); },
    accentValue: function (key) { return (ACCENTS[key] || ACCENTS.teal).value; }
  };
})();
