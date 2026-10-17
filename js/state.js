/* ==========================================================================
   CM Studio — state.js
   Estado do documento aberto no editor:
   - aplica alterações por meio de funções "mutadoras";
   - mantém histórico para desfazer/refazer (snapshots JSON);
   - salva automaticamente (com atraso curto) e informa o status.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  if (CM.uiLang) CM.uiLang.declare(['Alterações salvas', 'Salvo apenas nesta sessão', 'Alterações pendentes', 'Não foi possível salvar.']);
  var U = CM.utils;
  var C = CM.catalog;

  var HISTORY_LIMIT = 100;
  var COALESCE_MS = 1200;
  var SAVE_DELAY = 600;

  var doc = null;
  var past = [];
  var future = [];
  var lastCoalesce = { key: null, time: 0 };
  var listeners = { change: [], status: [] };
  var status = { state: 'idle', message: '' };

  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { if (window.console) console.error('[CM Studio]', e.message); }
    });
  }

  function on(evt, fn) {
    listeners[evt].push(fn);
    return function off() {
      listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
    };
  }

  function setStatus(state, message) {
    status = { state: state, message: message || '' };
    emit('status', status);
  }

  var scheduleSave = U.debounce(function () { saveNow(); }, SAVE_DELAY);

  function saveNow() {
    scheduleSave.cancel();
    if (!doc) return { ok: true };
    var res = CM.storage.saveDoc(doc);
    if (res.ok) {
      setStatus('saved', CM.storage.isPersistent() ? 'Alterações salvas' : 'Salvo apenas nesta sessão');
    } else {
      // Mensagens de status são guardadas no texto-fonte e traduzidas ao exibir (editor.renderStatus)
      setStatus('error', res.error && res.error.message ? res.error.message : 'Não foi possível salvar.');
    }
    return res;
  }

  function open(id) {
    flush();
    var loaded = CM.storage.loadDoc(id);
    if (!loaded) return false;
    // Passa pela sanitização para garantir uma estrutura válida
    var clean = CM.validation.sanitizeDocument(loaded).doc;
    if (!clean) return false;
    clean.id = loaded.id;
    if (clean.migratedFrom) {
      // Migração segura: guarda o original e grava a versão nova (dados preservados)
      CM.storage.backupLegacy(loaded);
      delete clean.migratedFrom;
      CM.storage.saveDoc(clean);
    }
    doc = clean;
    past = [];
    future = [];
    lastCoalesce = { key: null, time: 0 };
    setStatus('saved', 'Alterações salvas');
    return true;
  }

  function close() {
    flush();
    doc = null;
    past = [];
    future = [];
  }

  function flush() {
    if (doc && status.state === 'pending') saveNow();
  }

  /**
   * Aplica uma alteração ao documento.
   * opts.coalesce: chave para agrupar digitação contínua em um único passo de desfazer.
   * opts.structural: indica que a estrutura mudou (o formulário deve ser redesenhado).
   */
  function update(mutator, opts) {
    if (!doc) return;
    opts = opts || {};
    var now = Date.now();
    var snapshot = JSON.stringify(doc);
    var coalescing = opts.coalesce && lastCoalesce.key === opts.coalesce && now - lastCoalesce.time < COALESCE_MS;
    if (!coalescing) {
      past.push(snapshot);
      if (past.length > HISTORY_LIMIT) past.shift();
    }
    lastCoalesce = { key: opts.coalesce || null, time: now };
    future = [];
    mutator(doc);
    doc.updatedAt = now;
    setStatus('pending', 'Alterações pendentes');
    scheduleSave();
    emit('change', { structural: !!opts.structural, source: opts.source || 'edit' });
  }

  function undo() {
    if (!doc || !past.length) return false;
    future.push(JSON.stringify(doc));
    doc = JSON.parse(past.pop());
    doc.updatedAt = Date.now();
    lastCoalesce = { key: null, time: 0 };
    setStatus('pending', 'Alterações pendentes');
    scheduleSave();
    emit('change', { structural: true, source: 'undo' });
    return true;
  }

  function redo() {
    if (!doc || !future.length) return false;
    past.push(JSON.stringify(doc));
    doc = JSON.parse(future.pop());
    doc.updatedAt = Date.now();
    lastCoalesce = { key: null, time: 0 };
    setStatus('pending', 'Alterações pendentes');
    scheduleSave();
    emit('change', { structural: true, source: 'redo' });
    return true;
  }

  /* ---------------- Auxiliares de busca ---------------- */
  function findSection(d, sid) {
    return d.sections.filter(function (s) { return s.id === sid; })[0] || null;
  }
  function findItem(sec, iid) {
    return sec && sec.items ? sec.items.filter(function (i) { return i.id === iid; })[0] || null : null;
  }
  function move(arr, index, delta) {
    var target = index + delta;
    if (index < 0 || target < 0 || target >= arr.length) return false;
    var tmp = arr[index];
    arr[index] = arr[target];
    arr[target] = tmp;
    return true;
  }

  /* ---------------- Ações de alto nível ---------------- */
  var actions = {
    setPersonal: function (key, value) {
      update(function (d) { d.personal[key] = value; }, { coalesce: 'p:' + key });
    },
    rename: function (name) {
      update(function (d) { d.name = String(name).slice(0, 120); }, { coalesce: 'name' });
    },
    setSectionTitle: function (sid, value) {
      update(function (d) { var s = findSection(d, sid); if (s) s.title = value; }, { coalesce: 's:' + sid + ':title' });
    },
    setSectionContent: function (sid, value, opts) {
      update(function (d) { var s = findSection(d, sid); if (s) s.content = value; },
        { coalesce: opts && opts.noCoalesce ? null : 's:' + sid + ':content' });
    },
    setItemField: function (sid, iid, key, value, opts) {
      update(function (d) {
        var it = findItem(findSection(d, sid), iid);
        if (it) it[key] = value;
      }, { coalesce: opts && opts.noCoalesce ? null : 'i:' + iid + ':' + key });
    },
    setTags: function (sid, tags) {
      update(function (d) { var s = findSection(d, sid); if (s) s.tags = tags.slice(0, 150); }, { structural: false });
    },
    addSection: function (kind, title) {
      var sec = C.createSection(kind, title, doc ? doc.locale : 'pt-BR');
      update(function (d) { d.sections.push(sec); }, { structural: true });
      return sec.id;
    },
    removeSection: function (sid) {
      update(function (d) { d.sections = d.sections.filter(function (s) { return s.id !== sid; }); }, { structural: true });
    },
    duplicateSection: function (sid) {
      var newId = null;
      update(function (d) {
        var i = d.sections.findIndex(function (s) { return s.id === sid; });
        if (i === -1) return;
        var copy = U.deepClone(d.sections[i]);
        copy.id = U.uid('sec');
        copy.title = CM.t("{0} (cópia)", [copy.title]);
        (copy.items || []).forEach(function (it) { it.id = U.uid('it'); });
        d.sections.splice(i + 1, 0, copy);
        newId = copy.id;
      }, { structural: true });
      return newId;
    },
    moveSection: function (sid, delta) {
      var moved = false;
      update(function (d) {
        var i = d.sections.findIndex(function (s) { return s.id === sid; });
        moved = move(d.sections, i, delta);
      }, { structural: true });
      return moved;
    },
    toggleSection: function (sid) {
      update(function (d) { var s = findSection(d, sid); if (s) s.visible = !s.visible; }, { structural: true });
    },
    addItem: function (sid) {
      var newId = null;
      update(function (d) {
        var s = findSection(d, sid);
        if (!s || !s.items) return;
        var item = C.createItem(s.kind);
        s.items.push(item);
        newId = item.id;
      }, { structural: true });
      return newId;
    },
    removeItem: function (sid, iid) {
      update(function (d) {
        var s = findSection(d, sid);
        if (s && s.items) s.items = s.items.filter(function (i) { return i.id !== iid; });
      }, { structural: true });
    },
    duplicateItem: function (sid, iid) {
      var newId = null;
      update(function (d) {
        var s = findSection(d, sid);
        if (!s || !s.items) return;
        var i = s.items.findIndex(function (x) { return x.id === iid; });
        if (i === -1) return;
        var copy = U.deepClone(s.items[i]);
        copy.id = U.uid('it');
        s.items.splice(i + 1, 0, copy);
        newId = copy.id;
      }, { structural: true });
      return newId;
    },
    moveItem: function (sid, iid, delta) {
      update(function (d) {
        var s = findSection(d, sid);
        if (!s || !s.items) return;
        move(s.items, s.items.findIndex(function (x) { return x.id === iid; }), delta);
      }, { structural: true });
    },
    /** Ordena itens do mais recente para o mais antigo (itens atuais primeiro). */
    sortItemsByDate: function (sid) {
      update(function (d) {
        var s = findSection(d, sid);
        if (!s || !s.items) return;
        var schema = C.getSchema(s.kind);
        var keys = schema.dateKeys || [];
        var endKey = keys[keys.length - 1];
        var startKey = keys[0];
        function score(it) {
          if (it.current || it.status === 'cursando') return 999999 + (U.parsePeriod(it[startKey]) || 0) / 1e6;
          return U.parsePeriod(it[endKey]) || U.parsePeriod(it[startKey]) || 0;
        }
        s.items = s.items
          .map(function (it, idx) { return { it: it, idx: idx, sc: score(it) }; })
          .sort(function (a, b) { return b.sc - a.sc || a.idx - b.idx; })
          .map(function (x) { return x.it; });
      }, { structural: true });
    },
    setTemplate: function (tpl) {
      update(function (d) { d.template = tpl; }, { structural: false });
    },
    setDesign: function (key, value) {
      update(function (d) { d.design[key] = value; }, { structural: false });
    },
    /**
     * Troca o tipo de currículo preservando os dados:
     * - mantém todas as seções existentes e seu conteúdo;
     * - acrescenta, vazias, as seções sugeridas do novo tipo que faltarem;
     * - opcionalmente remove seções VAZIAS que não fazem parte do novo tipo;
     * - opcionalmente aplica o modelo recomendado.
     */
    changeType: function (typeId, opts) {
      opts = opts || {};
      var type = C.TYPES[typeId];
      if (!type) return;
      var L = CM.l10n;
      update(function (d) {
        var plan = C.sectionPlan(typeId, d.country);
        var suggestedKinds = plan.map(function (s) { return s[0]; });
        if (opts.removeEmpty) {
          d.sections = d.sections.filter(function (s) {
            return C.sectionHasContent(s) || suggestedKinds.indexOf(s.kind) !== -1;
          });
        }
        plan.forEach(function (s) {
          var exists = d.sections.some(function (x) { return x.kind === s[0]; });
          if (!exists) d.sections.push(C.createSection(s[0], s[1], d.locale));
        });
        // Ajusta o título do resumo apenas se ele ainda tiver um título padrão
        var newSummary = plan.filter(function (s) { return s[0] === 'summary'; })[0];
        d.sections.forEach(function (s) {
          if (s.kind !== 'summary' || !newSummary) return;
          var isDefault = s.titleKey && String(s.title).trim() === L.sectionTitle(s.titleKey, d.locale);
          if (isDefault) {
            s.titleKey = newSummary[1] || 'summary';
            s.title = L.sectionTitle(s.titleKey, d.locale) || s.title;
          }
        });
        if (opts.reorder) {
          d.sections.sort(function (a, b) {
            var ia = suggestedKinds.indexOf(a.kind), ib = suggestedKinds.indexOf(b.kind);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
        }
        d.type = typeId;
        if (opts.applyTemplate) d.template = CM.countryRules.templatesFor(d.country, typeId).first;
      }, { structural: true });
    },

    /* ---------------- País, idioma, papel (Atualização internacional) ----------------
       País, idioma e finalidade são independentes; nenhuma destas ações apaga dados. */

    /**
     * Troca o país de destino.
     * opts: { locale: bool (aplicar idioma sugerido), paper: bool, template: bool, region }
     */
    changeCountry: function (code, opts) {
      opts = opts || {};
      if (!CM.countries.has(code)) return null;
      var R = CM.countryRules;
      var result = { retitled: 0 };
      update(function (d) {
        d.country = code;
        var prof = CM.countries.get(code);
        d.region = opts.region && prof.regions && prof.regions.some(function (r) { return r.id === opts.region; }) ? opts.region : (prof.regions ? prof.regions[0].id : '');
        // Cada opção aceita true (usar o padrão do país) ou um valor explícito.
        if (opts.paper) d.design.paper = typeof opts.paper === 'string' ? (opts.paper === 'Letter' ? 'Letter' : 'A4') : R.paperFor(code);
        if (opts.locale) {
          var next = typeof opts.locale === 'string' && CM.i18n.has(opts.locale) ? opts.locale : R.defaultLanguage(code, d.region);
          if (next !== d.locale) {
            if (opts.retitle !== false) result.retitled = CM.l10n.retitleSections(d, d.locale, next).changed;
            d.locale = next;
          }
        }
        if (opts.template) d.template = typeof opts.template === 'string' && CM.templates.has(opts.template) ? opts.template : R.templatesFor(code, d.type).first;
        // Foto: se o novo país orienta não incluir, a foto é desativada (a imagem continua guardada)
        if (R.photoPolicy(code).policy === 'avoid') d.design.showPhoto = false;
      }, { structural: true });
      return result;
    },

    /** Troca o idioma do documento. retitle: traduz os títulos ainda padrão. */
    setLocale: function (locale, opts) {
      opts = opts || {};
      if (!CM.i18n.has(locale)) return null;
      var result = { changed: 0, kept: [] };
      update(function (d) {
        if (opts.retitle !== false) result = CM.l10n.retitleSections(d, d.locale, locale);
        d.locale = locale;
      }, { structural: true });
      return result;
    },

    /** Atualiza todos os títulos que coincidem com o padrão de QUALQUER idioma para o idioma atual. */
    retitleAll: function () {
      var count = 0;
      update(function (d) {
        d.sections.forEach(function (s) {
          if (!s.titleKey) return;
          var cur = String(s.title || '').trim();
          var target = CM.l10n.sectionTitle(s.titleKey, d.locale);
          if (!target || cur === target) return;
          var isDefaultSomewhere = !cur || CM.i18n.codes().some(function (c) { return CM.l10n.sectionTitle(s.titleKey, c) === cur; });
          if (isDefaultSomewhere) { s.title = target; count++; }
        });
      }, { structural: true });
      return count;
    },

    setRegion: function (region) {
      update(function (d) { d.region = region || ''; }, { structural: false });
    },

    setPaper: function (paper) {
      update(function (d) { d.design.paper = paper === 'Letter' ? 'Letter' : 'A4'; }, { structural: false });
    },

    /** Foto (data URL já validada e reduzida). '' remove a foto. */
    setPhoto: function (dataUrl) {
      var safe = dataUrl ? CM.validation.safePhoto(dataUrl) : '';
      if (dataUrl && !safe) return false;
      update(function (d) {
        d.personal.photo = safe;
        d.design.showPhoto = !!safe;
      }, { structural: false });
      return true;
    },

    /* ---------------- Documentos complementares ---------------- */
    addCompanion: function (data) {
      var c = CM.validation.sanitizeCompanion(Object.assign({ id: U.uid('cmp'), createdAt: Date.now(), updatedAt: Date.now() }, data || {}));
      update(function (d) { d.companions = d.companions || []; d.companions.push(c); }, { structural: true });
      return c.id;
    },
    updateCompanion: function (id, key, value) {
      update(function (d) {
        var c = (d.companions || []).filter(function (x) { return x.id === id; })[0];
        if (!c) return;
        if (key.indexOf('recipient.') === 0) c.recipient[key.slice(10)] = value;
        else c[key] = value;
        c.updatedAt = Date.now();
      }, { coalesce: 'c:' + id + ':' + key });
    },
    removeCompanion: function (id) {
      update(function (d) { d.companions = (d.companions || []).filter(function (x) { return x.id !== id; }); }, { structural: true });
    },

    /* ---------------- Vaga (analisador local) ---------------- */
    setJob: function (job) {
      update(function (d) { d.job = job ? CM.validation.sanitizeJob(job) : null; }, { structural: false, coalesce: 'job' });
    },
    setKeywordStatus: function (term, status, edit) {
      update(function (d) {
        if (!d.job) return;
        d.job.keywords.forEach(function (k) {
          if (k.term === term) { k.status = status; if (edit != null) k.edit = String(edit).slice(0, 80); }
        });
      }, { structural: false });
    }
  };

  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  CM.state = {
    open: open,
    close: close,
    flush: flush,
    saveNow: saveNow,
    update: update,
    undo: undo,
    redo: redo,
    on: on,
    actions: actions,
    findSection: function (sid) { return doc ? findSection(doc, sid) : null; },
    findItem: function (sid, iid) { return doc ? findItem(findSection(doc, sid), iid) : null; },
    get doc() { return doc; },
    get status() { return status; },
    canUndo: function () { return past.length > 0; },
    canRedo: function () { return future.length > 0; }
  };
})();
