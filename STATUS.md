# Estado do Offshore Journey

Atualizado em 30 de outubro de 2026. Implementação autorizada pelo usuário após a definição da stack e a decisão de seguir sem Docker.

## Primeira versão funcional

A aplicação foi reconstruída em componentes React sobre Next.js e TypeScript. O PostgreSQL persiste macroprocessos e frentes com relações próprias e mantém os detalhes da frente em JSONB. Prisma gerencia o esquema e as migrações.

| Requisito | Resultado |
| --- | --- |
| Execução sem Docker | Node.js diretamente, com PostgreSQL do ambiente ou auxiliar nativo para desenvolvimento |
| Senha compartilhada | Tela com somente senha; proteção de páginas, APIs, importação e exportações |
| Macroprocessos dos cards pretos | Criação, edição de nome, status e responsáveis, reordenação e inclusão de frentes |
| Salvamento automático | Campos e operações persistidos sem botão Salvar; estado de gravação e novas tentativas |
| Exportação | JSON completo, CSV e HTML independente para consulta |
| Continuidade | Importação atômica e preservação de migrações e registros históricos no JSON |
| Jornadas | Casos e etapas com atores, canais, operação, sistemas, capacidades, dados, atendimento e funcionalidades |
| Governança | Oferta, elegibilidade, AS-IS, CSD, decisões com histórico e ações |
| Cadastros | Pessoas com foto; operações com bandeiras; atores, canais, áreas, sistemas e capacidades com cor e ícone editáveis; vínculos de responsabilidade |
| Fidelidade visual | Timeline horizontal com preparação e lançamentos, inventário expansível e paleta original dos horizontes |
| Concorrência | Comparação de valores anteriores, transações e aviso de conflito |
| Entrega ao time tech | Pacote de código e migrações, configuração e instruções de hospedagem |

Os itens “Configurar workshop” e “Registros preservados” foram removidos da navegação conforme solicitado. Metadados e históricos já existentes continuam nas exportações JSON.

O HTML original permanece inalterado. O código foi enviado ao repositório privado [jraugustos/journeyoffshore](https://github.com/jraugustos/journeyoffshore), no branch `main`. A publicação do aplicativo na Vercel está em preparação.

## Publicação no GitHub e na Vercel

A criação do repositório e a publicação na Vercel foram autorizadas pelo usuário, com o nome `journeyoffshore`. O repositório privado já contém o código funcional, as migrações e a documentação, sem credenciais ou banco local.

Foram adicionados `vercel.json`, exclusões de arquivos locais, Node.js 22 e o comando `vercel-build`, que aplica as migrações antes da compilação. A conexão direta opcional `DIRECT_DATABASE_URL` permite usar um pooler na aplicação e uma conexão direta nas migrações.

A conexão Vercel está ativa. O projeto [journeyoffshore](https://vercel.com/juniors-projects-7bbe2e04/journeyoffshore), na conta Junior's projects, foi criado e ligado ao repositório. Node.js 22, o domínio `journeyoffshore.vercel.app` e as variáveis privadas de senha, sessão e origem de produção foram configurados. A senha compartilhada foi mantida; o segredo de sessão da produção é próprio desse ambiente.

O usuário escolheu Prisma Postgres no plano gratuito e confirmou o aceite dos termos. O banco `journeyoffshore` foi criado em Washington, D.C. (`iad1`) e conectado exclusivamente ao ambiente de produção. As variáveis da integração foram criadas como sensíveis. A aplicação usa a conexão com pool e as migrações mantêm a conexão direta.

O plano Free apresentado pela instalação da Vercel informa 100 mil operações mensais, 2 GB e até 50 bancos, sem custo. Esse limite de operações difere dos 200 mil anunciados pela documentação pública do Prisma; o limite apresentado na contratação foi registrado como referência conservadora. O deploy e a verificação funcional de produção estão em andamento.

## Validação

Consultar [VALIDACAO.md](VALIDACAO.md) para os testes executados, evidências e limites. A aplicação foi verificada com PostgreSQL local e uma versão de produção do Next.js.

## Limites desta versão

- Detalhes de casos, etapas, decisões e demais registros aninhados usam JSONB no conteúdo da frente; a normalização dessas entidades em mais tabelas pode evoluir depois.
- Edições de listas aninhadas da mesma frente podem exigir revisão de conflito mesmo quando são itens diferentes.
- Atualizações de outras sessões aparecem ao retornar à janela ou recarregar. Não há edição colaborativa em tempo real.
- Mudanças ainda não confirmadas pelo banco permanecem somente na memória da página, com aviso e opção de backup pendente.
- HTML exportado é para consulta; a edição ocorre na aplicação ou após restaurar o JSON.
- Contas individuais e identificação pessoal da autoria continuam fora do escopo da senha compartilhada.

## Próximos passos de implantação

Para concluir a Vercel, conectar a conta, configurar o PostgreSQL e as variáveis privadas, publicar e verificar o acesso por senha, a persistência e as exportações. Para outros provedores, o time tech pode seguir [IMPLANTACAO.md](docs/IMPLANTACAO.md).
