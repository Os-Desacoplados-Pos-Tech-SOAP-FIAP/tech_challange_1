# ADR 002 — ALB público com validação dupla do token

**Status:** aceito · **Data:** 2026-08-19 · **Fase:** 3

## Contexto

O caminho canônico seria expor a aplicação apenas por dentro da VPC (ALB interno) e
conectá-la ao API Gateway por um **VPC Link**, deixando o gateway como única porta de
entrada.

O obstáculo é de ordem prática: o ALB não é criado pelo Terraform, e sim pelo **AWS Load
Balancer Controller** em tempo de execução, a partir do `Ingress` da aplicação. O VPC Link
precisa do ARN do listener do ALB, que só existe **depois** do deploy da aplicação — um
ciclo entre a stack de infraestrutura e o deploy do app.

## Decisão

Manter o **ALB internet-facing** (herdado da Fase 2) e proteger as rotas com **validação
dupla**:

1. no **API Gateway**, o Lambda authorizer valida o token de escopo `CLIENTE` nas rotas
   `/api/publico/*`;
2. na **aplicação**, o `ClienteJwtGuard` revalida o mesmo token, e as rotas internas
   seguem protegidas pelo `JwtAuthGuard` + `RolesGuard`.

O API Gateway é o endereço divulgado e o ponto de entrada oficial; o ALB permanece
acessível, mas quem o acessa diretamente não ganha nenhum privilégio.

## Consequências

- Nenhuma rota fica desprotegida se alguém contornar o gateway.
- A stack `gateway/` tem state próprio e é a **última** a subir (lê o ALB por data source)
  e a **primeira** a ser destruída.
- Custo e latência de um salto extra (gateway → ALB) são irrelevantes na escala do projeto.
- Evolução natural: com ALB interno pré-provisionado por Terraform (fora do controller),
  passa-se a VPC Link e fecha-se o acesso externo.
