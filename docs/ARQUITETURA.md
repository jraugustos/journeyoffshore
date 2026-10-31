# Arquitetura do Offshore Journey

Aplicação web em Next.js 16, React 19 e TypeScript, com PostgreSQL e Prisma ORM 7. A execução usa Node.js diretamente. O visual do HTML aprovado foi preservado no CSS, e as telas foram reconstruídas em componentes React.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `src/app` | Páginas, metadados, estilos complementares e rotas HTTP |
| `src/components` | Workspace, blueprint, editores, acesso e salvamento automático |
| `src/lib/domain.ts` | Tipos, validação, cobertura, cópias e importações |
| `src/lib/changes.ts` | Diferenças por campo, combinação de alterações e conflitos |
| `src/lib/exports.ts` | Exportações CSV e HTML de consulta |
| `src/server` | Configuração privada, sessões, banco e persistência |
| `src/data` | Base inicial e referências funcionais recebidas |
| `prisma` | Modelo e migrações SQL do banco |
| `scripts` | Configuração, execução e preparação do pacote |

Os arquivos JavaScript antigos e o HTML original continuam preservados como referência. A aplicação hospedada usa os componentes React. Os arquivos de referência na raiz não são servidos pelo Next.js.

## Persistência

| Tabela | Conteúdo |
| --- | --- |
| `Workspace` | Dados da sessão de workshop, revisão e metadados |
| `MacroProcess` | Identificador, nome, status, responsáveis e posição dos macroprocessos |
| `WorkFront` | Identificador, macroprocesso, nome, posição e conteúdo da frente |
| `AccessSession` | Hash do token, validade e versão da configuração de acesso |
| `LoginAttempt` | Contagem e bloqueio temporário de tentativas incorretas |

Macroprocessos e frentes possuem relações e índices próprios. Casos, etapas, ofertas, decisões e ações ficam em JSONB no conteúdo da frente nesta primeira entrega. Essa organização preserva os campos e arquivos de migração do HTML sem impor perda de informações. Cadastros e outros conteúdos transversais ficam nos metadados do workspace. O esquema é validado no servidor antes da gravação.

Renomear ou reordenar um macroprocesso mantém seu ID e seus vínculos. A movimentação de uma frente atualiza seu macroprocesso e o contexto dos casos. Os agrupamentos são dados do banco e não uma lista fixa no código.

## Senha compartilhada

Há uma senha para o projeto inteiro. Não há cadastro de usuário ou e-mail. A senha é validada no servidor com Argon2id; um token aleatório de sessão é colocado em cookie HttpOnly e SameSite Strict. No banco permanece somente o hash do token.

As páginas e rotas de dados verificam a sessão. A senha e o segredo ficam em variáveis de ambiente ou em arquivo de configuração privado fora do projeto. Alterar a senha ou o segredo invalida as sessões anteriores. A duração padrão é de 12 horas e pode ser configurada.

Em hospedagem, `APP_URL` deve usar HTTPS. HTTP é aceito apenas para localhost. Rotas de alteração verificam a origem da solicitação. Dez tentativas incorretas em uma janela de dez minutos provocam bloqueio de dois minutos para a senha do projeto.

## Salvamento automático e conflitos

Textos são enviados após 700 ms sem digitação. Seleções, vínculos, criação de registros e reordenação são enviados imediatamente. O indicador “Todas as alterações salvas” só aparece após confirmação do banco.

O cliente mantém uma referência da última versão confirmada e envia diferenças. O servidor confere o valor anterior de cada campo, valida o resultado e grava dentro de uma transação. A revisão do workspace impede que gravações concorrentes substituam uma à outra. A leitura usa um snapshot consistente do banco.

Edições de campos distintos podem ser combinadas. Listas aninhadas, como os casos de uma mesma frente, são tratadas como uma unidade de conflito nesta versão. Se a mesma unidade mudou em outra sessão, a alteração é recusada e o usuário pode baixar sua cópia pendente antes de recarregar a versão do servidor.

Falhas de rede mantêm as mudanças na memória da página e provocam novas tentativas. Fechar a página com alterações pendentes gera aviso do navegador. Não há garantia de recuperação dessas alterações após fechar o navegador; o JSON pendente permite guardá-las antes disso. O projeto confirmado permanece no PostgreSQL.

Ao retornar à janela, a aplicação atualiza os dados quando não há alterações locais pendentes. Não há colaboração em tempo real ou indicação de cursores de outros participantes nesta entrega.

## Importações e exportações

JSON completo preserva a sessão, os históricos e os arquivos internos de migração. Importar exige sessão liberada e revisão atual; erros ou concorrência não substituem parcialmente a base. Schemas 1, 2 e 3 têm migração com preservação do original. Schema 4 mantém os registros existentes, sem a antiga limpeza destrutiva.

CSV oferece casos, CSD, decisões, ações, acompanhamento e funcionalidades. Campos com aparência de fórmula recebem proteção. HTML é uma cópia independente de consulta com os dados completos para download em JSON; a edição continua no aplicativo. Arquivos exportados são cópias independentes do controle de acesso do servidor.

## Evolução

Contas individuais, permissões por papel, sincronização em tempo real e normalização das demais entidades em tabelas próprias podem ser adicionadas quando necessárias. Essas capacidades não são pressupostos para operar a primeira versão.
