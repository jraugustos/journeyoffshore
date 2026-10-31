# PRD Offshore Journey

Versão 1.3 · 30 de outubro de 2026 · Base de referência: `offshore_workshop_interativo_v17.html`

Offshore Journey é um workspace para conduzir workshops e organizar a definição das jornadas do Novo Banco Offshore. Ele conecta a experiência do cliente às áreas de operação, aos sistemas, às capacidades e aos dados necessários para prestar cada serviço. O resultado esperado é uma visão compartilhada do que está sendo proposto, do que foi validado e do que precisa de decisão.

A evolução seguirá duas etapas definidas pelo usuário: primeiro discutir e escolher a stack para uma aplicação com banco de dados persistente local e possibilidade de hospedagem na AWS ou em outros ambientes; depois construir o projeto na stack escolhida. A stack definida é Next.js, TypeScript, PostgreSQL e Prisma, com execução direta em Node.js e sem Docker por enquanto.

O acesso ao aplicativo deverá ficar bloqueado por senha antes de qualquer conteúdo do workspace ser disponibilizado. As macroetapas representadas pelos cards pretos deverão permitir adição e edição, assim como as frentes e os demais elementos do desenho.

A construção foi autorizada pelo usuário após a escolha da stack. A interface aprovada orienta a implementação. A senha é compartilhada pela equipe, o salvamento é automático e os dados continuam exportáveis. Hospedagem e publicação externa não foram solicitadas nesta etapa.

Este PRD descreve o comportamento encontrado no HTML, os requisitos confirmados pelo usuário e propostas de detalhamento para a evolução. Banco local com hospedagem possível, trava por senha e macroetapas adicionáveis e editáveis são requisitos confirmados. Os marcos e as capacidades de produtos bancários continuam com a natureza e a fonte registradas na base.

## Problema e resultado pretendido

As definições de uma nova operação bancária atravessam produtos, canais, experiência, comercial, operação e tecnologia. Uma lista de funcionalidades ou um roadmap isolado não explica quem executa cada etapa, por onde ela acontece, quais dados circulam e quais decisões ainda faltam.

O workspace reúne essas perspectivas em uma estrutura navegável. A equipe deve conseguir partir da visão completa do relacionamento, aprofundar uma frente, descrever seu processo padrão e suas variações, registrar decisões e transformar pendências em ações acompanháveis.

O produto deve permitir responder:

- Qual jornada está sendo desenhada e para quais perfis ela se aplica?
- Qual é o processo padrão e quais casos exigem um fluxo diferente?
- Quem atua, em qual canal, com qual área operacional e sistema?
- Quais capacidades e dados habilitam a etapa?
- Quais funcionalidades sustentam esse processo e de onde veio a referência?
- Qual é o marco proposto, quais decisões foram tomadas e o que impede o avanço?

Preencher uma célula indica completude do desenho. Validar um bloco indica uma decisão explícita da equipe. A cobertura declarada por um fornecedor é uma terceira informação, independente dessas duas.

## Pessoas e contextos de uso

Os papéis abaixo orientam o produto; não representam atribuições já feitas às pessoas cadastradas.

| Papel | Necessidade | Atividades principais |
| --- | --- | --- |
| Facilitador do workshop | Conduzir a discussão e registrar resultados | Navegar pelas frentes, editar registros e acompanhar o salvamento automático |
| Produto e experiência | Definir oferta, elegibilidade e jornadas | Mapear o processo padrão, os casos específicos, as exceções e os canais |
| Operação e comercial | Explicitar execução e responsabilidade | Associar áreas, descrever papéis, atendimento e tarefas assistidas |
| Tecnologia e arquitetura | Identificar habilitadores e dependências | Vincular sistemas, capacidades, fornecedores de dados e funcionalidades |
| Liderança e responsáveis por decisão | Entender avanço e pendências | Consultar acompanhamento, decisões, ações e marcos |

O uso principal atual é uma sessão local, operada por uma pessoa e compartilhada visualmente em uma reunião. JSON e HTML preenchido permitem continuar o trabalho e transportar uma cópia. O arquivo não oferece edição simultânea entre participantes.

## Diagnóstico do ponto de partida

### Estrutura técnica

O material recebido contém um HTML de 636.788 bytes, com interface em português, CSS, JavaScript e três bases JSON incorporadas. O aplicativo renderiza as telas no navegador e mantém um rascunho em `localStorage`. Um vínculo opcional com arquivo JSON usa a File System Access API e IndexedDB quando o navegador oferece suporte.

O HTML acumula camadas de alterações das versões 9 a 17, sobrepondo funções de renderização, edição, inicialização e migração. O título ainda identifica a versão 15 e o nome do HTML exportado aponta para a versão 13. Essa divergência dificulta identificar qual versão está em uso.

### Conteúdo e entidades existentes

| Item | Conteúdo identificado |
| --- | --- |
| Macroprocessos | 4: Prospecção; Onboarding; Usar, consultar e gerenciar produtos e serviços; Encerramento de relacionamento |
| Frentes | 8: Prospecção, Onboarding, Banking, Investimentos, Crédito, Cartão de crédito, Mortgage e Encerramento de relacionamento |
| Perfis | Private Offshore, Private Onshore, Special e Person e US Person |
| Matriz funcional | 85 funcionalidades: 47 de Cliente e 38 de Operação / Comercial |
| Catálogo de lançamento | 11 itens, incluindo Current Wealth Suite com 61 produtos listados |
| Cadastros iniciais | 7 pessoas e 11 capacidades; atores, canais, sistemas e áreas operacionais começam sem registros |
| Blueprint padrão | 22 etapas reais distribuídas nas frentes; Prospecção começa sem etapas |
| Casos no estado inicial executado | 8 casos padrão e 3 casos específicos de cartões |
| Conteúdo arquivado pela inicialização existente | 15 casos e 4 ofertas de Onboarding em `v13ArchivedDefaults` |
| CSD | 52 registros nas quatro frentes com conteúdo de discussão |
| Decisões e plano de ação | Estruturas disponíveis, sem registros iniciais |

A base bruta do HTML contém 26 casos e 19 ofertas. A inicialização antiga retira 15 casos e 4 ofertas da área ativa e os guarda em um arquivo interno. Por isso, o conteúdo embutido e o que aparece ao abrir o aplicativo têm contagens diferentes. A primeira evolução deve manter essa separação inicial sem repetir o arquivamento sobre novos registros criados pelo usuário.

Os perfis são classificações de contexto. US Person pode se sobrepor aos outros grupos; eles não devem ser tratados como segmentos mutuamente exclusivos.

### Prioridades e etapas iniciais

| Frente | Estado inicial | Etapas do caso padrão |
| --- | --- | --- |
| Prospecção | Não priorizado | A definir |
| Onboarding | Em definição | KYC, Convite e Abertura |
| Banking | Em definição | Cash in; Cash out; Cartão de débito; Consultar conta; Gerenciar conta e operação |
| Investimentos | Em definição | Consultar e acompanhar; Investir e movimentar; Relatórios e documentos; Consultar oferta; Integrar contas e canais; Planejamento e assessoria |
| Crédito | Não priorizado | Solicitar e analisar crédito |
| Cartão de crédito | Em definição | Solicitar cartão; Usar e gerenciar; Fatura e pagamento; Suporte e disputas; Benefícios |
| Mortgage | Não priorizado | Solicitar e originar mortgage |
| Encerramento de relacionamento | Em definição | Encerrar conta |

Os nomes e a ordem exatos das etapas são dados editáveis da sessão. Etapas propostas e estruturas de referência mantêm sua natureza registrada, sem se tornarem processos aprovados pela simples presença no mapa.

### Fontes registradas no HTML

A matriz atribui referências a `DeNovo Products & Launch Timeline v24` e `RFI analysis - Finxact.xlsx > Functional Requirements`. Outros conteúdos mencionam `Visioning Offshore 2030`. Esses documentos não acompanham a pasta; as atribuições descrevem a proveniência registrada no HTML e não uma nova validação das fontes.

Na matriz, 79 itens têm natureza “RFI + proposta de UX” e 6 são “Hipótese de experiência”. A cobertura declarada é: 61 itens plenos no ecossistema, 5 parciais, 15 via terceiros, 2 sem confirmação RFI e 2 que não atendem. Essas contagens descrevem a matriz recebida.

### Defeitos e riscos observados

| Prioridade | Achado | Consequência | Tratamento |
| --- | --- | --- | --- |
| P0 | A limpeza da versão 13 reconhece apenas `13.0` como versão já migrada | Casos específicos de Onboarding, Banking e Investimentos e ofertas de Onboarding podem sair da área ativa ao normalizar dados da versão 17 | Tornar a migração idempotente e preservar os novos registros |
| P0 | Uma camada de normalização acessa `formatVersion` quando a camada anterior retorna `null` | Importações inválidas geram erro técnico em vez de rejeição controlada | Validar a entrada e interromper a cadeia com segurança |
| P1 | Código e estilos estão concentrados no HTML e acumulam sobrescritas | Maior risco de regressões e alto custo de manutenção | Reconstruir o projeto na stack a definir, preservando os fluxos e dados relevantes |
| P1 | Alguns textos de acompanhamento ainda descrevem seis campos por etapa | A explicação não corresponde ao cálculo da versão 17 | Explicar sete dimensões e objetivo, totalizando oito verificações |
| P1 | Título, versão de dados e nome de exportação divergem | Dificuldade de suporte e identificação da sessão | Unificar a identificação da versão entregue |
| P1 | Há um script externo de instrumentação antes do elemento `html` | Uma abertura do arquivo pode fazer uma solicitação externa desnecessária ao funcionamento local | Remover a dependência na nova distribuição |
| P2 | Componentes antigos de modal, ícones e formulários seguem implementações diferentes | Experiência de teclado e manutenção inconsistentes | Consolidar componentes em uma etapa posterior |
| P2 | Mudanças em cadastros podem deixar referências sem resolução | Cobertura pode aparentar avanço apesar de vínculos incompletos | Evidenciar vínculos pendentes e ampliar a integridade referencial |

## Objetivos e limites

### Objetivos da evolução inicial

1. Construir a aplicação na stack definida, com banco persistente local e implantação possível na AWS ou em outro provedor.
2. Bloquear o acesso ao conteúdo até a validação da senha.
3. Permitir criar e editar macroetapas, sem depender dos quatro agrupamentos fixos do HTML atual.
4. Preservar o trabalho ao salvar, recarregar, importar, migrar e exportar uma sessão.
5. Manter a visão geral e a frente derivadas dos mesmos registros persistidos.
6. Manter utilizáveis os fluxos de workshop, apresentação e consulta, com progresso e validação claramente explicados.

### Fora do escopo inicial

- Executar abertura de conta, transferências, investimentos, análises de crédito ou outros serviços bancários.
- Conectar o workspace a core bancário, CRM, fontes de dados de clientes ou sistemas corporativos.
- Aprovar elegibilidade, controles regulatórios ou cobertura de fornecedores.
- Implantar contas individuais, permissões por papel ou colaboração simultânea, enquanto esses recursos não forem solicitados. A trava por senha faz parte do escopo obrigatório.
- Publicar o aplicativo ou compartilhar seu conteúdo externamente.
- Substituir o visual existente por uma nova marca ou um redesign completo.
- Converter automaticamente hipóteses e exemplos em decisões finais.

## Arquitetura da informação

| Área | Finalidade | Conteúdo e ações |
| --- | --- | --- |
| Acesso por senha | Liberar o uso do workspace | Entrada de senha, validação, erro de acesso e encerramento da sessão autenticada |
| Visão geral | Entender a jornada completa | Blueprint agregado, filtros, seleção de casos por frente e atalhos |
| Macroetapas | Organizar os agrupamentos representados pelos cards pretos | Adicionar, editar nome, posição e status, vincular frentes e excluir com confirmação do impacto |
| Frente | Trabalhar um recorte específico | Blueprint, oferta e recorte, AS-IS, CSD e decisões, plano de ação |
| Acompanhamento | Ler avanço e responsabilidade | Cobertura, validações, casos específicos, dúvidas e ações |
| Launch Timeline | Consultar a sequência de disponibilização | Day-1, Releases A a D, produtos, funcionalidades e dependências |
| Funcionalidades | Consultar a matriz e sua classificação | Busca, filtros, detalhes, RFI, cobertura e vínculo com a frente |
| Cadastros e responsáveis | Manter vocabulário compartilhado | Pessoas, atores, canais, operação, sistemas, capacidades e vínculos |
| Arquivos e exportações | Salvar e transportar o trabalho | JSON, HTML preenchido, CSV e impressão |

## Fluxos essenciais

### Iniciar ou retomar uma sessão

1. Acessar a aplicação executada localmente ou no ambiente hospedado.
2. Exibir somente a tela de acesso enquanto a senha não tiver sido validada.
3. Validar a senha na camada responsável pelo controle de acesso e abrir uma sessão autenticada.
4. Somente após a validação, carregar os dados persistidos no banco e disponibilizar a navegação do workspace.
5. Permitir importar o trabalho anterior. A configuração da sessão não integra a navegação atual.
6. Mostrar se as alterações foram efetivamente persistidas e seguir para uma frente.

A base persistente da nova aplicação será o banco de dados. A importação de JSON será um caminho de migração do HTML existente; `localStorage` não será a fonte principal do projeto reconstruído.

### Criar e editar macroetapas

1. Após o acesso por senha, acionar a criação de uma macroetapa.
2. Definir seu nome e os atributos de organização adotados no modelo, incluindo ordem e status. Responsáveis são definidos por contexto/produto e capacidade.
3. Adicionar frentes ou associar frentes existentes ao agrupamento.
4. Editar o card preto para atualizar a macroetapa, preservando seu identificador e os conteúdos associados.
5. Refletir a alteração no blueprint, na navegação e no acompanhamento a partir dos mesmos registros do banco.

### Construir o blueprint

1. Selecionar a frente e o caso padrão ou um caso específico.
2. Criar ou editar as etapas, mantendo uma ordem explícita.
3. Associar atores, canais, áreas operacionais, sistemas e capacidades.
4. Descrever os dados necessários e quem os fornece, ou marcar que não há dados adicionais.
5. Definir atendimento, objetivo do processo, status e marco quando discutidos.
6. Consultar o mesmo resultado na visão geral, sem duplicar as etapas.

### Trabalhar uma variação

1. Criar um caso específico com nome, contexto e perfis aplicáveis.
2. Começar vazio ou copiar etapas de um caso existente.
3. Editar a cópia de forma independente, com novos identificadores para etapas e dados.
4. Registrar gatilho, necessidade, resultado e exceções.
5. Alternar entre os casos sem alterar o processo padrão.

### Decidir e encaminhar

1. Registrar uma certeza, suposição ou dúvida com contexto, fonte e responsável quando conhecido.
2. Criar uma decisão vinculada à discussão.
3. Exigir responsável e justificativa para uma decisão final.
4. Preservar o histórico das mudanças da decisão.
5. Transformar uma pendência em ação com critério de conclusão, responsável, prioridade e prazo quando definido.

### Salvar e transportar

1. Persistir no banco as alterações confirmadas, com indicação de sucesso ou falha.
2. Permitir gerar backups e exportações dentro da sessão autenticada.
3. Restaurar ou importar dados sem substituir parcialmente um trabalho válido.
4. Transferir a base entre instalação local e ambiente hospedado conforme a estratégia definida na escolha da stack.
5. Rejeitar JSON inválido sem alterar o trabalho já aberto.

O HTML preenchido autossuficiente é uma capacidade do material de referência. Sua continuidade na nova aplicação dependerá da compatibilidade com o controle de acesso; o requisito de senha prevalece sobre a distribuição de dados em um arquivo público.

## Requisitos funcionais

P0 indica preservação dos dados e fluxos indispensáveis. P1 indica capacidade necessária para uma sessão consistente. P2 indica ampliação posterior.

| ID | Prioridade | Requisito e critério de aceite |
| --- | --- | --- |
| RF01 | P0 | Recuperar o trabalho persistido no banco. Após editar, salvar e reiniciar a aplicação, casos, ofertas, macroetapas, frentes, etapas, decisões e cadastros permanecem disponíveis após autenticação, com os mesmos identificadores. |
| RF02 | P0 | Importar JSON de forma atômica. Dados válidos substituem a sessão somente após validação e eventual confirmação de substituição; erro ou cancelamento preserva a sessão aberta. |
| RF03 | P0 | Migrar schemas suportados sem descarte silencioso. O conteúdo anterior permanece nos registros ativos ou em arquivo identificado e acessível. Repetir a normalização não arquiva novos casos ou ofertas. |
| RF04 | P0 | Exportar JSON completo mediante acesso autenticado. Todos os registros da sessão, históricos, classificações e arquivos internos são incluídos. |
| RF05 | P1 | Oferecer exportações e relatórios compatíveis com o controle de acesso. JSON completo, CSV e HTML de consulta são os formatos adotados; dados do workspace não podem ser obtidos por rotas públicas de exportação. |
| RF06 | P1 | Manter dados da sessão com título, data, facilitador, participantes e objetivo. Campos vazios continuam vazios, sem preenchimento presumido. |
| RF07 | P1 | Manter macroetapas e frentes com nome e status editáveis; responsáveis pertencem às frentes (contextos/produtos). Alterar prioridade ou desativar não exclui dados. A criação de macroetapas é detalhada em RF37. |
| RF08 | P0 | Manter um caso padrão por frente. A visão geral e a tela da frente usam o mesmo objeto como origem das etapas. |
| RF09 | P1 | Criar e editar casos específicos com perfis, necessidade, gatilho, resultado e exceção. Eles continuam disponíveis após recarga e exportação. |
| RF10 | P1 | Copiar etapas com novos IDs, preservando referência à origem. Editar a cópia não altera o caso original. |
| RF11 | P1 | Criar, editar, ordenar e desativar etapas. Referências da matriz permanecem disponíveis se uma etapa for removida. |
| RF12 | P1 | Associar múltiplos atores e canais por etapa a partir dos cadastros. Nomes exibidos refletem o cadastro correspondente. |
| RF13 | P1 | Associar áreas operacionais e seus papéis na etapa. O papel da operação é independente da responsabilidade de uma pessoa pela frente. |
| RF14 | P1 | Associar sistemas e capacidades, preservando descrições e referências. Cadastro não implica participação automática em todas as frentes. |
| RF15 | P1 | Registrar dados necessários com nome, fornecedor do tipo sistema ou capacidade e observação opcional. Origem desconhecida fica a definir. |
| RF16 | P1 | Permitir marcar uma etapa sem dados adicionais. Essa opção não pode coexistir com uma lista de dados cadastrados. |
| RF17 | P1 | Classificar o objetivo como Contratar, Consultar, Gerenciar, Resgatar, Transacionar ou Cancelar, ou deixá-lo pendente. |
| RF18 | P1 | Vincular funcionalidades às etapas e permitir reclassificação, preservando os campos originais e a justificativa de alteração do marco quando informada. |
| RF19 | P1 | Consultar a matriz por ID, nome, contexto, público e marco. O detalhe mantém natureza, cobertura, RFI, observações e fonte. |
| RF20 | P1 | Definir oferta e recorte com problema, escopo incluído, exclusões e valor esperado. |
| RF21 | P1 | Manter produtos e serviços com condições de elegibilidade por perfil. “A definir” é diferente de “Não elegível”. |
| RF22 | P1 | Manter AS-IS com etapa, ambiente de execução e ator, preservando fontes e referências anteriores. |
| RF23 | P1 | Manter registros CSD com tipo, status, prioridade, responsável, prazo, próximo passo e evidência. |
| RF24 | P0 | Exigir responsável e justificativa para decisão final. Registrar o histórico quando uma decisão é criada, alterada ou revogada. |
| RF25 | P1 | Manter ações com descrição, critério de conclusão, responsável, prazo, prioridade, marco, status e origem. |
| RF26 | P1 | Calcular cobertura pelos dados do caso padrão e pelas frentes no ciclo. A interface explica os critérios e o denominador. |
| RF27 | P1 | Permitir validação manual dos cinco blocos, independente da cobertura automática. |
| RF28 | P1 | Filtrar blueprint por macroprocesso, perfil, marco e status sem modificar os dados da sessão. |
| RF29 | P1 | Exibir a timeline e permitir navegar para a frente e as funcionalidades relacionadas. Ordem de lançamento não representa prioridade de discussão. |
| RF30 | P1 | Manter cadastros de pessoas, atores, canais, áreas, sistemas e capacidades; permitir referências a registros inativos quando já utilizados. |
| RF31 | P1 | Exportar casos, CSD, plano de ação e acompanhamento em CSV, com acentos e proteção contra interpretação de texto como fórmula. |
| RF32 | P1 | Disponibilizar modo apresentação, recolhimento do menu e impressão da tela atual. |
| RF33 | Fora do escopo atual | A tela “Registros preservados” foi retirada por solicitação do usuário. Os dados históricos continuam preservados no backup JSON. |
| RF34 | P2 | Detectar referências quebradas e alterações concorrentes entre abas antes de uma gravação substituir outra sessão. |
| RF35 | P2 | Consolidar navegação, modais e formulários em componentes consistentes com foco e mensagens acessíveis. |
| RF36 | P0 | Bloquear o aplicativo por senha. Antes da validação, somente a tela de acesso fica disponível; páginas internas, APIs, dados, cadastros, fontes de dados estáticas e exportações não podem expor conteúdo do workspace por acesso direto. Senha incorreta mantém o bloqueio. Encerrar a sessão volta a bloquear o acesso. |
| RF37 | P0 | Permitir adicionar e editar as macroetapas representadas pelos cards pretos. Uma nova macroetapa pode receber nome próprio e frentes associadas; a edição atualiza todas as visões, preservando IDs e registros vinculados. Os agrupamentos não podem depender de uma lista fixa no código. |
| RF38 | P0 | Persistir a aplicação em banco de dados local. Dados e relações sobrevivem ao reinício do processo e do navegador; deve existir procedimento de backup e restauração. O mecanismo escolhido é PostgreSQL. |
| RF39 | P0 | Permitir executar o projeto localmente e hospedá-lo na AWS ou em outro ambiente compatível com a stack escolhida, com configuração de banco e credenciais por ambiente e procedimento de transferência dos dados. |
| RF40 | P0 | Salvar automaticamente as alterações, sem botão geral Salvar. Textos são enviados após breve pausa; seleções, vínculos e reordenações são enviados ao concluir a ação. O estado de sucesso depende da confirmação do banco. Falhas mantêm as alterações pendentes visíveis e permitem nova tentativa. |
| RF41 | P0 | Usar uma única senha compartilhada por todos do projeto, sem cadastro de usuário ou e-mail. Cada navegador recebe uma sessão de acesso; encerramento ou expiração volta a bloquear o conteúdo. |
| RF42 | P1 | Entregar ao time tech código funcional, dependências versionadas, migrações, procedimento de configuração, execução e backup, para hospedagem sem desenvolvimento adicional das funcionalidades entregues. Docker não é requisito da entrega atual. |
| RF43 | P1 | Permitir adicionar, substituir e remover a foto de uma pessoa. Aceitar JPG, PNG e WebP de até 5 MB, otimizar para 176 × 176 px e salvar automaticamente. Mostrar foto ou iniciais em cadastros, seletores e responsáveis vinculados. |
| RF44 | P1 | Selecionar país no cadastro da operação, com bandeiras de Brasil, EUA e Portugal; refletir o país na lista, nos seletores e nas etapas. Preservar países personalizados de importações. |
| RF45 | P1 | Escolher cor e ícone de atores, canais, operações, sistemas e capacidades; refletir a escolha em todas as tags vinculadas. Manter a biblioteca visual do HTML aprovado. |
| RF46 | P1 | Manter a paleta do HTML para horizontes: Day-1 vermelho, Release A amarelo, B verde, C azul e D roxo. Aplicar no blueprint, catálogo e timeline, incluindo nomes legados equivalentes a Day-1. |
| RF47 | P1 | Exibir o Launch Timeline em grade horizontal com Today / Now, Day-1 e Releases A–D, preparação e lançamento. Permitir filtrar, expandir e recolher, consultar produtos por categoria e abrir funcionalidades e frentes relacionadas; manter rolagem horizontal no celular. |
| RF48 | P1 | Remover o item “Configurar workshop” da navegação. Manter metadados já existentes nas exportações para preservar a continuidade. |

## Regras de negócio e integridade

### Hierarquia e identidade

- “Macroetapas” designa neste projeto os macroprocessos agrupadores representados pelos cards pretos do blueprint, como Prospecção e Onboarding. Esses agrupadores passam a ser registros adicionáveis e editáveis.
- Um macroprocesso agrupa frentes; cada frente pertence a um macroprocesso.
- Renomear uma macroetapa não muda seu identificador nem recria as frentes, casos ou etapas vinculados.
- Ao adicionar uma macroetapa, ela deve aparecer nas visões pertinentes sem alteração do código da aplicação.
- Cada frente possui exatamente um caso padrão e pode possuir casos específicos.
- Cada caso contém uma sequência ordenada de etapas.
- IDs estáveis identificam registros; nomes são editáveis e não devem servir como chave de relacionamento.
- Copiar um caso cria etapas e dados independentes, com referência à origem quando disponível.
- A desativação de um registro não equivale à exclusão do histórico.

### Acesso por senha

O bloqueio protege o conteúdo e as operações do workspace. Ocultar a interface com JavaScript, mantendo os dados embutidos no HTML ou disponíveis em uma rota sem autenticação, não atende ao requisito.

A arquitetura deve verificar o acesso antes de entregar dados, validar a senha na camada de serviço, armazenar sua representação protegida e manter credenciais fora do código do cliente. A duração padrão da sessão é de 12 horas. A configuração inicial e a troca da senha usam um procedimento local ou variáveis privadas do ambiente. Senhas e tokens não entram nas exportações do projeto.

Contas individuais e permissões por papel permanecem uma decisão separada. O requisito confirmado agora é uma trava de acesso por senha para o aplicativo inteiro.

### Blueprint e cobertura

Cada etapa possui sete dimensões do desenho: ator, canal, operação, sistema, capacidades, dados e atendimento. O objetivo do processo é uma classificação adicional. A cobertura da versão atual considera oito verificações:

| Verificação | Condição de preenchimento |
| --- | --- |
| Ator | Pelo menos um ator associado |
| Canal | Pelo menos um canal associado |
| Operação | Pelo menos uma área associada, com papel significativo em cada vínculo |
| Sistema | Pelo menos um sistema associado |
| Capacidades | Pelo menos uma capacidade associada ou descrição significativa |
| Dados | Dispensa explícita ou lista de dados nomeados com tipo e fornecedor cadastrados |
| Atendimento | Descrição significativa de como o atendimento acontece |
| Objetivo | Um dos seis objetivos disponíveis selecionado |

A cobertura é `verificações preenchidas ÷ verificações aplicáveis × 100`, arredondada para um inteiro. Cada etapa ativa do caso padrão contribui com oito verificações. Etapas desativadas ficam fora do cálculo. A opção “sem dados adicionais” satisfaz a verificação de dados porque registra uma conclusão explícita da equipe.

Na agregação, somam-se numeradores e denominadores das frentes no ciclo; não se tira uma média simples dos percentuais de cada frente. Frentes ou macroprocessos não priorizados ou desativados ficam fora dessa agregação, conforme a regra vigente.

Textos como “A definir”, “A detalhar”, “A validar”, “Pendente” ou um traço não contam como descrição concluída. Cobertura não substitui validação manual.

### Validação, marcos e natureza

Os cinco blocos de validação são Blueprint, Oferta e recorte, AS-IS, CSD e decisões e Plano de ação. Cada um admite A iniciar, Em construção e Validado.

Os marcos são Day-1 e Releases A, B, C e D. A base também preserva valores de origem como Atual → Day-1 e Sem fase definida. A apresentação pode normalizar equivalentes conhecidos sem apagar o texto original da fonte.

Uma funcionalidade pode ter marco original e marco revisto no workshop. Os dois devem continuar distinguíveis. Uma hipótese, proposta de classificação ou capacidade declarada só vira decisão final por ação explícita e com os campos exigidos.

### Persistência e migração

- O schema estrutural da base recebida é 4; `formatVersion` identifica a evolução do formato da aplicação.
- Schemas 1, 2 e 3 têm rotinas de migração; dados que não se encaixam na nova estrutura permanecem preservados.
- Uma entrada inválida não pode produzir atualização parcial da sessão.
- Normalizar novamente uma sessão atual deve preservar seus registros e IDs.
- O template é ponto de partida para uma nova sessão, não fonte para sobrescrever campos já preenchidos.
- Arquivos internos de migração acompanham a exportação; sua recuperação para áreas ativas exige revisão explícita.

## Modelo de dados

| Entidade | Campos principais | Relações |
| --- | --- | --- |
| Sessão | `schema`, `formatVersion`, `session`, `updatedAt` | Contém a base do workshop |
| Macroprocesso | `id`, `name`, `short`, `status`, `ownerIds`, `boards` | Agrupa frentes e referencia pessoas |
| Frente | `id`, `macroId`, `name`, `status`, `scope`, `ownerIds`, `blueprintProgress`, `progress` | Contém casos, ofertas, AS-IS, CSD, decisões e ações |
| Caso | `uid`, `boardId`, `macroId`, `title`, `ref`, `isDefault`, `profiles`, `need`, `trigger`, `result`, `exception`, `steps` | Pertence a uma frente e contém etapas |
| Etapa | `uid`, `name`, `objective`, `status`, `release`, `actorIds`, `channelIds`, `systemIds`, `operationLinks`, `capabilityIds`, `support`, `featureIds` | Referencia cadastros, funcionalidades e dados necessários |
| Dado necessário | `uid`, `name`, `providerKind`, `providerId`, `note` | Pertence à etapa e referencia sistema ou capacidade |
| Cadastro | `id`, `name`, `description`, `status`, `color`, `icon` | Tipos: pessoas, atores, canais, operação, sistemas e capacidades |
| Responsabilidade | `uid`, `capabilityId`, `context`, `personIds`, `role` | Liga capacidade e pessoas a uma frente ou macroprocesso |
| Oferta | `uid`, `title`, `detail`, `rules`, `horizon`, `nature`, `status`, `eligibility`, `eligibilityNotes` | Pertence a uma frente e classifica os perfis |
| Registro CSD | `uid`, `type`, `title`, `detail`, `stage`, `owner`, `deadline`, `priority`, `status`, `action`, `resolution`, `source` | Pertence a uma frente e pode originar uma ação |
| Decisão | `uid`, `title`, `status`, `rationale`, `owner`, `horizon`, `linkedQuestion`, `reference`, `decidedAt` | Possui histórico de eventos |
| Ação | `uid`, `title`, `detail`, `acceptance`, `owner`, `deadline`, `status`, `priority`, `horizon`, `source` | Pertence a uma frente |
| Funcionalidade | `id`, `publico`, `jornada`, `subjornada`, `funcionalidade`, `marco_produto`, `status_vendor`, `rfi_ids`, fontes | Referência original preservada; vínculo revisto em `featureRouting` |
| Item de lançamento | `id`, `name`, `phase`, `kind`, `prep`, `board`, `featureIds`, `products` | Referência da timeline |
| Arquivos de migração | `migrationArchive`, `sharedRecords`, `previousContext`, `v13ArchivedDefaults` | Preservam conteúdo anterior e contexto de origem |

O modelo acima descreve as entidades do HTML e orienta a migração. O esquema físico inicial está em `prisma/schema.prisma`; macroprocessos e frentes possuem relações próprias, e o conteúdo detalhado das frentes permanece em JSONB validado pelo servidor. Macroetapas deverão ser persistidas como entidades editáveis, e a configuração de acesso terá armazenamento protegido próprio.

O modelo atual ainda contém campos textuais antigos em etapas e estruturas anteriores de experiência. Eles devem continuar disponíveis durante a transição, sem virar uma segunda fonte independente do blueprint.

## Requisitos de experiência e qualidade

| ID | Requisito | Verificação |
| --- | --- | --- |
| RNF01 | Funcionamento local | A aplicação e seu banco podem executar no ambiente local, com procedimento documentado para iniciar, parar e restaurar dados. |
| RNF02 | Portabilidade de implantação | A stack pode ser hospedada na AWS ou em outro ambiente compatível; a implantação e a migração de dados não dependem obrigatoriamente de um serviço exclusivo de um provedor. |
| RNF03 | Manutenção | Interface, regras, acesso e persistência possuem responsabilidades claras, migrações de banco versionadas e processo de geração reproduzível na stack escolhida. |
| RNF04 | Compatibilidade | As funções centrais de persistência não dependem de APIs exclusivas de acesso a arquivos do navegador; os navegadores suportados serão definidos na arquitetura. |
| RNF05 | Integridade | Importação, recarga, cópia e exportação têm cenários de regressão cobrindo os registros criados pelo usuário. |
| RNF06 | Acessibilidade | Controles têm nomes acessíveis; navegação por teclado, foco visível e retorno de foco são revisados nos componentes consolidados. Mensagens de salvamento precisam ser anunciáveis. |
| RNF07 | Responsividade | A navegação e os editores se adaptam a celular; a matriz admite rolagem horizontal contida e orientação clara. |
| RNF08 | Texto e idioma | Interface em português, UTF-8, acentos, textos extensos e caracteres especiais preservados. |
| RNF09 | Desempenho | Medir abertura, filtro e edição com a base existente antes de estabelecer metas de tempo e capacidade para bases maiores. |
| RNF10 | Privacidade | Dados do workspace só são entregues após autenticação; nenhuma base com conteúdo protegido é publicada como arquivo estático acessível sem senha. Dados de teste não são dados reais de clientes. |
| RNF11 | Transparência | Indicadores distinguem alterações ainda não persistidas, gravação em andamento, sucesso e falha no banco. |
| RNF12 | Recuperação | Backups e restauração protegem a base. Falhas de gravação não devem ser apresentadas como sucesso nem causar substituição parcial dos dados. |
| RNF13 | Controle de acesso | Rotas e operações que entregam conteúdo exigem sessão autenticada. A senha não fica no código do navegador nem em texto aberto no banco; a implantação hospedada protege o transporte das credenciais. |

A direção visual permanece a existente: superfícies claras, texto escuro, laranja para ações e destaque, marcos com tons de azul e foco no blueprint. Alterações visuais iniciais devem servir à clareza e à operação, sem alterar informações de produto.

## Estratégia técnica

### Escolha da stack

A stack escolhida é Next.js com TypeScript e React para a aplicação, PostgreSQL para persistência e Prisma ORM para consultas e migrações. O projeto executa diretamente em Node.js. Docker fica fora da entrega atual.

Os critérios de escolha são: simplicidade para executar localmente; persistência e integridade das relações; suporte ao bloqueio por senha; manutenção dos blueprints e seus editores; backup e migrações; possibilidade de hospedar em AWS ou outros ambientes; e esforço operacional compatível com o uso esperado.

O PostgreSQL pode executar no ambiente local ou em uma instância acessível pela aplicação hospedada. O auxiliar nativo de desenvolvimento é opcional; a hospedagem pode usar o PostgreSQL do próprio ambiente.

### Construção após a definição

A implementação autorizada usa camada de acesso com senha compartilhada, banco persistente, salvamento automático, modelo editável de macroetapas e os fluxos identificados no HTML. O material existente serve como referência de produto, dados e comportamento, sem impor a arquitetura de um arquivo HTML único.

A implementação deve incluir migração controlada do conteúdo de referência e verificação dos novos requisitos antes de qualquer publicação. Edição simultânea, contas individuais e permissões avançadas dependem de definição adicional.

## Plano de entregas

Não há prazo ou orçamento aprovados. A stack e o início da implementação foram autorizados. A sequência confirmada pelo usuário é:

| Etapa | Entrega | Condição de conclusão |
| --- | --- | --- |
| 1 Definição da stack | Discutir e escolher tecnologias para a aplicação, banco local, senha e implantação | Stack definida com os critérios de persistência, acesso e hospedagem atendidos |
| 2 Construção | Implementar o projeto na stack escolhida, conforme solicitações do usuário | Fluxos migrados, acesso bloqueado por senha e macroetapas adicionáveis e editáveis com persistência no banco |

### Backlog imediato

| ID | Prioridade | Trabalho | Dependência |
| --- | --- | --- | --- |
| B01 | P0 | Manter PRD e referência original reconciliados com os pedidos do usuário | Nenhuma |
| B02 | P0 | Comparar e definir a stack para aplicação, banco, senha e hospedagem | Solicitação do usuário para iniciar a etapa 1 |
| B03 | P0 | Definir o esquema do banco e o plano de migração | B02 |
| B04 | P0 | Implementar a trava de senha em conteúdo, rotas e operações | Solicitação de construção e B02 |
| B05 | P0 | Implementar criação e edição de macroetapas com vínculos persistidos | B03 e B04 |
| B06 | P0 | Reconstruir os fluxos existentes na stack definida | B03 e B04 |
| B07 | P0 | Verificar autenticação, integridade, migração, backup e restauração | B05 e B06 |
| B08 | P1 | Documentar execução local e implantação em ambiente compatível | B07 |
| B09 | Retirado | Tela de recuperação de registros arquivados removida por solicitação; preservação no JSON mantida | B06 |
| B10 | P2 | Ampliar relações entre dúvidas, decisões e ações | B06 |

A implementação local deste backlog foi autorizada. Publicação, compartilhamento e implantação externa exigem solicitação correspondente.

## Verificação e critérios de entrega

### Cenários de regressão

| Cenário | Resultado esperado |
| --- | --- |
| Acessar o aplicativo sem senha ou com senha incorreta | Somente a tela de acesso é disponibilizada; conteúdo e dados permanecem bloqueados |
| Acessar diretamente página interna, API, arquivo de dados ou exportação sem sessão | Acesso negado, sem exposição do conteúdo do workspace |
| Informar a senha correta e depois encerrar a sessão | Conteúdo liberado durante a sessão e novamente bloqueado após o encerramento |
| Adicionar uma macroetapa e associar uma frente | Novo card preto, navegação e vínculo persistidos, sem editar código |
| Renomear e reorganizar uma macroetapa existente | Atualização em todas as visões com preservação dos IDs e dos conteúdos associados |
| Reiniciar aplicação e banco após salvar | Dados permanecem disponíveis após autenticação |
| Restaurar backup em outra instalação compatível | Registros e relações preservados, com configuração de acesso própria do ambiente |
| Criar caso em Onboarding, Banking e Investimentos e recarregar | Os três casos continuam ativos, com etapas e IDs iguais |
| Criar oferta de Onboarding e normalizar novamente | A oferta continua ativa e não entra no arquivo de limpeza antigo |
| Normalizar duas vezes uma sessão atual | Casos, ofertas, etapas e cadastros permanecem equivalentes |
| Importar JSON sintaticamente inválido ou schema desconhecido | Mensagem compreensível e sessão existente intacta |
| Importar estrutura com IDs duplicados | Rejeição anterior à substituição do estado |
| Migrar schema anterior | Registros anteriores permanecem ativos ou no arquivo de migração; o original completo é preservado quando aplicável |
| Copiar caso com dados necessários | Novos IDs; editar a cópia não modifica o original |
| Exportar e abrir JSON | Mesmos dados e relações após normalização |
| Exibir ou exportar textos com acentos, emoji e conteúdo semelhante a script | Texto preservado sem execução, dentro dos fluxos de acesso permitidos |
| Calcular cobertura em etapa vazia e em etapa preenchida | Oito verificações por etapa; dispensa de dados conta como decisão explícita |
| Navegar por todas as áreas | Sem erro de execução e com conteúdo acessível |
| Abrir em desktop e celular | Layout operável e rolagem da matriz contida |
| Executar a instalação local sem acesso à internet | Aplicação e banco locais disponíveis; senha continua obrigatória |

A construção na nova stack só é considerada entregue após verificar os requisitos de senha, macroetapas editáveis, persistência e preservação dos fluxos. Testes feitos no experimento HTML anterior não comprovam atendimento desses novos requisitos.

### Medidas de produto propostas

Medir em uso real: tempo para retomar uma sessão; dúvidas sem responsável; decisões finais com evidência; ações sem critério de conclusão; referências pendentes; facilidade para encontrar uma jornada; incidentes de perda ou substituição indevida de dados.

Não há metas de adoção ou produtividade definidas. Cobertura e validações descrevem o conteúdo do workshop e não medem a prontidão real de um banco para lançamento.

## Decisões em aberto

| Tema | Decisão necessária | Impacto |
| --- | --- | --- |
| Ambiente de hospedagem | Qual servidor, PostgreSQL, domínio e operação o time tech disponibilizará? | Configuração da implantação sem Docker |
| Público e distribuição | Uso pessoal, ferramenta de equipe ou produto corporativo? | Dimensionamento e operação; execução local e hospedagem já são requisitos |
| Configuração da senha | Como definir, trocar e recuperar a senha, e qual duração de sessão adotar? | Operação do controle de acesso obrigatório |
| Macroetapas | Quais atributos adicionais e regras de movimentação de frentes serão necessários? | Detalhamento do editor; adicionar e editar já são obrigatórios |
| Colaboração | Uma pessoa opera por sessão ou várias editam simultaneamente? | Persistência, conflitos e histórico |
| Governança | Quem pode marcar um bloco como validado e registrar decisão final? | Permissões e rastreabilidade |
| Vocabulário | Manter termos em inglês e nomes de perfis como no material ou criar glossário aprovado? | Consistência da interface |
| Documentos de referência | Quais arquivos originais devem ser ligados ao workspace e com qual controle de atualização? | Qualidade das fontes e manutenção da matriz |
| Dados arquivados | Manter os registros históricos no backup JSON | Tela de recuperação retirada do escopo atual |
| Critério de cobertura | Os oito itens devem manter o mesmo peso para todas as etapas? | Métrica e leitura de completude |
| Capacidade e suporte | Quais navegadores, volumes e ambientes precisam de suporte formal? | Testes e metas de desempenho |
| Marca e compartilhamento | Há diretrizes e permissões de uso dos ativos na distribuição pretendida? | Apresentação e publicação futura |

Os detalhamentos em aberto serão tratados conforme o uso e as próximas solicitações do usuário. A implementação local está autorizada; implantação externa e publicação ainda não foram solicitadas.

## Referências locais e continuidade

- [HTML original recebido](offshore_workshop_interativo_v17.html)
- [Documentação e referência experimental anterior](README.md)
- [Estado e sequência de trabalho acordada](STATUS.md)

O anexo a seguir inventaria as funcionalidades do material recebido. Nome, ID e marco original são referências da base, não compromissos de implementação do banco.

## Inventário das funcionalidades

| ID | Funcionalidade | Público | Marco original |
| --- | --- | --- | --- |
| F001 | Iniciar abertura por link | Cliente | Day-1 |
| F002 | Preencher formulário digital com reaproveitamento cadastral | Cliente | Day-1 |
| F003 | Escolher Checking e/ou Savings | Cliente | Day-1 |
| F004 | Enviar documentos e validar identidade (KYC/CIP) | Cliente | Day-1 |
| F005 | Aceitar termos e assinar digitalmente | Cliente | Day-1 |
| F006 | Acompanhar status da proposta e resolver pendências | Cliente | Sem fase definida |
| F007 | Ativar conta e receber dados bancários | Cliente | Day-1 |
| F008 | Adicionar cotitular, procurador ou responsável | Cliente | Sem fase definida |
| F009 | Consultar saldo disponível, contábil e retido | Cliente | Day-1 |
| F010 | Consultar lançamentos, histórico e extratos | Cliente | Day-1 |
| F011 | Baixar extratos e documentos da conta | Cliente | Day-1 |
| F012 | Receber depósitos e visualizar dados para ACH/Wire | Cliente | Day-1 |
| F013 | Consultar saldo e rendimento da Savings | Cliente | Day-1 |
| F014 | Configurar alertas de movimentação | Cliente | Sem fase definida |
| F015 | Gerenciar acesso delegado e permissões | Cliente | Sem fase definida |
| F016 | Solicitar encerramento da conta pelo canal | Cliente | Sem fase definida |
| F017 | Transferir entre contas próprias | Cliente | Atual → Day-1 |
| F018 | Realizar Wire Transfer nacional/internacional | Cliente | Atual → Day-1 |
| F019 | Enviar e receber transferências ACH | Cliente | Atual → Day-1 |
| F020 | Cadastrar beneficiários e configurar limites | Cliente | Sem fase definida |
| F021 | Agendar pagamentos e transferências recorrentes | Cliente | Sem fase definida |
| F022 | Acompanhar status, devoluções e comprovantes | Cliente | Sem fase definida |
| F023 | Pagar contas (Bill Pay) | Cliente | Sem fase definida |
| F024 | Enviar pagamentos P2P | Cliente | Release A |
| F025 | Consultar câmbio e converter moedas | Cliente | Sem fase definida |
| F026 | Solicitar emissão de cheque | Cliente | Atual → Day-1 |
| F027 | Solicitar cartão de débito próprio | Cliente | Release A |
| F028 | Emitir cartão virtual e adicionar à carteira digital (débito) | Cliente | Release A |
| F029 | Consultar compras e lançamentos do débito | Cliente | Release A |
| F030 | Bloquear/desbloquear débito e controlar limites | Cliente | Release A |
| F031 | Solicitar cartão de crédito próprio | Cliente | Release B |
| F032 | Consultar fatura, limite e compras do crédito | Cliente | Release B |
| F033 | Pagar fatura e acompanhar vencimento | Cliente | Release B |
| F034 | Contestar compras e acompanhar disputas | Cliente | Release B |
| F035 | Solicitar segunda via e acompanhar reemissão | Cliente | Release B |
| F036 | Visualizar cartões atuais Karta e Cornercard no novo canal | Cliente | Sem fase definida |
| F037 | Consultar pontos, cashback e benefícios | Cliente | Sem fase definida |
| F038 | Solicitar outros tipos de empréstimos | Cliente | Release C |
| F039 | Simular/solicitar mortgage | Cliente | Release C |
| F040 | Consultar carteira e posições de investimentos | Cliente | Atual → Day-1 |
| F041 | Consultar performance, rentabilidade e composição | Cliente | Atual → Day-1 |
| F042 | Baixar relatórios, statements e documentos fiscais | Cliente | Atual → Day-1 |
| F043 | Executar ordens e movimentar investimentos | Cliente | Atual → Day-1 |
| F044 | Consultar prateleira de ativos e produtos | Cliente | Atual → Day-1 |
| F045 | Visualizar contas Avenue integradas | Cliente | Release D |
| F046 | Acessar investimentos no mesmo aplicativo bancário | Cliente | Sem fase definida |
| F047 | Acessar serviços de planejamento patrimonial | Cliente | Release C |
| F048 | Criar convite de abertura e encaminhar cliente | Operação / Comercial | Sem fase definida |
| F049 | Consultar propostas, etapa e pendências de onboarding | Operação / Comercial | Day-1 |
| F050 | Validar KYC/CIP, OFAC e alertas de risco | Operação / Comercial | Day-1 |
| F051 | Solicitar e revisar documentos, pendências e exceções | Operação / Comercial | Day-1 |
| F052 | Aprovar, rejeitar ou devolver proposta para correção | Operação / Comercial | Day-1 |
| F053 | Configurar fluxos e exigências por segmento | Operação / Comercial | Day-1 |
| F054 | Gerenciar titulares, procuradores e poderes | Operação / Comercial | Day-1 |
| F055 | Acessar visão 360 de cliente, contas e vínculos | Operação / Comercial | Day-1 |
| F056 | Consultar saldos, histórico, holds e extratos | Operação / Comercial | Day-1 |
| F057 | Abrir, ajustar, encerrar e reativar contas | Operação / Comercial | Day-1 |
| F058 | Bloquear/desbloquear contas e aplicar restrições | Operação / Comercial | Day-1 |
| F059 | Manter cadastro, cotitularidade e permissões | Operação / Comercial | Day-1 |
| F060 | Gerir juros, tarifas e exceções comerciais | Operação / Comercial | Day-1 |
| F061 | Gerar statements, relatórios e extratos sob demanda | Operação / Comercial | Day-1 |
| F062 | Consultar trilha de auditoria e lançamentos operacionais | Operação / Comercial | Day-1 |
| F063 | Configurar ofertas de contas e condições comerciais | Operação / Comercial | Sem fase definida |
| F064 | Acompanhar filas, status e exceções ACH/Wire | Operação / Comercial | Atual → Day-1 |
| F065 | Aprovar operações acima de limites ou com restrições | Operação / Comercial | Sem fase definida |
| F066 | Investigar, devolver ou estornar transferências | Operação / Comercial | Sem fase definida |
| F067 | Aplicar filtros de AML/OFAC e bloqueios transacionais | Operação / Comercial | Atual → Day-1 |
| F068 | Conciliar movimentações, tarifas e canais | Operação / Comercial | Sem fase definida |
| F069 | Gerenciar lotes, agendamentos e recorrência | Operação / Comercial | Sem fase definida |
| F070 | Investigar transações P2P e resolver falhas | Operação / Comercial | Release A |
| F071 | Emitir, ativar e administrar cartões de débito | Operação / Comercial | Release A |
| F072 | Parametrizar bloqueios, limites e restrições de uso | Operação / Comercial | Release A |
| F073 | Controlar inventário, reemissão e relatórios | Operação / Comercial | Release A |
| F074 | Administrar ciclos de fatura, juros e pagamentos | Operação / Comercial | Release B |
| F075 | Tratar contestação e chargebacks | Operação / Comercial | Release B |
| F076 | Atender clientes Karta/Cornercard e acompanhar casos | Operação / Comercial | Sem fase definida |
| F077 | Gerir programas de pontos e benefícios | Operação / Comercial | Sem fase definida |
| F078 | Originação, underwriting e aprovação de empréstimos | Operação / Comercial | Release C |
| F079 | Originar mortgage com TRID/RESPA/TILA e HMDA | Operação / Comercial | Release C |
| F080 | Consultar posição e histórico consolidado do cliente | Operação / Comercial | Atual → Day-1 |
| F081 | Consultar ordens e movimentações da corretora | Operação / Comercial | Atual → Day-1 |
| F082 | Gerar relatórios patrimoniais e documentos | Operação / Comercial | Atual → Day-1 |
| F083 | Oferecer atendimento consultivo com visão de portfólio | Operação / Comercial | Sem fase definida |
| F084 | Integrar posição, contas e clientes Avenue | Operação / Comercial | Release D |
| F085 | Atender demandas de Wealth Planning / Trust | Operação / Comercial | Release C |


## Ajustes de fidelidade e gestão — 31/10/2026

1. Oferta deve apresentar, tanto na leitura quanto na edição: Problema (o que queremos resolver), Oferta, Recorte, Fora do recorte e Resultado esperado.
2. AS-IS deve ser uma lista numerada de etapas, editável e reordenável, com onde acontece, quem faz, referência e fonte.
3. CSD mantém as colunas Certezas/Suposições/Dúvidas, quadro de decisões, tabela de dúvidas, filtros e histórico. O plano de ação mantém cards de entregas com responsável, prazo, prioridade, horizonte, critério de conclusão e controle de conclusão.
4. Seletores exibem as escolhas como itens ativos removíveis, com busca e cadastro rápido sem abandonar o editor. O cadastro e o vínculo são persistidos juntos.
5. Responsáveis pelo contexto/produto coordenam o recorte. Responsáveis por capacidade respondem pela especialidade naquele contexto. Responsáveis de referência de uma capacidade são o padrão quando não há atribuição específica; uma atribuição específica, inclusive vazia, prevalece. A mesma capacidade pode ter responsáveis diferentes por contexto.
6. Exclusão de macroprocesso remove os contextos associados; exclusão de contexto remove seus dados aninhados; exclusão de etapa afeta somente o caso selecionado. Exigir confirmação e informar a abrangência. Preservar o conteúdo removido e os vínculos em `deletedItems` no JSON, limpar referências operacionais e manter as funcionalidades no catálogo. Permitir excluir o último item e reconstruir o projeto vazio.
7. Cards de funcionalidades devem ter bordas discretas, mantendo cores e marcadores de horizonte.
