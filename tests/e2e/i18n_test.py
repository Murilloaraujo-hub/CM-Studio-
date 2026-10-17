"""
CM Studio — teste ponta a ponta do IDIOMA DA INTERFACE (opcional, para desenvolvedores).

Requisitos: Python 3.9+ e Playwright (pip install playwright; python -m playwright install chromium)
Execução, a partir da pasta do projeto:
    python tests/e2e/i18n_test.py

O que verifica:
  - idioma padrão por país (BR, US, UK, DE, FR, PT, JP, ES, IT, NL) no modo automático;
  - interface inteira traduzida: página inicial, assistente (4 etapas), editor (5 abas),
    biblioteca, configurações, ajuda, diálogos, avisos (toasts), textos de acessibilidade
    (aria-label, title, placeholder, alt) e título da página;
  - "sobras" em português: (1) texto-fonte exibido sem tradução quando existe tradução;
    (2) heurística de palavras/grafias exclusivas do português;
  - modo manual (troca de país não muda a interface) e modo automático (ressincroniza);
  - persistência após recarregar; troca de idioma não altera regras nem o documento;
  - plurais, datas no formato local, html lang, fallback sem chaves técnicas.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "index.html").as_uri()
MSGS = [m["id"] for m in json.loads((ROOT / "docs/i18n/messages.json").read_text("utf-8"))["messages"]]

passed, failed = [], []


def check(cond, name, detail=""):
    (passed if cond else failed).append(name + ("" if cond else f" -> {detail}"))
    print(("  OK   " if cond else "  FALHA ") + name + ("" if cond else f" -> {str(detail)[:600]}"))


# Coleta textos visíveis da interface (exclui conteúdo do documento e nomes de idioma).
COLLECT_JS = r"""
(msgs) => {
  const cur = document.documentElement.lang;
  const skipSel = '.page, .tpl-thumb, .rs-page, script, style, svg, noscript, [data-i18n-skip], .ui-lang-select, #set-ui-locale, #new-locale, .user-content, [data-user-content], input, textarea';
  const allow = new Set();
  CM.countries.list().forEach(p => { if (p.nameLocal) allow.add(p.nameLocal); });
  CM.uiLang.codes().forEach(c => allow.add(CM.uiLang.endonym(c)));
  CM.storage.listDocs().forEach(d => allow.add(d.name));
  if (CM.state.doc) {
    CM.state.doc.sections.forEach(s => allow.add(s.title));
    allow.add(CM.state.doc.name);
  }
  const foreignLang = el => { const l = el.closest('[lang]'); return l && l !== document.documentElement && l.getAttribute('lang').slice(0, 2) !== cur.slice(0, 2); };
  const visible = el => {
    if (el.closest('[hidden]')) return false;
    const cs = getComputedStyle(el);
    return !(cs.display === 'none' || cs.visibility === 'hidden') || !!el.closest('.sr-only');
  };
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue.trim();
    if (!t || !/\p{L}{2,}/u.test(t)) continue;
    const el = n.parentElement;
    if (!el || el.closest(skipSel) || foreignLang(el) || !visible(el) || allow.has(t)) continue;
    out.push(t);
  }
  document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(e => {
    if (e.closest('.page, .tpl-thumb, .rs-page, [data-i18n-skip], .ui-lang-select') || e.closest('[hidden]') || foreignLang(e)) return;
    ['aria-label', 'title', 'placeholder', 'alt'].forEach(a => {
      const v = (e.getAttribute(a) || '').trim();
      if (v && /\p{L}{2,}/u.test(v) && !allow.has(v)) out.push(v);
    });
  });
  out.push(document.title);
  // (1) texto-fonte em português exibido, embora exista tradução para o idioma ativo
  // (um texto que também é a TRADUÇÃO de outra mensagem não conta: ex. "Carta" = papel em italiano)
  const set = new Set(msgs);
  const values = new Set(msgs.map(m => CM.t(m)));
  const exact = [...new Set(out.filter(t => set.has(t) && CM.t(t) !== t && !values.has(t)))];
  return { texts: [...new Set(out)], exact: exact };
}
"""

# (2) grafias/palavras que só existem em português (não aparecem em en/de/fr/es/it/nl/ja)
PT_ONLY = re.compile(r"[ãõÃÕ]|\bvocê\b|\bcurrículos?\b|\bseções?\b|\bconfigurações\b|\bnão\b", re.I)
TECH_KEY = re.compile(r"^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+){1,}$")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1366, "height": 900})
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)

        async def go(h, wait=300):
            await page.evaluate(f"location.hash = '{h}'; 0")
            await page.wait_for_timeout(wait)

        leftovers = {}

        async def scan(label):
            await page.wait_for_timeout(200)
            r = await page.evaluate(COLLECT_JS, MSGS)
            lang = await page.evaluate("document.documentElement.lang")
            bad = list(r["exact"])
            if not lang.startswith("pt"):
                bad += [t for t in r["texts"] if PT_ONLY.search(t)]
            bad += [t for t in r["texts"] if TECH_KEY.match(t)]
            for t in bad:
                leftovers.setdefault(t[:140], label)
            return r

        print("\n[1] Primeira visita: Brasil → português do Brasil")
        await page.goto(URL)
        await page.evaluate("localStorage.clear()")
        await page.reload()
        await page.wait_for_function("document.documentElement.classList.contains('is-ready')")
        check(await page.evaluate("document.documentElement.lang") == "pt-BR", "html lang = pt-BR na primeira visita")
        check(await page.evaluate("CM.uiLanguage.mode()") == "auto", "modo automático por padrão")
        check(await page.locator("#ui-lang-select").count() == 1, "seletor de idioma visível no cabeçalho")
        await page.evaluate("CM.storage.saveSettings(Object.assign(CM.storage.getSettings(), {printTipSeen: true})); 0")

        # país → (idioma esperado, palavra que deve aparecer na navegação/página inicial)
        cases = [
            ("US", "en-US", "My résumés"),
            ("UK", "en-GB", "My CVs"),
            ("DE", "de-DE", "Meine Lebensläufe"),
            ("FR", "fr-FR", "Mes CV"),
            ("PT", "pt-PT", "Definições"),
            ("JP", "ja-JP", "設定"),
            ("ES", "es-ES", "Mis CV"),
            ("IT", "it-IT", "I miei CV"),
            ("NL", "nl-NL", "Mijn cv's"),
        ]
        for code, lang, word in cases:
            print(f"\n[2] {code}: modo automático → {lang}, interface inteira sem sobras")
            await go("#/novo")
            await expect(page.locator("#new-step-1")).to_be_visible()
            await page.click(f'label[for="nc-opt-{code}"]')
            await page.wait_for_timeout(300)
            check(await page.evaluate("document.documentElement.lang") == lang, f"{code}: interface em {lang} logo após escolher o país")
            toast = await page.locator(".toast").last.text_content() if await page.locator(".toast").count() else ""
            check(bool(toast) and not PT_ONLY.search(toast or "") or lang.startswith("pt"), f"{code}: aviso de troca de idioma no novo idioma", toast)
            await scan(f"{code}/assistente-1")
            for step in (2, 3, 4):
                await page.click("#new-next")
                await page.wait_for_timeout(250)
                await scan(f"{code}/assistente-{step}")
            await page.fill("#new-name", f"Doc {code}")
            await page.click("#new-submit")
            await expect(page.locator("#view-editor")).to_be_visible()
            await page.wait_for_timeout(400)
            await scan(f"{code}/editor-conteudo")
            for tab in ["design", "review", "job", "letters"]:
                await page.click(f"#tab-{tab}")
                await page.wait_for_timeout(250)
                await scan(f"{code}/editor-{tab}")
            await page.click("#tab-content")
            # diálogo: excluir seção (cancelado)
            btn = page.locator('[data-focus-key^="delete:"], button.section-delete, .section-actions button').last
            dialogs = 0
            try:
                await page.locator('.section-head button[aria-label]').last.click(timeout=1500)
                await page.wait_for_timeout(250)
                if await page.locator("dialog[open]").count():
                    dialogs += 1
                    await scan(f"{code}/dialogo-secao")
                    await page.keyboard.press("Escape")
            except Exception:
                pass
            # diálogo de impressão
            await page.evaluate("CM.storage.saveSettings(Object.assign(CM.storage.getSettings(), {printTipSeen: false})); 0")
            await page.evaluate("window.print = () => {}; 0")
            await page.click("#btn-print")
            await page.wait_for_timeout(300)
            if await page.locator("dialog[open]").count():
                dialogs += 1
                await scan(f"{code}/dialogo-impressao")
                await page.keyboard.press("Escape")
            await page.evaluate("CM.storage.saveSettings(Object.assign(CM.storage.getSettings(), {printTipSeen: true})); 0")
            check(dialogs >= 1, f"{code}: diálogos verificados ({dialogs})")
            for route, label in [("#/inicio", "inicio"), ("#/biblioteca", "biblioteca"), ("#/configuracoes", "configuracoes"), ("#/ajuda", "ajuda"), ("#/nao-existe", "nao-encontrada")]:
                await go(route)
                await scan(f"{code}/{label}")
            await go("#/biblioteca")
            # diálogo: excluir currículo (cancelado)
            await page.locator(".doc-row button[aria-label]").last.click()
            await page.wait_for_timeout(250)
            if await page.locator("dialog[open]").count():
                await scan(f"{code}/dialogo-biblioteca")
                await page.keyboard.press("Escape")
            await go("#/inicio")
            body = await page.locator("body").text_content()
            check(word in body, f"{code}: termo esperado na interface ({word})")
            title = await page.title()
            check(not PT_ONLY.search(title) or lang.startswith("pt"), f"{code}: título da página traduzido ({title})")
            mine = {k: v for k, v in leftovers.items() if v.startswith(code + "/")}
            check(not mine, f"{code}: nenhuma sobra em português nem chave técnica", list(mine.items())[:15])

        print("\n[2b] Fluxos internos (exemplos, assistente, vaga, cartas, perfis) em ja-JP, de-DE e fr-FR")
        job_text = {"ja-JP": "経理の経験、Excel、SAP、チームワーク、顧客対応。日本語ビジネスレベル、英語 TOEIC 800 点以上。",
                    "de-DE": "Wir suchen eine Fachkraft mit Erfahrung in Buchhaltung, SAP, Excel und Teamarbeit. Deutschkenntnisse C1 und Englisch B2.",
                    "fr-FR": "Nous recherchons une personne expérimentée en comptabilité, SAP, Excel et travail en équipe. Anglais B2 requis."}
        for lang, doc in [("ja-JP", "Doc JP"), ("de-DE", "Doc DE"), ("fr-FR", "Doc FR")]:
            await page.evaluate(f"CM.uiLanguage.setManual('{lang}'); 0")
            await go("#/biblioteca")
            await page.locator(f'.doc-row:has-text("{doc}") .doc-main').click()
            await expect(page.locator("#view-editor")).to_be_visible()
            await page.wait_for_timeout(300)
            tag = lang[:2].upper() + "+"
            opened = []

            async def try_dialog(selector, label):
                try:
                    await page.locator(selector).first.click(timeout=2000)
                    await page.wait_for_timeout(350)
                    await scan(f"{tag}/{label}")
                    opened.append(label)
                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(200)
                except Exception:
                    pass

            ex = await page.evaluate("CM.t('Ver exemplos')")
            await try_dialog(f'button:has-text("{ex}")', "exemplos")
            # assistente de conquista: existe em itens de experiência/projetos → adiciona um item antes
            add = await page.evaluate("CM.t('Adicionar item')")
            try:
                await page.locator(f'button:has-text("{add}"):visible').first.click(timeout=2000)
                await page.wait_for_timeout(300)
            except Exception:
                pass
            await try_dialog('[data-focus-key^="wa:"]', "assistente-conquista")
            ct = await page.evaluate("CM.t('Trocar finalidade')")
            await try_dialog(f'button:has-text("{ct}")', "trocar-finalidade")
            await try_dialog(".ctx-bar button, [data-ctx], .context-chip", "contexto")
            await page.click("#tab-job")
            await page.wait_for_timeout(250)
            await page.fill("#panel-job textarea", job_text[lang])
            an = await page.evaluate("CM.t('Analisar localmente')")
            await page.locator(f'#panel-job button:has-text("{an}")').click()
            await page.wait_for_timeout(600)
            await scan(f"{tag}/vaga-resultado")
            opened.append("vaga")
            await page.click("#tab-letters")
            await page.wait_for_timeout(250)
            try:
                await page.locator("#panel-letters [data-create-kind]").first.click(timeout=2000)
                await page.wait_for_timeout(500)
                await scan(f"{tag}/carta")
                opened.append("carta")
            except Exception:
                pass
            await go("#/ajuda/paises", 400)
            for c in ["JP", "DE", "US", "NL"]:
                await try_dialog(f"#help-country-table [data-country-info='{c}']", f"perfil-{c}")
            await go("#/configuracoes")
            await try_dialog("#set-clear", "apagar-tudo")
            mine = {k: v for k, v in leftovers.items() if v.startswith(tag)}
            check(len(opened) >= 8 and not mine, f"{lang}: fluxos internos sem sobras ({len(opened)} telas: {', '.join(opened)})", list(mine.items())[:15])

        print("\n[3] Formatos locais e plurais")
        await page.evaluate("CM.uiLanguage.setManual('de-DE'); 0")
        await go("#/biblioteca")
        lib = await page.locator("#view-library").text_content()
        check(re.search(r"\d{2}\.\d{2}\.\d{4}", lib) is not None, "data no formato alemão (dd.mm.aaaa) na biblioteca")
        await page.evaluate("CM.uiLanguage.setManual('ja-JP'); 0")
        await page.wait_for_timeout(200)
        pl = await page.evaluate("CM.utils.plural(3, 'currículo', 'currículos')")
        check(pl == "3件の履歴書", f"plural em japonês com contador colado ao número ({pl})")
        await page.evaluate("CM.uiLanguage.setManual('en-US'); 0")
        p1 = await page.evaluate("CM.utils.plural(1, 'fonte', 'fontes')")
        p2 = await page.evaluate("CM.utils.plural(2, 'fonte', 'fontes')")
        check(p1 == "1 source" and p2 == "2 sources", f"plural em inglês ({p1} / {p2})")
        await page.evaluate("CM.uiLanguage.setManual('fr-FR'); 0")
        n = await page.evaluate("CM.uiLang.formatNumber(1234.5)")
        check("234,5" in n, f"número no formato francês ({n})")

        print("\n[4] Modo manual: trocar de país NÃO muda a interface")
        await page.select_option("#ui-lang-select", "en-GB")
        await page.wait_for_timeout(250)
        check(await page.evaluate("document.documentElement.lang") == "en-GB", "seletor do cabeçalho aplica en-GB sem recarregar")
        check(await page.evaluate("CM.uiLanguage.mode()") == "manual", "escolha no cabeçalho ativa o modo manual")
        await go("#/novo")
        await page.click('label[for="nc-opt-DE"]')
        await page.wait_for_timeout(300)
        check(await page.evaluate("document.documentElement.lang") == "en-GB", "país Alemanha escolhido; interface continua en-GB")
        t = await page.locator(".toast").last.text_content() if await page.locator(".toast").count() else ""
        check("Deutsch" in (t or ""), "aviso oferece o idioma do país (Deutsch)", t)
        await page.reload()
        await page.wait_for_function("document.documentElement.classList.contains('is-ready')")
        check(await page.evaluate("document.documentElement.lang") == "en-GB", "idioma manual persiste após recarregar")

        print("\n[5] Modo automático: ressincroniza com o país")
        await go("#/configuracoes")
        check(await page.locator("#settings-language").is_visible(), "cartão de idioma nas Configurações")
        await page.click('label[for="ui-lang-auto"]')
        await page.wait_for_timeout(300)
        lang_auto = await page.evaluate("document.documentElement.lang")
        exp = await page.evaluate("CM.uiLanguage.forCountry((CM.storage.getSettings().lastCountry || 'BR'), '')")
        check(await page.evaluate("CM.uiLanguage.mode()") == "auto" and lang_auto == exp, f"modo automático aplica o idioma do país de referência ({lang_auto})")
        check(await page.evaluate("CM.uiLanguage.forCountry('CH', 'fr')") == "fr-CH" and await page.evaluate("CM.uiLanguage.forCountry('CH', 'it')") == "it-CH" and await page.evaluate("CM.uiLanguage.forCountry('CA', '')") == "en-CA",
              "Suíça por região (fr-CH, it-CH) e Canadá (en-CA)")
        check(await page.evaluate("CM.uiLanguage.forCountry('XX', '')") is None, "'Outros países' mantém o idioma atual")

        print("\n[6] Trocar o idioma da interface não altera regras nem o documento")
        await go("#/biblioteca")
        await page.locator('.doc-row:has-text("Doc DE") .doc-main').click()
        await expect(page.locator("#view-editor")).to_be_visible()
        await page.wait_for_timeout(300)
        await page.fill('[data-path="p:fullName"]', "Erika Mustermann")
        await page.wait_for_timeout(600)
        # Dicas de tela vazia (.is-placeholder) são orientações da interface e nunca são impressas
        prev_expr = """(() => { const c = document.querySelector('#preview-stage').cloneNode(true); c.querySelectorAll('.is-placeholder').forEach(n => n.remove()); return c.textContent; })()"""
        before = await page.evaluate("JSON.stringify({d: CM.state.doc, paper: CM.countryRules.paperFor('DE'), langs: CM.countryRules.languagesFor('DE'), photo: CM.countryRules.photoLabel ? 1 : 0})")
        prev_before = await page.evaluate(prev_expr)
        for code in ["ja-JP", "fr-FR", "pt-BR"]:
            await page.select_option("#ui-lang-select", code)
            await page.wait_for_timeout(300)
        after = await page.evaluate("JSON.stringify({d: CM.state.doc, paper: CM.countryRules.paperFor('DE'), langs: CM.countryRules.languagesFor('DE'), photo: CM.countryRules.photoLabel ? 1 : 0})")
        await page.wait_for_timeout(400)
        prev_after = await page.evaluate(prev_expr)
        b, a = json.loads(before), json.loads(after)
        b["d"].pop("updatedAt", None); a["d"].pop("updatedAt", None)
        check(a == b, "documento, papel e idiomas do país iguais após 3 trocas de idioma")
        check(prev_before == prev_after and "Erika Mustermann" in prev_after, "pré-visualização (conteúdo do documento) não muda com o idioma da interface")
        check(a["d"]["locale"] == "de-DE", "idioma do documento continua de-DE")

        print("\n[7] Fallback, cobertura e ajuda")
        await page.select_option("#ui-lang-select", "es-ES")
        await page.wait_for_timeout(300)
        await go("#/ajuda/idiomas", 500)
        rows = await page.locator("#help-lang-table tbody tr").count()
        codes = await page.evaluate("CM.uiLang.codes().length")
        check(rows == codes and rows >= 18, f"tabela de idiomas na ajuda ({rows} linhas)")
        es_row = await page.locator('#help-lang-table tr[data-ui-lang-row="es-ES"]').text_content()
        de_row = await page.locator('#help-lang-table tr[data-ui-lang-row="de-DE"]').text_content()
        check("parcial" in es_row.lower() and "1536" not in es_row.split("de")[0], f"es-ES declarado como parcial ({es_row})")
        check("Completo" in de_row, f"de-DE declarado como completo ({de_row})")
        opt = await page.locator('#ui-lang-select option[value="nl-NL"]').text_content()
        check("—" in opt, f"seletor indica tradução parcial ({opt})")
        r = await scan("ES/ajuda-fallback")
        check(not [t for t in r["texts"] if TECH_KEY.match(t)], "nenhuma chave técnica exibida no idioma parcial")
        check(not [t for t in r["texts"] if PT_ONLY.search(t)], "texto sem tradução cai no inglês, não no português")
        miss = await page.evaluate("CM.uiLang.t('Texto que não existe no catálogo {0}', ['X'])")
        check(miss == "Texto que não existe no catálogo X", "mensagem desconhecida mostra o texto legível (nunca uma chave)")

        print("\n[8] Atributos de idioma e acessibilidade")
        await page.select_option("#ui-lang-select", "ja-JP")
        await page.wait_for_timeout(300)
        check(await page.evaluate("document.documentElement.lang") == "ja-JP" and await page.evaluate("document.documentElement.dir") == "ltr", "html lang=ja-JP e dir=ltr")
        skip = await page.locator(".skip-link").first.text_content()
        check(skip.strip() == "コンテンツへスキップ" or not PT_ONLY.search(skip), f"link 'pular para o conteúdo' traduzido ({skip.strip()})")
        labels = await page.evaluate("[...document.querySelectorAll('header [aria-label]')].map(e => e.getAttribute('aria-label'))")
        check(labels and not [l for l in labels if PT_ONLY.search(l)], f"aria-labels do cabeçalho traduzidos ({labels[:4]})")
        await page.select_option("#ui-lang-select", "pt-BR")
        await page.wait_for_timeout(200)

        print("\n[9] Erros de JavaScript")
        check(not errors, "nenhum erro de JavaScript no console", errors[:5])
        await browser.close()

    print(f"\nResultado: {len(passed)} aprovados, {len(failed)} falhas")
    if leftovers:
        print("Sobras encontradas:")
        for t, l in leftovers.items():
            print(f"  [{l}] {t}")
    sys.exit(1 if failed else 0)


asyncio.run(main())
