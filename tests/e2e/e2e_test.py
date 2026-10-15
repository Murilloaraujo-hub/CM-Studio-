"""
CM Studio — teste ponta a ponta (opcional, apenas para desenvolvedores).

O usuário comum NÃO precisa executar este arquivo. Ele simula uma pessoa
usando o aplicativo no navegador Chromium (cliques, digitação, diálogos,
download e upload de backup, impressão em PDF, celular e tema escuro).

Requisitos: Python 3.9+ e Playwright
    pip install playwright
    python -m playwright install chromium
    pip install pymupdf   (opcional: contagem de páginas do PDF)
Execução (a partir da pasta do projeto):
    python tests/e2e/e2e_test.py

Cobre os fluxos da Fase 1 (edição, biblioteca, backup, impressão, celular,
temas) e os fluxos da atualização internacional (país antes do editor,
finalidade, modelos por país, idioma, A4/Letter, analisador de vaga, cartas,
migração v1, rótulos de suporte, fontes, caminhos relativos e botões sem ação).
"""
import asyncio
import json
import os
import re
import sys
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "index.html").as_uri()
OUT = Path(tempfile.gettempdir()) / "cm-studio-e2e"
OUT.mkdir(exist_ok=True)

passed, failed = [], []


def check(cond, name, detail=""):
    (passed if cond else failed).append(name + ("" if cond else f" -> {detail}"))
    print(("  OK   " if cond else "  FALHA ") + name + ("" if cond else f" -> {detail}"))


async def doc_state(page):
    return await page.evaluate("CM.state.doc ? JSON.parse(JSON.stringify(CM.state.doc)) : null")


async def section_id(page, kind):
    d = await doc_state(page)
    return next(s["id"] for s in d["sections"] if s["kind"] == kind)


async def expand(page, sid):
    toggle = page.locator(f'[data-focus-key="toggle:{sid}"]')
    if await toggle.get_attribute("aria-expanded") != "true":
        await toggle.click()


async def wizard(page, country="BR", purpose="professional", template=None, name=None, search=None):
    """Assistente de criação em 4 etapas: país -> finalidade -> modelo -> detalhes."""
    await page.goto(URL + "#/novo")
    await expect(page.locator("#new-step-1")).to_be_visible()
    if search:
        await page.fill("#nc-search", search)
        await page.wait_for_timeout(200)
    await page.click(f'label[for="nc-opt-{country}"]')
    await page.click("#new-next")
    await expect(page.locator("#new-step-2")).to_be_visible()
    await page.click(f'label[for="nt-{purpose}"]')
    await page.click("#new-next")
    await expect(page.locator("#new-step-3")).to_be_visible()
    if template:
        await page.click(f'label[for="ntpl-{template}"]')
    await page.click("#new-next")
    await expect(page.locator("#new-step-4")).to_be_visible()
    if name:
        await page.fill("#new-name", name)
    await page.click("#new-submit")
    await expect(page.locator("#view-editor")).to_be_visible()
    await page.wait_for_timeout(300)


def pdf_info(path):
    """Número de páginas e tamanho (pt) da 1ª página do PDF."""
    try:
        import pymupdf
        with pymupdf.open(str(path)) as d:
            r = d[0].rect
            return d.page_count, r.width, r.height
    except ImportError:
        b = Path(path).read_bytes()
        n = len(re.findall(rb"/Type\s*/Page[^s]", b))
        box = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)", b)
        return n, float(box.group(1)), float(box.group(2))


async def make_pdf(page, name):
    await page.emulate_media(media="print")
    path = OUT / name
    await page.pdf(path=str(path), prefer_css_page_size=True, print_background=True)
    await page.emulate_media(media="screen")
    return pdf_info(path)


async def preview_text(page):
    await page.wait_for_timeout(350)
    return await page.locator("#preview-stage").inner_text()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)

        print("\n[1] Página inicial")
        await page.goto(URL)
        await page.evaluate("localStorage.clear()")
        await page.reload()
        await expect(page.locator("#home-title")).to_be_visible()
        check(await page.title() == "CM Studio — Seu currículo, sua próxima oportunidade", "título da página")
        n_tpl = await page.evaluate("CM.templates.ids().length")
        check(n_tpl == 14 and await page.locator(".template-card").count() == n_tpl, f"galeria com {n_tpl} modelos")
        n_types = await page.locator("#home-types .type-card").count()
        check(n_types >= 11, f"{n_types} finalidades na página inicial")
        check(await page.locator(".thumb-frame .page").count() >= n_tpl, "miniaturas renderizadas")
        check(await page.locator("#home-countries .home-country").count() >= 9, "seção de países na página inicial")
        check(not await page.locator("#nav-toggle").is_visible(), "menu hambúrguer oculto no desktop")

        print("\n[2] Criar currículo profissional")
        await page.click(".hero-actions >> text=Criar currículo")
        await expect(page.locator("#new-title")).to_be_visible()
        check("Para qual país você deseja criar seu currículo?" in await page.locator("#new-country-title").text_content(), "país é a primeira pergunta")
        check(await page.locator("#nc-opt-BR").is_checked(), "Brasil é o padrão")
        await page.click("#new-next")
        await page.click('label[for="nt-professional"]')
        await page.click("#new-next")
        await expect(page.locator("#new-step-3")).to_be_visible()
        await page.wait_for_timeout(300)
        check(await page.locator("#new-tpl-preview .page").count() >= 1, "pré-visualização do modelo no assistente")
        await page.click("#new-next")
        await page.fill("#new-name", "Teste Profissional")
        await page.click("#new-submit")
        await expect(page.locator("#view-editor")).to_be_visible()
        d = await doc_state(page)
        check(d["type"] == "professional" and d["template"] == "corporate", "tipo e modelo recomendados")
        check(d["country"] == "BR" and d["locale"] == "pt-BR" and d["design"]["paper"] == "A4", "Brasil · pt-BR · A4")
        check(await page.locator("#doc-name").input_value() == "Teste Profissional", "nome do documento")

        print("\n[3] Edição de campos e pré-visualização em tempo real")
        await page.fill('[data-path="p:fullName"]', "Ana Teste Silva")
        await page.fill('[data-path="p:headline"]', "Analista de Testes")
        await page.fill('[data-path="p:email"]', "ana@invalido")
        await page.locator('[data-path="p:phone"]').focus()
        err = await page.locator("#f-p-email-err").inner_text()
        check("inválido" in err, "validação de e-mail inválido", err)
        await page.fill('[data-path="p:email"]', "ana@example.com")
        await page.fill('[data-path="p:phone"]', "(44) 99999-0000")
        await page.fill('[data-path="p:linkedin"]', "linkedin.com/in/ana-teste")
        await page.locator('[data-path="p:location"]').focus()
        check(await page.locator("#f-p-email-err").inner_text() == "", "erro some com e-mail válido")
        txt = await preview_text(page)
        check("Ana Teste Silva" in txt and "ana@example.com" in txt, "nome e e-mail na pré-visualização")
        link = await page.locator('#preview-stage a[href^="https://linkedin.com"]').count()
        check(link == 1, "LinkedIn normalizado como link https")

        sid_sum = await section_id(page, "summary")
        await expand(page, sid_sum)
        await page.fill(f'[data-path="s:{sid_sum}:content"]', "Profissional com experiência em testes de software.")
        check("experiência em testes" in await preview_text(page), "resumo na pré-visualização")

        print("\n[4] Itens: experiência, 'atual', adicionar/duplicar")
        sid_exp = await section_id(page, "experience")
        await expand(page, sid_exp)
        d = await doc_state(page)
        it = next(s for s in d["sections"] if s["id"] == sid_exp)["items"][0]["id"]
        await page.fill(f'[data-path="i:{sid_exp}:{it}:title"]', "Analista de QA")
        await page.fill(f'[data-path="i:{sid_exp}:{it}:org"]', "Empresa Fictícia")
        await page.fill(f'[data-path="i:{sid_exp}:{it}:start"]', "03/2022")
        await page.check(f'[data-path="i:{sid_exp}:{it}:current"]')
        check(await page.locator(f'[data-path="i:{sid_exp}:{it}:end"]').is_disabled(), "'Atual' desativa término")
        await page.fill(f'[data-path="i:{sid_exp}:{it}:description"]', "- Planejamento de testes\n- Automação de regressão")
        txt = await preview_text(page)
        check("03/2022 – Atual" in txt and "Automação de regressão" in txt, "item com período e tópicos")
        check(await page.locator("#preview-stage .r-ul li").count() >= 2, "tópicos viram lista")
        await page.click(f'[data-focus-key="add-item:{sid_exp}"]')
        d = await doc_state(page)
        items = next(s for s in d["sections"] if s["id"] == sid_exp)["items"]
        check(len(items) == 2, "adicionar item")
        await page.fill(f'[data-path="i:{sid_exp}:{items[1]["id"]}:title"]', "Estagiário")
        await page.fill(f'[data-path="i:{sid_exp}:{items[1]["id"]}:start"]', "2020")
        await page.fill(f'[data-path="i:{sid_exp}:{items[1]["id"]}:end"]', "2021")
        await page.click(f'[data-focus-key="it-dup:{items[1]["id"]}"]')
        d = await doc_state(page)
        check(len(next(s for s in d["sections"] if s["id"] == sid_exp)["items"]) == 3, "duplicar item")

        print("\n[5] Habilidades (lista) e sugestões")
        sid_sk = await section_id(page, "skills")
        await expand(page, sid_sk)
        await page.fill(f'[data-focus-key="tags:{sid_sk}"]', "Selenium, Cypress")
        await page.press(f'[data-focus-key="tags:{sid_sk}"]', "Enter")
        check(await page.locator(f'[data-card="{sid_sk}"] .tag-chip').count() == 2, "adicionar habilidades por vírgula")
        await page.locator(f'[data-card="{sid_sk}"] >> text=Ver sugestões').click()
        await page.locator("dialog[open] .chip-toggle").first.click()
        await page.locator("dialog[open] >> text=Concluir").click()
        check(await page.locator(f'[data-card="{sid_sk}"] .tag-chip').count() == 3, "sugestão de habilidade adicionada")
        await page.locator(f'[data-card="{sid_sum}"] >> text=Ver exemplos').click()
        await page.locator("dialog[open] >> text=Inserir no campo").first.click()
        val = await page.locator(f'[data-path="s:{sid_sum}:content"]').input_value()
        check("[" in val and "testes de software" in val, "exemplo de texto inserido sem apagar o existente")
        await page.wait_for_timeout(300)
        review = await page.locator("#panel-review").inner_text()
        check("colchetes" in review, "revisão avisa trechos entre colchetes")
        await page.fill(f'[data-path="s:{sid_sum}:content"]', "Profissional com experiência em testes de software.")

        print("\n[6] Seções: adicionar, mover, ocultar, excluir, desfazer")
        await page.click('[data-focus-key="add-section"]')
        await page.locator('dialog[open] .kind-option:has-text("Prêmios e reconhecimentos")').click()
        sid_aw = await section_id(page, "awards")
        check(await page.locator(f'[data-card="{sid_aw}"]').count() == 1, "adicionar seção")
        order_before = [s["kind"] for s in (await doc_state(page))["sections"]]
        await page.click(f'[data-focus-key="sec-down:{sid_sum}"]')
        order_after = [s["kind"] for s in (await doc_state(page))["sections"]]
        check(order_after.index("summary") == order_before.index("summary") + 1, "mover seção para baixo")
        await page.click(f'[data-focus-key="sec-up:{sid_sum}"]')
        await page.click(f'[data-focus-key="sec-vis:{sid_sk}"]')
        check("Selenium" not in await preview_text(page), "ocultar seção remove da pré-visualização")
        await page.click(f'[data-focus-key="sec-vis:{sid_sk}"]')
        check("Selenium" in await preview_text(page), "mostrar seção novamente")
        await page.locator(f'[data-card="{sid_aw}"] [aria-label^="Excluir seção"]').click()
        check(await page.locator(f'[data-card="{sid_aw}"]').count() == 0, "excluir seção vazia (sem confirmação)")
        await page.locator(f'[data-card="{sid_exp}"] [aria-label^="Excluir seção"]').click()
        check(await page.locator("dialog[open]").count() == 1, "confirmação ao excluir seção preenchida")
        await page.locator("dialog[open] >> text=Cancelar").click()
        check(await page.locator(f'[data-card="{sid_exp}"]').count() == 1, "cancelar mantém a seção")
        await page.locator(f'[data-card="{sid_exp}"] [aria-label^="Excluir seção"]').click()
        await page.locator('dialog[open] button:has-text("Excluir seção")').click()
        check(await page.locator(f'[data-card="{sid_exp}"]').count() == 0, "confirmar exclui a seção")
        await page.locator("body").press("Control+z")
        await page.wait_for_timeout(200)
        check(await page.locator(f'[data-card="{sid_exp}"]').count() == 1, "Ctrl+Z desfaz a exclusão")
        check("Analista de QA" in await preview_text(page), "conteúdo restaurado após desfazer")
        await page.click("#btn-redo")
        check(await page.locator(f'[data-card="{sid_exp}"]').count() == 0, "botão refazer")
        await page.click("#btn-undo")

        print("\n[7] Troca de modelos (dados preservados)")
        await page.click("#tab-design")
        await page.check("#opt-alltpl")
        await page.wait_for_timeout(200)
        for tpl in ["classic", "minimal", "corporate", "modern", "academic", "school", "firstJob", "ats", "academicExtended", "usResume", "lebenslauf", "europass", "jpShokumu", "jpRirekisho"]:
            await page.click(f'label[for="tpl-opt-{tpl}"]')
            await page.wait_for_timeout(250)
            ok = await page.locator(f"#preview-stage .tpl-{tpl}").count() == 1
            txt = await page.locator("#preview-stage").text_content()
            check(ok and "Ana Teste Silva" in txt and "Analista de QA" in txt, f"modelo {tpl} aplicado com dados")
            await page.locator("#preview-stage").screenshot(path=str(OUT / f"tpl-{tpl}.png"))
        await page.click('label[for="tpl-opt-modern"]')
        await page.wait_for_timeout(200)
        await page.click('label[for="seg-density-compact"]')
        await page.click('label[for="acc-blue"]')
        d = await doc_state(page)
        check(d["design"]["density"] == "compact" and d["design"]["accent"] == "blue", "opções de design salvas")

        print("\n[8] Salvamento automático e recuperação")
        await page.wait_for_timeout(900)
        status = await page.locator("#save-status").get_attribute("data-state")
        check(status == "saved", "status 'salvo' após edição", status)
        doc_id = d["id"]
        await page.reload()
        await page.wait_for_timeout(400)
        check(await page.locator('[data-path="p:fullName"]').input_value() == "Ana Teste Silva", "dados recuperados após recarregar")
        await page.screenshot(path=str(OUT / "editor-desktop.png"))

        print("\n[9] Tecla de navegação nas abas")
        await page.click("#tab-content")
        await page.locator("#tab-content").press("ArrowRight")
        check(await page.locator("#tab-design").get_attribute("aria-selected") == "true", "setas trocam a aba")
        await page.click("#tab-review")
        check(await page.locator("#panel-review").is_visible(), "painel de revisão")
        await page.click("#tab-content")

        print("\n[10] Impressão / PDF (A4)")
        pages_preview = await page.evaluate("CM.preview.render(CM.state.doc, null, {}).pages")
        await page.evaluate("window.__printed = 0; window.print = function () { window.__printed++; }; 0")
        await page.click("#btn-print")
        await expect(page.locator('dialog[open] >> text=Abrir impressão')).to_be_visible()
        check("A4" in await page.locator("dialog[open]").text_content(), "orientação de impressão cita o papel A4")
        await page.click('dialog[open] label[for="print-tip-dismiss"]')
        await page.locator('dialog[open] >> text=Abrir impressão').click()
        await page.wait_for_timeout(300)
        check(await page.evaluate("window.__printed") == 1, "botão Imprimir / Salvar como PDF aciona a impressão")
        check((await page.evaluate("document.title")).endswith("-curriculo"), "nome sugerido do arquivo em português")
        n_pdf, w, h = await make_pdf(page, "curriculo.pdf")
        check(n_pdf == pages_preview, f"PDF com {n_pdf} página(s) = pré-visualização ({pages_preview})")
        check(abs(w - 595.28) < 2 and abs(h - 841.89) < 2, f"página A4 no PDF ({w:.1f} x {h:.1f} pt)")
        await page.evaluate("CM.print.cleanup()")

        print("\n[11] Biblioteca: vários currículos")
        await wizard(page, "BR", "school")
        d2 = await doc_state(page)
        check(d2["type"] == "school" and d2["template"] == "school", "currículo escolar criado")
        kinds = [s["kind"] for s in d2["sections"]]
        check("experience" not in kinds and "scienceFairs" in kinds, "modo escolar sem experiência obrigatória")
        await page.fill('[data-path="p:fullName"]', "Estudante Teste")
        await page.wait_for_timeout(800)
        await page.goto(URL + "#/biblioteca")
        check(await page.locator(".doc-row").count() == 2, "biblioteca lista 2 currículos")
        a = await page.evaluate(f"CM.storage.loadDoc('{doc_id}').personal.fullName")
        check(a == "Ana Teste Silva", "documentos independentes (o 1º não mudou)")
        row = page.locator('.doc-row:has-text("Teste Profissional")')
        await row.locator('[aria-label^="Renomear"]').click()
        await page.locator("dialog[open] input").fill("Profissional Renomeado")
        await page.locator('dialog[open] button:has-text("Renomear")').click()
        check(await page.locator('.doc-row:has-text("Profissional Renomeado")').count() == 1, "renomear")
        await page.locator('.doc-row:has-text("Profissional Renomeado")').locator('[aria-label^="Duplicar"]').click()
        check(await page.locator(".doc-row").count() == 3, "duplicar")
        await page.fill("#lib-search", "cópia")
        await page.wait_for_timeout(250)
        check(await page.locator(".doc-row").count() == 1, "busca na biblioteca")
        await page.fill("#lib-search", "")
        await page.wait_for_timeout(250)
        await page.locator('.doc-row:has-text("(cópia)")').locator('[aria-label^="Excluir"]').click()
        await page.locator('dialog[open] button.btn--danger').click()
        check(await page.locator(".doc-row").count() == 2, "excluir com confirmação")

        print("\n[12] Exportar e importar backup")
        async with page.expect_download() as dl_info:
            await page.click("#lib-export")
        dl = await dl_info.value
        backup_path = OUT / "backup.json"
        await dl.save_as(str(backup_path))
        data = json.loads(backup_path.read_text("utf-8"))
        check(data.get("format") == "cmstudio-backup" and len(data["documents"]) == 2, "backup JSON exportado com 2 currículos")
        bad = OUT / "invalido.json"
        bad.write_text('{"isto": "não é um backup"}', "utf-8")
        async with page.expect_file_chooser() as fc_info:
            await page.click("#lib-import")
        fc = await fc_info.value
        await fc.set_files(str(bad))
        await page.wait_for_timeout(400)
        toast = await page.locator(".toast--error").last.inner_text()
        check("não foi reconhecido" in toast, "arquivo inválido gera mensagem clara", toast)
        broken = OUT / "quebrado.json"
        broken.write_text("{quebrado", "utf-8")
        async with page.expect_file_chooser() as fc_info:
            await page.click("#lib-import")
        await (await fc_info.value).set_files(str(broken))
        await page.wait_for_timeout(400)
        check("JSON válido" in await page.locator(".toast--error").last.inner_text(), "JSON corrompido tratado")
        async with page.expect_file_chooser() as fc_info:
            await page.click("#lib-import")
        await (await fc_info.value).set_files(str(backup_path))
        await expect(page.locator("dialog[open]")).to_be_visible()
        await page.locator('dialog[open] button:has-text("Importar")').click()
        await page.wait_for_timeout(300)
        check(await page.locator(".doc-row").count() == 4, "importar (mesclar) adiciona 2 currículos")
        async with page.expect_file_chooser() as fc_info:
            await page.click("#lib-import")
        await (await fc_info.value).set_files(str(backup_path))
        await page.click('dialog[open] label[for="imp-replace"]')
        await page.locator('dialog[open] button:has-text("Importar")').click()
        await expect(page.locator('dialog[open] button:has-text("Substituir")')).to_be_visible()
        await page.locator('dialog[open] button:has-text("Substituir")').click()
        await page.wait_for_timeout(300)
        check(await page.locator(".doc-row").count() == 2, "importar (substituir) com confirmação")

        print("\n[13] Modo acadêmico estendido")
        await wizard(page, "BR", "academicExtended")
        sid_pub = await section_id(page, "publications")
        await expand(page, sid_pub)
        d3 = await doc_state(page)
        pit = next(s for s in d3["sections"] if s["id"] == sid_pub)["items"][0]["id"]
        await page.fill(f'[data-path="i:{sid_pub}:{pit}:authors"]', "SILVA, A.")
        await page.fill(f'[data-path="i:{sid_pub}:{pit}:title"]', "Um estudo de caso")
        await page.fill(f'[data-path="i:{sid_pub}:{pit}:year"]', "2025")
        check("[1] SILVA, A." in await preview_text(page), "publicação numerada no modelo acadêmico estendido")

        print("\n[14] Celular (390 x 844)")
        # Mesma sessão (mesmo armazenamento local), janela com tamanho de celular
        mobile = await ctx.new_page()
        await mobile.set_viewport_size({"width": 390, "height": 844})
        mobile.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
        await mobile.goto(URL)
        overflow = await mobile.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(overflow <= 0, "home sem rolagem horizontal no celular", overflow)
        check(await mobile.locator("#nav-toggle").is_visible(), "menu recolhido no celular")
        await mobile.click("#nav-toggle")
        check(await mobile.locator("#main-nav").is_visible(), "menu abre no celular")
        await mobile.screenshot(path=str(OUT / "mobile-home.png"))
        await mobile.goto(URL + "#/biblioteca")
        await mobile.locator(".doc-main").first.click()
        await expect(mobile.locator("#view-editor")).to_be_visible()
        overflow = await mobile.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(overflow <= 0, "editor sem rolagem horizontal no celular", overflow)
        check(not await mobile.locator(".preview-pane").is_visible(), "celular mostra só o formulário")
        await mobile.screenshot(path=str(OUT / "mobile-editor.png"))
        await mobile.click('[data-mobile-view="preview"]')
        check(await mobile.locator(".preview-pane").is_visible(), "alternar para visualização")
        await mobile.wait_for_timeout(300)
        await mobile.screenshot(path=str(OUT / "mobile-preview.png"))
        await mobile.close()

        print("\n[15] Tema escuro e configurações")
        await page.goto(URL + "#/configuracoes")
        before = await page.evaluate("document.documentElement.dataset.theme")
        await page.click("#theme-toggle")
        after = await page.evaluate("document.documentElement.dataset.theme")
        check(before != after, f"alternar tema ({before} -> {after})")
        await page.reload()
        check(await page.evaluate("document.documentElement.dataset.theme") == after, "tema persistido")
        await page.screenshot(path=str(OUT / "settings-dark.png"), full_page=True)
        await page.goto(URL + "#/biblioteca")
        await page.screenshot(path=str(OUT / "library-dark.png"))
        await page.goto(URL + "#/configuracoes")
        await page.click('label[for="theme-light"]')
        check(await page.evaluate("document.documentElement.dataset.theme") == "light", "tema claro pelas configurações")
        await page.click("#set-clear")
        await page.locator('dialog[open] button:has-text("Apagar tudo")').click()
        await page.wait_for_timeout(200)
        check(await page.locator("#set-doc-count").inner_text() == "0", "apagar todos os dados com confirmação")
        await page.goto(URL + "#/biblioteca")
        check(await page.locator("#lib-empty").is_visible(), "estado vazio da biblioteca")
        await page.goto(URL + "#/editor/inexistente")
        check(await page.locator("#view-notfound").is_visible(), "rota de currículo inexistente tratada")

        # =================== ATUALIZAÇÃO INTERNACIONAL ===================
        await page.evaluate("CM.storage.saveSettings(Object.assign(CM.storage.getSettings(), {printTipSeen: true})); 0")

        print("\n[17] Tela de país: busca, populares, nomes completos, status")
        await page.goto(URL + "#/novo")
        await expect(page.locator("#new-step-1")).to_be_visible()
        step1 = await page.locator("#new-step-1").text_content()
        check("nacionalidade" in step1.lower(), "explica que país = destino, não nacionalidade")
        n_opts = await page.locator('#new-step-1 input[name="new-country"]').count()
        check(n_opts == 16, f"16 opções de país (15 + Outros países): {n_opts}")
        names_ok = await page.evaluate("""[...document.querySelectorAll('#new-step-1 label.country-opt')].every(l => (l.textContent || '').trim().length > 3)""")
        check(names_ok, "cada país tem nome por extenso (bandeira não é o único identificador)")
        await page.fill("#nc-search", "alem")
        await page.wait_for_timeout(250)
        vis = await page.evaluate("""[...document.querySelectorAll('#new-step-1 label.country-opt')].filter(l => l.offsetParent !== null).map(l => l.dataset.country)""")
        check("DE" in vis and "US" not in vis, f"busca 'alem' encontra Alemanha ({vis})")
        await page.fill("#nc-search", "")
        await page.click('label[for="nc-opt-NL"]')
        await page.wait_for_timeout(200)
        check("Preliminar" in await page.locator("#new-step-1").text_content(), "status 'Preliminar' visível para Países Baixos")

        print("\n[18] EUA — résumé (Letter, en-US, sem campos desaconselhados)")
        await wizard(page, "US", "professional", name="US Resume")
        d = await doc_state(page)
        check(d["template"] == "usResume" and d["locale"] == "en-US" and d["design"]["paper"] == "Letter", f"résumé americano: {d['template']} · {d['locale']} · {d['design']['paper']}")
        ctxt = await page.locator("#editor-context").text_content()
        check(all(x in ctxt for x in ["Estados Unidos", "Letter"]), "barra do editor mostra país e papel")
        check(await page.locator("#editor-context [data-ctx]").count() >= 5, "barra do editor: país, idioma, tipo, modelo e papel alteráveis")
        check(await page.locator('[data-path="p:birthDate"]').count() == 0 and await page.locator('[data-path="p:nationality"]').count() == 0, "data de nascimento e nacionalidade ocultas por padrão (EUA)")
        check(not d["design"].get("showPhoto"), "foto desativada por padrão")
        await page.fill('[data-path="p:fullName"]', "Jordan Example")
        await page.fill('[data-path="p:email"]', "jordan@example.com")
        sid_us = await section_id(page, "experience")
        await expand(page, sid_us)
        it_us = next(s for s in (await doc_state(page))["sections"] if s["id"] == sid_us)["items"][0]["id"]
        await page.fill(f'[data-path="i:{sid_us}:{it_us}:title"]', "Analyst")
        txt = await preview_text(page)
        exp_title = await page.evaluate("CM.l10n.sectionTitle('experience', 'en-US')")
        check(exp_title.upper() in txt.upper(), f"títulos em inglês na prévia ({exp_title})")
        await page.evaluate("window.print = function () {}; 0")
        await page.click("#btn-print")
        await page.wait_for_timeout(200)
        title = await page.evaluate("document.title")
        check(title.endswith("-resume"), f"nome sugerido do arquivo: {title}")
        n, w, h = await make_pdf(page, "us-resume.pdf")
        check(abs(w - 612) < 2 and abs(h - 792) < 2, f"PDF em Letter ({w:.0f} x {h:.0f} pt)")
        await page.evaluate("CM.print.cleanup()")

        print("\n[19] EUA — CV acadêmico (pesquisa) e admissão universitária")
        await wizard(page, "US", "research", name="US CV")
        d = await doc_state(page)
        check(d["template"] == "academicExtended" and d["design"]["paper"] == "Letter", f"CV acadêmico nos EUA: {d['template']}")
        kinds = [s["kind"] for s in d["sections"]]
        check("education" in kinds and "publications" in kinds, "CV acadêmico com formação e publicações")
        await wizard(page, "US", "academic", name="US Admissão")
        d = await doc_state(page)
        check(d["template"] == "usResume", "admissão universitária usa résumé, não CV de emprego/pesquisa")

        print("\n[20] Reino Unido — CV em A4")
        await wizard(page, "UK", "professional", name="UK CV")
        d = await doc_state(page)
        check(d["locale"] == "en-GB" and d["design"]["paper"] == "A4", f"Reino Unido: {d['locale']} · {d['design']['paper']}")
        check(await page.locator('[data-path="p:birthDate"]').count() == 0, "data de nascimento oculta (Reino Unido)")
        await page.click("text=Mostrar outros campos")
        await page.fill('[data-path="p:birthDate"]', "01/01/1990")
        await page.wait_for_timeout(500)
        await page.click("#tab-review")
        check("Data de nascimento" in await page.locator("#panel-review").text_content() or "nascimento" in (await page.locator("#panel-review").text_content()).lower(), "revisão avisa dado sensível preenchido")
        await page.click("#tab-content")

        print("\n[21] Alemanha — Lebenslauf, foto opcional, Anschreiben")
        await wizard(page, "DE", "professional", name="DE Lebenslauf")
        d = await doc_state(page)
        check(d["template"] == "lebenslauf" and d["locale"] == "de-DE", f"Lebenslauf alemão: {d['template']}")
        check(await page.locator("#photo-input").count() == 1, "controle de foto disponível (opcional)")
        await page.fill('[data-path="p:fullName"]', "Lena Beispiel")
        await page.fill('[data-path="p:email"]', "lena@example.com")
        await page.wait_for_timeout(400)
        txt = await page.locator("#preview-stage").text_content()
        check("Lebenslauf" in txt and await page.locator("#preview-stage .r-pd").count() == 1, "título 'Lebenslauf' e bloco de dados pessoais em tabela")
        await page.click("#tab-letters")
        check(await page.locator('[data-create-kind="anschreiben"]').count() == 1, "Anschreiben sugerido para a Alemanha")
        await page.click('[data-create-kind="anschreiben"]')
        await expect(page.locator("#cmp-f-body")).to_be_visible()
        await page.fill("#cmp-f-body", "Erster Absatz.\n\nZweiter Absatz.")
        await page.wait_for_timeout(600)
        d = await doc_state(page)
        check(len(d["companions"]) == 1 and d["companions"][0]["locale"] == "de-DE", "Anschreiben criado em alemão")
        check("Zweiter Absatz" not in await page.locator("#preview-stage").text_content(), "carta não é misturada ao currículo")
        await page.evaluate("window.print = function () {}; 0")
        await page.click("#cmp-print")
        await page.wait_for_timeout(300)
        n, w, h = await make_pdf(page, "anschreiben.pdf")
        check(n == 1 and abs(w - 595.28) < 2, f"Anschreiben impresso em 1 página A4 ({n})")
        await page.evaluate("CM.print.cleanup()")
        await page.click("#tab-content")

        print("\n[22] Japão — 履歴書 e 職務経歴書 com estruturas diferentes")
        await wizard(page, "JP", "professional", name="JP")
        d = await doc_state(page)
        check(d["template"] == "jpRirekisho" and d["locale"] == "ja-JP", f"履歴書: {d['template']}")
        check(await page.locator('[data-path="p:nationality"]').count() == 0, "nacionalidade não é pedida (Japão)")
        await page.fill('[data-path="p:fullName"]', "山田 花子")
        sid_ed = await section_id(page, "education")
        await expand(page, sid_ed)
        it_ed = next(s for s in (await doc_state(page))["sections"] if s["id"] == sid_ed)["items"][0]["id"]
        await page.fill(f'[data-path="i:{sid_ed}:{it_ed}:institution"]', "東京大学")
        await page.fill(f'[data-path="i:{sid_ed}:{it_ed}:start"]', "04/2018")
        await page.wait_for_timeout(400)
        check(await page.locator("#preview-stage .jp-row").count() > 0 and "履歴書" in await page.locator("#preview-stage").text_content(), "履歴書 com tabela 年/月")
        rtxt = await page.locator("#preview-stage").text_content()
        check(not any(w in rtxt for w in ["宗教", "配偶者", "口座"]), "sem religião, família ou conta bancária")
        await page.click("#tab-design")
        await page.click('label[for="tpl-opt-jpShokumu"]')
        await page.wait_for_timeout(400)
        stxt = await page.locator("#preview-stage").text_content()
        check("職務経歴書" in stxt and await page.locator("#preview-stage .jp-row").count() == 0 and "山田 花子" in stxt, "職務経歴書 com estrutura própria e mesmos dados")
        await page.click("#tab-content")

        print("\n[23] Troca de país, idioma e papel com dados preservados")
        await wizard(page, "US", "professional", name="Troca")
        await page.fill('[data-path="p:fullName"]', "Pat Example")
        sid_e = await section_id(page, "experience")
        await expand(page, sid_e)
        it = next(s for s in (await doc_state(page))["sections"] if s["id"] == sid_e)["items"][0]["id"]
        await page.fill(f'[data-path="i:{sid_e}:{it}:org"]', "Universidade Federal do Paraná")
        await page.wait_for_timeout(500)
        before = await doc_state(page)
        await page.click('[data-ctx="country"]')
        await page.click('label[for="dsc-opt-DE"]')
        await page.wait_for_timeout(200)
        check(len((await page.locator("dialog[open] .ds-changes").text_content()).strip()) > 10, "diálogo descreve o que muda antes de aplicar")
        await page.click("dialog[open] .btn--primary")
        await page.wait_for_timeout(500)
        after = await doc_state(page)
        check(after["country"] == "DE" and after["locale"] == "de-DE" and after["design"]["paper"] == "A4", f"país trocado: {after['country']} · {after['locale']} · {after['design']['paper']}")
        same = after["personal"] == before["personal"] and [s.get("items") or s.get("tags") or s.get("content") for s in after["sections"]] == [s.get("items") or s.get("tags") or s.get("content") for s in before["sections"]]
        check(same, "dados idênticos após trocar de país")
        check("Universidade Federal do Paraná" in await page.locator("#preview-stage").text_content(), "nome da instituição não é traduzido")
        await page.click('[data-ctx="locale"]')
        await page.select_option("#ds-locale", "en-GB")
        await page.click("dialog[open] .btn--primary")
        await page.wait_for_timeout(400)
        d = await doc_state(page)
        check(d["country"] == "DE" and d["locale"] == "en-GB", "idioma trocado sem mudar o país (Alemanha em inglês)")
        check(await page.evaluate("document.querySelector('#preview-stage .resume-doc').getAttribute('lang')") == "en-GB", "atributo lang do documento atualizado")
        await page.click('[data-ctx="paper"]')
        await page.click('label[for="ds-paper-Letter"]')
        await page.click("dialog[open] .btn--primary")
        await page.wait_for_timeout(400)
        d = await doc_state(page)
        r = await page.evaluate("(() => { const b = document.querySelector('#preview-stage .page').getBoundingClientRect(); return b.height / b.width; })()")
        check(d["design"]["paper"] == "Letter" and abs(r - 279.4 / 215.9) < 0.01, "A4 → Letter: prévia proporcional")
        await page.click("#tab-review")
        check("Letter" in await page.locator("#panel-review").text_content(), "aviso de papel diferente do padrão do país")
        await page.click("#tab-content")
        await page.click('[data-ctx="paper"]')
        await page.click('label[for="ds-paper-A4"]')
        await page.click("dialog[open] .btn--primary")
        await page.wait_for_timeout(400)
        r = await page.evaluate("(() => { const b = document.querySelector('#preview-stage .page').getBoundingClientRect(); return b.height / b.width; })()")
        check(abs(r - 297 / 210) < 0.01, "Letter → A4: prévia proporcional")

        print("\n[24] Analisador de vaga (local)")
        await page.click("#tab-job")
        await page.fill("#job-text", "We need an analyst with Excel and SQL. SQL queries daily. Power BI dashboards and Power BI reports. Excel reports.")
        await page.click("#job-analyze")
        await page.wait_for_timeout(400)
        res = await page.locator("#job-results").text_content()
        check("não é uma nota" in res, "explica que não é nota nem garantia")
        check(await page.locator('.kw-row[data-term="SQL"]').count() == 1 and await page.locator('.kw-row[data-term="Power BI"]').count() == 1, "termos ausentes listados (incl. termo composto)")
        skills_before = [s.get("tags") for s in (await doc_state(page))["sections"] if s["kind"] == "skills"]
        await page.locator('.kw-row[data-term="Power BI"] .kw-ignore').click()
        await page.locator('.kw-row[data-term="SQL"] .kw-accept').click()
        skills_mid = [s.get("tags") for s in (await doc_state(page))["sections"] if s["kind"] == "skills"]
        check(skills_mid == skills_before, "aceitar não altera o currículo sozinho")
        await page.locator('.kw-row[data-term="SQL"] .kw-add').click()
        await page.wait_for_timeout(300)
        tags = sum([s.get("tags") or [] for s in (await doc_state(page))["sections"] if s["kind"] == "skills"], [])
        check("SQL" in tags, "termo aceito adicionado a Competências só após clique")
        check("1 ignorados" in await page.locator(".job-changes").text_content(), "resumo das alterações")
        await page.click("#tab-content")

        print("\n[25] Várias páginas: prévia = PDF")
        await page.evaluate("""(() => { const s = CM.state.doc.sections.find(x => x.kind === 'summary');
            CM.state.actions.setSectionContent(s.id, Array(70).fill('Line of text to force a second page in the document.').join('\\n')); })(); 0""")
        await page.wait_for_timeout(600)
        pages_preview = await page.evaluate("CM.preview.render(CM.state.doc, null, {}).pages")
        await page.evaluate("CM.print.prepare(CM.state.doc); 0")
        n, w, h = await make_pdf(page, "multi.pdf")
        check(pages_preview >= 2 and n == pages_preview, f"documento longo: {pages_preview} páginas na prévia, {n} no PDF")
        await page.evaluate("CM.print.cleanup(); 0")

        print("\n[26] Migração v1 → v2 no navegador")
        v1 = {"id": "doc_legacy1", "schemaVersion": 1, "name": "Currículo antigo", "type": "professional", "template": "classic",
              "createdAt": 1700000000000, "updatedAt": 1700000000000,
              "design": {"accent": "teal", "fontScale": "normal", "density": "normal", "pageNumbers": True},
              "personal": {"fullName": "Pessoa da Versão 1", "email": "v1@example.com"},
              "sections": [{"id": "s1", "kind": "summary", "title": "Meu objetivo", "visible": True, "content": "Texto da versão 1"}]}
        await page.evaluate("v => { localStorage.setItem('cmstudio.v1.doc.' + v.id, JSON.stringify(v)); CM.storage._rebuildIndex(); }", v1)
        await page.goto(URL + "#/biblioteca")
        row = page.locator('.doc-row:has-text("Currículo antigo")')
        check(await row.count() == 1, "documento v1 aparece na biblioteca")
        check("Brasil" in await row.text_content(), "documento v1 identificado como Brasil")
        await row.locator(".doc-main").click()
        await expect(page.locator("#view-editor")).to_be_visible()
        d = await doc_state(page)
        check(d["schemaVersion"] == 2 and d["country"] == "BR" and d["locale"] == "pt-BR" and d["sections"][0]["title"] == "Meu objetivo" and d["sections"][0]["content"] == "Texto da versão 1", "v1 migrado sem perder dados")
        check(await page.evaluate("!!CM.storage.loadLegacy('doc_legacy1')"), "cópia do original v1 preservada")

        print("\n[27] Ajuda: perfis, rótulos de suporte e fontes")
        await page.goto(URL + "#/ajuda/paises")
        await page.wait_for_timeout(300)
        rows = await page.locator("#help-country-table tbody tr").count()
        check(rows == 16, f"tabela de perfis com 16 linhas ({rows})")
        ttxt = await page.locator("#help-country-table").text_content()
        check(all(x in ttxt for x in ["Verificado", "Parcial", "Preliminar", "Genérico"]), "rótulos de suporte (Verificado/Parcial/Preliminar/Genérico)")
        n_src = await page.locator("#help-country-table [data-country-info]").count()
        check(n_src == 15, f"15 perfis com fontes; 'Outros países' sem fontes ({n_src})")
        await page.locator("#help-country-table [data-country-info='DE']").first.click()
        await expect(page.locator("dialog[open]")).to_be_visible()
        dtxt = await page.locator("dialog[open]").text_content()
        n_links = await page.locator("dialog[open] a[href^='https://']").count()
        check(("make-it-in-germany" in dtxt or "Make it in Germany" in dtxt) and n_links >= 1, f"detalhes do perfil mostram as fontes com link ({n_links})")
        check(re.search(r"\d+\s?%", dtxt) is None, "sem estatísticas percentuais no perfil")
        await page.keyboard.press("Escape")

        print("\n[28] Configurações: país padrão e página inicial")
        await page.goto(URL + "#/configuracoes")
        n_set = await page.locator("#set-country option").count()
        check(n_set == 16, f"seletor de país padrão com 16 opções ({n_set})")
        await page.select_option("#set-country", "PT")
        await page.uncheck("#set-remember-country")
        await page.goto(URL + "#/novo")
        await page.wait_for_timeout(300)
        check(await page.locator("#nc-opt-PT").is_checked(), "país padrão das configurações aplicado no assistente")
        await page.goto(URL + "#/inicio")
        await page.locator('#home-countries a[href*="pais=JP"]').click()
        await page.wait_for_timeout(300)
        check(await page.locator("#nc-opt-JP").is_checked(), "atalho de país na página inicial pré-seleciona o país")
        await page.goto(URL + "#/configuracoes")
        await page.select_option("#set-country", "BR")
        await page.check("#set-remember-country")

        print("\n[29] Caminhos relativos e botões sem ação")
        html = (ROOT / "index.html").read_text("utf-8")
        refs = re.findall(r'(?:src|href)="([^"#][^"]*)"', html)
        bad = [r for r in refs if r.startswith("/") or re.match(r"^[a-z]+://", r)]
        check(not bad, "index.html só usa caminhos relativos (funciona em subpasta do GitHub Pages)", bad)
        missing = [r for r in refs if not r.startswith(("mailto:", "data:")) and not (ROOT / r.split("?")[0]).exists()]
        check(not missing, "todos os arquivos referenciados existem", missing)
        cdp = await ctx.new_cdp_session(page)
        dead = []
        for route in ["#/inicio", "#/novo", "#/biblioteca", "#/configuracoes", "#/ajuda/paises"]:
            await page.goto(URL + route)
            await page.wait_for_timeout(300)
            nolink = await page.evaluate("[...document.querySelectorAll('a')].filter(a => a.offsetParent !== null && !a.getAttribute('href')).map(a => a.textContent.trim().slice(0, 30))")
            dead += [f"{route}: link sem destino '{x}'" for x in nolink]
            n_btn = await page.evaluate("window.__btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null); window.__btns.length")
            for i in range(n_btn):
                obj = await cdp.send("Runtime.evaluate", {"expression": f"window.__btns[{i}]"})
                oid = obj["result"]["objectId"]
                has = False
                cur = oid
                for _ in range(12):
                    ls = await cdp.send("DOMDebugger.getEventListeners", {"objectId": cur})
                    if any(l["type"] in ("click", "pointerdown", "mousedown") for l in ls["listeners"]):
                        has = True
                        break
                    par = await cdp.send("Runtime.callFunctionOn", {"objectId": cur, "functionDeclaration": "function(){ const p = this.parentElement; return p && p !== document.body ? p : null; }"})
                    if par["result"].get("subtype") == "null" or "objectId" not in par["result"]:
                        break
                    cur = par["result"]["objectId"]
                info = await page.evaluate(f"(() => {{ const b = window.__btns[{i}]; return {{ t: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 40), submit: b.type === 'submit' && !!b.form, deleg: !!b.closest('[data-country-info]') }}; }})()")
                if not has and not info["submit"] and not info["deleg"]:
                    dead.append(f"{route}: {info['t']}")
        check(not dead, "nenhum botão ou link visível sem ação (home, assistente, biblioteca, configurações, ajuda)", dead)

        print("\n[30] Celular e tema escuro com os novos componentes")
        mob = await ctx.new_page()
        await mob.set_viewport_size({"width": 390, "height": 844})
        mob.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
        for route in ["#/novo", "#/ajuda/paises", "#/configuracoes"]:
            await mob.goto(URL + route)
            await mob.wait_for_timeout(300)
            ov = await mob.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            check(ov <= 0, f"{route} sem rolagem horizontal no celular", ov)
        await mob.screenshot(path=str(OUT / "mobile-wizard.png"))
        await mob.goto(URL + "#/biblioteca")
        await mob.locator(".doc-main").first.click()
        await expect(mob.locator("#view-editor")).to_be_visible()
        ov = await mob.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(ov <= 0, "editor (5 abas + barra de contexto) sem rolagem horizontal", ov)
        await mob.close()
        await page.goto(URL + "#/novo")
        for theme in ["dark", "light"]:
            await page.evaluate(f"document.documentElement.dataset.theme = '{theme}'; 0")
            await page.wait_for_timeout(700)  # aguarda a transição de cores
            await page.screenshot(path=str(OUT / f"wizard-{theme}.png"))
            ratio = await page.evaluate("""(() => {
                const parse = s => { const m = s.match(/[\\d.]+/g).map(Number); return s.startsWith('color(') ? m.slice(0, 3).map(x => x * 255) : m.slice(0, 3); };
                const lum = c => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
                const box = document.querySelector('label.country-opt:not(:has(input:checked)) .country-opt-box');
                const a = lum(parse(getComputedStyle(box).backgroundColor)), b = lum(parse(getComputedStyle(box.querySelector('.country-opt-name')).color));
                return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); })()""")
            check(ratio >= 4.5, f"cartões de país legíveis no tema {theme} (contraste {ratio:.1f}:1)")

        print("\n[31] Testes unitários (tests/unit-tests.html) no mesmo navegador")
        up = await ctx.new_page()
        up.on("pageerror", lambda e: errors.append(f"unit pageerror: {e}"))
        await up.goto((ROOT / "tests" / "unit-tests.html").as_uri())
        await up.wait_for_function("window.__TEST_RESULTS__", timeout=60000)
        ur = await up.evaluate("window.__TEST_RESULTS__")
        fails = [r["name"] + ": " + r.get("error", "") for r in ur["results"] if not r["ok"]]
        check(ur["failed"] == 0, f"testes unitários: {ur['passed']} de {ur['total']}", fails)
        await up.close()

        print("\n[32] Erros de JavaScript")
        check(not errors, "nenhum erro de JavaScript no console", "; ".join(errors))

        await browser.close()

    print(f"\nResultado: {len(passed)} aprovados, {len(failed)} falhas")
    print(f"Capturas e PDF em: {OUT}")
    if failed:
        print("Falhas:\n - " + "\n - ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
