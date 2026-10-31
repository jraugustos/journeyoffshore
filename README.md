# Offshore Journey

Aplicação em Next.js, TypeScript, PostgreSQL e Prisma, com execução direta em Node.js e sem Docker. Preserva a referência visual do HTML aprovado e acrescenta senha compartilhada, salvamento automático e macroprocessos adicionáveis e editáveis.

Produção: [journeyoffshore.vercel.app](https://journeyoffshore.vercel.app), com banco Prisma Postgres no plano Free. O acesso exige a senha compartilhada do projeto. O repositório é privado: [jraugustos/journeyoffshore](https://github.com/jraugustos/journeyoffshore).

## Executar localmente

Requisitos: Node.js 22.12 ou superior dentro da linha 22 e npm. Na primeira instalação, é necessário acesso à internet para baixar as dependências.

```sh
npm ci
npm run setup
npm run db:migrate
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e informe a senha definida no setup. Sem informar uma conexão externa, o setup prepara o uso de um PostgreSQL nativo para desenvolvimento, sem Docker. O banco inicia junto com a aplicação e seus dados ficam fora da pasta sincronizada.

O setup pede uma senha com pelo menos 12 caracteres sem exibi-la. A configuração padrão fica em `~/.config/offshore-journey/config.json`, com hash da senha e credenciais privadas. Para outro caminho, defina `OFFSHORE_CONFIG`. Nenhuma senha é gravada no projeto.

Se já houver um PostgreSQL instalado, forneça sua `DATABASE_URL` ao setup e use `OFFSHORE_LOCAL_DB=false`. Para hospedagem, siga o [procedimento de implantação](docs/IMPLANTACAO.md).

## Usar o projeto

- Informe a senha compartilhada para liberar o workspace. Não há cadastro de usuário.
- Clique no nome de um card preto para editar o macroprocesso, ou use “+ Macroprocesso” para criar outro.
- No editor do macroprocesso, altere nome, posição e status. Defina responsáveis no contexto/produto e, quando necessário, por capacidade dentro desse contexto.
- Adicione frentes pelo blueprint ou em “Cadastros e responsáveis → Macroprocessos e frentes”.
- Abra uma frente para trabalhar seus casos, etapas, oferta, AS-IS, CSD, decisões e ações.
- Os campos são salvos automaticamente: textos após 700 ms sem digitação, e seleções e reordenações assim que concluídas.
- “Todas as alterações salvas” significa confirmação do banco. Em caso de falha, mantenha a página aberta até concluir ou baixe as alterações pendentes.
- Use o ícone de exportação no header para baixar JSON completo, CSV ou HTML preenchido para consulta. O trabalho é retomado automaticamente do banco de dados; a importação JSON não faz mais parte da interface.
- Em Pessoas, adicione ou remova a foto. Nas operações, selecione o país com bandeira. Nos demais cadastros, personalize cor e ícone. As escolhas são refletidas nas etapas vinculadas.
- Consulte o Launch Timeline na grade horizontal, filtre por horizonte e expanda os produtos e funcionalidades relacionados.
- “Configurar workshop” e “Registros preservados” foram removidos da navegação. Conteúdos históricos já existentes seguem preservados no JSON.

O JSON inclui o trabalho e seus históricos, sem senha ou tokens de acesso. O HTML exportado é uma cópia de consulta com opção de baixar seu JSON; as cópias exportadas são independentes do sistema hospedado.

## Hospedar

```sh
npm ci
npm run build
npm run db:migrate
npm start
```

Configure antes as credenciais, `APP_URL` com HTTPS e a conexão PostgreSQL do ambiente. Use o processo e o proxy definidos pelo time tech. O pacote não exige Docker nem um provedor específico.

Para Vercel, o repositório inclui a configuração do Next.js e o comando `npm run vercel-build`, que aplica as migrações antes de compilar. Conecte um PostgreSQL externo e configure as variáveis privadas de produção conforme a [seção Vercel da implantação](docs/IMPLANTACAO.md#vercel).

- [Implantação e configuração](docs/IMPLANTACAO.md)
- [Arquitetura e modelo de persistência](docs/ARQUITETURA.md)
- [PRD](PRD.md)
- [Estado da entrega](STATUS.md)
- [Validação](VALIDACAO.md)

## Gerar o pacote para o time tech

```sh
npm run package
```

O resultado é `dist/offshore-journey-1.0.0.tar.gz`, com código, arquivo de dependências, migrações e documentação. Credenciais, banco local, dependências instaladas e arquivos temporários ficam fora do pacote.

## Verificar

```sh
npm run typecheck
npm test
npm run build
```

A suíte de navegador usa Playwright e uma instância isolada da aplicação. Defina `TEST_PROJECT_PASSWORD` e, se necessário, `TEST_BASE_URL`, e execute `npm run test:e2e`. O Playwright deve estar disponível no ambiente; é possível informar seu módulo com `-- --playwright /caminho/para/playwright`.

A suíte adicional de fidelidade pode ser executada com `npm run test:fidelity`, usando as mesmas variáveis para uma instância isolada.

Os testes de navegador criam dados sintéticos e restauram a base inicial da instância testada. Execute-os somente contra uma base isolada. As capturas e o resultado são gravados na pasta temporária indicada pela suíte.

## Referência original

O [HTML v17 recebido](offshore_workshop_interativo_v17.html), a distribuição experimental `index.html` e suas fontes JavaScript permanecem preservados como histórico. A aplicação atual é acessada pelo servidor Node.js. Abrir `src/shell.html` ou `index.html` diretamente não abre a aplicação com banco e senha.

Os arquivos antigos não são servidos publicamente pelo Next.js. A base inicial usa os dados de referência e preserva os arquivos de migração encontrados no HTML.

### Ajustes nas frentes

- Oferta: Problema → Oferta → Recorte → Fora do recorte → Resultado esperado.
- AS-IS: lista numerada, com edição e reordenação. CSD: colunas, dúvidas e decisões. Plano de ação: entregas com conclusão, responsáveis, prazo e critérios.
- Os seletores são campos compactos: clique para abrir a busca e marcar os itens. Busque um nome novo para cadastrá-lo e vinculá-lo no mesmo lugar. No blueprint, cada célula abre apenas as opções daquele campo, junto à célula; o nome da etapa mantém a edição completa. Responsáveis do contexto também podem ser selecionados diretamente no cabeçalho.
- Cada contexto/produto possui seus responsáveis. Capacidades podem ter responsáveis de referência e uma atribuição específica por contexto, que prevalece sobre a referência. A atribuição pode ser feita na etapa ou no botão “Responsáveis por capacidade” da frente.
- Macroprocessos, contextos e etapas podem ser excluídos pelo editor, com confirmação do impacto. A exclusão de um macroprocesso remove seus contextos; a de um contexto remove seus casos e etapas. Funcionalidades permanecem no catálogo. O conteúdo removido é mantido em `deletedItems` na exportação JSON; não há restauração individual pela interface.
