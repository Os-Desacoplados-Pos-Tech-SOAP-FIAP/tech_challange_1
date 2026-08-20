# ADR 001 — Lambda authorizer HS256 para o token de cliente

**Status:** aceito · **Data:** 2026-08-19 · **Fase:** 3

## Contexto

A Fase 3 exige autenticação do cliente por CPF numa função serverless, com as rotas
sensíveis protegidas por um API Gateway. O token precisa ser aceito tanto pelo gateway
quanto pela API NestJS, que já valida JWTs de funcionários assinados em **HS256** com o
segredo `JWT_SECRET` (Fases 1–2).

O API Gateway HTTP oferece um *JWT authorizer nativo*, porém ele exige um emissor OIDC
com JWKS público (assinatura assimétrica, RS256). Adotá-lo implicaria emitir tokens
RS256, publicar um endpoint JWKS e manter rotação de chaves — ou introduzir um Cognito,
ampliando o escopo sem ganho para o objetivo da fase.

## Decisão

A Lambda emite **JWT HS256** com o mesmo `JWT_SECRET` da aplicação (lido do AWS Secrets
Manager em ambos os lados) e o gateway valida esse token via **Lambda authorizer**
(`REQUEST`, payload 2.0, *simple response*, cache de 300s).

Contrato de claims:

| Claim | Conteúdo |
| --- | --- |
| `sub` | id do cliente no banco |
| `cpf` | CPF somente dígitos |
| `scope` | `CLIENTE` (distingue do token de funcionário, que carrega `perfil`) |
| `exp` | 1 hora |

A Lambda executa as três etapas exigidas pelo enunciado: valida formato e dígitos
verificadores do CPF, consulta a existência do cliente na base e devolve o token.

**"Status do cliente"**: a tabela `Cliente` não possui coluna de status/ativo. O critério
adotado é a *existência do cadastro* — cliente não encontrado resulta em `404
CLIENTE_NAO_ENCONTRADO`. Introduzir uma coluna de status seria mudança de modelo sem
requisito de negócio que a sustente.

## Consequências

- Nenhum endpoint JWKS para publicar e nenhuma chave assimétrica para rotacionar.
- O segredo é compartilhado entre Lambda e API: girá-lo exige redeploy coordenado dos
  dois (mitigado por ambos lerem do Secrets Manager no boot).
- O authorizer roda **fora da VPC** (só verifica assinatura), o que reduz o cold start;
  a Lambda de autenticação roda **dentro** da VPC porque consulta o RDS.
- O cache de 300s do authorizer significa que a revogação de um token não é imediata —
  aceitável para o escopo, dado o `exp` curto.

## Alternativas consideradas

- **JWT authorizer nativo + RS256/JWKS:** menos código, porém exige infraestrutura de
  chaves e mudança no formato do token já usado pela aplicação.
- **Amazon Cognito:** resolveria emissão e validação, mas o requisito é autenticação por
  CPF contra a base própria — o Cognito viraria uma camada a mais para o mesmo resultado.
