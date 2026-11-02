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

`npm run test:structure` verifica inserção por posição, edição e movimentação de contextos, persistência, filtros, teclado, toque e exportação, também com `TEST_BASE_URL` e `TEST_PROJECT_PASSWORD` de uma base isolada.

Os testes de navegador criam dados sintéticos e restauram a base inicial da instância testada. Execute-os somente contra uma base isolada. As capturas e o resultado são gravados na pasta temporária indicada pela suíte.
