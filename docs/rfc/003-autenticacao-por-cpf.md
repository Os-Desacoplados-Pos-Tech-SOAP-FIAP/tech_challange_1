# RFC 003 — Estratégia de autenticação por CPF

**Status:** decidido · **Data:** 2026-08-19

## Problema

A fase exige uma função serverless que valide o CPF do cliente, verifique sua existência na
base e devolva um JWT para consumir APIs protegidas — e um API Gateway que proteja as rotas
sensíveis. A aplicação, porém, já possui autenticação própria por e-mail e senha para os
funcionários (`ATENDENTE`, `MECANICO`, `ADMINISTRADOR`), com autorização por perfil.

A pergunta central não é *como emitir o token*, e sim **o que o token de um cliente pode
acessar**. Cliente e funcionário são atores diferentes: o cliente não pode listar ordens de
serviço de terceiros nem manipular o catálogo.

## Opções consideradas

### A. Token de cliente com acesso apenas às rotas do próprio cliente (escolhida)

As rotas do cliente externo — consulta de status da OS, consulta e decisão de orçamento —
deixam de ser abertas e passam a exigir o token de escopo `CLIENTE`. O login de
funcionários permanece intacto.

- **A favor:** respeita o modelo de perfis existente; melhora a segurança real do sistema
  (a decisão de orçamento era pública, protegida apenas pelo token de uso único enviado por
  e-mail); nenhuma mudança nas camadas de domínio e aplicação.
- **Contra:** o token de cliente não abre as APIs administrativas — que é justamente o
  comportamento desejado.

### B. Token de cliente com acesso às APIs internas

- **A favor:** leitura mais literal de "consumo das APIs protegidas".
- **Contra:** quebraria o modelo de autorização: ou o cliente enxergaria dados de outros
  clientes, ou toda consulta precisaria de um filtro por proprietário — retrabalho no
  domínio sem requisito de negócio que o sustente.

### C. Substituir o login de funcionários pelo fluxo de CPF

- **Contra:** funcionário não se autentica por CPF de cliente; descartada de imediato.

## Decisão

Opção **A**, com dois mecanismos coexistindo:

| Ator | Como autentica | O que acessa |
| --- | --- | --- |
| Cliente | `POST /auth` no gateway, informando o CPF | `/api/publico/*` (status da OS, orçamento, decisão) |
| Funcionário | `POST /api/auth/login` (e-mail e senha) | Rotas internas, conforme o perfil |

O token de orçamento de uso único, enviado por e-mail, permanece como segunda camada nas
rotas de orçamento: o JWT prova *quem é o cliente*, o token prova *qual orçamento* ele
recebeu.

Sobre a divergência entre professores a respeito do escopo da Lambda (uma ou três
funcionalidades), foi implementada a versão completa — validação do CPF, consulta do
cliente e emissão do token — por ser a leitura mais exigente do enunciado.

## Impacto

- Novo `ClienteJwtGuard` na aplicação e Lambda authorizer no gateway (ver ADR 001 e 002).
- Testes: unitários do guard e da Lambda, e cenários e2e cobrindo acesso com token, sem
  token e com token de funcionário.
- Consequência para o consumidor: as rotas `/api/publico/*` passaram a exigir
  `Authorization: Bearer <token>` — mudança quebradora documentada no `oficina.http`.
