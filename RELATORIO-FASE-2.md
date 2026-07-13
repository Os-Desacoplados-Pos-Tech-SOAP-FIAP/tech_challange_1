# Relatório de Execução — Fase 2 (Projeto FIAP)

**Data:** 2026-06-14
**Repositório:** `Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1`
**Branch base:** `main`
**Projeto Linear:** FIAP (time DevL)

Este relatório documenta a execução autônoma das tarefas do projeto **FIAP** no Linear,
seguindo, para cada tarefa, o fluxo: **branch dedicada → implementação → PR → review do
GitHub Copilot → correções → merge → atualização da `main`**.

---

## 1. Resumo

- **13 tarefas** executadas e **13 Pull Requests** abertos, revisados pelo Copilot e **mergeados** (#10–#22).
- Todas as tarefas correspondentes foram movidas para **Done** no Linear.
- **Todos os PRs receberam review do GitHub Copilot**; **22 comentários** acionáveis foram tratados (corrigidos ou respondidos com justificativa técnica) e **todas as threads foram resolvidas**.
- Estado final da `main`: **224 testes unitários** + **72 testes e2e** verdes, **cobertura ≥ 80%** (gate do `jest.config.ts`), **lint** verde e **CI** verde.

> As tarefas DEV-50 a DEV-54 já estavam concluídas/merge antes desta sessão (o status no Linear
> não sincroniza automaticamente com o merge). A verificação foi feita contra o estado real do
> repositório, não contra o status do Linear.

---

## 2. Ordem de execução (respeitando dependências)

A ordem foi definida para respeitar as dependências técnicas entre as entregas:

1. **App primeiro** — `/api/health` (base para probes e healthcheck).
2. **Docker** — `HEALTHCHECK` depende do endpoint de health.
3. **Kubernetes** — Deployment (probes em `/api/health`) → Service/Ingress → HPA (escala o Deployment).
4. **Terraform** — VPC (fundação) → EKS → RDS → ECR/Secrets → outputs/README.
5. **CI/CD** — `ci.yml` (pré-requisito) → `cd.yml` (usa ECR + EKS).
6. **Documentação** — README da Fase 2 (referencia tudo acima).

---

## 3. Tarefas executadas

| # | Linear | Título | PR | Comentários do Copilot | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | DEV-58 | Endpoint público `GET /api/health` | [#10](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/10) | 0 | ✅ Merged |
| 2 | DEV-66 | `HEALTHCHECK` no Dockerfile | [#11](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/11) | 1 | ✅ Merged |
| 3 | DEV-55 | Deployment K8s + initContainer de migrations | [#12](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/12) | 1 | ✅ Merged |
| 4 | DEV-56 | Service ClusterIP + Ingress ALB | [#13](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/13) | 1 | ✅ Merged |
| 5 | DEV-57 | HorizontalPodAutoscaler (2–10) | [#14](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/14) | 0 | ✅ Merged |
| 6 | DEV-59 | Terraform — VPC dedicada | [#15](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/15) | 3 | ✅ Merged |
| 7 | DEV-60 | Terraform — EKS + node group | [#16](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/16) | 4 | ✅ Merged |
| 8 | DEV-61 | Terraform — RDS Postgres 16 | [#17](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/17) | 4 | ✅ Merged |
| 9 | DEV-62 | Terraform — ECR + Secrets Manager | [#18](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/18) | 4 | ✅ Merged |
| 10 | DEV-63 | Terraform — outputs + README de operação | [#19](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/19) | 2 | ✅ Merged |
| 11 | DEV-64 | CI — `ci.yml` (lint, testes, cobertura) | [#20](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/20) | 3 | ✅ Merged |
| 12 | DEV-65 | CD — `cd.yml` (build ECR, deploy EKS) | [#21](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/21) | 3 | ✅ Merged |
| 13 | DEV-67 | README da Fase 2 | [#22](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/pull/22) | 6 | ✅ Merged |

---

## 4. Detalhe por tarefa

### DEV-58 — Endpoint `/api/health` (PR #10)
`HealthController` em `src/modules/health/` retornando `{ status: 'ok' }`, com `@Public()` para
escapar do `JwtAuthGuard` global; unit test (payload + flag pública) e e2e (200 sem token).
**Review:** sem comentários.

### DEV-66 — Dockerfile (PR #11)
Adicionado `HEALTHCHECK` no stage de produção batendo em `/api/health` (wget do busybox/alpine);
confirmados base `node:20-alpine`, ordem de COPY (cache) e `npm ci --omit=dev`.
**Review:** healthcheck passou a usar `${PORT:-3000}` para acompanhar a porta lida pela app.

### DEV-55 — Deployment K8s (PR #12)
`k8s/base/deployment.yaml` com initContainer de `prisma migrate deploy`, probes em `/api/health`,
requests/limits (cpu 200m/500m, mem 256Mi/512Mi), 2 réplicas e imagem parametrizada via Kustomize.
**Review:** `prisma` movido de `devDependencies` para `dependencies` (presente na imagem de produção)
e initContainer passou a usar `npx --no-install` — migrations determinísticas.

### DEV-56 — Service + Ingress ALB (PR #13)
`service.yaml` (ClusterIP 80→3000) e `ingress.yaml` com anotações ALB (`internet-facing`,
`target-type: ip`, `healthcheck-path`).
**Review:** adicionado `spec.ingressClassName: alb` (a anotação `kubernetes.io/ingress.class` é deprecada).

### DEV-57 — HPA (PR #14)
`hpa.yaml` (`autoscaling/v2`): min 2 / max 10, CPU 70% e memória 80%, alvo o Deployment `oficina-api`.
**Review:** sem comentários.

### DEV-59 — Terraform VPC (PR #15)
`versions.tf`, `variables.tf`, `vpc.tf` (módulo VPC: 3 AZs, 6 subnets, 1 NAT). `.gitignore` de Terraform.
**Review:** `min(3, length(azs))` para regiões com <3 AZs; tag `kubernetes.io/cluster/<nome>=shared` nas subnets.

### DEV-60 — Terraform EKS (PR #16)
`eks.tf` (módulo EKS ~20): node group `t3.medium` (2/2/5), IRSA, subnets privadas; providers
`kubernetes`/`helm` via `aws eks get-token`.
**Review:** `cluster_endpoint_public_access` e `enable_cluster_creator_admin_permissions` tornados
configuráveis; `exec.api_version` migrado de `v1beta1` para `v1`.

### DEV-61 — Terraform RDS (PR #17)
`rds.tf`: Postgres 16 `db.t3.micro` em subnet privada, SG liberando 5432 só dos nós EKS, senha sensitive.
**Review:** `validation` na `db_password`; flags `multi_az`/`deletion_protection`/`skip_final_snapshot`
tornadas configuráveis; descrições de SG mantidas em ASCII (a API da AWS rejeita acentos).

### DEV-62 — Terraform ECR + Secrets (PR #18)
`ecr.tf` (scan on push) e `secrets.tf` (`DATABASE_URL` do RDS + `JWT_SECRET` via `random_password`).
**Review:** `urlencode()` nas credenciais da `DATABASE_URL`; nome do ECR derivado de `cluster_name`;
`image_tag_mutability` default `IMMUTABLE`; nota sobre segredos no state.

### DEV-63 — Outputs + README de infra (PR #19)
`outputs.tf` (cluster, endpoints, ECR url, kubeconfig) e `infra/README.md` (recursos, variáveis,
comandos, custo estimado, segurança do state).
**Review:** comando de kubeconfig via output (sem região hardcoded); nome do ECR corrigido na doc.

### DEV-64 — CI `ci.yml` (PR #20)
Workflow de CI (Node 20: `npm ci` → prisma generate → lint → `test:cov` com gate 80% → upload de coverage).
**Setup do ESLint** que não existia no repo (flat config + `typescript-eslint`).
**Review:** script `lint:ci` sem `--fix` e com `--max-warnings 0`; `Logger` do Nest no lugar de `console.log`;
globais do Jest escopadas apenas a arquivos de teste.

### DEV-65 — CD `cd.yml` (PR #21)
Deploy contínuo via `workflow_run` após CI verde em `main`: OIDC, build/push no ECR por SHA imutável,
`kustomize edit set image`, `kubectl apply -k` + `rollout status` e rollback automático.
**Review:** `concurrency` com `cancel-in-progress`; kustomize por release fixado (sem `curl | bash`);
`apply`/`rollout` separados com rollback condicionado à falha do rollout.

### DEV-67 — README da Fase 2 (PR #22)
Seção Fase 2 (descrição, objetivos, **diagrama Mermaid**, instruções local/K8s/Terraform, links e
nota do email mock), mantendo a documentação da Fase 1 íntegra.
**Review:** placeholder do vídeo sem URL falsa; rota pública real documentada; acentuação e rota
corrigidas no diagrama; tabela confirmada correta (falso positivo respondido).

---

## 5. Estado final verificado

| Verificação | Resultado |
| --- | --- |
| Testes unitários | **224 passando** (46 suites) |
| Testes e2e | **72 passando** (10 suites) |
| Cobertura (gate 80% em domain/application) | **OK** (`npm run test:cov`) |
| Lint (`npm run lint:ci`, `--max-warnings 0`) | **OK** |
| CI (GitHub Actions) | **verde** em todos os PRs |
| Arquivos Terraform (`infra/`) | 8 `.tf` + `README.md` |
| Manifestos K8s (`k8s/base/`) | 8 YAMLs (base) + overlays dev/prod |

---

## 6. Decisões técnicas relevantes

- **`prisma` para `dependencies`** (DEV-55): garante o CLI na imagem de produção (`npm ci --omit=dev`),
  tornando migrations e `prisma generate` determinísticos.
- **ESLint configurado do zero** (DEV-64): o repositório não tinha linter; criado `eslint.config.mjs`
  (flat config) e script `lint:ci` para o gate de CI rodar **sem `--fix`**.
- **ECR `IMMUTABLE` + push por SHA** (DEV-62/DEV-65): builds reproduzíveis; o Deployment fixa o SHA via
  Kustomize, dispensando a tag `latest`.
- **Gate `vars.ENABLE_CD`** (DEV-65): evita runs vermelhos de CD em `main` enquanto a infra (Terraform)
  e o secret `AWS_ROLE_ARN` não estiverem provisionados; habilitação única, depois automático.
- **Hardening de segurança acatado do review**: endpoint EKS restringível por CIDR, flags de proteção do
  RDS configuráveis, OIDC sem chaves, segredos via Secrets Manager + nota de state criptografado.

## 7. Pendências (fora do escopo de código, para a entrega)

- **Link do vídeo demonstrativo:** https://youtu.be/SwKqzc23xvA ✅
- Para deploy real: provisionar a infra (`terraform apply`), configurar o secret `AWS_ROLE_ARN`
  (role IAM com trust de GitHub OIDC) e definir a variável de repositório `ENABLE_CD=true`.


# Status dos Entregáveis da Fase 2

| Entregável | Status | Localização |
| --- | --- | --- |
| Dockerfile | Completo | [`docker/Dockerfile`](docker/Dockerfile) (2 stages, HEALTHCHECK) |
| docker-compose | Completo | [`docker-compose.yml`](docker-compose.yml) (API + Postgres) |
| Manifestos Kubernetes | Completo | [`k8s/base/`](k8s/base/) (8 YAMLs: deployment, service, ingress, HPA…) |
| Overlays K8s | Completo | [`k8s/overlays/`](k8s/overlays/) (ci, dev, prod) |
| Terraform | Completo | [`infra/`](infra/) (VPC, EKS, RDS, ECR, Secrets Manager) |
| Pipeline CI/CD | Completo | [`.github/workflows/`](.github/workflows/) (ci.yml + cd.yml) |
| README — Descrição e objetivos | Completo | [`README.md`](README.md) |
| README — Diagrama de arquitetura | Completo | Mermaid flowchart com app, infra e deploy |
| README — Instruções local | Completo | `docker:up` documentado |
| README — Instruções Kubernetes | Completo | Kustomize dev/prod documentado |
| README — Instruções Terraform | Completo | Link para [`infra/README.md`](infra/README.md) |
| README — Link API (Swagger) | Completo | `/api/docs` documentado |
| README — Link vídeo demonstrativo | Completo | [https://youtu.be/SwKqzc23xvA](https://youtu.be/SwKqzc23xvA) |
| Swagger configurado | Completo | [`src/main.ts`](src/main.ts) |