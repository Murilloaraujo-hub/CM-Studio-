/* ==========================================================================
   CM Studio — job-analyzer.js
   Analisador LOCAL de descrição de vaga. Nada é enviado pela internet.

   O que faz: extrai termos frequentes/relevantes do texto da vaga e verifica
   quais já aparecem no currículo. O que NÃO faz: não calcula "nota ATS", não
   garante aprovação, não entende sinônimos e nunca adiciona competências por
   conta própria — a pessoa decide o que é verdadeiro e o que entra.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var C = CM.catalog;

  // Palavras comuns que não são competências (pt, en, es, fr, de, it, nl).
  var STOP = (
    // pt
    'a o os as um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para com sem sob sobre entre ' +
    'e ou mas que se como mais menos muito muita muitos muitas ser estar ter haver fazer sua seu suas seus nosso nossa nossos nossas ' +
    'voce você vocês voces ele ela eles elas isso isto aquele aquela este esta esse essa já ja também tambem não nao sim ' +
    'vaga vagas empresa empresas área area areas áreas candidato candidata candidatos pessoa pessoas profissional profissionais ' +
    'requisitos requisito desejável desejavel desejáveis diferencial diferenciais atividades atividade responsabilidades ' +
    'benefícios beneficios conhecimento conhecimentos experiência experiencia buscamos procuramos oferecemos local salário salario ' +
    'horário horario segunda sexta tempo integral contratação contratacao regime clt pj home office presencial híbrido hibrido ' +
    'anos ano mês meses dia dias bom boa bons boas ótimo otimo forte fortes capacidade será sera serão serao etc ' +
    // en
    'the a an and or but of to in on at by for with without from into over under about as is are was were be been being have has had ' +
    'do does did will would can could should may might must our your their its this that these those we you they he she it ' +
    'job role position company team candidate candidates requirements required preferred plus nice responsibilities duties ' +
    'experience knowledge skills skill ability strong excellent good years year including include such other etc work working ' +
    'benefits salary location full time part remote hybrid office apply applicants opportunity looking join daily ' +
    // es
    'el la los las un una unos unas y o pero de del en por para con sin sobre como más mas muy su sus nuestro nuestra es son ser estar ' +
    'puesto empresa requisitos experiencia conocimientos años ' +
    // fr
    'le la les un une des et ou mais de du en dans par pour avec sans sur comme plus très tres son sa ses notre nos est sont être etre ' +
    'poste entreprise profil missions expérience experience connaissances ans vous nous ' +
    // de
    'der die das ein eine einen einem einer und oder aber von zu im in am an auf für fur mit ohne über uber als ist sind sein wir sie ihr ' +
    'ihre unser unsere stelle unternehmen anforderungen erfahrung kenntnisse jahre aufgaben bieten ' +
    // it / nl
    'il lo gli le uno una e o ma di del della in per con senza su come più piu molto è sono essere ' +
    'de het een en of maar van te in op voor met zonder over als is zijn wij jij u functie bedrijf ervaring kennis jaar'
  ).split(/\s+/).reduce(function (m, w) { if (w) m[w] = true; return m; }, {});

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Divide em tokens preservando termos técnicos como C++, C#, Node.js, .NET, CI/CD. */
  function tokenize(text) {
    var out = [];
    var re = /[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9+#.\/-]*[A-Za-zÀ-ÖØ-öø-ÿ0-9+#]|[A-Za-zÀ-ÖØ-öø-ÿ0-9]|\.[A-Za-z]+/g;
    var m;
    while ((m = re.exec(text))) out.push(m[0].replace(/[.\/-]+$/, ''));
    return out;
  }

  /**
   * Extrai termos-chave da vaga.
   * Considera: palavras não comuns com 3+ letras, siglas (SQL, ERP), termos com
   * símbolos (C++), e pares de palavras que se repetem (ex.: "atendimento ao cliente" → "atendimento cliente").
   * Retorna [{ term, count }] ordenados por relevância.
   */
  // Conectores que podem ficar DENTRO de um termo composto ("atendimento ao cliente")
  var CONNECT = { de: 1, do: 1, da: 1, dos: 1, das: 1, ao: 1, aos: 1, 'à': 1, of: 1, du: 1, des: 1, di: 1, del: 1, von: 1, der: 1 };

  function extractKeywords(text, max) {
    max = max || 40;
    var tokens = tokenize(String(text || ''));
    var words = {};   // chave → { term, count, weight }
    var pairs = {};
    function bump(map, key, shown, w) {
      var x = map[key] || (map[key] = { term: shown, count: 0, weight: 0 });
      x.count += 1; x.weight += w;
      if (/[A-Z]/.test(shown) && !/[A-Z]/.test(x.term)) x.term = shown;
    }
    var prev = null;      // último termo de conteúdo
    var gap = [];         // conectores desde o último termo
    tokens.forEach(function (tok) {
      var n = norm(tok);
      var isAcronym = /^[A-Z0-9][A-Z0-9+#.]{1,9}$/.test(tok) && /[A-Z]/.test(tok);
      var isTech = /[+#.\/]/.test(tok) && tok.length >= 2;
      var isStop = STOP[n] || /^\d+$/.test(n);
      if (!isStop && (n.length >= 4 || isAcronym || isTech)) {
        bump(words, n, tok, isAcronym || isTech ? 1.5 : 1);
        if (prev && gap.length <= 1) {
          var key = prev.n + ' ' + gap.map(norm).join(' ') + (gap.length ? ' ' : '') + n;
          bump(pairs, key, prev.tok + ' ' + gap.join(' ') + (gap.length ? ' ' : '') + tok, 1);
        }
        prev = { n: n, tok: tok }; gap = [];
      } else if (prev && CONNECT[n] && !gap.length) {
        gap.push(tok);
      } else {
        prev = null; gap = [];
      }
    });
    var list = [];
    Object.keys(pairs).forEach(function (k) { if (pairs[k].count >= 2) list.push({ key: k, term: pairs[k].term, count: pairs[k].count, score: pairs[k].count * 1.6 }); });
    // palavras soltas que quase sempre aparecem dentro de um termo composto são omitidas
    Object.keys(words).forEach(function (k) {
      var w = words[k];
      var covered = list.some(function (pp) { return (' ' + pp.key + ' ').indexOf(' ' + k + ' ') !== -1 && pp.count >= w.count * 0.75; });
      if (!covered) list.push({ key: k, term: w.term, count: w.count, score: w.weight });
    });
    list.sort(function (a, b) { return b.score - a.score || a.term.localeCompare(b.term); });
    return list.slice(0, max).map(function (x) { return { term: x.term, count: x.count }; });
  }

  /** Todo o texto do currículo (visível), normalizado, com o título de cada parte. */
  function docTextParts(doc) {
    var parts = [];
    var p = doc.personal || {};
    parts.push({ where: 'Dados pessoais', text: [p.headline, p.fullName].join(' ') });
    (doc.sections || []).forEach(function (s) {
      if (!s.visible) return;
      var bits = [s.content || ''].concat(s.tags || []);
      (s.items || []).forEach(function (it) {
        Object.keys(it).forEach(function (k) { if (k !== 'id' && typeof it[k] === 'string') bits.push(it[k]); });
      });
      parts.push({ where: s.title || C.getKind(s.kind).title, text: bits.join(' \n ') });
    });
    return parts.map(function (x) { return { where: x.where, text: ' ' + norm(x.text).replace(/[^a-z0-9+#.\/]+/g, ' ') + ' ' }; });
  }

  function findIn(parts, term) {
    var t = ' ' + norm(term).replace(/[^a-z0-9+#.\/]+/g, ' ').trim() + ' ';
    var where = [];
    parts.forEach(function (p) { if (p.text.indexOf(t) !== -1) where.push(p.where); });
    return where;
  }

  /**
   * Compara a vaga com o currículo.
   * Retorna { found:[{term,count,where}], missing:[{term,count}], total, coverage }
   * coverage = fração de termos encontrados — NÃO é nota de aprovação.
   */
  function analyze(jobText, doc, existing) {
    var kws = extractKeywords(jobText);
    var parts = docTextParts(doc);
    var found = [], missing = [];
    kws.forEach(function (k) {
      var where = findIn(parts, k.term);
      if (where.length) found.push({ term: k.term, count: k.count, where: where });
      else missing.push({ term: k.term, count: k.count });
    });
    return { found: found, missing: missing, total: kws.length, coverage: kws.length ? found.length / kws.length : 0 };
  }

  /** Reavalia apenas a presença de um termo (após a pessoa editar o currículo). */
  function presence(doc, term) { return findIn(docTextParts(doc), term); }

  CM.jobAnalyzer = { extractKeywords: extractKeywords, analyze: analyze, presence: presence, _norm: norm };
})();
