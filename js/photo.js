/* ==========================================================================
   CM Studio — photo.js
   Foto OPCIONAL do currículo. A imagem é lida localmente, reduzida no
   navegador (máx. 360 × 480 px, JPEG) e guardada apenas no próprio documento,
   no armazenamento local. Nada é enviado pela internet.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  var ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
  var MAX_INPUT_BYTES = 10 * 1024 * 1024;
  var MAX_W = 360, MAX_H = 480;

  /** Lê, valida e reduz a imagem. Resolve com data URL JPEG ou rejeita com mensagem. */
  function processFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('Nenhum arquivo selecionado.')); return; }
      if (ACCEPT.indexOf(file.type) === -1) { reject(new Error('Formato não aceito. Use JPG, PNG ou WebP.')); return; }
      if (file.size > MAX_INPUT_BYTES) { reject(new Error('A imagem tem mais de 10 MB. Escolha um arquivo menor.')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Não foi possível ler a imagem.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('O arquivo não parece ser uma imagem válida.')); };
        img.onload = function () {
          // Recorte central na proporção 3:4 (retrato), comum em fotos de currículo
          var targetRatio = 3 / 4;
          var sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
          if (sw / sh > targetRatio) { var nw = sh * targetRatio; sx = (sw - nw) / 2; sw = nw; }
          else { var nh = sw / targetRatio; sy = (sh - nh) / 2; sh = nh; }
          var scale = Math.min(1, MAX_W / sw, MAX_H / sh);
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(sw * scale));
          canvas.height = Math.max(1, Math.round(sh * scale));
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          var q = 0.86, url = canvas.toDataURL('image/jpeg', q);
          while (url.length > 580000 && q > 0.4) { q -= 0.1; url = canvas.toDataURL('image/jpeg', q); }
          if (!CM.validation.safePhoto(url)) { reject(new Error('Não foi possível reduzir a imagem a um tamanho seguro.')); return; }
          resolve(url);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Bloco de controle da foto para o editor (dados pessoais). */
  function control(doc, onChange) {
    var R = CM.countryRules;
    var pol = R.photoPolicy(doc.country);
    var prof = CM.countries.get(doc.country);
    var tpl = CM.templates.get(doc.template);
    var has = !!doc.personal.photo;
    var input = el('input', { type: 'file', id: 'photo-input', class: 'visually-hidden-input', attrs: { accept: ACCEPT.join(','), 'aria-label': 'Escolher foto' } });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      processFile(f).then(function (url) {
        if (CM.state.actions.setPhoto(url)) {
          CM.ui.toast('Foto adicionada (reduzida e guardada só neste navegador).', { type: 'success' });
          if (onChange) onChange();
        }
      }, function (err) { CM.ui.toast(err.message, { type: 'error' }); });
    });

    var thumb = el('div', { class: 'photo-thumb' + (has ? '' : ' is-empty'), attrs: { 'aria-hidden': 'true' } });
    if (has) thumb.appendChild(el('img', { attrs: { src: doc.personal.photo, alt: '' } }));
    else thumb.appendChild(U.icon('user'));

    var show = el('input', { type: 'checkbox', id: 'photo-show' });
    show.checked = !!doc.design.showPhoto && has;
    show.disabled = !has;
    show.addEventListener('change', function () { CM.state.actions.setDesign('showPhoto', show.checked); if (onChange) onChange(); });

    var tone = pol.policy === 'avoid' ? 'warn' : pol.policy === 'unverified' ? 'muted' : 'accent';
    return el('div', { class: 'photo-block' }, [
      el('div', { class: 'photo-head' }, [
        el('strong', { text: 'Foto (opcional)' }),
        el('span', { class: 'badge badge--' + tone, text: R.photoLabel(doc.country) })
      ]),
      el('p', { class: 'field-help', text: (pol.note || '') + ' Para ' + prof.name + ', a foto nunca é obrigatória no CM Studio.' }),
      el('div', { class: 'photo-row' }, [
        thumb,
        el('div', { class: 'photo-actions' }, [
          input,
          el('label', { class: 'btn btn--secondary btn--sm', attrs: { for: 'photo-input', tabindex: '0', role: 'button', 'data-focus-key': 'photo-pick' },
            on: { keydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } } } },
            [U.icon('upload'), has ? 'Trocar foto' : 'Escolher foto']),
          has ? el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Remover foto',
            on: { click: function () { CM.state.actions.setPhoto(''); if (onChange) onChange(); } } }) : null,
          el('label', { class: 'check', attrs: { for: 'photo-show' } }, [show, el('span', { text: 'Mostrar a foto no currículo' })]),
          !tpl.photoSlot ? el('p', { class: 'field-help', text: 'O modelo atual não exibe foto. Modelos com espaço para foto: Lebenslauf, Estilo Europass e 履歴書.' }) : null
        ])
      ]),
      el('p', { class: 'field-help', text: 'A imagem é reduzida no seu navegador e não é enviada para nenhum servidor.' })
    ]);
  }

  CM.photo = { processFile: processFile, control: control };
})();
