# Validação da aplicação Offshore Journey

## Estrutura editável da blueprint — 02/11/2026

Build de produção e 24 testes unitários passaram. A suíte `test:structure` passou em 8 cenários, em uma instância separada com PostgreSQL temporário: inserção de macroprocesso na posição escolhida; criação, edição e reordenação do contexto; inserção de etapas no caso correto; ordem com filtro de horizonte ativo; foco e inserção por teclado; criação de contexto dentro da frente, transferência para outro macroprocesso e exclusão; reflexo na visão geral e exportação JSON; controles de toque e ausência de overflow da página em 390 × 844. Os testes restauraram os dados iniciais da instância isolada e não utilizaram os dados de trabalho.

Conferidos os controles nas divisórias e a edição explícita dos contextos/produtos em desktop e celular. Divisas entre pais diferentes usam um único controle com escolha do destino, evitando sobreposição. Safari, Firefox e leitura completa por tecnologia assistiva não foram exercitados nesta revisão.

Evidências: [resultados](tests/application-evidence/structure/results.json), [desktop](tests/application-evidence/structure/desktop.png), [celular](tests/application-evidence/structure/mobile.png).

Verificações realizadas em 30 de outubro de 2026 sobre a aplicação Next.js com PostgreSQL e Prisma, em ambiente local e na Vercel, sem Docker. A verificação de produção está registrada em 31 de outubro de 2026 às 03:03 UTC.

## Resultado

- 15 testes de regras de domínio, preservação dos cadastros e apresentação passaram com Vitest.
- A suíte também passou após atualizar o Vitest para 5.0.5 e adicionar o controle de conexões da Vercel. A instalação final de dependências reportou zero vulnerabilidades no npm audit.
- 7 cenários adicionais de fidelidade passaram: foto otimizada e removível, bandeiras, ícones/cores, paleta, timeline horizontal, exportação/importação e retirada dos módulos.
- 18 cenários de navegador passaram em Chrome, usando uma base isolada e dados sintéticos.
- Verificação de tipos e build de produção concluídos.
- Pacote extraído em uma pasta limpa: instalação via npm ci e build de produção concluídos.
- Migrações verificadas também com o PostgreSQL local já aberto, sem interromper a aplicação.
- Persistência de uma alteração de macroprocesso confirmada após encerrar e reiniciar o serviço e o PostgreSQL.
- Inspeção visual em desktop e celular concluída, incluindo o editor de macroprocesso e a tela de senha.
- Nenhum erro de execução da interface foi registrado pela suíte.
- HTML original preservado por comparação de SHA-256.
- Produção em `https://journeyoffshore.vercel.app` com Prisma Postgres Free: saúde do banco, senha e cookie seguro, bloqueio das APIs e exportações sem sessão, proteção de origem, persistência entre sessões e exportações JSON/HTML/CSV verificados.
- Conteúdo local da revisão 47 importado e comparado em produção, desconsiderando somente a data de atualização renovada na gravação. A base local permaneceu igual.

## Cenários de navegador

| Cenário | Resultado |
| --- | --- |
| Bloqueio de páginas, APIs, dados e exportações sem senha | Passou |
| Senha incorreta e liberação por senha compartilhada, com cookie HttpOnly | Passou |
| Desktop e celular, com rolagem da matriz contida | Passou |
| Renomear macroprocesso pelo card preto com salvamento automático | Passou |
| Criar e reordenar macroprocesso sem editar código | Passou |
| Criar frente e manter vínculo com o novo macroprocesso | Passou |
| Persistir cadastros automaticamente | Passou |
| Persistir etapa, objetivo, sistema e fornecedor de dados | Passou |
| Preservar ofertas e casos de uso após recarga | Passou |
| Manter alterações pendentes em falha de conexão e reenviar depois | Passou |
| Editar responsabilidades por capacidade e contexto | Passou |
| Exigir dados para decisão final e registrar histórico no servidor | Passou |
| Usar a mesma senha em outra sessão e detectar conflito de alteração | Passou |
| Recusar origem indevida e importação inválida sem modificar o projeto | Passou |
| Exportar JSON, CSV e HTML com os registros persistidos | Passou |
| Restaurar JSON de forma atômica e rejeitar revisão antiga | Passou |
| Encerrar acesso e voltar a bloquear os dados | Passou |
| Executar a interface sem erros de JavaScript | Passou |

## Evidências

- [Verificação da publicação em produção](tests/application-evidence/production.json)

O campo Operação do blueprint foi padronizado com o card do HTML original: fundo e borda na cor do cadastro, ícone e nome no topo, bandeira e país, e papel ou “Papel a definir nesta etapa”. A conferência em desktop e celular incluiu múltiplas operações, nome longo, papel com várias linhas e abertura do editor ao clicar. Os dados da prévia foram comparados integralmente antes e depois da atualização e permaneceram iguais.

- [Card de operação em desktop](tests/application-evidence/operation-cards-desktop.png)
- [Card de operação no celular](tests/application-evidence/operation-cards-mobile.png)
- [Resultado da conferência do card](tests/application-evidence/operation-card-results.json)

- [Resultado estruturado dos 18 cenários](tests/application-evidence/results.json)
- [Registro da verificação após reinício](tests/application-evidence/restart.json)
- [Workspace em desktop](tests/application-evidence/workspace-desktop.png)
- [Workspace no celular](tests/application-evidence/workspace-mobile.png)
- [Editor de macroprocesso](tests/application-evidence/editor-macroprocesso.png)
- [Tela de acesso no celular](tests/application-evidence/login-mobile.png)
- [Cadastros e horizontes: testes](src/lib/presentation.test.ts)
- [Fidelidade ao HTML: suíte de navegador](tests/fidelity.spec.cjs)
- [Fidelidade: resultado estruturado](tests/application-evidence/fidelity-results.json)
- [Timeline restaurada em desktop](tests/application-evidence/timeline-desktop.png)
- [Timeline restaurada no celular](tests/application-evidence/timeline-mobile.png)
- [Editor de foto no celular](tests/application-evidence/editor-foto-mobile.png)
- [Tags, bandeira e foto no blueprint](tests/application-evidence/blueprint-visuals-desktop.png)
- [Testes de regras](src/lib/domain.test.ts)
- [Suíte de navegador](tests/application.spec.cjs)

A atualização foi aplicada à prévia local sem modificar o conteúdo do banco: revisão 33 e dados comparados integralmente antes e depois do reinício. Os testes que gravam dados usaram exclusivamente uma base isolada.

O hash do HTML original é `0a93a30af64ebd6f7d239a28413066e89a760b28d25116d2450c6900108cf05f`.

A suíte de navegador cria registros sintéticos e restaura a base inicial do ambiente de teste. Não deve ser executada contra uma base com trabalho real da equipe.

## Limites da verificação

A validação usou Chrome no macOS e um PostgreSQL local iniciado pelo auxiliar nativo. Hospedagem em AWS ou outro provedor, TLS do ambiente final, Safari, Firefox e auditoria completa com leitor de tela ainda dependem do ambiente e de verificação adicional.

O detector de interface aplicado aos novos componentes não apontou ocorrências. Os estilos históricos do HTML foram preservados para manter a identidade aprovada; a revisão não equivale a uma certificação completa de acessibilidade.

Casos, etapas e outros registros aninhados usam JSONB nesta entrega. O controle de conflito dessas listas é mais amplo que uma célula individual, conforme [ARQUITETURA.md](docs/ARQUITETURA.md). HTML exportado é uma cópia de consulta; os dados completos podem ser restaurados por JSON.

## Revisão das frentes — 31/10/2026

- TypeScript e build otimizado do Next.js passaram. 19 testes de regras passaram, incluindo exclusão em cascata, preservação de conteúdo, limpeza de vínculos e workspace vazio.
- Uma chamada real à API criou e excluiu macroprocesso/contexto exclusivamente no PostgreSQL isolado da porta 3001; o conteúdo inicial dessa base foi restaurado ao final.
- Conferência no navegador: sequência da Oferta na leitura e no editor; lista AS-IS; três colunas CSD com borda e espaçamento; criação de ator diretamente na etapa; seleção ativa e persistente de pessoa no contexto; botão de exclusão no editor. Editor conferido em desktop e 390 × 844.
- Testes desta revisão não executaram a suíte E2E antiga contra bases reais. Dados de produção e da prévia local não foram usados para testes de criação/exclusão.

## Seletores compactos e edição localizada — 31/10/2026

Build otimizado, TypeScript e os 19 testes de regras passaram. Na base isolada, o navegador verificou: clique em Canal sem abrir o editor completo, busca/cadastro/vínculo de canal, marcação de pessoas com busca e persistência após recarga, abertura isolada de Operação/Dados/Capacidades, seleção de responsáveis da capacidade em lista aninhada, Escape fechando apenas essa lista e manutenção do editor completo. Listas de responsáveis conferidas no desktop e em 390 × 844, dentro dos limites da tela. Produção não recebeu os cadastros de teste.

### Uniformidade dos seletores de contexto

Responsáveis e caso de uso no blueprint foram comparados pelo navegador: ambos com 25 px de altura, fonte de 11 px, padding de 3 px vertical, sem borda e fundo transparente. A lista de casos usa o mesmo componente de popup das demais seleções, com busca e escolha única. Troca para “Bloquear cartão no aplicativo” e retorno ao caso padrão atualizaram as etapas e fecharam a lista. Conferido em desktop e 390 × 844, exclusivamente na prévia isolada. TypeScript e build otimizado passaram.

## Revisão de consistência com ST05, ST09 e ST10

A revisão de código dos perfis do Second Brain foi seguida de testes no navegador em desktop e 390 × 844, exclusivamente na base isolada. Medidos padding, altura/raio das ações e filtros, busca móvel, estados acessíveis e retorno de foco. Limpar filtros, reescolha de caso e filtro de dúvidas funcionaram. Abrir/fechar responsabilidades não criou registros, e repetir uma capacidade existente não duplicou vínculos. TypeScript, build e 19 testes passaram. [Relatório e limites](docs/REVISAO-CONSISTENCIA.md), [resultados](tests/application-evidence/consistency/results.json).

## Cards de funcionalidades vinculadas — 31/10/2026

Os cards do blueprint agora preenchem 100% da coluna, têm fundo branco e margem inferior de 10 px. Código e marcador de horizonte ficam na mesma linha; a descrição ocupa a linha seguinte. TypeScript e build passaram. Na base isolada foram comparados F002, F004, F050 e F051 em desktop e 390 × 844: largura comum, fundo branco, margem e alinhamento confirmados. O clique continuou abrindo o editor da funcionalidade. Os dados iniciais da base de teste foram restaurados; produção não recebeu o exemplo. Evidências: [desktop](tests/application-evidence/feature-cards-desktop.png), [celular](tests/application-evidence/feature-cards-mobile.png), [medições](tests/application-evidence/feature-cards-results.json).

## Header, formulários e espaçamento — 31/10/2026

TypeScript e build passaram. Na prévia isolada em desktop e 390 × 844, conferidos: menu recolhido/expandido e retorno pelo mesmo controle no header; ícones alinhados; legenda atualizada; ausência de importação na interface; menu de exportação com os formatos anteriores; edição de cadastro por ícone. Formulários de macroprocesso, pessoa e CSD conferidos: títulos com 840 px e metadados em pares de 410 px no desktop; macroprocesso com campos de 318 px no celular. Cards do catálogo com gap real de 6 px e cards do blueprint com margem de 6 px. Nenhum dado foi editado durante essa conferência. Evidências: [macroprocesso](tests/application-evidence/shell/macro-desktop.png), [menu recolhido](tests/application-evidence/shell/collapsed-desktop.png), [catálogo](tests/application-evidence/shell/catalog-desktop.png), [macroprocesso mobile](tests/application-evidence/shell/macro-mobile.png), [medições](tests/application-evidence/shell/results.json).

Referências consultadas para o controle do menu: [Carbon — UI shell header](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-header/guidelines) e [SGDS — Sidebar](https://www.designsystem.tech.gov.sg/components/sidebar). Foi adotado o controle no header para manter a ação acessível mesmo com a navegação recolhida. A implementação foi adaptada ao shell existente.

### Controle de navegação dentro da sidebar

Conforme a referência fornecida pelo usuário, o controle saiu do header. Aberto, fica ao lado de Workspace; fechado, é o primeiro ícone da navegação com direção para expandir. TypeScript e build passaram. Conferidos os dois estados no desktop e no celular: o centro horizontal do controle recolhido e dos ícones de navegação coincidiu em 34,5 px; o botão permaneceu acessível no celular e reabriu Workspace. Dados não foram editados. Evidências: [aberto](tests/application-evidence/sidebar/open.png), [fechado](tests/application-evidence/sidebar/closed.png), [celular](tests/application-evidence/sidebar/mobile-open.png), [medições](tests/application-evidence/sidebar/results.json).

## Login simplificado — 02/11/2026

Removidos marca, apresentação e rodapé da tela de acesso. Textos atuais: “Acessar Workspace”, “Senha” e “Login”. TypeScript e build passaram. No navegador da base isolada, senha incorreta manteve o bloqueio; mostrar/ocultar senha funcionou; a senha de teste liberou o workspace e encerrar acesso retornou ao login. Layout conferido em desktop e 390 × 844. Evidências: [desktop](tests/application-evidence/login-clean-desktop.png), [celular](tests/application-evidence/login-clean-mobile.png), [resultados](tests/application-evidence/login-clean-results.json).

## Catálogo, capacidades e timeline — 02/11/2026

Build otimizado e 27 testes de regras passaram. A suíte `test:study` passou em quatro cenários completos, usando apenas uma instância isolada: criação e edição de funcionalidade com recarga e exportação JSON/CSV/HTML; casos padrão, digital e comercial como linhas distintas no roadmap; mudança de Release C para D pelo editor da etapa refletida na timeline; planejamento original com os mesmos 11 itens; responsáveis contidos no card da capacidade; cadastro e vínculo de funcionalidade diretamente na etapa; layout móvel sem overflow da página e ausência de erros JavaScript. O conteúdo inicial da base isolada foi restaurado.

Evidências: [resultados](tests/application-evidence/study/results.json), [timeline desktop](tests/application-evidence/study/timeline-desktop.png), [timeline celular](tests/application-evidence/study/timeline-mobile.png), [capacidade com responsáveis](tests/application-evidence/study/capabilities-desktop.png). Conferido no Chrome; não substitui testes em outros navegadores ou uma auditoria completa de acessibilidade.

## Exclusão de funcionalidades — 02/11/2026

Build e 29 testes de regras passaram, incluindo exclusão de item original, limpeza dos vínculos em casos padrão e alternativos, persistência pelo protocolo de alterações, manutenção da referência original, exportação e não reutilização de códigos excluídos. A suíte isolada de navegador foi estendida para cancelar a confirmação sem excluir, confirmar a exclusão, conferir vínculos e histórico e recarregar o catálogo.
