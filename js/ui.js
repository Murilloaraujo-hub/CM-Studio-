/* ==========================================================================
   CM Studio — ui.js
   Componentes de interface reutilizáveis: avisos (toasts), diálogos de
   confirmação e de entrada de texto. Usa o elemento nativo <dialog>, que
   já oferece foco preso no diálogo e fechamento com a tecla Esc.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;
  var el = U.el;

  /* ---------------- Toasts ---------------- */
  var ICONS = { success: 'check', error: 'alert', info: 'info', warning: 'alert' };

  function toast(message, opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var region = document.getElementById('toast-region');
    if (!region) return;
    var prefix = { success: 'Sucesso: ', error: 'Erro: ', warning: 'Atenção: ', info: '' }[type];
    var node = el('div', { class: 'toast toast--' + type, attrs: { role: type === 'error' ? 'alert' : 'status' } }, [
      U.icon(ICONS[type] || 'info'),
      el('p', { class: 'toast-msg' }, [el('span', { class: 'sr-only', text: prefix }), message])
    ]);
    if (opts.action && typeof opts.action.onClick === 'function') {
      node.appendChild(el('button', {
        class: 'toast-action', type: 'button', text: opts.action.label,
        on: { click: function () { opts.action.onClick(); dismiss(); } }
      }));
    }
    var close = U.iconButton('close', 'Fechar aviso', { class: 'toast-close', on: { click: function () { dismiss(); } } });
    node.appendChild(close);
    region.appendChild(node);
    // Mantém no máximo 3 avisos visíveis ao mesmo tempo
    var all = region.querySelectorAll('.toast:not(.is-leaving)');
    for (var i = 0; i < all.length - 3; i++) all[i].remove();
    var duration = opts.duration != null ? opts.duration : (type === 'error' ? 9000 : 3800);
    var timer = duration > 0 ? setTimeout(dismiss, duration) : null;
    function dismiss() {
      clearTimeout(timer);
      node.classList.add('is-leaving');
      setTimeout(function () { node.remove(); }, 200);
    }
    return dismiss;
  }

  /* ---------------- Diálogo genérico ---------------- */
  /**
   * modal({ title, description, body, actions:[{label, value, variant, autofocus}], size, onOpen })
   * Retorna uma Promise com o "value" do botão clicado (ou null ao cancelar).
   * Um action pode ter "validate: function(){ return true|false }".
   */
  function modal(opts) {
    return new Promise(function (resolve) {
      var titleId = U.uid('dlg-title');
      var descId = U.uid('dlg-desc');
      var dialog = el('dialog', {
        class: 'dialog' + (opts.size ? ' dialog--' + opts.size : ''),
        attrs: { 'aria-labelledby': titleId, 'aria-describedby': opts.description ? descId : null }
      });
      var form = el('form', { class: 'dialog-form', attrs: { method: 'dialog', novalidate: true } });
      var header = el('div', { class: 'dialog-header' }, [
        el('h2', { class: 'dialog-title', id: titleId, text: opts.title || '' }),
        U.iconButton('close', 'Fechar', { class: 'dialog-x', attrs: { value: '__cancel' }, on: { click: function () { finish(null); } } })
      ]);
      form.appendChild(header);
      var content = el('div', { class: 'dialog-body' });
      if (opts.description) content.appendChild(el('p', { class: 'dialog-desc', id: descId, text: opts.description }));
      if (opts.body) U.appendChildren(content, opts.body);
      form.appendChild(content);

      var footer = el('div', { class: 'dialog-footer' });
      (opts.actions || [{ label: 'Fechar', value: null, variant: 'ghost' }]).forEach(function (a) {
        var btn = el('button', {
          class: 'btn btn--' + (a.variant || 'ghost'),
          type: a.submit ? 'submit' : 'button',
          text: a.label,
          attrs: { autofocus: a.autofocus ? true : null }
        });
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (a.validate && !a.validate()) return;
          finish(typeof a.value === 'function' ? a.value() : a.value);
        });
        footer.appendChild(btn);
      });
      form.appendChild(footer);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var primary = (opts.actions || []).filter(function (a) { return a.submit; })[0];
        if (primary) {
          if (primary.validate && !primary.validate()) return;
          finish(typeof primary.value === 'function' ? primary.value() : primary.value);
        }
      });
      dialog.appendChild(form);

      var done = false;
      var previouslyFocused = document.activeElement;
      function finish(value) {
        if (done) return;
        done = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        if (previouslyFocused && previouslyFocused.focus && document.body.contains(previouslyFocused)) {
          try { previouslyFocused.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
        }
        resolve(value);
      }
      dialog.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      dialog.addEventListener('mousedown', function (e) {
        if (e.target === dialog) finish(null); // clique fora do conteúdo
      });

      document.body.appendChild(dialog);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      if (opts.onOpen) opts.onOpen(dialog, finish);
      var af = dialog.querySelector('[autofocus]');
      if (af) af.focus();
    });
  }

  function confirm(opts) {
    return modal({
      title: opts.title || 'Confirmar',
      description: opts.message,
      body: opts.body,
      actions: [
        { label: opts.cancelLabel || 'Cancelar', value: false, variant: 'ghost', autofocus: !!opts.danger },
        { label: opts.confirmLabel || 'Confirmar', value: true, variant: opts.danger ? 'danger' : 'primary', autofocus: !opts.danger, submit: true }
      ]
    }).then(function (v) { return v === true; });
  }

  function prompt(opts) {
    var inputId = U.uid('prompt');
    var errId = U.uid('prompt-err');
    var input = el('input', {
      class: 'input', id: inputId, type: 'text',
      attrs: { maxlength: opts.maxLength || 120, autocomplete: 'off', 'aria-describedby': errId, required: opts.required !== false }
    });
    input.value = opts.value || '';
    var err = el('p', { class: 'field-error', id: errId, attrs: { 'aria-live': 'polite' } });
    var body = el('div', { class: 'field' }, [el('label', { class: 'label', text: opts.label || 'Nome', attrs: { for: inputId } }), input, err]);
    return modal({
      title: opts.title,
      description: opts.message,
      body: body,
      onOpen: function () { input.focus(); input.select(); },
      actions: [
        { label: 'Cancelar', value: null, variant: 'ghost' },
        {
          label: opts.confirmLabel || 'Salvar', variant: 'primary', submit: true,
          validate: function () {
            if (opts.required !== false && U.isBlank(input.value)) {
              err.textContent = 'Preencha este campo.';
              input.setAttribute('aria-invalid', 'true');
              input.focus();
              return false;
            }
            return true;
          },
          value: function () { return input.value.trim(); }
        }
      ]
    });
  }

  /** Anuncia uma mensagem para leitores de tela sem exibir nada. */
  function announce(message) {
    var live = document.getElementById('sr-announcer');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = message; }, 50);
  }

  CM.ui = { toast: toast, modal: modal, confirm: confirm, prompt: prompt, announce: announce };
})();
