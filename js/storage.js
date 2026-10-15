/* ==========================================================================
   CM Studio — storage.js
   Armazenamento local no navegador (localStorage).
   - Cada currículo fica em uma chave própria (cmstudio.v1.doc.<id>), o que
     impede que a edição de um documento altere outro.
   - Um índice leve (cmstudio.v1.index) guarda nome, tipo e data de cada um.
   - Se o localStorage estiver indisponível (ex.: navegação privativa com
     bloqueio), usa memória temporária e o app avisa o usuário.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});

  var PREFIX = 'cmstudio.v1.';
  var INDEX_KEY = PREFIX + 'index';
  var SETTINGS_KEY = PREFIX + 'settings';
  var DOC_PREFIX = PREFIX + 'doc.';

  var DEFAULT_SETTINGS = {
    theme: 'system',          // system | light | dark
    showTips: true,           // dicas dentro das seções
    confirmItemDelete: true,  // confirmar antes de excluir itens
    previewZoom: 'fit',       // fit | 100 | 75 | 50
    lastDocId: null,
    defaultCountry: 'BR',     // país pré-selecionado ao criar um currículo
    lastCountry: null,        // último país usado (lembrado se rememberCountry)
    rememberCountry: true
  };

  var memory = {};
  var available = detect();

  function detect() {
    try {
      var k = PREFIX + '__test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function rawGet(key) {
    if (!available) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    return window.localStorage.getItem(key);
  }

  /** Grava e lança um erro descritivo em caso de falha (ex.: cota cheia). */
  function rawSet(key, value) {
    if (!available) { memory[key] = value; return; }
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      var quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      var err = new Error(quota
        ? 'O espaço de armazenamento do navegador está cheio. Exporte um backup e exclua currículos que não usa mais.'
        : 'O navegador não permitiu salvar os dados.');
      err.cause = e;
      err.quota = !!quota;
      throw err;
    }
  }

  function rawRemove(key) {
    if (!available) { delete memory[key]; return; }
    window.localStorage.removeItem(key);
  }

  function parse(json, fallback) {
    if (json == null) return fallback;
    try { return JSON.parse(json); } catch (e) { return fallback; }
  }

  /* ---------------- Índice ---------------- */
  function readIndex() {
    var idx = parse(rawGet(INDEX_KEY), null);
    if (!Array.isArray(idx)) idx = rebuildIndex();
    return idx.filter(function (e) { return e && typeof e.id === 'string'; });
  }

  /** Reconstrói o índice varrendo as chaves (recuperação de falhas). */
  function rebuildIndex() {
    var keys = allKeys().filter(function (k) { return k.indexOf(DOC_PREFIX) === 0; });
    var idx = [];
    keys.forEach(function (k) {
      var d = parse(rawGet(k), null);
      if (d && d.id) idx.push(summaryOf(d));
    });
    try { rawSet(INDEX_KEY, JSON.stringify(idx)); } catch (e) { /* ignora: será tentado de novo */ }
    return idx;
  }

  function allKeys() {
    if (!available) return Object.keys(memory);
    var keys = [];
    for (var i = 0; i < window.localStorage.length; i++) keys.push(window.localStorage.key(i));
    return keys;
  }

  function summaryOf(doc) {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      template: doc.template,
      country: doc.country || 'BR',
      locale: doc.locale || 'pt-BR',
      companions: Array.isArray(doc.companions) ? doc.companions.length : 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  function writeIndexEntry(doc) {
    var idx = readIndex();
    var entry = summaryOf(doc);
    var pos = idx.findIndex(function (e) { return e.id === doc.id; });
    if (pos === -1) idx.push(entry); else idx[pos] = entry;
    rawSet(INDEX_KEY, JSON.stringify(idx));
  }

  /* ---------------- API pública ---------------- */
  function listDocs() {
    return readIndex().slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
  }

  function loadDoc(id) {
    var d = parse(rawGet(DOC_PREFIX + id), null);
    return d && d.id === id ? d : null;
  }

  /** Salva um documento. Retorna { ok: true } ou { ok: false, error }. */
  function saveDoc(doc) {
    try {
      rawSet(DOC_PREFIX + doc.id, JSON.stringify(doc));
      writeIndexEntry(doc);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  /**
   * Antes de migrar um documento antigo, guarda uma cópia do original
   * (somente na primeira vez). Nunca apagamos a versão anterior sem cópia.
   */
  var LEGACY_PREFIX = PREFIX + 'legacy.';
  function backupLegacy(raw) {
    if (!raw || !raw.id) return false;
    var key = LEGACY_PREFIX + raw.id;
    if (rawGet(key) != null) return true;
    try { rawSet(key, JSON.stringify(raw)); return true; } catch (e) { return false; }
  }
  function loadLegacy(id) { return parse(rawGet(LEGACY_PREFIX + id), null); }

  function deleteDoc(id) {
    rawRemove(DOC_PREFIX + id);
    rawRemove(LEGACY_PREFIX + id);
    var idx = readIndex().filter(function (e) { return e.id !== id; });
    rawSet(INDEX_KEY, JSON.stringify(idx));
    var s = getSettings();
    if (s.lastDocId === id) saveSettings(Object.assign(s, { lastDocId: null }));
  }

  function hasDoc(id) {
    return rawGet(DOC_PREFIX + id) != null;
  }

  function getSettings() {
    var s = parse(rawGet(SETTINGS_KEY), {});
    return Object.assign({}, DEFAULT_SETTINGS, s && typeof s === 'object' ? s : {});
  }

  function saveSettings(settings) {
    try {
      rawSet(SETTINGS_KEY, JSON.stringify(settings));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  /** Remove todos os dados do CM Studio (apenas chaves com o prefixo do app). */
  function clearAll() {
    allKeys().forEach(function (k) {
      if (k && k.indexOf(PREFIX) === 0) rawRemove(k);
    });
  }

  /** Estimativa do espaço usado pelo app, em bytes (UTF-16 = 2 bytes/char). */
  function usageBytes() {
    var total = 0;
    allKeys().forEach(function (k) {
      if (k && k.indexOf(PREFIX) === 0) total += (k.length + (rawGet(k) || '').length) * 2;
    });
    return total;
  }

  CM.storage = {
    PREFIX: PREFIX,
    DOC_PREFIX: DOC_PREFIX,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    isPersistent: function () { return available; },
    listDocs: listDocs,
    loadDoc: loadDoc,
    saveDoc: saveDoc,
    deleteDoc: deleteDoc,
    hasDoc: hasDoc,
    backupLegacy: backupLegacy,
    loadLegacy: loadLegacy,
    getSettings: getSettings,
    saveSettings: saveSettings,
    clearAll: clearAll,
    usageBytes: usageBytes,
    _rebuildIndex: rebuildIndex
  };
})();
