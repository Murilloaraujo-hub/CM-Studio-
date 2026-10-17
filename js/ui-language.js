/* ==========================================================================
   CM Studio — ui-language.js
   Controla o IDIOMA DA INTERFACE (separado do idioma do documento).

   Quatro estados independentes:
     - país de destino          → doc.country (regras nacionais)
     - idioma da interface      → settings.uiLocale (este módulo)
     - idioma do documento      → doc.locale (títulos e rótulos impressos)
     - finalidade               → doc.type

   Modos (settings.uiLocaleMode):
     'auto'   → a interface acompanha o idioma padrão do país escolhido
                (seleção no assistente, troca de país no editor, link ?pais=,
                país padrão nas Configurações). "Outros países" mantém o idioma.
     'manual' → a pessoa escolheu um idioma; trocar de país NÃO o altera
                (apenas um aviso discreto oferece o idioma do país).
   Trocar o idioma da interface nunca altera regras do país nem o documento.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var L = CM.uiLang;
  var lastOffer = null;

  function settings() { return CM.storage.getSettings(); }
  function save(patch) {
    var s = Object.assign(settings(), patch);
    CM.storage.saveSettings(s);
    return s;
  }
  function mode() { return settings().uiLocaleMode === 'manual' ? 'manual' : 'auto'; }

  /** Melhor idioma de interface disponível para um código de idioma qualquer. */
  function bestUi(code) {
    if (!code) return null;
    if (L.has(code)) return code;
    var lang = String(code).slice(0, 2);
    var same = L.codes().filter(function (c) { return c.slice(0, 2) === lang; })[0];
    return same || L.FALLBACK;
  }

  /** Idioma de interface padrão de um país (null para "Outros países": mantém o atual). */
  function forCountry(code, region) {
    if (!code || code === CM.countries.OTHER || !CM.countries.has(code)) return null;
    var R = CM.countryRules;
    var docLang = R ? R.defaultLanguage(code, region || '') : CM.countries.get(code).defaultLanguage;
    return bestUi(docLang);
  }

  function apply(code, opts) {
    return L.set(code, opts);
  }

  /**
   * Avisa que um país foi escolhido. No modo automático, troca o idioma da
   * interface (com opção de manter o anterior); no manual, só oferece.
   */
  function countryChanged(code, region, opts) {
    opts = opts || {};
    var target = forCountry(code, region);
    var prev = L.current();
    if (!target || target === prev) return false;
    if (mode() === 'auto') {
      save({ uiLocale: target });
      apply(target);
      if (!opts.quiet) {
        CM.ui.toast(CM.t('Interface em {0}, o idioma de {1}.', [L.endonym(target), CM.countries.get(code).name]), {
          type: 'info', duration: 7000,
          action: {
            label: CM.t('Manter {0}', [L.endonym(prev)]),
            onClick: function () { setManual(prev); }
          }
        });
      }
      return true;
    }
    // Modo manual: não muda; oferece uma vez por país/idioma.
    var key = code + '|' + target;
    if (!opts.quiet && lastOffer !== key) {
      lastOffer = key;
      CM.ui.toast(CM.t('O idioma da interface foi mantido ({0}). Idioma padrão de {1}: {2}.', [L.endonym(prev), CM.countries.get(code).name, L.endonym(target)]), {
        type: 'info', duration: 7000,
        action: { label: CM.t('Usar {0}', [L.endonym(target)]), onClick: function () { setManual(target); } }
      });
    }
    return false;
  }

  /** Escolha manual de idioma (seletor do cabeçalho ou Configurações). */
  function setManual(code) {
    code = bestUi(code) || L.SOURCE;
    save({ uiLocaleMode: 'manual', uiLocale: code });
    apply(code, { force: true });
    syncControls();
    CM.ui.announce(CM.t('Idioma da interface: {0}', [L.endonym(code)]));
  }

  /** País de referência para o modo automático: o do documento aberto, do assistente ou o padrão. */
  function contextCountry() {
    if (CM.state && CM.state.doc && !document.querySelector('[data-view="editor"]').hidden) {
      return { code: CM.state.doc.country, region: CM.state.doc.region };
    }
    var nd = CM.newDocument && CM.newDocument._state;
    if (nd && !document.querySelector('[data-view="new"]').hidden) return { code: nd.country, region: nd.region };
    var s = settings();
    var c = s.rememberCountry !== false && s.lastCountry ? s.lastCountry : s.defaultCountry;
    return { code: CM.countries.has(c) ? c : 'BR', region: '' };
  }

  /** Volta ao modo automático e ressincroniza com o país atual. */
  function setAuto() {
    save({ uiLocaleMode: 'auto' });
    var ctx = contextCountry();
    var target = forCountry(ctx.code, ctx.region) || L.current();
    save({ uiLocale: target });
    apply(target, { force: true });
    syncControls();
    CM.ui.announce(CM.t('Idioma automático pelo país: {0}', [L.endonym(target)]));
  }

  /* ---------------- Seletor no cabeçalho ---------------- */
  function fillSelect(sel, withAuto) {
    U().clear(sel);
    var cur = L.current();
    if (withAuto) {
      sel.appendChild(U().el('option', { text: CM.t('Automático pelo país ({0})', [L.endonym(cur)]), attrs: { value: 'auto' } }));
    }
    L.codes().forEach(function (c) {
      sel.appendChild(U().el('option', { text: label(c), attrs: { value: c, lang: c } }));
    });
    sel.value = withAuto && mode() === 'auto' ? 'auto' : cur;
  }
  function U() { return CM.utils; }

  /** Nome do idioma (sempre na própria língua) + aviso honesto quando a tradução não é completa. */
  function label(c) {
    var st = L.status(c);
    if (st === 'partial') return L.endonym(c) + ' — ' + CM.t('Tradução parcial');
    if (st === 'adapted') return L.endonym(c) + ' — ' + CM.t('Adaptação automática');
    return L.endonym(c);
  }

  /** Tabela "Idiomas da interface" na Central de ajuda (#/ajuda/idiomas). */
  function renderHelpTable(table) {
    if (!table) return;
    var el = U().el;
    Array.prototype.slice.call(table.querySelectorAll('thead, tbody')).forEach(function (n) { n.remove(); });
    table.appendChild(el('thead', {}, el('tr', {}, [CM.t('Idioma'), CM.t('Status'), CM.t('Mensagens traduzidas')].map(function (h) {
      return el('th', { attrs: { scope: 'col' }, text: h });
    }))));
    var body = el('tbody');
    L.codes().forEach(function (c) {
      var st = L.status(c), cov = L.coverage(c), base = L.baseOf(c);
      var text = st === 'source' ? CM.t('Idioma original')
        : st === 'complete' ? CM.t('Completo')
        : st === 'adapted' ? CM.t('Adaptação automática')
        : CM.t('Tradução parcial');
      if (base && base !== L.SOURCE && st !== 'adapted') text += ' · ' + CM.t('Variante de {0}', [L.endonym(base)]);
      var covText = st === 'source' ? '100%'
        : st === 'adapted' ? '—'
        : cov ? CM.t('{0} de {1}', [L.formatNumber(cov.translated), L.formatNumber(cov.total)]) : '—';
      body.appendChild(el('tr', { attrs: { 'data-ui-lang-row': c } }, [
        el('th', { attrs: { scope: 'row', lang: c }, text: L.endonym(c) }),
        el('td', { text: text }),
        el('td', { text: covText })
      ]));
    });
    table.appendChild(body);
  }

  function syncControls() {
    var head = document.getElementById('ui-lang-select');
    if (head) fillSelect(head, true);
    var set = document.getElementById('set-ui-locale');
    if (set) {
      fillSelect(set, false);
      set.disabled = mode() === 'auto';
    }
    document.querySelectorAll('input[name="ui-lang-mode"]').forEach(function (r) { r.checked = r.value === mode(); });
    var cur = document.getElementById('set-ui-current');
    if (cur) cur.textContent = L.endonym(L.current());
  }

  function bindControls() {
    var head = document.getElementById('ui-lang-select');
    if (head) {
      head.addEventListener('change', function () {
        if (head.value === 'auto') setAuto(); else setManual(head.value);
      });
    }
    var set = document.getElementById('set-ui-locale');
    if (set) set.addEventListener('change', function () { setManual(set.value); });
    document.querySelectorAll('input[name="ui-lang-mode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        if (r.value === 'auto') setAuto(); else setManual(L.current());
      });
    });
  }

  /** Inicialização: registra os textos do HTML e aplica o idioma salvo (sem forçar o do país no modo manual). */
  function init() {
    L.captureStatic();
    var s = settings();
    var code = s.uiLocale && L.has(s.uiLocale) ? s.uiLocale : null;
    if (!code) {
      // Primeira visita: idioma do país padrão (Brasil → pt-BR)
      code = forCountry(s.defaultCountry || 'BR', '') || L.SOURCE;
    }
    apply(code, { force: true, initial: true });
    bindControls();
    syncControls();
    L.onChange(function () {
      syncControls();
      // Anúncios antigos para leitores de tela ficariam no idioma anterior
      var live = document.getElementById('sr-announcer');
      if (live) live.textContent = '';
    });
  }

  CM.uiLanguage = {
    init: init,
    mode: mode,
    forCountry: forCountry,
    countryChanged: countryChanged,
    setManual: setManual,
    setAuto: setAuto,
    syncControls: syncControls,
    bestUi: bestUi,
    label: label,
    renderHelpTable: renderHelpTable
  };
})();
