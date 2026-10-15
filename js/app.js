/* ==========================================================================
   CM Studio — app.js
   Ponto de entrada: tema, navegação por hash (#/rota) e inicialização.
   O roteamento por hash funciona tanto abrindo o arquivo localmente quanto
   no GitHub Pages (inclusive em subdiretórios), sem configuração de servidor.
   ========================================================================== */
(function () {
  'use strict';

  var CM = (window.CM = window.CM || {});
  var U = CM.utils;

  var currentView = null;
  var firstRoute = true;
  var mediaDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var TITLES = {
    home: 'CM Studio — Seu currículo, sua próxima oportunidade',
    new: 'Criar currículo — CM Studio',
    library: 'Meus currículos — CM Studio',
    editor: 'Editor — CM Studio',
    settings: 'Configurações — CM Studio',
    help: 'Central de ajuda — CM Studio',
    notfound: 'Página não encontrada — CM Studio'
  };

  /* ---------------- Tema ---------------- */
  function resolvedTheme() {
    var t = CM.storage.getSettings().theme || 'system';
    if (t === 'system') return mediaDark && mediaDark.matches ? 'dark' : 'light';
    return t;
  }

  function applyTheme() {
    var t = resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#14181c' : '#0f6b6f');
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var label = t === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  }

  function toggleTheme() {
    var next = resolvedTheme() === 'dark' ? 'light' : 'dark';
    var s = CM.storage.getSettings();
    s.theme = next;
    CM.storage.saveSettings(s);
    applyTheme();
    if (currentView === 'settings') CM.settings.render();
    CM.ui.announce(next === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado');
  }

  /* ---------------- Roteamento ---------------- */
  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var qIndex = raw.indexOf('?');
    var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var params = {};
    if (qIndex !== -1) {
      raw.slice(qIndex + 1).split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    var parts = path.split('/').filter(Boolean).map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    return { parts: parts, params: params };
  }

  function showView(name) {
    if (currentView === 'editor' && name !== 'editor') CM.editor.close();
    document.querySelectorAll('[data-view]').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });
    document.body.classList.toggle('is-editor', name === 'editor');
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    currentView = name;
    document.title = TITLES[name] || 'CM Studio';
    closeNav();
  }

  function focusHeading(name) {
    if (firstRoute) return; // não rouba o foco no primeiro carregamento
    var view = document.querySelector('[data-view="' + name + '"]');
    var h = view && view.querySelector('[data-view-heading]');
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }

  function route() {
    var r = parseHash();
    var section = r.parts[0] || 'inicio';
    var name;
    switch (section) {
      case 'inicio':
        name = 'home'; showView(name); CM.home.render(); window.scrollTo(0, 0); break;
      case 'novo':
        name = 'new'; showView(name); CM.newDocument.render(r.params); window.scrollTo(0, 0); break;
      case 'biblioteca':
        name = 'library'; showView(name); CM.library.render(); window.scrollTo(0, 0); break;
      case 'configuracoes':
        name = 'settings'; showView(name); CM.settings.render(); window.scrollTo(0, 0); break;
      case 'ajuda':
        name = 'help'; showView(name);
        if (r.parts[1]) {
          var target = document.getElementById('help-' + r.parts[1]);
          if (target) {
            setTimeout(function () {
              target.scrollIntoView({ block: 'start' });
              var h2 = target.querySelector('h2');
              if (h2) { h2.setAttribute('tabindex', '-1'); h2.focus({ preventScroll: true }); }
            }, 0);
            firstRoute = false;
            return;
          }
        }
        window.scrollTo(0, 0);
        break;
      case 'editor':
        var id = r.parts[1];
        if (id && CM.storage.hasDoc(id)) {
          name = 'editor';
          showView(name);
          if (!CM.editor.open(id)) {
            name = 'notfound'; showView(name);
          } else {
            document.title = (CM.state.doc.name || 'Currículo') + ' — CM Studio';
          }
        } else {
          name = 'notfound'; showView(name);
          document.getElementById('nf-text').textContent = 'Este currículo não foi encontrado neste navegador. Ele pode ter sido excluído ou criado em outro navegador/dispositivo.';
        }
        break;
      default:
        name = 'notfound'; showView(name);
        document.getElementById('nf-text').textContent = 'O endereço acessado não existe.';
    }
    focusHeading(name);
    firstRoute = false;
  }

  function refreshTitle() {
    if (currentView === 'editor' && CM.state.doc) document.title = (CM.state.doc.name || 'Currículo') + ' — CM Studio';
    else document.title = TITLES[currentView] || 'CM Studio';
  }

  /* ---------------- Menu no celular ---------------- */
  function closeNav() {
    var nav = document.getElementById('main-nav');
    var btn = document.getElementById('nav-toggle');
    if (!nav || !btn) return;
    nav.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
  }

  function toggleNav() {
    var nav = document.getElementById('main-nav');
    var btn = document.getElementById('nav-toggle');
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
  }

  /* ---------------- Outras abas ---------------- */
  function onStorage(e) {
    if (!e.key || e.key.indexOf(CM.storage.PREFIX) !== 0) return;
    if (currentView === 'library') CM.library.render();
    if (currentView === 'home') CM.home.render();
    var doc = CM.state.doc;
    if (currentView === 'editor' && doc && e.key === CM.storage.DOC_PREFIX + doc.id) {
      CM.ui.toast('Este currículo foi alterado em outra aba ou janela. Para evitar perda de dados, edite-o em apenas uma aba.', {
        type: 'warning', duration: 0,
        action: {
          label: 'Carregar versão mais recente',
          onClick: function () { CM.editor.open(doc.id); }
        }
      });
    }
    if (e.key === CM.storage.PREFIX + 'settings') applyTheme();
  }

  /* ---------------- Inicialização ---------------- */
  function init() {
    applyTheme();
    if (mediaDark) {
      var listener = function () { if ((CM.storage.getSettings().theme || 'system') === 'system') applyTheme(); };
      if (mediaDark.addEventListener) mediaDark.addEventListener('change', listener);
      else if (mediaDark.addListener) mediaDark.addListener(listener);
    }
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('nav-toggle').addEventListener('click', toggleNav);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('main-nav').classList.contains('is-open')) {
        closeNav();
        document.getElementById('nav-toggle').focus();
      }
    });
    if (!CM.storage.isPersistent()) document.getElementById('storage-banner').hidden = false;
    window.addEventListener('hashchange', route);
    window.addEventListener('storage', onStorage);
    route();
    document.documentElement.classList.add('is-ready');
  }

  CM.app = { applyTheme: applyTheme, refreshTitle: refreshTitle, route: route, version: '1.0.0' };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
