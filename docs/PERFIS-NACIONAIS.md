# Perfis nacionais do CM Studio

Este documento descreve os 16 perfis de país do CM Studio (15 países + "Outros países"). A tabela foi **gerada a partir dos próprios arquivos de perfil** (`js/countries/*.js`) em 15/10/2026, para não divergir do aplicativo.

> **Importante.** Os perfis descrevem *convenções* de currículo encontradas em fontes oficiais ou institucionais. Eles **não são aconselhamento jurídico** e não substituem as instruções da vaga, da empresa ou da instituição. Quando a vaga pedir algo diferente, siga a vaga.

## O que significa cada status

| Status | Significado |
|---|---|
| **Verificado** | As orientações principais foram conferidas em pelo menos uma fonte oficial ou institucional, consultada em 15/10/2026. Pontos que a fonte não cobre aparecem como "não verificado" no próprio perfil. |
| **Parcial** | Há fontes oficiais, mas elas cobrem só parte das orientações (caso do Brasil: não existe guia federal de formato de currículo). |
| **Preliminar** | Não foi obtida fonte nacional oficial; o perfil se apoia em fonte local/limitada (caso dos Países Baixos). |
| **Genérico** | "Outros países": modelo neutro, sem nenhuma verificação de regras locais. |

Prioridade de profundidade definida no projeto: Brasil, EUA, Reino Unido, Canadá, Austrália, Alemanha, França, Portugal e Japão. Espanha, Itália, Irlanda, Nova Zelândia e Suíça têm perfis mais curtos, baseados em uma única fonte cada.

## Tabela-resumo

| País | Código | Status | Documento principal | Idiomas sugeridos | Papel | Foto | Páginas (profissional) | Modelo inicial | Fontes |
|---|---|---|---|---|---|---|---|---|---|
| Brasil | BR | Parcial | Currículo | Português (Brasil) | A4 | Não incluir foto (orientação da fonte) | até 2 † | `corporate` | 2 |
| Estados Unidos | US | Verificado | Résumé | Inglês (Estados Unidos) | Letter | Não incluir foto (orientação da fonte) | até 1 † | `usResume` | 2 |
| Reino Unido | UK | Verificado | CV | Inglês (Reino Unido) | A4 | Normalmente sem foto (não verificado na fonte) | até 2 † | `classic` | 1 |
| Canadá | CA | Verificado | Résumé | Inglês (Canadá), Francês (Canadá) | Letter | Não incluir foto (orientação da fonte) | até 2 | `ats` | 1 |
| Austrália | AU | Verificado | Resume | Inglês (Austrália) | A4 | Sem orientação verificada sobre foto | até 3 | `classic` | 1 |
| Alemanha | DE | Verificado | Lebenslauf | Alemão (Alemanha), Inglês (Reino Unido) | A4 | Foto é comum, mas opcional | até 2 † | `lebenslauf` | 1 |
| França | FR | Verificado | CV | Francês (França), Inglês (Reino Unido) | A4 | Foto opcional | até 2 † | `classic` | 1 |
| Portugal | PT | Verificado | Curriculum Vitae | Português (Portugal), Inglês (Reino Unido) | A4 | Foto é comum, mas opcional | até 2 | `classic` | 1 |
| Japão | JP | Verificado | 履歴書 + 職務経歴書 | Japonês, Inglês (Estados Unidos) | A4 | Foto é comum, mas opcional | até 2 | `jpRirekisho` | 3 |
| Espanha | ES | Verificado | Currículum vítae | Espanhol (Espanha), Inglês (Reino Unido) | A4 | Foto opcional | até 2 | `classic` | 1 |
| Itália | IT | Verificado | Curriculum vitae | Italiano (Itália), Inglês (Reino Unido) | A4 | Foto opcional | até 2 † | `europass` | 1 |
| Irlanda | IE | Verificado | CV | Inglês (Irlanda) | A4 | Sem orientação verificada sobre foto | até 2 | `classic` | 1 |
| Países Baixos | NL | Preliminar | Curriculum vitae | Neerlandês (Países Baixos), Inglês (Reino Unido) | A4 | Foto é comum, mas opcional | até 2 | `classic` | 1 |
| Nova Zelândia | NZ | Verificado | CV | Inglês (Nova Zelândia) | A4 | Não incluir foto (orientação da fonte) | até 2 | `ats` | 1 |
| Suíça | CH | Verificado | CV / Lebenslauf | Alemão (Suíça), Francês (Suíça), Italiano (Suíça), Inglês (Reino Unido) | A4 | Foto é comum, mas opcional | até 3 | `lebenslauf` | 1 |
| Outros países | XX | Genérico | CV / résumé | Inglês (Estados Unidos), Inglês (Reino Unido) | A4 | Sem orientação verificada sobre foto | até 2 † | `classic` | 0 |

Observações sobre a tabela:

- **Papel:** Letter (216 × 279 mm) nos EUA e no Canadá, A4 (210 × 297 mm) nos demais. Esse dado vem do **padrão de papel do país**, não das fontes de currículo; algumas fontes (Irlanda, Portugal, Espanha, Países Baixos) citam A4 explicitamente. O papel pode ser trocado manualmente em qualquer documento; o CM Studio avisa quando ele difere do padrão do país.
- **Foto:** nunca é obrigatória no CM Studio e começa desativada. "Não incluir foto (orientação da fonte)" só aparece quando a fonte consultada diz isso. No Reino Unido a fonte não trata de foto, por isso o rótulo é "Normalmente sem foto (não verificado na fonte)".
- **Páginas:** orientação para currículo profissional. **†** = a fonte não fixa esse número; é uma convenção usada pelo CM Studio (o próprio app mostra essa ressalva). Sem †, o limite vem da fonte citada. CV acadêmico (pesquisa/pós-graduação) não tem limite fixo — o guia de Harvard GSAS diz que a maioria tem de 2 a 5 páginas.
- **Finalidades:** todos os países oferecem profissional, primeiro emprego, estágio, escolar, admissão universitária, bolsa, pesquisa, intercâmbio, voluntariado, acadêmico estendido e personalizado. **Jovem aprendiz** aparece só no Brasil (programa definido pela Lei 10.097/2000, conforme o Ministério do Trabalho).

## Detalhes por país

### Brasil (BR) — Parcial

Currículo objetivo, normalmente de 1 a 2 páginas, sem foto e sem documentos pessoais. Direcione o conteúdo para a vaga.

- **Verificação:** Não foi encontrada uma orientação federal (gov.br) sobre formato de currículo. As regras do programa Jovem Aprendiz vêm do Ministério do Trabalho; as recomendações de conteúdo vêm de um guia da Prefeitura de São Paulo. O restante segue as convenções do CM Studio, indicadas como não verificadas.
- **Data da verificação:** 15/10/2026
- **Foto:** Não incluir foto (orientação da fonte). Foto não é exigida. O guia da Prefeitura de São Paulo recomenda não incluir foto. Inclua só se o processo pedir.
- **Páginas (profissional):** até 2. Referência de até 2 páginas usada pelo CM Studio (convenção, não verificada em fonte oficial).
- **Papel:** A4 · **Idiomas sugeridos:** Português (Brasil) · **Modelos preferidos:** Clássico, Corporativo, Moderno
- **Fontes:**
  - [Aprendizagem profissional: regras, direitos e funcionamento do contrato de aprendizagem](https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/julho/aprendizagem-profissional-regras-direitos-e-funcionamento-do-contrato-de-aprendizagem) — Ministério do Trabalho e Emprego (gov.br), consultada em 15/10/2026. Embasa: Faixa etária, duração e jornada do contrato de aprendizagem; frequência escolar.
  - [Como preparar um currículo](https://prefeitura.sp.gov.br/web/desenvolvimento/w/dicas/preparar_um_curriculo/619) — Prefeitura de São Paulo — SMDET, consultada em 15/10/2026. Embasa: Direcionar para a vaga; evitar foto, pretensão salarial, RG, CNH e CPF; não usar pronomes pessoais. (Página antiga, cerca de 2009.)

### Estados Unidos (US) — Verificado

Résumé conciso, em ordem cronológica inversa, sem foto, idade ou gênero e sem lista de referências. Para pesquisa e pós-graduação usa-se o CV acadêmico, mais longo.

- **Verificação:** Orientações de résumé e CV acadêmico conferidas nos guias do serviço de carreiras da Universidade Harvard (FAS Mignone Center for Career Success). É uma fonte institucional universitária, não governamental. O portal usa.gov não foi consultado.
- **Data da verificação:** 15/10/2026
- **Foto:** Não incluir foto (orientação da fonte). O guia de Harvard orienta não incluir foto, idade ou gênero.
- **Páginas (profissional):** até 1. Conciso. Uma página é comum no início de carreira (convenção não fixada pela fonte).
- **Papel:** Letter · **Idiomas sugeridos:** Inglês (Estados Unidos) · **Modelos preferidos:** Résumé norte-americano, ATS (leitura automatizada), Clássico
- **Fontes:**
  - [Create a Strong Resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/) — Harvard FAS — Mignone Center for Career Success, consultada em 15/10/2026. Embasa: Linguagem, ordem cronológica inversa, sem foto/idade/gênero, sem referências, adaptar à vaga.
  - [GSAS CV & Cover Letter Guide](https://careerservices.fas.harvard.edu/resources/gsas-cv-cover-letter-guide-2/) — Harvard FAS — Mignone Center for Career Success, consultada em 15/10/2026. Embasa: Seções do CV acadêmico; sem limite de páginas (2 a 5 é o mais comum); margens de 3/4 a 1 pol.

### Reino Unido (UK) — Verificado

CV com seções claras (contato, apresentação, formação, experiência, referências), sem idade, data de nascimento, estado civil ou nacionalidade.

- **Verificação:** Conteúdo e dados pessoais conferidos no National Careers Service (gov.uk). Foto e número de páginas não são tratados na página consultada.
- **Data da verificação:** 15/10/2026
- **Foto:** Normalmente sem foto (não verificado na fonte). A página consultada não trata de foto. Não incluir foto é a prática comum no Reino Unido (não verificado na fonte).
- **Páginas (profissional):** até 2. Duas páginas é uma convenção comum (não fixada pela página consultada).
- **Papel:** A4 · **Idiomas sugeridos:** Inglês (Reino Unido) · **Modelos preferidos:** Clássico, ATS (leitura automatizada), Minimalista
- **Fontes:**
  - [CV sections](https://nationalcareers.service.gov.uk/careers-advice/cv-sections) — National Careers Service (gov.uk), consultada em 15/10/2026. Embasa: Seções, fonte e tamanho, dados pessoais que não devem constar, referências sob pedido, formação primeiro no início da carreira.

### Canadá (CA) — Verificado

Currículo claro e conciso de até duas páginas, adaptado à vaga, sem foto e sem dados pessoais como idade, estado civil ou religião.

- **Verificação:** Orientações conferidas no Job Bank, do Governo do Canadá. O tamanho do papel não é tratado na fonte.
- **Data da verificação:** 15/10/2026
- **Foto:** Não incluir foto (orientação da fonte). O Job Bank informa que incluir foto "não é a norma no Canadá".
- **Páginas (profissional):** até 2. Limite de duas páginas (Job Bank).
- **Papel:** Letter · **Idiomas sugeridos:** Inglês (Canadá), Francês (Canadá) · **Modelos preferidos:** ATS (leitura automatizada), Clássico, Résumé norte-americano
- **Fontes:**
  - [How to write a good resume](https://www.jobbank.gc.ca/findajob/resources/write-good-resume) — Job Bank — Government of Canada, consultada em 15/10/2026. Embasa: Duas páginas, adaptar à vaga, sem foto, sem dados pessoais, nunca o SIN, referências em folha separada, voluntariado.

### Austrália (AU) — Verificado

Resume de 1 a 3 páginas, conforme o tempo de experiência, com títulos e tópicos, pontos fortes de carreira e referees (pessoas de referência).

- **Verificação:** Orientações conferidas no site do Governo de Queensland (governo estadual; página atualizada em 27/04/2022). Não foi consultada fonte federal. A fonte não trata de foto nem de dados pessoais sensíveis.
- **Data da verificação:** 15/10/2026
- **Foto:** Sem orientação verificada sobre foto. A fonte consultada não trata de foto. Na dúvida, não inclua (o CM Studio deixa desativado).
- **Páginas (profissional):** até 3. De 1 a 3 páginas, conforme o tempo de experiência (Governo de Queensland).
- **Papel:** A4 · **Idiomas sugeridos:** Inglês (Austrália) · **Modelos preferidos:** Clássico, ATS (leitura automatizada), Minimalista
- **Fontes:**
  - [Write a resume](https://www.qld.gov.au/jobs/finding/resume) — Queensland Government, consultada em 15/10/2026. Embasa: Resume vs CV, 1 a 3 páginas, títulos e tópicos, conteúdo esperado, referees, cover letter de uma página, critérios de seleção.

### Alemanha (DE) — Verificado

Lebenslauf em formato de tabela, com experiência e formação em ordem cronológica inversa, idiomas com níveis do QECR (ex.: Englisch C1) e, em geral, Anschreiben e certificados (Zeugnisse).

- **Verificação:** Orientações conferidas no portal oficial Make it in Germany, do Governo Federal. O portal da Agência Federal de Emprego (arbeitsagentur.de) não foi consultado.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto é comum, mas opcional. Segundo o Make it in Germany, é frequente esperar-se uma foto, mas há grandes diferenças entre setores. Continua opcional no CM Studio.
- **Páginas (profissional):** até 2. A fonte não fixa número de páginas; 1 a 2 é comum (não verificado).
- **Papel:** A4 · **Idiomas sugeridos:** Alemão (Alemanha), Inglês (Reino Unido) · **Modelos preferidos:** Lebenslauf tabular, Estilo Europass, Clássico
- **Fontes:**
  - [Applying for a job in Germany](https://www.make-it-in-germany.com/en/working-in-germany/job/application) — Make it in Germany — Governo Federal da Alemanha, consultada em 15/10/2026. Embasa: Formato em tabela, cronologia inversa, foto frequente mas variável, idiomas com QECR, Europass como guia, certificados e traduções, envio em PDF.

### França (FR) — Verificado

CV livre: não é obrigatório e a lei não define conteúdo. Costuma trazer coordenadas, percurso profissional e formação; a foto é opcional. As informações devem ter ligação direta com a vaga.

- **Verificação:** Regras conferidas no Service-Public.fr (ficha F33336, verificada pela DILA em 20/02/2026). A ficha trata do conteúdo e dos limites legais, não do layout.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto opcional. O Service-Public menciona "eventualmente uma fotografia de identidade": é opcional.
- **Páginas (profissional):** até 2. A fonte não fixa número de páginas; 1 página é comum no início de carreira (não verificado).
- **Papel:** A4 · **Idiomas sugeridos:** Francês (França), Inglês (Reino Unido) · **Modelos preferidos:** Clássico, Moderno, Minimalista
- **Fontes:**
  - [Curriculum vitae (CV) : quelles sont les règles ? (F33336)](https://www.service-public.fr/particuliers/vosdroits/F33336) — Service-Public.fr — DILA, consultada em 15/10/2026. Embasa: CV não obrigatório, sem menções legais obrigatórias, foto eventual, ligação direta com a vaga, informações discriminatórias, boa-fé.

### Portugal (PT) — Verificado

CV em ordem cronológica inversa, com 1 a 2 páginas, maiores realizações na metade superior da 1.ª página e formação profissional separada da educação. A fotografia é muitas vezes valorizada.

- **Verificação:** Orientações conferidas no portal EURES (Comissão Europeia), página sobre condições de vida e de trabalho em Portugal, datada de 03/07/2026.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto é comum, mas opcional. Segundo o EURES, "a inclusão de fotografia é muitas vezes valorizada". Continua opcional.
- **Páginas (profissional):** até 2. De 1 a 2 páginas (EURES).
- **Papel:** A4 · **Idiomas sugeridos:** Português (Portugal), Inglês (Reino Unido) · **Modelos preferidos:** Clássico, Estilo Europass, Moderno
- **Fontes:**
  - [Condições de vida e de trabalho: Portugal](https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-portugal_pt) — EURES — Comissão Europeia, consultada em 15/10/2026. Embasa: Cronologia inversa, 1 a 2 páginas, estrutura do CV, local de residência sem morada, fotografia valorizada, carta de 1 página, documentos só quando pedidos.

### Japão (JP) — Verificado

Dois documentos separados: o 履歴書 (formulário padronizado com dados, histórico escolar e profissional, licenças e motivação) e o 職務経歴書 (1 a 2 páginas detalhando a carreira). Quem tem bom inglês pode enviar também um résumé em inglês.

- **Verificação:** Conferido na Hello Work (Ministério da Saúde, Trabalho e Bem-Estar — MHLW) e no Tokyo Career Guide (Governo Metropolitano de Tóquio). As mudanças no formulário modelo do MHLW foram confirmadas por fontes secundárias que citam o anúncio do ministério.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto é comum, mas opcional. O Tokyo Career Guide descreve foto no 履歴書 (fundo branco ou azul liso, traje formal). Continua opcional no CM Studio: siga o que a empresa pedir.
- **Páginas (profissional):** até 2. 職務経歴書: 1 ou 2 páginas (Tokyo Career Guide).
- **Papel:** A4 · **Idiomas sugeridos:** Japonês, Inglês (Estados Unidos) · **Modelos preferidos:** 履歴書 (rirekisho), 職務経歴書 (shokumu keirekisho), Résumé norte-americano
- **Fontes:**
  - [応募書類の作成 (履歴書・職務経歴書)](https://www.hellowork.mhlw.go.jp/member/career_doc01.html) — Hello Work — MHLW, consultada em 15/10/2026. Embasa: 履歴書 como documento geral, 職務経歴書 cada vez mais pedido, folha de envio, formulário modelo do MHLW.
  - [TOKYO CAREER GUIDE — Step 1](https://www.tdh.metro.tokyo.lg.jp/english/road_to_tokyo/step1.php) — Tokyo Metropolitan Government, consultada em 15/10/2026. Embasa: Campos do 履歴書, foto, furigana, dados não exigidos, 職務経歴書 de 1 a 2 páginas, carta não exigida, résumé em inglês.
  - Mudanças no formulário modelo de 履歴書 do MHLW (sem link: fonte secundária) — Fontes secundárias (yodogawaroukyou.gr.jp, forest-sr.com) citando o anúncio do MHLW, consultada em 15/10/2026. Embasa: Campo de gênero opcional; remoção de deslocamento, dependentes e cônjuge. (Anúncio original não consultado diretamente.)

### Espanha (ES) — Verificado

Não há modelo único: adapte o CV a cada oferta, de preferência em até duas páginas A4. Modelos cronológico, funcional ou europeu (Europass); foto não obrigatória.

- **Verificação:** Orientações gerais conferidas no portal EURES (Comissão Europeia). Perfil de profundidade menor que os prioritários.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto opcional. Não é obrigatória, embora possa ser útil para algumas vagas (EURES).
- **Páginas (profissional):** até 2. Até duas páginas A4 (EURES).
- **Papel:** A4 · **Idiomas sugeridos:** Espanhol (Espanha), Inglês (Reino Unido) · **Modelos preferidos:** Clássico, Estilo Europass, Minimalista
- **Fontes:**
  - [Living and working conditions: Spain](https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-spain_en) — EURES — Comissão Europeia, consultada em 15/10/2026. Embasa: Sem modelo único, quatro modelos, duas páginas A4, foto não obrigatória, cópias só quando pedidas, linguagem direta, Europass como alternativa.

### Itália (IT) — Verificado

CV atualizado e adaptado à vaga, com autorização para o tratamento de dados pessoais. Foto e certificados só se forem pedidos. O Europass é uma opção.

- **Verificação:** Orientações gerais do portal EURES (Comissão Europeia), obtidas por trecho de busca da página datada de julho de 2026. Perfil de profundidade menor.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto opcional. Segundo o EURES, não é preciso anexar foto, salvo pedido específico.
- **Páginas (profissional):** até 2. A fonte não fixa número de páginas (2 é uma referência, não verificada).
- **Papel:** A4 · **Idiomas sugeridos:** Italiano (Itália), Inglês (Reino Unido) · **Modelos preferidos:** Estilo Europass, Clássico, Minimalista
- **Fontes:**
  - [Living and working conditions: Italy](https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-italy_en) — EURES — Comissão Europeia, consultada em 15/10/2026. Embasa: CV adaptado com carta, autorização de tratamento de dados, foto e certificados só se pedidos, Europass. (Conteúdo obtido por trecho de busca.)

### Irlanda (IE) — Verificado

CV claro de 1 a 2 páginas A4, com experiência mais recente primeiro e títulos em negrito. Para vagas anunciadas, envie sempre uma cover letter.

- **Verificação:** Orientações conferidas no JobsIreland (Department of Social Protection). A fonte oficial não trata de foto nem de data de nascimento.
- **Data da verificação:** 15/10/2026
- **Foto:** Sem orientação verificada sobre foto. A fonte oficial não trata de foto. O CM Studio deixa desativado; confirme com o empregador.
- **Páginas (profissional):** até 2. De 1 a 2 páginas A4 (JobsIreland).
- **Papel:** A4 · **Idiomas sugeridos:** Inglês (Irlanda) · **Modelos preferidos:** Clássico, ATS (leitura automatizada), Minimalista
- **Fontes:**
  - [Tips and Advice](https://jobsireland.ie/en-US/TipsandAdvicePage) — JobsIreland — Department of Social Protection, consultada em 15/10/2026. Embasa: Conteúdo do CV, 1 a 2 páginas A4, ordem da experiência, cover letter sempre.

### Países Baixos (NL) — Preliminar

Perfil preliminar: CV de até 2 páginas A4, informações mais importantes primeiro, cronologia inversa e adaptado a cada vaga. Foto não obrigatória, mas habitual segundo a fonte municipal.

- **Verificação:** Não foi obtida orientação nacional oficial (werk.nl/UWV). Este perfil usa apenas o portal de informações de um município (Krimpen aan den IJssel) e deve ser confirmado.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto é comum, mas opcional. A fonte municipal diz que a foto profissional não é obrigatória, mas é habitual. Fonte não nacional: confirme.
- **Páginas (profissional):** até 2. No máximo 2 páginas A4 (fonte municipal).
- **Papel:** A4 · **Idiomas sugeridos:** Neerlandês (Países Baixos), Inglês (Reino Unido) · **Modelos preferidos:** Clássico, Estilo Europass, Minimalista
- **Fontes:**
  - [Cv maken](https://www.krimpenwijzer.nl/is/een-vraag-over/werk-geld-en-uitkering/solliciteren/cv-maken) — Krimpenwijzer — Gemeente Krimpen aan den IJssel, consultada em 15/10/2026. Embasa: Dados pessoais, foto habitual não obrigatória, no máximo 2 folhas A4, cronologia inversa, PDF. (Fonte municipal.)

### Nova Zelândia (NZ) — Verificado

CV de até 2 páginas, simples e sem imagens, com personal statement, key skills ligadas ao anúncio, histórico em ordem inversa e referees.

- **Verificação:** Orientações conferidas no Tahatū Career Navigator, do Governo da Nova Zelândia (substituiu o careers.govt.nz).
- **Data da verificação:** 15/10/2026
- **Foto:** Não incluir foto (orientação da fonte). O Tahatū recomenda não usar imagens no CV.
- **Páginas (profissional):** até 2. Até 2 páginas, se possível (Tahatū).
- **Papel:** A4 · **Idiomas sugeridos:** Inglês (Nova Zelândia) · **Modelos preferidos:** ATS (leitura automatizada), Clássico, Minimalista
- **Fontes:**
  - [How to write a CV](https://tahatu.govt.nz/work/applying-for-a-job/how-to-write-a-cv) — Tahatū Career Navigator — New Zealand Government, consultada em 15/10/2026. Embasa: Duas páginas, sem imagens, personal statement, key skills, palavras-chave, referees, PDF.

### Suíça (CH) — Verificado

Dossiê de candidatura com carta, CV completo e sem lacunas de até três páginas (com dados pessoais e foto) e certificados de trabalho, diplomas e certificados em um PDF.

- **Verificação:** Orientações conferidas no arbeit.swiss (SECO, portal oficial; maio de 2026). Diferenças entre as regiões linguísticas não foram verificadas.
- **Data da verificação:** 15/10/2026
- **Foto:** Foto é comum, mas opcional. O arbeit.swiss lista os dados pessoais "incluindo fotografia". Continua opcional no CM Studio.
- **Páginas (profissional):** até 3. No máximo três páginas (arbeit.swiss).
- **Papel:** A4 · **Idiomas sugeridos:** Alemão (Suíça), Francês (Suíça), Italiano (Suíça), Inglês (Reino Unido) · **Modelos preferidos:** Lebenslauf tabular, Clássico, Estilo Europass
- **Fontes:**
  - [Tips on applying for jobs](https://www.arbeit.swiss/en/jobseekers/tips-on-applying-for-jobs) — arbeit.swiss — SECO, consultada em 15/10/2026. Embasa: Carta, CV de até 3 páginas sem lacunas, dados pessoais com foto, seções, certificados em PDF, referências sob pedido.

### Outros países (XX) — Genérico

Currículo neutro, sem foto e sem dados sensíveis por padrão. Ajuste conforme as orientações do país de destino.

- **Verificação:** Modelo neutro para países sem perfil próprio. Não há verificação de regras locais: confirme com o empregador, a instituição ou o serviço público de emprego do país.
- **Foto:** Sem orientação verificada sobre foto. Sem orientação verificada. O CM Studio deixa a foto desativada.
- **Páginas (profissional):** até 2. Referência de até 2 páginas usada pelo CM Studio (convenção, não verificada em fonte oficial).
- **Papel:** A4 · **Idiomas sugeridos:** Inglês (Estados Unidos), Inglês (Reino Unido) · **Modelos preferidos:** Clássico, ATS (leitura automatizada), Minimalista
- **Fontes:** nenhuma (perfil genérico).

## Como adicionar ou atualizar um país

1. Copie um perfil parecido em `js/countries/` (por exemplo, `ie.js`) para `js/countries/<código>.js` e altere `code`, `name`, `localName`, `languages`, `paper`, `photo`, `fields`, `templates`, `purposes`, `tips`, `warnings`.
2. Preencha `sources` com **apenas** páginas que você realmente leu: `title`, `publisher`, `url` (https), `accessed` (AAAA-MM-DD) e `supports` (o que a fonte embasa).
3. Defina `status` com honestidade (`verified`, `partial`, `preliminary` ou `generic`) e explique em `statusNote` o que **não** foi verificado.
4. Acrescente `<script src="js/countries/<código>.js"></script>` no `index.html` (depois de `js/countries/registry.js`) e em `tests/unit-tests.html`.
5. Se o país usar um idioma novo, crie o dicionário em `js/i18n/` (veja o README).
6. Rode os testes: o teste "perfis com status, data e fontes bem formadas" falha se faltar algum campo obrigatório, e o teste de estatísticas falha se houver percentuais no texto do perfil.
