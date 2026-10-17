"""
CM Studio — extração das mensagens da interface (ferramenta de desenvolvimento).

O usuário comum NÃO precisa executar este arquivo.

O que faz:
  1. Abre o index.html no Chromium (Playwright) e coleta as mensagens
     registradas em tempo de execução: textos estáticos do HTML, estruturas de
     dados (tipos, seções, modelos, perfis de países…) e mensagens declaradas.
  2. Varre os scripts em js/ procurando CM.t('…') e U.plural(n, '…', '…').
  3. Grava o catálogo em docs/i18n/messages.json e docs/i18n/messages.js
     (este último é lido pelos testes unitários para medir a cobertura).
  4. Com --coverage, mostra quantas mensagens cada idioma traduz.

Requisitos: Python 3.9+ e Playwright (pip install playwright;
python -m playwright install chromium).
Uso (na pasta do projeto):
    python tools/extract_messages.py
    python tools/extract_messages.py --coverage
"""
import asyncio
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "i18n"

STR = r"""('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")"""
RE_T = re.compile(r"CM\.t\(\s*" + STR)
RE_PLURAL = re.compile(r"plural\(\s*[^,()]+(?:\([^()]*\))?\s*,\s*" + STR + r"\s*,\s*" + STR)


def js_unquote(lit):
    """Converte um literal de string JS (aspas simples ou duplas) em texto."""
    body = lit[1:-1]
    if lit[0] == "'":
        body = body.replace('\\"', '"').replace('"', '\\"').replace("\\'", "'")
    return json.loads('"' + body + '"')


def scan_sources():
    found = {}
    for path in sorted((ROOT / "js").rglob("*.js")):
        if "i18n/ui/" in path.as_posix():
            continue
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT).as_posix()
        for m in RE_T.finditer(text):
            found.setdefault(js_unquote(m.group(1)), set()).add(rel)
        for m in RE_PLURAL.finditer(text):
            for g in (1, 2):
                found.setdefault(js_unquote(m.group(g)), set()).add(rel)
    return found


async def runtime_messages():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context()
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto((ROOT / "index.html").as_uri())
        await page.wait_for_function("window.CM && CM.uiLang && document.documentElement.classList.contains('is-ready')")
        msgs = await page.evaluate("""() => {
            const out = CM.uiLang.knownMessages();
            CM.i18n.codes().forEach(c => { const n = CM.i18n.get(c).meta.name; if (n) out.push(n); });
            return out;
        }""")
        await browser.close()
        if errors:
            print("Erros de JavaScript na página:", errors)
        return msgs


def coverage(messages):
    """Conta, por idioma, as mensagens com tradução própria ou herdada."""
    import subprocess  # noqa: F401  (mantido simples: a contagem é feita no navegador)
    async def run():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            ctx = await browser.new_context()
            page = await ctx.new_page()
            await page.goto((ROOT / "index.html").as_uri())
            await page.wait_for_function("window.CM && CM.uiLang")
            res = await page.evaluate("""(msgs) => CM.uiLang.codes().map(c => ({
                code: c, missing: CM.uiLang.untranslated(c, msgs).length, total: msgs.length }))""", messages)
            await browser.close()
            return res
    return asyncio.run(run())


def main():
    src = scan_sources()
    rt = asyncio.run(runtime_messages())
    allm = {}
    for m, files in src.items():
        allm.setdefault(m, set()).update(files)
    for m in rt:
        allm.setdefault(m, set()).add("runtime")
    # Descarta itens sem letras (ex.: " · ") e duplicatas
    msgs = sorted(m for m in allm if re.search(r"[A-Za-zÀ-ÿ\u3040-\u30ff\u4e00-\u9fff]", m))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {"source": "pt-BR", "count": len(msgs),
            "messages": [{"id": m, "where": sorted(allm[m])} for m in msgs]}
    (OUT_DIR / "messages.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT_DIR / "messages.js").write_text(
        "/* Gerado por tools/extract_messages.py — catálogo de mensagens da interface (pt-BR). */\n"
        "window.CM_UI_MESSAGES = " + json.dumps(msgs, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"{len(msgs)} mensagens gravadas em docs/i18n/messages.json")
    if "--coverage" in sys.argv:
        for row in coverage(msgs):
            done = row["total"] - row["missing"]
            print(f"  {row['code']:6} {done:5}/{row['total']}  ({100 * done / row['total']:.1f}%)")


if __name__ == "__main__":
    main()
