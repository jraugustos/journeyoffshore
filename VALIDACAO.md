# Validação da aplicação Offshore Journey

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
