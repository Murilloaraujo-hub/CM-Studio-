# CM Studio

**CM Studio — Seu currículo, sua próxima oportunidade.**

![CM Studio](assets/images/cm-studio-cover.svg)

O CM Studio é um gerador de currículos gratuito que funciona inteiramente no navegador. Você cria, edita e organiza vários currículos, acompanha a pré-visualização em formato A4 em tempo real e imprime ou salva em PDF pela janela de impressão do próprio navegador.

- Sem cadastro, sem servidor e sem banco de dados externo.
- Os dados ficam **somente no seu navegador** (localStorage).
- Feito com HTML5, CSS3 e JavaScript puro: não há frameworks, dependências nem etapa de compilação.
- Funciona abrindo o `index.html` direto no computador ou publicado no GitHub Pages.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Como usar (início rápido)](#como-usar-início-rápido)
3. [Publicar no GitHub Pages (passo a passo)](#publicar-no-github-pages-passo-a-passo)
4. [Seus dados e backup](#seus-dados-e-backup)
5. [Imprimir e salvar em PDF](#imprimir-e-salvar-em-pdf)
6. [Estrutura de pastas](#estrutura-de-pastas)
7. [Arquitetura](#arquitetura)
8. [Testes](#testes)
9. [Acessibilidade e segurança](#acessibilidade-e-segurança)
10. [Limitações conhecidas](#limitações-conhecidas)
11. [Licença](#licença)

---

## Funcionalidades

### Telas
- **Início:** apresentação, botão para criar currículo, currículos salvos recentes, galeria de modelos, tipos de currículo, aviso de privacidade e dicas para o primeiro currículo.
- **Criar currículo:** criação guiada em etapas (tipo → modelo → nome).
- **Editor:** formulário à esquerda e pré-visualização A4 em tempo real à direita. No celular, as abas "Editar" e "Visualizar" alternam entre os dois.
- **Meus currículos:** criar, abrir, renomear, duplicar, exportar, excluir (com confirmação), buscar e ordenar. Mostra a data da última alteração e um estado vazio explicativo.
- **Configurações:** tema claro, escuro ou automático; preferências do editor (dicas nas seções, confirmação ao excluir itens preenchidos, orientações antes de imprimir, zoom inicial); exportar e importar backup; apagar todos os dados, com confirmação e oferta de backup antes.
- **Ajuda:** central com tópicos sobre como começar, modos de currículo, modelos, impressão, backup, privacidade e atalhos.

### 11 tipos de currículo
Profissional · Primeiro emprego · Jovem aprendiz · Escolar / estudantil · Faculdade / processo seletivo acadêmico (versão resumida) · Estágio · Bolsa de estudos · Intercâmbio · Voluntariado · Acadêmico estendido · Personalizado.

Cada tipo define as seções iniciais, as dicas e o modelo recomendado. **Tipo e modelo podem ser trocados depois, sem perder dados.** Antes de trocar, o app explica o que vai mudar, e as seções já preenchidas são mantidas.

**Modo escolar:**
- Todos os campos são opcionais e nada vazio aparece no documento.
- Experiência profissional não é exigida.
- Não pede foto, CPF, RG nem endereço completo.
- Inclui seções como formação escolar, projetos, feiras de ciências, olimpíadas, grêmio, clubes, atividades extracurriculares e voluntariado.
- Os exemplos aparecem sempre identificados como exemplos.
- Lembra que as regras da escola, do edital ou da instituição têm prioridade.

**Modo acadêmico:** há uma versão resumida (faculdade ou processo seletivo) e uma estendida, com interesses de pesquisa, projetos, publicações numeradas, apresentações, monitoria, bolsas e prêmios. A versão estendida pode ter várias páginas.

**Primeiro emprego e jovem aprendiz:** priorizam objetivo, formação, cursos, habilidades e atividades, com orientações para quem ainda não tem experiência formal.

**Profissional:**
- Aceita várias experiências, que podem ser ordenadas por data (mais recente primeiro) ou manualmente, por relevância.
- A ordem das seções é livre.

### Editor
- Pré-visualização em tempo real e salvamento automático, com indicador "Alterações salvas" ou "Salvando…".
- Adicionar, remover, duplicar, ocultar e reordenar seções e itens.
- Opção "Atual" para períodos em andamento.
- Validação de e-mail, telefone e links. Links perigosos (por exemplo, `javascript:`) são bloqueados.
- Contagem aproximada de páginas, com aviso de conteúdo longo.
- Aba **Revisão**: aponta campos importantes vazios, seções vazias, trechos de exemplo não editados (entre colchetes) e excesso de páginas.
- Desfazer e refazer (até 100 passos).
- Confirmação antes de ações destrutivas, e mensagens de sucesso e de erro.
- Navegação completa por teclado.
- **Sugestões de texto locais:** frases e habilidades de exemplo, sempre editáveis e identificadas como exemplos. Não há inteligência artificial, e nada é enviado para fora do navegador.

**Atalhos de teclado do editor**

| Atalho | Ação |
|---|---|
| Ctrl/⌘ + Z | Desfazer |
| Ctrl/⌘ + Shift + Z ou Ctrl/⌘ + Y | Refazer |
| Ctrl/⌘ + S | Salvar agora |
| Ctrl/⌘ + P | Imprimir / salvar como PDF |
| ← / → / Home / End (nas abas) | Trocar de aba |

### 9 modelos
Clássico · Minimalista · Corporativo · Moderno (barra lateral) · Acadêmico · Escolar / estudantil · Primeiro emprego · ATS (leitura automatizada) · Acadêmico estendido.

Cada modelo tem estrutura, tipografia e hierarquia próprias. Na aba **Design** você ajusta a cor de destaque, o tamanho do texto, o espaçamento e a numeração de páginas.

> Sobre o modelo **ATS**: ele usa estrutura simples, uma coluna e títulos padronizados, o que costuma facilitar a leitura por sistemas automatizados de recrutamento. Mesmo assim, **não há garantia de compatibilidade total com todos os sistemas**, porque cada empresa usa um sistema e uma configuração diferentes.

---

## Como usar (início rápido)

1. Baixe e descompacte o arquivo `CM-Studio-Projeto-Completo.zip`.
2. Abra a pasta `CM-Studio` e dê dois cliques em **`index.html`**. O app abre no seu navegador padrão.
3. Clique em **Criar currículo**, escolha o tipo e o modelo e dê um nome ao documento.
4. Preencha os campos. A pré-visualização é atualizada enquanto você digita, e tudo é salvo automaticamente.
5. Confira a aba **Revisão** e, quando terminar, clique em **PDF** ("Imprimir / Salvar como PDF").
6. De vez em quando, exporte um **backup** em *Configurações → Exportar backup*.

Navegadores recomendados: versões atuais do Chrome, Edge, Firefox ou Safari.

> Dica: se o navegador estiver em modo anônimo/privado, os dados podem ser apagados ao fechar a janela. Nesse caso o app mostra um aviso.

---

## Publicar no GitHub Pages (passo a passo)

O CM Studio é um site estático e não precisa de nenhuma configuração extra para funcionar no GitHub Pages.

1. **Crie uma conta** em [github.com](https://github.com), se ainda não tiver.
2. **Crie um repositório:** clique em **New repository**, escolha um nome (por exemplo, `cm-studio`), marque **Public** e clique em **Create repository**.
3. **Envie os arquivos:**
   - Na página do repositório, clique em **uploading an existing file** (ou em **Add file → Upload files**).
   - Arraste **o conteúdo da pasta `CM-Studio`**: `index.html`, as pastas `css`, `js`, `assets` e `tests`, além de `README.md` e `LICENSE`.
   - O `index.html` precisa ficar na **raiz** do repositório, e não dentro de uma subpasta.
   - Clique em **Commit changes**.
4. **Ative o GitHub Pages:**
   - Vá em **Settings → Pages**.
   - Em **Build and deployment → Source**, escolha **Deploy from a branch**.
   - Em **Branch**, selecione **`main`** e a pasta **`/ (root)`**, e clique em **Save**.
5. **Aguarde alguns minutos.** A própria página **Settings → Pages** mostrará o endereço publicado, normalmente no formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
6. Abra o endereço e teste. Para atualizar o site depois, envie os arquivos alterados para o repositório: a publicação é refeita automaticamente.

Para usar Git pela linha de comando, rode os comandos abaixo dentro da pasta `CM-Studio`:

```bash
git init
git add .
git commit -m "CM Studio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

Troque `SEU-USUARIO` e `NOME-DO-REPOSITORIO` pelos seus dados. Depois, faça o passo 4.

**Observações:**
- Todos os caminhos do projeto são relativos, então o app funciona em subdiretórios como `/NOME-DO-REPOSITORIO/`.
- Os dados de quem usa o site publicado ficam no navegador de cada pessoa. Nada é enviado ao GitHub nem a você.
- Os dados ficam ligados ao endereço: currículos criados ao abrir o `index.html` localmente **não** aparecem automaticamente na versão publicada. Para transferi-los, use **exportar/importar backup**.

---

## Seus dados e backup

- Cada currículo é salvo separadamente no `localStorage` do navegador, com chaves que começam com `cmstudio.v1.`.
- **Não existe nuvem nem sincronização.** Os dados podem ser perdidos se você limpar os dados de navegação, usar modo anônimo, trocar de navegador ou de computador, ou se o navegador liberar espaço.
- **Exportar backup:** gera um arquivo `.json` com todos os currículos (em *Configurações* ou *Meus currículos*). Também é possível exportar um currículo individual pelo editor ou pela biblioteca.
- **Importar backup:**
  - O arquivo é validado: formato, tamanho máximo de 5 MB, até 500 currículos e campos desconhecidos descartados.
  - Você escolhe entre **mesclar** com os currículos atuais (nada é sobrescrito) ou **substituir** tudo. A substituição pede confirmação.
- **Apagar todos os dados:** pede confirmação e oferece baixar um backup antes.

---

## Imprimir e salvar em PDF

O botão **PDF** ("Imprimir / Salvar como PDF") abre a janela de impressão do navegador (`window.print()`). Para gerar o arquivo PDF:

1. Em **Destino**, escolha **Salvar como PDF** (ou "Microsoft Print to PDF").
2. Use papel **A4** e margens **Padrão** (ou "Nenhuma").
3. Se as cores de destaque não aparecerem, ative **Gráficos de plano de fundo**. O texto continua legível mesmo sem cores.

O app **não gera o PDF diretamente**: quem cria o arquivo é o navegador. A folha de impressão:
- tem formato A4 (210 × 297 mm), com `@page` e `@media print`;
- esconde toda a interface do editor;
- quebra as páginas da mesma forma que a pré-visualização;
- evita títulos sozinhos no fim da página;
- pode numerar as páginas.

---

## Estrutura de pastas

```
CM-Studio/
├── index.html              # Estrutura do app, ícones SVG e ordem dos scripts
├── README.md               # Este arquivo
├── LICENSE                 # Licença MIT
├── assets/
│   ├── icons/              # favicon.svg, logo.svg, apple-touch-icon.png, icon-512.png
│   └── images/             # cm-studio-cover.svg (capa do README)
├── css/
│   ├── tokens.css          # Cores, tipografia, espaçamentos (temas claro e escuro)
│   ├── base.css            # Reset, tipografia base, foco, movimento reduzido
│   ├── layout.css          # Cabeçalho, navegação, rodapé, contêineres
│   ├── components.css      # Botões, campos, diálogos, avisos, abas
│   ├── home.css            # Início, biblioteca, criação guiada, ajuda
│   ├── editor.css          # Editor e área de pré-visualização
│   ├── templates.css       # Os 9 modelos de currículo (página A4)
│   ├── responsive.css      # Ajustes para tablet e celular
│   └── print.css           # Regras de impressão A4
├── js/
│   ├── utils.js            # Utilidades (criação segura de elementos, datas, downloads)
│   ├── catalog.js          # Tipos de currículo, seções, campos e modelo de dados
│   ├── validation.js       # Validação, sanitização e revisão do documento
│   ├── storage.js          # Leitura e gravação no localStorage
│   ├── state.js            # Documento aberto, salvamento automático, desfazer/refazer
│   ├── templates.js        # Definição dos 9 modelos
│   ├── preview.js          # Renderização A4 e paginação
│   ├── samples.js          # Dados fictícios para as miniaturas dos modelos
│   ├── suggestions.js      # Sugestões de texto locais (exemplos editáveis)
│   ├── ui.js               # Avisos, diálogos de confirmação, foco
│   ├── export-import.js    # Backup JSON (exportar, validar, importar)
│   ├── print.js            # Preparação para impressão
│   ├── editor.js           # Tela do editor
│   ├── home.js             # Tela inicial e central de ajuda
│   ├── new-document.js     # Criação guiada
│   ├── library.js          # Meus currículos
│   ├── settings.js         # Configurações
│   └── app.js              # Rotas (#/inicio, #/editor/…) e inicialização
└── tests/
    ├── unit-tests.html     # Testes unitários — abra no navegador
    ├── unit-tests.js
    └── e2e/
        └── e2e_test.py     # Teste ponta a ponta (opcional, para desenvolvedores)
```

---

## Arquitetura

- **Sem build:** scripts clássicos carregados em ordem pelo `index.html`, organizados no namespace `window.CM`. Isso permite abrir o arquivo direto (`file://`), coisa que módulos ES não permitem sem servidor.
- **Rotas por hash:** `#/inicio`, `#/novo`, `#/editor/<id>`, `#/biblioteca`, `#/configuracoes`, `#/ajuda`. Rotas desconhecidas mostram uma página "não encontrada".
- **Modelo de dados:** cada currículo é um objeto JSON (`schemaVersion: 1`) com dados pessoais, design e uma lista ordenada de seções. Cada seção tem tipo, título, visibilidade e conteúdo, que pode ser texto, lista de itens ou etiquetas.
- **Renderização:** o mesmo código gera a pré-visualização, as miniaturas e a versão impressa. Assim, o que você vê é o que será impresso.

---

## Testes

### Testes unitários (qualquer pessoa pode rodar)
Abra `tests/unit-tests.html` no navegador. São **21 testes**, que cobrem:
- validação de e-mail, telefone e URLs;
- criação dos 11 tipos e regras do modo escolar;
- sanitização e validação de backup;
- armazenamento de documentos independentes;
- importação (mesclar e substituir);
- desfazer e refazer, e troca de tipo sem perda de dados;
- ordenação por data;
- renderização segura e A4 dos 9 modelos, e paginação de conteúdo longo;
- revisão e nome do app.

O teste faz backup dos seus dados do CM Studio antes de começar e os restaura no final.

### Teste ponta a ponta (opcional, para desenvolvedores)
`tests/e2e/e2e_test.py` usa o Playwright para simular uma pessoa usando o app no Chromium:
- criar currículos e preencher campos;
- validar campos e usar sugestões;
- reordenar, ocultar e excluir seções, e desfazer;
- trocar os 9 modelos e conferir o salvamento automático depois de recarregar;
- usar a biblioteca, o backup (exportar, importar e arquivos inválidos) e a impressão em PDF A4;
- testar o celular e o tema escuro.

```bash
pip install playwright
python -m playwright install chromium
python tests/e2e/e2e_test.py
```

As capturas de tela e o PDF gerados ficam na pasta temporária do sistema (`cm-studio-e2e`).

---

## Acessibilidade e segurança

**Acessibilidade:**
- Navegação completa por teclado, foco visível e "pular para o conteúdo".
- Rótulos em todos os campos e mensagens de erro ligadas ao campo.
- Abas com padrão ARIA e diálogos nativos (`<dialog>`) que mantêm o foco dentro da janela e o devolvem ao fechar.
- Contraste adequado nos dois temas.
- Respeito a `prefers-reduced-motion`.
- Alvos de toque confortáveis e sem rolagem horizontal no celular.

**Segurança e privacidade:**
- Todo texto do usuário é inserido com `textContent`, nunca como HTML.
- Os links são validados (apenas `http`, `https` e `mailto`).
- Os backups importados são validados e sanitizados.
- Não há rastreamento, analytics, cookies nem recursos externos, e os dados nunca são registrados no console.

---

## Limitações conhecidas

- **Sem nuvem:** os dados ficam apenas no navegador e no endereço em que foram criados. Faça backups.
- **PDF via navegador:** o resultado final (margens, cabeçalhos e rodapés do navegador) depende das opções escolhidas na janela de impressão. Desative "Cabeçalhos e rodapés" do navegador para um resultado limpo.
- **Contagem de páginas aproximada:** a pré-visualização usa as mesmas medidas da impressão, mas fontes e motores de renderização de navegadores diferentes podem causar pequenas variações.
- **Sem foto no currículo:** é uma decisão de projeto, em linha com recomendações comuns no Brasil e com a privacidade de estudantes.
- **ATS:** o modelo ATS segue boas práticas, mas não há garantia de compatibilidade total com todos os sistemas.
- **Sugestões de texto:** são exemplos fixos e genéricos. Adapte sempre à sua realidade e não declare nada que não seja verdadeiro.
- **Limite de armazenamento:** o `localStorage` costuma ter cerca de 5 MB por site, o que é suficiente para muitos currículos de texto. O app avisa se não conseguir salvar.

---

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
