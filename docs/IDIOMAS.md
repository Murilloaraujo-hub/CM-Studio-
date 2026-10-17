# Idiomas da interface do CM Studio

Este documento explica como funciona a **tradução da interface** (menus, botões, avisos, ajuda…), qual é a situação de cada idioma e como manter as traduções.

> A tradução da interface é diferente da tradução do **documento**. O idioma do documento só muda os títulos e rótulos impressos no currículo. **O texto que você escreve nunca é traduzido automaticamente**, nem pela interface nem pelo documento.

---

## 1. Quatro escolhas independentes

| Escolha | Onde fica | O que muda |
|---|---|---|
| **País de destino** | `doc.country` | Regras nacionais: papel, foto, dados pessoais, seções, modelos, avisos. |
| **Idioma da interface** | `settings.uiLocale` e `settings.uiLocaleMode` | Somente os textos do aplicativo. |
| **Idioma do documento** | `doc.locale` | Títulos e rótulos impressos no currículo. |
| **Finalidade** | `doc.type` | Seções iniciais e orientações. |

Trocar o idioma da interface **nunca** altera as regras do país, o documento ou a pré-visualização impressa. Esse comportamento é coberto pelos testes automatizados.

## 2. Modo automático e modo manual

As duas opções aparecem em **Configurações → Idioma da interface**. Também há um seletor no cabeçalho.

- **Idioma automático pelo país** (padrão). A interface passa para o idioma do país escolhido, de imediato e sem recarregar a página. Isso acontece:
  - no assistente de criação;
  - ao trocar o país no editor;
  - ao abrir um link `#/novo?pais=…`.

  Um aviso permite **manter o idioma anterior**. "Outros países" mantém o idioma atual.
- **Escolher idioma manualmente**. A sua escolha é mantida, e trocar de país **não** muda a interface. Um aviso discreto oferece o idioma do país, caso você queira usá-lo.

Escolher um idioma no seletor do cabeçalho ativa o modo manual. Voltar para "Automático pelo país" ressincroniza a interface com o país atual. O modo e o idioma ficam salvos no navegador. Ao recarregar a página, o idioma manual é respeitado.

### País → idioma padrão da interface

| País | Interface | Alternativas de documento |
|---|---|---|
| Brasil | Português (Brasil) | — |
| Estados Unidos | English (United States) | — |
| Reino Unido | English (United Kingdom) | — |
| Canadá | English (Canada) | Français (Canada) |
| Austrália | English (Australia) | — |
| Alemanha | Deutsch (Deutschland) | English (UK) |
| França | Français (France) | English (UK) |
| Portugal | Português (Portugal) | English (UK) |
| Espanha | Español (España) | English (UK) |
| Itália | Italiano (Italia) | English (UK) |
| Japão | 日本語 | English (US) |
| Irlanda | English (Ireland) | — |
| Países Baixos | Nederlands (Nederland) | English (UK) |
| Nova Zelândia | English (New Zealand) | — |
| Suíça | Deutsch (Schweiz) / Français (Suisse) / Italiano (Svizzera), conforme a região linguística escolhida | English (UK) |
| Outros países | mantém o idioma atual | English (US/UK) |

Os nomes de idioma sempre aparecem **escritos por extenso, na própria língua**. As bandeiras são apenas complementares e nunca substituem o nome.

## 3. Situação das traduções (15/10/2026)

O catálogo atual tem **1.537 mensagens**, extraídas de todo o código e do `index.html`.

| Idioma | Situação | Cobertura |
|---|---|---|
| Português (Brasil) | Idioma original (fonte) | 100% |
| English (United States) | **Completo** | 1.537 / 1.537 |
| Deutsch (Deutschland) | **Completo** | 1.537 / 1.537 |
| Français (France) | **Completo** | 1.537 / 1.537 |
| 日本語 | **Completo** | 1.537 / 1.537 |
| English (UK, Canada, Australia, Ireland, New Zealand) | Completo, como **variante automática** do en-US (ver seção 4) | 1.537 / 1.537 |
| Deutsch (Schweiz) | Completo, como variante automática do de-DE (sem "ß") | 1.537 / 1.537 |
| Français (Canada, Suisse) | Completo, como variante do fr-FR | 1.537 / 1.537 |
| Português (Portugal) | **Adaptação automática** do pt-BR (vocabulário). Revisão humana recomendada | — |
| Español (España) | **Parcial** | 942 / 1.537 (61%) |
| Italiano (Italia) e Italiano (Svizzera) | **Parcial** | 942 / 1.537 (61%) |
| Nederlands (Nederland) | **Parcial** | 942 / 1.537 (61%) |

**O que está traduzido nos idiomas parciais:**
- todos os menus, botões, rótulos, campos, títulos de página, avisos curtos e mensagens de erro e de sucesso;
- os modelos de frase com variáveis (`{0}`), para que nenhuma frase fique pela metade em outro idioma;
- os principais títulos da página inicial, do assistente e das configurações.

**O que ainda aparece em inglês:** parágrafos longos da Central de ajuda, dicas extensas por país e textos de exemplo.

A situação de cada idioma aparece:
- no próprio aplicativo, em **Central de ajuda → Idiomas da interface**;
- no seletor de idioma, que mostra "— Tradução parcial" ou "— Adaptação automática" ao lado do nome.

Nenhum idioma parcial é apresentado como completo.

### Regras de fallback

1. Primeiro, a tradução do idioma ativo.
2. Se não houver, a do idioma-base (para variantes, como en-GB → en-US).
3. Se não houver, o **inglês (en-US)**, para todos os idiomas, exceto as variantes do português.
4. Por último, o texto original em português.

Na prática, com en-US completo, nada chega a cair no português.

**Nunca aparece uma chave técnica.** As chaves são o próprio texto legível em português. Com `localStorage.setItem('cmstudio.debug', '1')`, o console avisa quais mensagens faltam.

## 4. Variantes regionais

Arquivo: `js/i18n/ui/variants.js`.

As variantes herdam de um idioma-base e aplicam um ajuste automático. Uma tradução escrita no dicionário da variante sempre tem prioridade.

- **en-GB, en-IE, en-NZ:**
  - grafia britânica (colour, organise, centre, licence, programme);
  - datas dd/mm/aaaa;
  - "résumé" → "CV".
- **en-AU:** grafia britânica (mas "program") e "résumé" → "resume".
- **en-CA:** "colour" e "centre"; "résumé" → "resume", como no Job Bank.
- **Regra comum às variantes do inglês:** mensagens que citam o **nome de um tipo de documento** ("US résumé", "Résumé") mantêm a palavra.
- **de-CH:** "ß" → "ss".
- **fr-CA:** "e-mail" → "courriel".
- **fr-CH e it-CH:** iguais ao idioma-base.
- **pt-PT:** troca de vocabulário frequente:
  - ficheiro, guardar, eliminar, definições, equipa, contacto, telemóvel, separador, ecrã…;
  - "salvo pedido" (no sentido de "exceto") é preservado.

  É uma adaptação automática, **não** uma tradução revisada.

## 5. Arquitetura (sem build, sem bibliotecas)

| Arquivo | Função |
|---|---|
| `js/i18n/ui-core.js` | Motor (`CM.uiLang`). Funções: `t()`, `plural()` (`Intl.PluralRules`), `formatNumber()`/`formatDate()` (`Intl`), `register()`, `registerTree()` (estruturas de dados), textos estáticos do HTML, `status()` e `coverage()`. Também atualiza `<html lang dir>`. |
| `js/i18n/ui/<idioma>.js` | Dicionários: `{ "texto em pt-BR": "tradução" }` + metadados (`complete`, `translated`, `total`). |
| `js/i18n/ui/variants.js` | Variantes regionais. |
| `js/ui-language.js` | Controlador (`CM.uiLanguage`). Cuida dos modos automático e manual, do seletor do cabeçalho, das Configurações e da tabela da ajuda. |
| `js/app.js` → `rerender()` | Redesenha a tela atual após a troca de idioma, sem recarregar e sem perder edições. |
| `docs/i18n/messages.json` / `messages.js` | Inventário completo das mensagens (gerado). |
| `tools/extract_messages.py` | Gera o inventário e mede a cobertura. |

**Regras seguidas no código:**
- Todo texto visível passa por `CM.t('Texto em português', [args])`. Isso inclui `aria-label`, `title`, `placeholder` e textos para leitores de tela.
- Estruturas de dados com textos (tipos, seções, modelos, perfis de países, cartas) são registradas com `CM.uiLang.registerTree()`. Chaves técnicas e **valores salvos** (ex.: níveis de idioma) não são traduzidos.
- Títulos e editoras das fontes ficam no original; o resumo do que cada fonte embasa é traduzido.
- Nomes de documentos locais (履歴書, Lebenslauf, Anschreiben, Sollicitatiebrief…) permanecem no original.
- Plurais: `CM.utils.plural(n, 'singular', 'plural')`. As duas formas são traduzidas; em japonês, o contador fica colado ao número (ex.: 3件の履歴書).

## 6. Como adicionar ou completar um idioma

### Completar um idioma parcial (es-ES, it-IT, nl-NL)
1. Abra `js/i18n/ui/es-ES.js`. Cada linha é `"texto original": "tradução"`.
2. Para ver o que falta, rode `python tools/extract_messages.py --coverage` (requer Python e Playwright). Também dá para abrir o app com `localStorage.setItem('cmstudio.debug', '1')`.
3. Acrescente pares `"texto original": "tradução"`, com estes cuidados:
   - mantenha `{0}`, `{1}` e as tags (`<strong>`, `<em>`, `<a href="…">`, `<kbd>`, `<br>`) exatamente como no original;
   - mantenha os espaços no início e no fim;
   - localize exemplos (e-mails, cidades, formatos de data).
4. Quando chegar a 100%, troque `complete: false` por `complete: true` e atualize `translated` nos metadados, no fim do arquivo.
5. Rode os testes (seção 7).

### Adicionar um idioma novo
1. Copie `js/i18n/ui/en-US.js` para `js/i18n/ui/<código>.js`. Troque o código em `CM.uiLang.register('<código>', …)` e traduza os valores.
2. Acrescente o nome do idioma, escrito na própria língua, em `ENDONYMS`, em `js/i18n/ui-core.js`.
3. Inclua `<script src="js/i18n/ui/<código>.js"></script>` no `index.html`, logo após `ui-core.js`. Faça o mesmo em `tests/unit-tests.html`, com `../`.
4. Para usar o idioma também nos **documentos**, siga "Novo idioma" no README: os rótulos impressos ficam em `js/i18n/<código>.js`.
5. Se o idioma for o padrão de um país, o modo automático já o escolhe pelo `defaultLanguage` do perfil, buscando o mesmo código ou o mesmo idioma.

### Adicionar uma variante regional
Registre em `js/i18n/ui/variants.js`: `L.register('xx-YY', {}, { base: 'xx-ZZ', transform: fn })`.

### Ao mudar textos no código
Um texto novo ou alterado vira uma mensagem nova. Rode `python tools/extract_messages.py --coverage`: ele atualiza o inventário e mostra o que falta em cada idioma. Depois, traduza nos dicionários.

## 7. Testes

| Teste | O que cobre |
|---|---|
| `tests/unit-tests.html` (7 testes de interface) | Catálogo completo em en/de/fr/ja; `{0}` e tags preservados em **todos** os idiomas; fallback para o inglês; situação declarada; variantes; `html lang`; plural japonês; regras dos países inalteradas pela troca de idioma. |
| `tests/e2e/i18n_test.py` | Cobre BR, US, UK, DE, FR, PT, JP, ES, IT e NL no modo automático, percorrendo a página inicial, o assistente (4 etapas), o editor (5 abas), a biblioteca, as configurações, a ajuda, a página 404 e os diálogos. Verifica avisos e `aria-label`/`title`/`placeholder`/`alt`. Em ja/de/fr, também percorre exemplos, assistente, troca de finalidade, contexto, analisador de vaga, cartas, perfis e "apagar tudo". Detecta sobras em português e chaves técnicas, e testa os modos manual/automático, a persistência, a independência de regras, os plurais, as datas e números locais e o fallback. |
| `tests/e2e/e2e_test.py` | Bateria completa das funcionalidades, com a interface fixada em pt-BR. |

## 8. Limitações

- es-ES, it-IT e nl-NL são **parciais**: textos longos de ajuda aparecem em inglês.
- pt-PT e as variantes do inglês, do alemão suíço e do francês são **ajustes automáticos** sobre o idioma-base. Funcionam para o vocabulário mais comum, mas não passaram por revisão de falantes nativos.
- As traduções completas (en, de, fr, ja) foram escritas para este projeto e verificadas por testes de integridade e de sobras. Mesmo assim, uma revisão por falantes nativos é recomendada antes de uso profissional.
- Todos os dicionários são carregados na abertura (cerca de 0,9 MB sem compressão e cerca de 0,3 MB com a compressão gzip do GitHub Pages). Isso garante a troca instantânea e o funcionamento offline e via `file://`.
