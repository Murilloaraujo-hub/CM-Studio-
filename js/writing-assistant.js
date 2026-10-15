/* ==========================================================================
   CM Studio — writing-assistant.js
   Assistente para descrever conquistas e resultados.
   Monta um tópico SOMENTE com o que a pessoa informar: ação, contexto,
   ferramenta, resultado e — se ela tiver esse dado — um número real.
   O CM Studio nunca sugere, estima ou inventa números.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  var KINDS = ['experience', 'volunteer', 'projects', 'schoolProjects', 'research', 'monitoring', 'extracurricular', 'studentOrgs', 'clubs'];

  var LANG = {
    pt: { verbs: ['Organizei', 'Coordenei', 'Desenvolvi', 'Atendi', 'Implantei', 'Reduzi', 'Aumentei', 'Treinei', 'Analisei', 'Criei', 'Apoiei', 'Melhorei'], how: 'usando', result: 'o que resultou em' },
    en: { verbs: ['Organized', 'Coordinated', 'Developed', 'Supported', 'Implemented', 'Reduced', 'Increased', 'Trained', 'Analyzed', 'Created', 'Improved', 'Managed'], how: 'using', result: 'resulting in' },
    es: { verbs: ['Organicé', 'Coordiné', 'Desarrollé', 'Atendí', 'Implanté', 'Reduje', 'Aumenté', 'Formé', 'Analicé', 'Creé', 'Mejoré'], how: 'utilizando', result: 'lo que permitió' },
    fr: { verbs: ['Organisé', 'Coordonné', 'Développé', 'Accompagné', 'Mis en place', 'Réduit', 'Augmenté', 'Formé', 'Analysé', 'Créé', 'Amélioré'], how: 'avec', result: 'ce qui a permis' },
    de: { verbs: ['Organisiert', 'Koordiniert', 'Entwickelt', 'Betreut', 'Eingeführt', 'Reduziert', 'Erhöht', 'Geschult', 'Analysiert', 'Erstellt', 'Verbessert'], how: 'mit', result: 'Ergebnis:' },
    it: { verbs: ['Organizzato', 'Coordinato', 'Sviluppato', 'Seguito', 'Implementato', 'Ridotto', 'Aumentato', 'Formato', 'Analizzato', 'Creato', 'Migliorato'], how: 'utilizzando', result: 'con il risultato di' },
    nl: { verbs: ['Georganiseerd', 'Gecoördineerd', 'Ontwikkeld', 'Begeleid', 'Ingevoerd', 'Verminderd', 'Verhoogd', 'Getraind', 'Geanalyseerd', 'Gemaakt', 'Verbeterd'], how: 'met', result: 'resultaat:' },
    ja: { verbs: [], how: '使用：', result: '成果：' }
  };

  function langOf(locale) { var l = String(locale || 'pt').slice(0, 2); return LANG[l] ? l : 'en'; }

  /** Monta o tópico a partir das respostas. Campos vazios são simplesmente omitidos. */
  function build(locale, a) {
    var lg = langOf(locale);
    var L = LANG[lg];
    var what = String(a.what || '').trim().replace(/[.;]+$/, '');
    if (!what) return '';
    var how = String(a.how || '').trim().replace(/[.;]+$/, '');
    var result = String(a.result || '').trim().replace(/[.;]+$/, '');
    var number = String(a.number || '').trim();
    var verb = String(a.verb || '').trim();
    if (lg === 'ja') {
      var s = what + (how ? '（' + L.how + how + '）' : '') + (result ? '。' + L.result + result : '') + (number ? '（' + number + '）' : '');
      return '- ' + s + '。';
    }
    var line = (verb ? verb + ' ' + lowerFirst(what) : upperFirst(what));
    if (how) line += ', ' + L.how + ' ' + how;
    if (result) line += lg === 'de' || lg === 'nl' ? '. ' + L.result + ' ' + result : ', ' + L.result + ' ' + result;
    if (number) line += ' (' + number + ')';
    return '- ' + line + '.';
  }
  function lowerFirst(s) { return s && /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function upperFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /** Abre o diálogo. Resolve com o tópico pronto ou null. */
  function open(opts) {
    opts = opts || {};
    var locale = opts.locale || 'pt-BR';
    var L = LANG[langOf(locale)];
    var answers = { verb: '', what: '', how: '', result: '', number: '' };
    var preview = el('p', { class: 'wa-preview', attrs: { 'aria-live': 'polite' } });

    function update() {
      var line = build(locale, answers);
      preview.textContent = line || 'Preencha "O que você fez" para ver o tópico.';
      preview.classList.toggle('is-empty', !line);
    }

    function input(id, label, key, help, multiline) {
      var ctrl = el(multiline ? 'textarea' : 'input', { class: 'input' + (multiline ? ' textarea' : ''), id: id, type: multiline ? null : 'text', attrs: { maxlength: 240, autocomplete: 'off', rows: multiline ? 2 : null, 'aria-describedby': help ? id + '-help' : null } });
      ctrl.addEventListener('input', function () { answers[key] = ctrl.value; update(); });
      return el('div', { class: 'field field--full' }, [
        el('label', { class: 'label', attrs: { for: id }, text: label }),
        ctrl,
        help ? el('p', { class: 'field-help', id: id + '-help', text: help }) : null
      ]);
    }

    var verbField = null;
    if (L.verbs.length) {
      var sel = el('select', { class: 'input select', id: 'wa-verb' });
      sel.appendChild(el('option', { text: '(sem verbo — escrever livremente)', attrs: { value: '' } }));
      L.verbs.forEach(function (v) { sel.appendChild(el('option', { text: v, attrs: { value: v } })); });
      sel.addEventListener('change', function () { answers.verb = sel.value; update(); });
      verbField = el('div', { class: 'field field--full' }, [el('label', { class: 'label', attrs: { for: 'wa-verb' }, text: 'Verbo de ação (no idioma do documento)' }), sel]);
    }

    var body = [
      el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('p', { text: 'Descreva apenas o que é verdadeiro. Se não tiver um número real (medido ou informado por alguém), deixe o campo de número vazio: um bom tópico também funciona sem números.' })]),
      verbField,
      input('wa-what', 'O que você fez? (obrigatório)', 'what', 'Ex.: o controle de estoque da loja · the weekly shift schedule', false),
      input('wa-how', 'Como ou com quais ferramentas? (opcional)', 'how', 'Ex.: planilhas compartilhadas', false),
      input('wa-result', 'Qual foi o resultado observado? (opcional)', 'result', 'Ex.: menos atrasos na reposição de produtos', false),
      input('wa-number', 'Número real, se você tiver (opcional)', 'number', 'Ex.: 20 pedidos por dia; 3 turmas. Não estime nem arredonde para cima.', false),
      el('p', { class: 'label', text: 'Tópico que será inserido:' }),
      preview,
      el('p', { class: 'field-help', text: 'O texto é montado com as suas palavras, no idioma em que você escrever. Revise a concordância antes de usar.' })
    ];
    update();
    return CM.ui.modal({
      title: 'Descrever uma conquista', body: body, size: 'lg',
      actions: [
        { label: 'Cancelar', value: null, variant: 'ghost' },
        {
          label: 'Inserir tópico', variant: 'primary', submit: true,
          validate: function () {
            if (U.isBlank(answers.what)) { var w = document.getElementById('wa-what'); if (w) { w.focus(); w.setAttribute('aria-invalid', 'true'); } return false; }
            return true;
          },
          value: function () { return build(locale, answers); }
        }
      ]
    });
  }

  CM.writingAssistant = { open: open, build: build, KINDS: KINDS };
})();
