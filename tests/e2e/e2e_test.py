"""
CM Studio — teste ponta a ponta (opcional, apenas para desenvolvedores).

O usuário comum NÃO precisa executar este arquivo. Ele simula uma pessoa
usando o aplicativo no navegador Chromium (cliques, digitação, diálogos,
download e upload de backup, impressão em PDF, celular e tema escuro).

Requisitos: Python 3.9+ e Playwright
    pip install playwright
    python -m playwright install chromium
Execução (a partir da pasta do projeto):
    python tests/e2e/e2e_test.py
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
        check(await page.locator(".template-card").count() == 9, "galeria com 9 modelos")
        check(await page.locator("#home-types .type-card").count() == 11, "11 tipos de currículo")
        check(await page.locator(".thumb-frame .page").count() >= 9, "miniaturas renderizadas")
        check(not await page.locator("#nav-toggle").is_visible(), "menu hambúrguer oculto no desktop")

        print("\n[2] Criar currículo profissional")
        await page.click(".hero-actions >> text=Criar currículo")
        await expect(page.locator("#new-title")).to_be_visible()
        await page.click('label[for="nt-professional"]')
        await page.fill("#new-name", "Teste Profissional")
        await page.click("#new-submit")
        await expect(page.locator("#view-editor")).to_be_visible()
        d = await doc_state(page)
        check(d["type"] == "professional" and d["template"] == "corporate", "tipo e modelo recomendados")
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
        for tpl in ["classic", "minimal", "corporate", "modern", "academic", "school", "firstJob", "ats", "academicExtended"]:
            await page.click(f'label[for="tpl-opt-{tpl}"]')
            await page.wait_for_timeout(250)
            ok = await page.locator(f"#preview-stage .tpl-{tpl}").count() == 1
            txt = await page.locator("#preview-stage").text_content()
            check(ok and "Ana Teste Silva" in txt and "Analista de QA" in txt, f"modelo {tpl} aplicado com dados")
            await page.locator("#preview-stage").screenshot(path=str(OUT / f"tpl-{tpl}.png"))
        await page.click('label[for="tpl-opt-modern"]')
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
        await page.evaluate("CM.print.prepare(CM.state.doc)")
        await page.emulate_media(media="print")
        pdf_path = OUT / "curriculo.pdf"
        await page.pdf(path=str(pdf_path), prefer_css_page_size=True, print_background=True)
        await page.emulate_media(media="screen")
        pdf_bytes = pdf_path.read_bytes()
        n_pdf = len(re.findall(rb"/Type\s*/Page[^s]", pdf_bytes))
        check(n_pdf == pages_preview, f"PDF com {n_pdf} página(s) = pré-visualização ({pages_preview})")
        box = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)", pdf_bytes)
        w, h = float(box.group(1)), float(box.group(2))
        check(abs(w - 595.28) < 2 and abs(h - 841.89) < 2, f"página A4 no PDF ({w:.1f} x {h:.1f} pt)")
        await page.evaluate("CM.print.cleanup()")

        print("\n[11] Biblioteca: vários currículos")
        await page.goto(URL + "#/novo?tipo=school")
        await page.click("#new-submit")
        await expect(page.locator("#view-editor")).to_be_visible()
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
        await page.goto(URL + "#/novo?tipo=academicExtended")
        await page.click("#new-submit")
        await expect(page.locator("#view-editor")).to_be_visible()
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

        print("\n[16] Erros de JavaScript")
        check(not errors, "nenhum erro de JavaScript no console", "; ".join(errors))

        await browser.close()

    print(f"\nResultado: {len(passed)} aprovados, {len(failed)} falhas")
    print(f"Capturas e PDF em: {OUT}")
    if failed:
        print("Falhas:\n - " + "\n - ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
