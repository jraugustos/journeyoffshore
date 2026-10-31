# Revisão de consistência — Offshore Journey

Data: 31/10/2026. Referência visual: HTML aprovado. Escopo: corrigir diferenças de espaçamento, controles, filtros e interação sem redesenhar a plataforma nem alterar os dados de produção.

## Agentes do Second Brain utilizados

Os perfis documentais foram carregados em três executores independentes nesta revisão. A revisão não instala ou ativa agentes permanentes no Maestri.

| Perfil | Versão | Módulo selecionado | Responsabilidade |
| --- | --- | --- | --- |
| ST05 — Product Designer | 3.1 | M3 — Protótipo, avaliação e handoff | Coerência entre telas, continuidade e efeitos das ações |
| ST09 — UI e Interaction Designer | 2.1 | M2 — Estados, foco e motion funcional | Seletores, estados, teclado e fechamento |
| ST10 — Design Systems | 2.1 | M1 — Auditoria e arquitetura de tokens, manual 2.0 | Espaçamento e padrões compartilhados |

Fontes canônicas no vault: `00 Sistema/Agentes/Studio/ST05-product-designer.md`, `ST09-ui-e-interaction-designer.md`, `ST10-especialista-em-design-systems.md` e seus módulos. Cada executor carregou a Base comportamental v2 e o Protocolo modular v1.0. Os agentes fizeram inspeção de código; a implementação e os testes no navegador foram realizados pelo executor principal. As skills locais frontend-design e impeccable orientaram a implementação e a conferência visual.

## Achados e correções

| Achado | Causa | Correção aplicada |
| --- | --- | --- |
| Contexto/produto sem recuo | O CSS histórico impõe padding zero esperando um wrapper que a versão React não utiliza | Contrato específico da célula React: 10 px vertical, 16 px horizontal no desktop e 12 px horizontal no celular |
| Limpar filtros menor que as demais ações | Variante `tiny` misturada às ações da toolbar | Mesma altura de 42 px, fonte de 12,5 px e raio de 10 px para as ações da toolbar; cores preservam ação secundária/principal |
| Caso de uso com dois comportamentos | A barra da frente ainda utilizava select nativo | Reuso do seletor pesquisável com escolha única também na barra |
| Filtros CSD e catálogo incompletos | Select sem contrato ou classe que definia apenas altura mínima | Estilo comum em `.oj-filter select`: altura, borda, raio, padding e fonte; aplicado ao CSD |
| Abrir responsáveis por capacidade criava um registro | A abertura já gravava a primeira capacidade | Primeiro escolher a capacidade; só então criar o vínculo. Um vínculo existente do mesmo contexto é reutilizado |
| Exclusão de vínculo exigia sair da frente | Ação disponível somente em Cadastros | Exclusão com confirmação na frente e no editor, usando a mesma operação de Cadastros |
| Escolher novamente o caso atual não fechava a lista | Radio já marcado não dispara `onChange` | Ativação da opção atual também fecha o popup |
| Estados acessíveis e rótulos diferentes | Gatilhos de responsáveis sem estado expandido e nomes de células derivados de chaves técnicas | `aria-expanded`/`aria-controls` nos gatilhos; rótulos de células em português |
| Busca dos seletores não acompanhava o tamanho móvel | O novo componente não estava coberto pelo breakpoint | Busca com fonte de 16 px em telas de até 800 px |
| Texto contradizia os objetos do produto | “Macroprocesso” no estado vazio e “board” na timeline | Orientação para contexto/produto e “Abrir frente relacionada” |

## Padrões preservados

- Contexto/produto: controles discretos, sem caixas adicionais, com recuo da célula.
- Filtros e ações da toolbar: alinhamento e dimensões comuns. Cores continuam distinguindo ações principais e secundárias.
- Ações de linha e tabela podem continuar menores; densidade é uma variação funcional legítima.
- Pessoas permitem múltipla escolha; caso de uso permite uma escolha. Ambos compartilham o popup, com semântica adequada a cada seleção.
- Cores de sistemas, capacidades e horizontes, estrutura da timeline e HTML original preservados.

## Verificação executada

Ambiente: build otimizado do Next.js, PostgreSQL isolado, `localhost:3001`. Nenhum cadastro ou exclusão de teste foi realizado na base real.

- TypeScript, build e 19 testes de regras passaram.
- Navegador: contexto com recuo efetivo de 16 px; ações da toolbar com 42 px e raio de 10 px; Limpar filtros retornou os quatro filtros a `all`.
- Filtro CSD e Horizonte do catálogo: 42 px e raio de 10 px. O filtro de dúvidas exibiu corretamente o estado vazio de Resolvidas.
- Popup de caso disponível na barra da frente; escolher novamente o caso atual fechou a lista.
- Responsáveis: estado expandido, vínculo válido com o painel e retorno de foco ao gatilho após Escape.
- Capacidade: revisão 53 e um vínculo antes/depois de abrir, fechar e escolher uma capacidade já vinculada. Ao escolher outra capacidade, passou à revisão 54 com dois vínculos; repetir a escolha não criou um terceiro.
- A ação de excluir vínculo foi conferida como disponível na frente e no editor; esta rodada não executou a exclusão pelo navegador.
- Navegação e carregamento conferidos em Visão geral, frente/Blueprint, Oferta, AS-IS, CSD, Plano de ação, Acompanhamento, Timeline, Funcionalidades e Cadastros. A inspeção visual concentrou-se nos componentes alterados.
- Celular, 390 × 844: recuo de 12 px, busca de 16 px e popup dentro da largura da tela.

Evidências: [resultados medidos](../tests/application-evidence/consistency/results.json), [contexto desktop](../tests/application-evidence/consistency/blueprint-desktop.png), [filtros desktop](../tests/application-evidence/consistency/filters-desktop.png), [filtros mobile](../tests/application-evidence/consistency/filters-mobile.png), [seleção mobile](../tests/application-evidence/consistency/selector-mobile.png).

## Limites

Esta é uma revisão amostral de consistência com verificações concretas de comportamento. Não constitui certificação de acessibilidade, teste de usabilidade com usuários nem cobertura de todos os estados e navegadores. Safari/iOS, Firefox e leitores de tela não foram exercitados. A matriz mantém rolagem horizontal deliberada no celular. As diferenças legítimas entre ações principais, ações de linha e controles do contexto foram mantidas.
