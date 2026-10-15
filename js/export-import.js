/* ==========================================================================
   CM Studio — export-import.js
   Backups em JSON: exportação (de um currículo ou de todos), importação
   com validação, e escolha entre mesclar ou substituir os dados locais.
   O conteúdo importado é tratado apenas como dados: nada é executado.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  var FORMAT = 'cmstudio-backup';
  var VERSION = 1;
  var MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

  function buildBackup(docs) {
    return {
      app: 'CM Studio',
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      documents: docs.map(function (d) { return U.deepClone(d); })
    };
  }

  function exportDocuments(docs, filename) {
    if (!docs || !docs.length) {
      CM.ui.toast('Não há currículos para exportar.', { type: 'warning' });
      return false;
    }
    try {
      var json = JSON.stringify(buildBackup(docs), null, 2);
      U.downloadFile(filename || ('cm-studio-backup-' + U.todayStamp() + '.json'), json, 'application/json');
      CM.ui.toast(docs.length === 1 ? 'Backup do currículo exportado.' : 'Backup com ' + docs.length + ' currículos exportado.', { type: 'success' });
      return true;
    } catch (e) {
      CM.ui.toast('Não foi possível gerar o arquivo de backup.', { type: 'error' });
      return false;
    }
  }

  function loadAllDocs() {
    return CM.storage.listDocs().map(function (e) { return CM.storage.loadDoc(e.id); }).filter(Boolean);
  }

  function exportAll() {
    if (CM.state.doc) CM.state.saveNow();
    return exportDocuments(loadAllDocs(), 'cm-studio-backup-completo-' + U.todayStamp() + '.json');
  }

  /**
   * Interpreta o texto de um arquivo de backup.
   * Retorna { docs: [...], warnings: [...] } ou { error: 'mensagem' }.
   */
  function parseBackup(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { error: 'O arquivo não é um JSON válido. Verifique se escolheu um backup exportado pelo CM Studio.' };
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { error: 'O arquivo não tem o formato de backup do CM Studio.' };
    }
    if (data.format !== FORMAT) {
      return { error: 'Este arquivo não foi reconhecido como backup do CM Studio (campo "format" ausente ou diferente).' };
    }
    if (typeof data.version !== 'number' || data.version > VERSION) {
      return { error: 'Este backup foi criado por uma versão mais nova ou desconhecida do CM Studio.' };
    }
    if (!Array.isArray(data.documents)) {
      return { error: 'O backup não contém a lista de currículos.' };
    }
    var docs = [];
    var warnings = [];
    data.documents.slice(0, 500).forEach(function (raw, i) {
      var res = CM.validation.sanitizeDocument(raw);
      if (res.doc) docs.push(res.doc);
      else warnings.push('O currículo nº ' + (i + 1) + ' foi ignorado por estar inválido.');
      res.warnings.forEach(function (w) { if (warnings.indexOf(w) === -1) warnings.push(w); });
    });
    if (!docs.length) return { error: 'Nenhum currículo válido foi encontrado no arquivo.' };
    return { docs: docs, warnings: warnings };
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Nenhum arquivo selecionado.'));
      if (file.size > MAX_FILE_BYTES) return reject(new Error('O arquivo é grande demais (máximo de 5 MB).'));
      if (file.name && !/\.json$/i.test(file.name) && file.type && file.type.indexOf('json') === -1) {
        return reject(new Error('Selecione um arquivo .json exportado pelo CM Studio.'));
      }
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Não foi possível ler o arquivo.')); };
      reader.readAsText(file, 'utf-8');
    });
  }

  /** Aplica a importação. mode: 'merge' (adiciona) | 'replace' (substitui tudo). */
  function applyImport(docs, mode) {
    if (mode === 'replace') {
      var settings = CM.storage.getSettings();
      CM.storage.clearAll();
      settings.lastDocId = null;
      CM.storage.saveSettings(settings);
    }
    var existing = {};
    CM.storage.listDocs().forEach(function (e) { existing[e.id] = true; });
    var saved = 0;
    var failed = null;
    docs.forEach(function (d) {
      if (failed) return;
      var copy = U.deepClone(d);
      if (existing[copy.id]) {
        // Evita sobrescrever um currículo existente: cria um novo ID.
        copy.id = U.uid('doc');
        copy.name = copy.name + ' (importado)';
      }
      existing[copy.id] = true;
      var r = CM.storage.saveDoc(copy);
      if (r.ok) saved++; else failed = r.error;
    });
    return { saved: saved, error: failed };
  }

  /** Fluxo completo: escolhe arquivo -> valida -> pergunta modo -> importa. */
  function importFromFile(file, onDone) {
    readFile(file).then(function (text) {
      var res = parseBackup(text);
      if (res.error) {
        CM.ui.toast(res.error, { type: 'error' });
        return;
      }
      var count = res.docs.length;
      var currentCount = CM.storage.listDocs().length;
      var mode = 'merge';
      var radios = el('fieldset', { class: 'fieldset' }, [
        el('legend', { text: 'Como deseja importar?' }),
        radio('imp-merge', 'merge', true, 'Mesclar', 'Adiciona os currículos do arquivo aos que já existem. Nada é apagado.'),
        radio('imp-replace', 'replace', false, 'Substituir tudo', 'Apaga os ' + currentCount + ' currículo(s) atuais deste navegador e mantém apenas os do arquivo.')
      ]);
      function radio(id, value, checked, title, desc) {
        var input = el('input', { type: 'radio', id: id, attrs: { name: 'imp-mode', value: value } });
        input.checked = checked;
        input.addEventListener('change', function () { mode = value; });
        return el('label', { class: 'type-radio', attrs: { for: id } }, [input, el('span', { class: 'type-radio-text' }, [el('strong', { text: title }), el('span', { text: desc })])]);
      }
      var body = [
        el('p', { text: 'O arquivo contém ' + U.plural(count, 'currículo válido', 'currículos válidos') + ':' }),
        el('ul', { class: 'plain-list import-list' }, res.docs.slice(0, 8).map(function (d) { return el('li', { text: d.name }); })
          .concat(count > 8 ? [el('li', { text: '… e mais ' + (count - 8) })] : [])),
        res.warnings.length ? el('div', { class: 'callout callout--warn' }, [U.icon('alert'), el('ul', { class: 'plain-list' }, res.warnings.map(function (w) { return el('li', { text: w }); }))]) : null,
        currentCount ? radios : null
      ];
      return CM.ui.modal({
        title: 'Importar backup', body: body, size: 'lg',
        actions: [
          { label: 'Cancelar', value: null, variant: 'ghost' },
          { label: 'Importar', variant: 'primary', submit: true, value: function () { return currentCount ? mode : 'merge'; } }
        ]
      }).then(function (chosen) {
        if (!chosen) return;
        if (chosen === 'replace') {
          return CM.ui.confirm({
            title: 'Substituir todos os currículos?',
            message: 'Os currículos atuais deste navegador serão apagados. Recomendamos exportar um backup antes. Deseja continuar?',
            confirmLabel: 'Substituir', danger: true,
            body: el('button', {
              class: 'btn btn--secondary btn--sm', type: 'button', text: 'Exportar backup atual antes',
              on: { click: exportAll }
            })
          }).then(function (ok) { if (ok) finish('replace'); });
        }
        finish('merge');
      });
      function finish(m) {
        var r = applyImport(res.docs, m);
        if (r.error) CM.ui.toast('Importação parcial: ' + r.saved + ' salvo(s). ' + r.error.message, { type: 'error' });
        else CM.ui.toast(U.plural(r.saved, 'currículo importado', 'currículos importados') + ' com sucesso.', { type: 'success' });
        if (onDone) onDone(r);
      }
    }).catch(function (e) {
      CM.ui.toast(e.message || 'Não foi possível importar o arquivo.', { type: 'error' });
    });
  }

  /** Abre o seletor de arquivos do sistema. */
  function pickAndImport(onDone) {
    var input = el('input', { type: 'file', attrs: { accept: '.json,application/json' } });
    input.style.display = 'none';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.remove();
      if (f) importFromFile(f, onDone);
    });
    document.body.appendChild(input);
    input.click();
  }

  function duplicateDocument(doc) {
    var copy = U.deepClone(doc);
    copy.id = U.uid('doc');
    copy.name = (doc.name || 'Currículo') + ' (cópia)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    copy.sections.forEach(function (s) {
      s.id = U.uid('sec');
      (s.items || []).forEach(function (it) { it.id = U.uid('it'); });
    });
    var r = CM.storage.saveDoc(copy);
    if (!r.ok) {
      CM.ui.toast(r.error.message, { type: 'error' });
      return null;
    }
    return copy;
  }

  CM.exportImport = {
    FORMAT: FORMAT,
    buildBackup: buildBackup,
    exportDocuments: exportDocuments,
    exportAll: exportAll,
    parseBackup: parseBackup,
    applyImport: applyImport,
    importFromFile: importFromFile,
    pickAndImport: pickAndImport,
    duplicateDocument: duplicateDocument,
    loadAllDocs: loadAllDocs
  };
})();
