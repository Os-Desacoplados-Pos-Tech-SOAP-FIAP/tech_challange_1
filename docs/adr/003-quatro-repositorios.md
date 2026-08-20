# ADR 003 — Separação em quatro repositórios

**Status:** aceito · **Data:** 2026-08-19 · **Fase:** 3

## Contexto

Até a Fase 2 o projeto era um repositório único com aplicação, manifestos Kubernetes e
Terraform (VPC, EKS, RDS, ECR) no mesmo estado. A Fase 3 exige quatro repositórios
independentes, cada um com CI/CD e deploy automático.

## Decisão

| Repositório | Responsabilidade | State |
| --- | --- | --- |
| `tech_challange_1` | Aplicação NestJS, manifestos Kustomize, documentação | — |
| `tc-lambda-auth` | Função de autenticação por CPF e authorizer | `lambda-auth/` |
| `tc-infra-kubernetes` | VPC, EKS, ECR, API Gateway (stack `gateway/`), observabilidade | `infra-kubernetes/`, `infra-gateway/` |
| `tc-infra-database` | RDS e Secrets Manager | `infra-database/` |

- A **VPC pertence ao repositório de Kubernetes**; banco e Lambda a consomem por
  `terraform_remote_state` (somente leitura). Evita um quinto repositório de rede e
  mantém uma única fonte da verdade.
- **Backend S3 único** (`tc-fase3-tfstate-538880133939`), uma *key* por stack, com lock
  nativo por `use_lockfile` — sem tabela DynamoDB.
- **Autenticação por OIDC**: uma role IAM por repositório, com *trust policy* restrita
  àquele repositório. Nenhuma credencial estática nos repositórios.
- Histórico das Fases 1 e 2 preservado no repositório da aplicação (branch `fase-2`
  bloqueada e tag `fase-2-entrega`).

**Ordem de deploy:** `tc-infra-kubernetes` → `tc-infra-database` → `tc-lambda-auth` →
aplicação → stack `gateway/`. Destruição na ordem inversa.

## Consequências

- Mudanças que cruzam fronteiras exigem dois PRs e respeitar a ordem de apply.
- O `terraform_remote_state` acopla os repositórios ao *formato dos outputs*: remover um
  output é mudança quebradora, o que é explícito no código.
- As roles usam `AdministratorAccess`. É deliberado para o escopo acadêmico (a esteira
  cria VPC, EKS, IAM, RDS); a redução para o mínimo necessário fica registrada como
  evolução — em produção, política por serviço e por recurso.
- Detalhe operacional descoberto na implementação: o GitHub emite o claim `sub` do token
  OIDC no formato enriquecido `repo:ORG@<org_id>/REPO@<repo_id>:<contexto>`. As trust
  policies aceitam os dois formatos (clássico e com IDs).
