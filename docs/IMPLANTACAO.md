# Implantação sem Docker

O projeto roda diretamente em Node.js e usa um PostgreSQL acessível pelo servidor. O pacote contém o código, dependências versionadas, migrações e procedimentos; domínio, HTTPS, credenciais e operação do ambiente ficam com o responsável pela hospedagem.

## Requisitos

- Node.js 22.12 ou superior dentro da linha 22, ou outra versão compatível com as dependências fixadas.
- PostgreSQL com uma base exclusiva e usuário capaz de aplicar as migrações nessa base.
- Acesso ao registro npm durante a instalação e geração do cliente Prisma.
- Proxy HTTPS ou plataforma de hospedagem que forneça HTTPS.

## Configurações privadas

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com credenciais do ambiente |
| `DIRECT_DATABASE_URL` | Conexão direta opcional para migrações quando a conexão principal usa pooler |
| `PROJECT_PASSWORD_HASH` | Hash Argon2id da senha compartilhada |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `APP_URL` | Origem pública exata, por exemplo `https://journey.exemplo.com` |
| `SESSION_HOURS` | Validade da sessão, padrão 12 horas e limite de 168 |
| `OFFSHORE_CONFIG` | Caminho opcional para um JSON privado com essas configurações |
| `HOST` | Endereço de escuta de produção; padrão `127.0.0.1` |
| `PORT` | Porta HTTP do serviço; padrão do Next.js: 3000 |

Variáveis do ambiente têm precedência sobre o arquivo. Sem `OFFSHORE_CONFIG`, o caminho padrão é `~/.config/offshore-journey/config.json`. Credenciais não devem ficar na pasta do projeto ou em variáveis `NEXT_PUBLIC_*`.

O comando `npm run setup` solicita a senha sem exibi-la e grava o hash e um segredo aleatório em arquivo privado. Para uma hospedagem com PostgreSQL existente, forneça `DATABASE_URL`, `APP_URL` e `OFFSHORE_LOCAL_DB=false` ao processo de configuração. Também é possível injetar diretamente as variáveis pelo gerenciador de segredos da hospedagem.

## Instalação e início

1. Extraia o pacote no diretório de aplicação e configure as variáveis privadas.
2. Execute `npm ci`.
3. Execute `npm run build` para gerar o cliente Prisma e compilar a aplicação.
4. Execute `npm run db:migrate` para aplicar as migrações versionadas.
5. Execute `npm start` por um gerenciador de serviços com reinício em caso de falha.
6. Direcione o proxy HTTPS ao endereço e porta da aplicação.
7. Verifique `GET /api/health`, abra o endereço público e informe a senha compartilhada.

O endpoint de saúde responde com estado do serviço e conexão; não contém dados do workspace. O banco não precisa ser exposto à internet. Quando a plataforma exige escuta em todas as interfaces, defina `HOST=0.0.0.0` e controle o acesso pela rede do ambiente.

O conteúdo inicial é criado uma única vez no primeiro acesso autenticado. Reiniciar a aplicação não restaura o template nem sobrescreve o banco.

## Dados e backup

A persistência está no PostgreSQL. É possível usar a instância local ao servidor ou uma instância gerenciada, incluindo um PostgreSQL já oferecido pelo ambiente de hospedagem.

Para cópias do projeto, use a exportação JSON autenticada. Para recuperação operacional do banco, configure backup pelo serviço de PostgreSQL ou com `pg_dump`, segundo as rotinas da equipe responsável. Valide a restauração em uma base separada antes de depender do backup.

Uma restauração JSON dentro da aplicação exige a senha e a confirmação da substituição. Ela preserva os registros de acesso do ambiente; exportações do projeto não contêm credenciais nem tokens de sessão.

## Atualizações

Antes de atualizar, faça backup da base. Instale as dependências do novo pacote, gere o build, aplique as migrações e reinicie o serviço. A migração não é executada automaticamente por `npm start`, para permitir que o time tech controle esse passo.

Ao trocar a senha com `npm run setup`, as sessões anteriores deixam de ser válidas. Se o serviço recebeu as variáveis no início do processo, reinicie-o após alterar a configuração.

## Vercel

O projeto inclui `vercel.json` para Next.js em Node.js 22. A Vercel hospeda a aplicação e o PostgreSQL fica em um serviço externo, conectado pelo Marketplace ou pela variável `DATABASE_URL`. O PostgreSQL auxiliar de desenvolvimento não é iniciado nesse ambiente.

1. Importe o repositório privado `journeyoffshore` do GitHub na sua conta Vercel, mantendo o mesmo nome de projeto.
2. Conecte uma base PostgreSQL exclusiva e configure `DATABASE_URL`. Se o serviço oferecer uma URL direta específica para migrações, configure também `DIRECT_DATABASE_URL`.
3. Cadastre `PROJECT_PASSWORD_HASH`, `SESSION_SECRET` e `SESSION_HOURS` nas variáveis privadas de produção. Não use nomes com prefixo `NEXT_PUBLIC_`.
4. Configure `APP_URL` com a origem HTTPS exata atribuída ao projeto. O endereço precisa corresponder ao domínio usado para acessar e editar o workspace.
5. Publique. O comando `npm run vercel-build` gera o cliente Prisma, aplica as migrações versionadas e compila o Next.js. Uma falha de migração interrompe a publicação.
6. Confira `/api/health`, o bloqueio sem senha e as exportações. Para levar o trabalho local existente, use o JSON autenticado e importe-o na nova base.

Os próximos commits no branch de produção podem gerar novas publicações pela integração GitHub–Vercel. Defina bancos e variáveis próprios para previews quando habilitar esse ambiente. As credenciais e os dados locais não pertencem ao repositório.

## PostgreSQL para desenvolvimento local

O projeto oferece um auxiliar de desenvolvimento com o pacote `embedded-postgres`, que inicia um processo PostgreSQL nativo. Ele permite testar localmente sem instalar um serviço global e sem Docker. Os dados persistem fora da pasta de código.

O auxiliar fica nas dependências de desenvolvimento. Em hospedagem, use o PostgreSQL do ambiente e mantenha `LOCAL_POSTGRES=false`. A aplicação e o esquema são os mesmos nos dois caminhos.
