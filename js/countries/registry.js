/* ==========================================================================
   CM Studio — countries/registry.js
   Registro dos PERFIS NACIONAIS. Cada país fica em um arquivo próprio
   (js/countries/xx.js) e chama CM.countries.register({...}).

   O país representa o DESTINO DA CANDIDATURA, não a nacionalidade da pessoa.

   Esquema de um perfil (todos os textos voltados à interface em pt-BR):
   {
     code: 'US',                       // ISO 3166-1 alfa-2 ('XX' = outros países)
     name: 'Estados Unidos',           // nome em português
     nameLocal: 'United States',       // nome no idioma local
     region: 'América do Norte',
     popular: true,                    // aparece em "Países mais usados"
     status: 'verified'|'partial'|'preliminary'|'generic',
     verifiedAt: 'AAAA-MM-DD',         // data da consulta às fontes
     statusNote: '...',                // o que foi e o que não foi verificado
     languages: ['en-US'], defaultLanguage: 'en-US',
     paper: 'A4'|'Letter', paperNote: '...',
     dateStyle: 'numeric-slash'|'numeric-dot'|'month-short'|'ja',
     phone: { prefix: '+1', example: '...' },
     location: '...',                  // orientação para o campo "local"
     terms: { cv: '...', letter: '...' },
     summary: '...',                   // descrição curta do padrão
     purposes: { <typeId>: { available, docLabel, templates[], maxPages, pagesHint,
                             sections?, docTitleKey, note } },
     photo: { policy: 'avoid'|'optional'|'common'|'unverified', verified?: false (prática comum não confirmada na fonte), note },
     personalFields: { birthDate: 'hidden'|'optional'|'recommended'|'discouraged', ... },
     companions: [{ kind, label, recommended, note }],
     supportingDocs: ['...'], tips: ['...'], warnings: ['...'],
     privacyConsent: { recommended, note } (opcional),
     regions: [{ id, label, locale }] (opcional, ex.: Suíça),
     sources: [{ title, publisher, url, accessed, supports }],
     unverified: ['...']               // convenções usadas que NÃO vieram das fontes
   }
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var PROFILES = {};
  var ORDER = [];
  var DEFAULT = 'BR';
  var OTHER = 'XX';

  var STATUS = {
    verified: { label: 'Verificado em fonte oficial', short: 'Verificado', tone: 'ok',
      description: 'As principais orientações deste perfil foram conferidas em fontes oficiais ou institucionais, listadas com data de consulta.' },
    partial: { label: 'Parcialmente verificado', short: 'Parcial', tone: 'warn',
      description: 'Parte das orientações foi conferida em fontes oficiais; o restante segue convenções gerais indicadas como não verificadas.' },
    preliminary: { label: 'Perfil preliminar', short: 'Preliminar', tone: 'warn',
      description: 'Não foi encontrada fonte oficial nacional suficiente. As orientações são iniciais e devem ser confirmadas com o empregador ou instituição.' },
    generic: { label: 'Genérico (não verificado)', short: 'Genérico', tone: 'neutral',
      description: 'Modelo neutro para países sem perfil próprio. Não reflete regras de nenhum país específico.' }
  };

  if (CM.uiLang) CM.uiLang.registerTree(STATUS);

  function register(profile) {
    if (!profile || !profile.code) return;
    PROFILES[profile.code] = profile;
    // Textos do perfil acompanham o idioma da interface. Títulos das fontes ficam no original.
    if (CM.uiLang) CM.uiLang.registerTree(profile, { skip: ['title'] });
    if (ORDER.indexOf(profile.code) === -1) ORDER.push(profile.code);
  }

  function get(code) { return PROFILES[code] || PROFILES[OTHER] || PROFILES[DEFAULT] || null; }
  function has(code) { return !!PROFILES[code]; }

  /** Lista em ordem alfabética (pt-BR), com "Outros países" sempre por último. */
  function list() {
    return ORDER.map(function (c) { return PROFILES[c]; }).sort(function (a, b) {
      if (a.code === OTHER) return 1;
      if (b.code === OTHER) return -1;
      return a.name.localeCompare(b.name, (CM.uiLang && CM.uiLang.current()) || 'pt-BR');
    });
  }

  function popular() {
    var order = ['BR', 'US', 'UK', 'CA', 'PT', 'DE', 'FR', 'AU', 'JP', 'ES', 'IT', 'IE'];
    return order.filter(has).map(get);
  }

  /** Busca por nome em português, nome local, código ou idioma (sem acentos). */
  function search(query) {
    var q = norm(query);
    if (!q) return list();
    return list().filter(function (p) {
      var hay = [p.name, p.nameLocal, p.code, p.region].concat((p.languages || []).map(function (l) {
        return CM.l10n ? CM.l10n.localeName(l) : l;
      })).concat(p.aliases || []).map(norm).join(' | ');
      return hay.indexOf(q) !== -1;
    });
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  CM.countries = {
    DEFAULT: DEFAULT,
    OTHER: OTHER,
    STATUS: STATUS,
    register: register,
    get: get,
    has: has,
    list: list,
    popular: popular,
    search: search,
    codes: function () { return ORDER.slice(); }
  };
})();
