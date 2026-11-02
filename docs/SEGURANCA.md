# Verificação de segurança e rotação de acesso

Data: 02/11/2026 — America/New_York. Aplicação: journeyoffshore. Senhas, hashes e valores de conexão foram deliberadamente omitidos deste relatório.

## Resultado

A senha solicitada foi aplicada em produção e na configuração local como hash Argon2id. A aplicação já vincula as sessões à configuração de acesso; a troca do hash invalida as sessões anteriores. A prévia local foi reiniciada com a configuração atualizada.

Na verificação de produção, a senha anterior retornou acesso negado, a nova senha liberou o workspace e uma sessão obtida antes da troca deixou de funcionar. A revisão 35 e o conteúdo do projeto permaneceram iguais antes e depois da rotação. Nenhuma migração ou importação dos dados foi executada.

## Varredura de exposição

Foram examinados o código atual, 13 revisões do Git, 187 blobs históricos, arquivos destinados ao navegador em `.next/static`, arquivos públicos, o pacote de entrega e temporários relacionados ao projeto. A busca exata utilizou as credenciais conhecidas sem exibi-las; uma revisão independente por agente também procurou padrões de segredos e inspecionou os controles de acesso.

- Nenhuma credencial real foi encontrada nos arquivos versionados, histórico, JavaScript do cliente e pacote examinados. O exemplo de conexão em `.env.example` contém um marcador de configuração, sem senha real.
- O repositório remoto foi confirmado como privado, com uma única branch principal e sem outras branches/tags remotas no momento da consulta.
- As variáveis de senha, sessão e banco na Vercel estão classificadas como sensíveis e restritas à produção. A senha em texto aberto não foi enviada à Vercel: somente seu verificador Argon2id.
- Os endereços dos deployments anteriores estão cobertos pela proteção de acesso da Vercel. Uma requisição ao deployment anterior foi redirecionada à autenticação da plataforma.
- Uma anotação local antiga continha a senha anterior em texto aberto, fora do repositório, com permissão 600. Essa anotação foi sanitizada. Uma configuração temporária que repetia a conexão real do banco foi removida. Não foi encontrada evidência de publicação desses arquivos.
- A configuração local continua fora do projeto, em diretório com permissão 700 e arquivo com permissão 600. Contém o hash e as configurações necessárias; não contém a nova senha de acesso em texto aberto.
- A nova senha foi transferida à ferramenta local por um canal temporário privado de memória, sem arquivo de senha em texto aberto. O arquivo temporário do verificador e os canais usados na rotação foram removidos após a verificação.

## Controles exercitados

| Verificação em produção | Resultado |
| --- | --- |
| Nova senha aceita e senha anterior recusada | Passou |
| Sessão anterior invalidada pela rotação | Passou |
| Cookie HttpOnly, Secure e SameSite=Strict | Passou |
| Dados e revisão do projeto preservados | Passou |
| APIs de dados e exportação negadas sem sessão | Passou |
| Alteração com Origin diferente recusada | Passou |
| `.env`, fontes de dados e HTML original indisponíveis publicamente | Passou |
| JSON, HTML e CSV sem as credenciais conhecidas | Passou |
| Encerramento da sessão de teste | Passou |

A consulta npm das dependências de produção retornou zero vulnerabilidades conhecidas naquele momento. Esse resultado depende da base de avisos do registro e não comprova ausência de vulnerabilidades desconhecidas.

Evidências sem credenciais: [verificação de produção](../tests/application-evidence/security/rotation.json), [dependências de produção](../tests/application-evidence/security/dependencies.json).

## Achado residual

**P2 — disponibilidade do login:** o limitador em `src/server/access.ts` usa um contador global para o projeto. Tentativas incorretas de um visitante podem bloquear temporariamente novos logins de toda a equipe. A revisão independente identificou esse comportamento por inspeção; não foi executado um ataque de bloqueio. Esse mecanismo não expõe a senha, mas merece uma evolução separada para limitar tentativas por origem confiável, considerando o ambiente Vercel e outros provedores. Não foi alterado nesta rotação.

## Limites

Esta foi uma revisão de código, arquivos, configuração e controles específicos; não um pentest completo ou uma certificação. A busca foi textual, por padrões e por credenciais conhecidas. Não incluiu OCR de todas as imagens, auditoria dos sistemas internos dos provedores, computadores de outros participantes, históricos completos de conversas ou cópias fora do escopo do projeto. A senha foi fornecida pelo usuário neste chat e não foi repetida no relatório. Não é possível garantir ausência de toda cópia externa a partir desta verificação.
