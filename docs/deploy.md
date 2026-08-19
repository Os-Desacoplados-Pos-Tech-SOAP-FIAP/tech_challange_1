# Estrutura de Deploy

O deploy é **containerizado, automatizado via GitHub Actions, com destino AWS EKS (Kubernetes)** e imagens publicadas no **Amazon ECR**. Há também um caminho local com Docker Compose.

## Visão geral

```
Push/PR → CI (lint+test+cobertura) → CD (build/push ECR → deploy EKS via Kustomize)
                                                              ↓
                                              EKS namespace "oficina-mecanica"
```

## 1. Imagem Docker (`docker/Dockerfile`)

Multi-stage, baseada em `node:20-alpine`:

- **builder**: `npm ci`, `prisma generate`, `npm run build` → gera `dist/`.
- **production**: instala só dependências de produção (`--omit=dev`), regenera o Prisma Client, copia o `dist/` do builder.
- `EXPOSE 3000`, `HEALTHCHECK` batendo em `/api/health` (público, sem auth/DB), `CMD node dist/main.js`.

## 2. Ambiente local (`docker-compose.yml`)

Para rodar localmente: serviço `db` (Postgres 16) + `api`. A API sobe com `prisma migrate deploy && prisma db seed && node dist/main.js`, com `depends_on` aguardando o healthcheck do Postgres. Não é o caminho de produção — é apenas dev/avaliação.

## 3. CI (`.github/workflows/ci.yml`)

Dispara em **push em qualquer branch** e **PR para `main`**. Roda em Node 20:

`npm ci` → `prisma:generate` → `lint:ci` (sem `--fix`, `--max-warnings 0`) → `test:cov` (unit + e2e com gate de 80%) → publica artefato de cobertura.

É o gate de qualidade que precede o CD.

## 4. CD (`.github/workflows/cd.yml`)

### Quando o deploy realmente roda

O deploy **não roda na aprovação do PR**. Ele roda **após o merge na `main`**, e de forma indireta. A cadeia é:

1. PR aberto → o **CI** roda sobre o PR (lint + testes + cobertura). Isso *não* faz deploy.
2. PR aprovado e **merge na `main`** → gera um push em `main`, que dispara o **CI** novamente, agora sobre `main`.
3. Quando esse CI **conclui com sucesso em `main`**, o **CD** dispara via `workflow_run`.

Ou seja, o gatilho real do CD é "CI passou em `main`" (que acontece após o merge), e não a aprovação do PR em si.

Dispara via `workflow_run` **somente quando o CI conclui com sucesso em `main`**.

Características principais:

- **Autenticação AWS por OIDC** (`id-token: write`), assumindo `AWS_ROLE_ARN` — sem chaves estáticas.
- **`concurrency: cd-production` com `cancel-in-progress`** — evita deploys fora de ordem.
- **Gate `vars.ENABLE_CD == 'true'`** — o CD só executa quando essa variável de repositório está habilitada (protege enquanto a infra/Terraform não está pronta).

Dois jobs:

### `build-and-push`
Checkout do SHA que passou no CI, login no ECR, `docker build -f docker/Dockerfile` e push com tag = **SHA do commit** (tags imutáveis no ECR; não usa `latest`).

### `deploy`
- Instala `kustomize` (versão fixada `v5.4.3`).
- `aws eks update-kubeconfig` no cluster `oficina-mecanica`.
- `kustomize edit set image` fixando o SHA no overlay de prod.
- `kubectl apply -k k8s/overlays/prod`.
- Aguarda `kubectl rollout status` (timeout 5m).
- **Rollback automático** (`rollout undo`) apenas se o rollout especificamente falhar.

## 5. Manifestos Kubernetes (`k8s/`, Kustomize base + overlays)

- **base/**: `namespace`, `configmap` (config não-sensível), `secret` (template com placeholders), `deployment`, `service`, `ingress`, `hpa`.
- **overlays/dev**: patch com `NODE_ENV=development`, `LOG_LEVEL=debug`.
- **overlays/prod**: usa defaults da base; imagem e segredos injetados pelo pipeline.

### Deployment (`oficina-api`)
- 2 réplicas iniciais (HPA assume a escala em runtime).
- **initContainer `prisma-migrate`** que roda `prisma migrate deploy` antes do container principal subir.
- `readinessProbe`/`livenessProbe` em `/api/health`.
- Requests/limits de CPU/memória alinhados ao HPA.

### Segredos em produção
Vêm do **AWS Secrets Manager**, sincronizados ao cluster pelo **External Secrets Operator**, substituindo o `secret.yaml` template da base.

## Credenciais e conta AWS

- **Sem credenciais estáticas.** A autenticação usa **OIDC**: o GitHub Actions emite um token de identidade do workflow (`permissions: id-token: write`) e a AWS troca por credenciais temporárias, assumindo uma IAM Role.

  ```yaml
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
      aws-region: us-east-1
  ```

- **`AWS_ROLE_ARN`** é um secret do GitHub (Settings → Secrets and variables → Actions). Contém o ARN da role, no formato `arn:aws:iam::<ACCOUNT_ID>:role/<nome-da-role>`.

- **A conta AWS de destino é o número de 12 dígitos (`<ACCOUNT_ID>`) dentro desse ARN.** Não está fixado em nenhum lugar do repositório.

- **O valor de um secret nunca pode ser lido** — nem via UI, CLI ou API. O GitHub os trata como write-only. O `gh` só lista nomes/metadados.

- Destino concreto dentro da conta (definido no `cd.yml`):
  - Região: `us-east-1`
  - Cluster EKS: `oficina-mecanica`
  - Repositório ECR: `oficina-mecanica-api`

- Para descobrir a conta de fato: pedir a um **admin da org** para conferir o valor de `AWS_ROLE_ARN`, ou inspecionar no lado AWS a IAM Role com trust policy para `token.actions.githubusercontent.com` e a conta onde estão o cluster EKS e o ECR.

## Estado atual da configuração (verificado via `gh` em 2026-06-21)

Repositório: `Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1`.

- **Secrets a nível de repositório:** nenhum → **`AWS_ROLE_ARN` não está definido no repo.**
- **Variables a nível de repositório:** nenhuma → **`ENABLE_CD` não está definido no repo.**
- **Environments:** existe `copilot` (do GitHub Copilot, sem relação com o deploy).
- **Org:** secrets/variables retornam **403** (sem permissão de admin/fine-grained), então não dá para listar daí.

Implicações:

1. Como `ENABLE_CD` não está configurado e o job tem `if: vars.ENABLE_CD == 'true'`, **o CD não está fazendo deploy hoje** — o job `build-and-push` é pulado. Merge na `main` roda o CI, mas **não** dispara deploy real.
2. `AWS_ROLE_ARN` também não aparece no repo. Ou está definido **a nível de organização** (não visível sem permissão de admin) ou **ainda não foi criado** — o que é consistente com os comentários no `cd.yml` sobre "habilitar quando a infra/Terraform estiver pronta".

## 6. Kubernetes — conceitos e como aparecem no projeto

Kubernetes (K8s) é um **orquestrador de containers**: roda containers Docker em um conjunto de máquinas (cluster), mantendo-os no ar, escalando, reiniciando quando caem e expondo-os à rede. Você descreve o **estado desejado** em YAML e o K8s reconcilia continuamente a realidade com essa descrição.

### Componentes principais

| Conceito | O que é | Neste projeto |
| --- | --- | --- |
| **Cluster** | Conjunto todo: control plane (cérebro) + nodes (workers) | AWS EKS gerenciado (`oficina-mecanica`) |
| **Node** | Máquina worker onde os containers rodam | EC2 `t3.medium` (2 a 5) |
| **Pod** | Menor unidade de deploy; envelope com 1+ containers | Pod da API (initContainer + container `api`) |
| **Deployment** | Mantém N réplicas, faz rolling update e rollback | `oficina-api`, 2 réplicas |
| **Service** | Endereço de rede estável + balanceamento interno | `service.yaml` |
| **Ingress** | Entrada HTTP externa; vira ALB na AWS | `ingress.yaml` |
| **ConfigMap** | Config não-sensível (env vars) | `NODE_ENV`, `PORT`, `JWT_EXPIRES_IN`, `LOG_LEVEL` |
| **Secret** | Dados sensíveis | `oficina-api-secret` (`DATABASE_URL`, `JWT_SECRET`) |
| **HPA** | Autoscaling de pods por CPU/memória | `hpa.yaml` (2 → até 5) |
| **Namespace** | Isolamento lógico de recursos | `oficina-mecanica` |

### Organização (Kustomize: base + overlays)

```
k8s/base/
├── namespace.yaml    → namespace oficina-mecanica
├── deployment.yaml   → 2 réplicas da API + initContainer que roda migrations
├── service.yaml      → endereço interno estável da API
├── ingress.yaml      → entrada HTTP externa (vira ALB na AWS)
├── hpa.yaml          → autoscaling (2 → até 5 pods)
├── configmap.yaml    → NODE_ENV, PORT, JWT_EXPIRES_IN, LOG_LEVEL
└── secret.yaml       → TEMPLATE de DATABASE_URL e JWT_SECRET (placeholders)
```

### Ciclo de vida do pod da API ao subir

1. **initContainer `prisma-migrate`** roda `prisma migrate deploy` — aplica as migrations **antes** do container principal subir.
2. O container `api` sobe, lendo config do ConfigMap + segredos do Secret.
3. K8s checa `readinessProbe`/`livenessProbe` em `/api/health` — só envia tráfego quando pronto, e reinicia se travar.
4. HPA observa CPU/memória e ajusta o número de réplicas.

> O banco **não** está nesses manifestos — é deliberadamente externo ao cluster (ver seção 7).

## 7. Deploy do banco de dados (AWS RDS, via Terraform)

### Onde: RDS, fora do cluster

O banco **não roda no Kubernetes**. É uma decisão arquitetural explícita (`infra/rds.tf`: *"Banco gerenciado externo ao cluster"*): um **AWS RDS PostgreSQL 16 gerenciado**, separado do EKS.

**Por quê fora do cluster:** banco é *stateful* (dados que precisam persistir e ser consistentes). O RDS já entrega backup automático, patching, multi-AZ e criptografia prontos. Padrão recomendado: **app stateless no K8s, dados no serviço gerenciado**.

### Como: provisionado por Terraform (`infra/`)

A stack em `infra/` cria toda a infra AWS. O banco é definido em `infra/rds.tf`:

- Engine `postgres`, classe parametrizada (default `db.t3.micro`).
- **`storage_encrypted = true`** — disco criptografado.
- **`publicly_accessible = false`** — sem IP público; só acessível de dentro da VPC.
- Fica em **subnets privadas** (via `db_subnet_group`).
- **Security Group dedicado** liberando a porta **5432 apenas para o SG dos nodes do EKS** — só os pods da aplicação falam com o banco.
- Flags de robustez para produção: `multi_az`, `deletion_protection`, `skip_final_snapshot`.

### Como as credenciais chegam à aplicação

A senha do banco **não fica no código nem nos YAMLs**. A cadeia (`infra/secrets.tf` → cluster):

1. **Terraform monta a `DATABASE_URL`** a partir do endpoint do RDS + usuário/senha, no formato Prisma:
   `postgresql://<user>:<senha>@<endpoint-rds>:5432/<db>?schema=public`
2. Essa URL (e o `JWT_SECRET`, gerado aleatoriamente) é gravada no **AWS Secrets Manager** (`oficina-mecanica/DATABASE_URL`, `oficina-mecanica/JWT_SECRET`).
3. No cluster, o **External Secrets Operator (ESO)** sincroniza esses valores do Secrets Manager para um **Secret nativo do K8s** (`oficina-api-secret`), substituindo o `secret.yaml` template.
4. O pod da API lê esse Secret via `envFrom: secretRef` e recebe a `DATABASE_URL` como env var.
5. O Prisma conecta usando a `DATABASE_URL`; o **initContainer roda as migrations** contra o RDS antes da API subir.

### Sequência completa

```
terraform apply
   ├─ cria VPC + subnets privadas
   ├─ cria RDS Postgres 16 (privado, criptografado, SG só p/ EKS)   ← infra/rds.tf
   └─ monta DATABASE_URL e grava no Secrets Manager                 ← infra/secrets.tf
        ↓
External Secrets Operator (no cluster)
   └─ sincroniza Secrets Manager → Secret do K8s (oficina-api-secret)
        ↓
Deploy da API (kubectl apply -k k8s/overlays/prod)
   ├─ initContainer prisma-migrate → aplica migrations no RDS
   └─ container api → conecta no RDS usando DATABASE_URL
```

**Resumo:** o **schema/migrations** são aplicados pela própria aplicação (initContainer `prisma migrate deploy`); a **instância do banco** é provisionada e gerenciada fora do K8s, via Terraform → RDS, com credenciais fluindo por Secrets Manager + External Secrets Operator.

> A `db_password` nunca é versionada — é fornecida via `TF_VAR_db_password` ou `*.tfvars` fora do controle de versão. Atenção: o state do Terraform contém `DATABASE_URL` e `JWT_SECRET` em texto plano; use backend remoto criptografado (S3 + SSE/KMS) em uso compartilhado.

## 8. Infra (Terraform) é manual e separada do pipeline

**O Terraform NÃO roda quando você faz merge de uma PR.** Não há nenhum step de `terraform plan`/`apply` nos workflows — a única menção a "terraform" no `cd.yml` é um comentário. O ciclo é dividido em duas responsabilidades:

| Camada | O que provisiona | Como é executado |
| --- | --- | --- |
| **Infra** (`infra/*.tf`) | VPC, EKS, **RDS**, ECR, Secrets Manager, IAM | **Manual** — alguém roda `terraform apply` localmente |
| **Aplicação** (`k8s/`) | imagem + manifestos no cluster já existente | **Automático** — via `cd.yml` após merge na `main` |

O Terraform cria a "casa" (cluster, banco, registries) **uma vez, manualmente**; depois, cada merge na `main` (com `ENABLE_CD=true`) só **redeploya a aplicação** dentro dessa infra existente — não recria VPC/EKS/RDS.

**Por quê manual:** `terraform apply` é destrutivo por natureza e o RDS é *stateful*; mudanças de infra exigem revisão humana do `terraform plan` antes de aplicar. A infra precisa ser aplicada **antes** de habilitar o CD, pois é o Terraform que cria o RDS e grava a `DATABASE_URL` no Secrets Manager.

## 9. Pré-requisitos para testar o deploy da infra (Terraform)

### Ferramentas

| Ferramenta | Versão exigida | Para quê |
| --- | --- | --- |
| Terraform | `>= 1.5` | Aplicar a stack `infra/` |
| AWS CLI v2 | qualquer recente | Autenticar na AWS; `aws eks get-token` é usado pelos providers `kubernetes`/`helm` durante o apply |
| kubectl | recente | Operar o cluster após o apply |

### Conta e credenciais AWS

- Uma **conta AWS** com permissões para VPC, EKS, RDS, ECR, Secrets Manager e IAM.
- AWS CLI autenticada (`aws configure` ou SSO). A identidade ativa é usada pelo Terraform e vira admin do cluster (`enable_cluster_creator_admin_permissions = true`).

### Variáveis obrigatórias

- **`db_password`** (≥ 8 caracteres) — única variável sem default. Fornecer via:
  ```bash
  export TF_VAR_db_password='uma-senha-forte-aqui'
  ```
  Nunca versionar (nem em `*.tfvars` commitado).

### Custo / limpeza

A stack gera custo enquanto está no ar (~US$ 6–9/dia — EKS, nodes, NAT, RDS, ALB). **Rodar `terraform destroy` ao terminar o teste.**

### Sequência para testar

```bash
cd infra
terraform init                       # baixa providers e módulos
export TF_VAR_db_password='...'
terraform plan                       # revisar o que será criado
terraform apply                      # provisiona VPC/EKS/RDS/ECR/Secrets
eval "$(terraform output -raw kubeconfig_command)"   # configura kubectl
kubectl get nodes                    # deve listar 2 nós Ready
kubectl apply -k ../k8s/overlays/prod                # deploy da aplicação
# ... ao terminar:
terraform destroy
```

## 10. Configuração da AWS CLI e credenciais

### Instalar a AWS CLI (Windows)

```bash
winget install -e --id Amazon.AWSCLI
```

Depois **reabra o terminal** para o `aws` entrar no PATH. Validar: `aws --version`.

### Conceito: o que o IAM resolve

A cada chamada à API da AWS, o IAM (Identity and Access Management) responde **quem é você?** (autenticação) e **você pode fazer isso?** (autorização). Você precisa de uma **identidade** com **permissões** e de **credenciais** para o Terraform/CLI provarem quem são.

| Peça | O que é | Papel |
| --- | --- | --- |
| **Usuário IAM** | "Conta de funcionário" dentro da conta AWS | A identidade (o "quem") |
| **Policy** | Documento JSON listando permissões | A autorização (o "pode fazer o quê") |
| **Access Keys** | Par Access Key ID + Secret Access Key | A prova de identidade usada por CLI/Terraform |

> Não use a conta **root** no dia a dia: se a credencial vazar, perde-se a conta inteira. Crie um usuário IAM limitado e descartável.

### Cenário A — Conta AWS própria (login root)

1. Console AWS → **IAM** → **Users** → **Create user** → nome `terraform-oficina`. Não marcar acesso ao console (é só CLI).
2. Permissões → **Attach policies directly** → anexar **`AdministratorAccess`** (o Terraform cria recursos em VPC/EKS/RDS/ECR/Secrets/**IAM**; admin evita o `apply` travar por falta de permissão num sandbox).
3. Abrir o usuário → **Security credentials** → **Create access key** → caso de uso **CLI**. Copiar o **Access key ID** e o **Secret access key** (o secret só aparece **uma vez**).
4. Configurar a CLI:
   ```bash
   aws configure
   # AWS Access Key ID     → (cole)
   # AWS Secret Access Key → (cole)
   # Default region name   → us-east-1
   # Default output format → json
   ```
   Grava em `~/.aws/credentials` e `~/.aws/config`. **Nunca** versionar essas chaves.

### Cenário B — AWS Academy Learner Lab (voclabs)

Identificável pelo ARN `arn:aws:sts::<conta>:assumed-role/voclabs/...`. Aqui **não dá para criar usuário IAM nem Access Keys** (a policy do lab nega IAM). As credenciais são **temporárias** e vêm prontas do lab:

1. Iniciar o lab (bolinha **verde**) → clicar em **"AWS Details"** → **"AWS CLI: Show"**.
2. Copiar o bloco com **três** linhas (note o `aws_session_token`):
   ```ini
   [default]
   aws_access_key_id=ASIA...
   aws_secret_access_key=...
   aws_session_token=...
   ```
3. `aws configure` **não serve** (não pergunta o session token). Cole o bloco direto em `~/.aws/credentials` (`C:\Users\<user>\.aws\credentials`) e crie `~/.aws/config` com:
   ```ini
   [default]
   region = us-east-1
   output = json
   ```
4. As credenciais **expiram** ao encerrar a sessão do lab — repetir a cada reinício.

### Validar a autenticação

```bash
aws sts get-caller-identity   # retorna Account (12 dígitos), UserId e Arn
```

### ⚠️ Limitação: este Terraform NÃO roda no AWS Academy

Testado em 2026-06-21 (conta `280273007505`, role `voclabs`): credenciais autenticam e o `terraform plan` chega a calcular **56 recursos**, mas falha em operações de IAM —
`iam:GetRole ... explicit deny in policy Pvoclabs2`.
O módulo EKS precisa criar a cluster role, a node role e o OIDC/IRSA (operações IAM), todas negadas pelo Learner Lab. Para o deploy completo da infra: usar uma **conta AWS própria** (Cenário A) ou reescrever `infra/` para reaproveitar a `LabRole` e remover a criação de roles IAM.

## 11. Análise: por que a infra não roda no AWS Academy Learner Lab

Investigação empírica (2026-06-21, conta `280273007505`, role de sessão `voclabs`).

### O que o lab permite vs. nega (testado)

| Ação | Resultado |
| --- | --- |
| `eks:ListClusters`, `ec2:DescribeVpcs`, `rds:DescribeDBInstances`, `secretsmanager:ListSecrets` | ✅ permitido (os serviços em si estão liberados) |
| `iam:ListRoles` | ✅ permitido |
| `iam:GetRole` na **`LabRole`** | ✅ permitido — e a `LabRole` existe (`arn:aws:iam::280273007505:role/LabRole`) |
| `iam:GetRole` na role **`voclabs`** (a da sessão) | ❌ **explicit deny** (policy `Pvoclabs2`) |
| `iam:CreateRole` / `iam:CreatePolicy` / `iam:CreateOpenIDConnectProvider` | ❌ negado (padrão do Academy) |

**Resumo:** os serviços (EKS, EC2, RDS, Secrets Manager) estão liberados; o que o Academy trava é o **IAM de escrita/inspeção de roles**.

### Causa raiz do erro no `terraform plan`

O módulo EKS (`terraform-aws-modules/eks` ~> 20) sempre instancia este data source (`main.tf:8`):

```hcl
data "aws_iam_session_context" "current" {
  count = local.create ? 1 : 0          # sempre criado quando o EKS está ativo
  arn = try(data.aws_caller_identity.current[0].arn, "")
}
```

Ele resolve o ARN canônico da role da sessão chamando internamente `iam:GetRole` na role `voclabs` — que o lab **nega explicitamente**. Como o `count` é `local.create` (e **não** depende de `enable_cluster_creator_admin_permissions`), desligar essa flag **não** evita a falha. Por isso o erro ocorre já no `plan`.

> Validação positiva: antes de abortar, o `plan` calcula **56 recursos a criar** — o código da stack está correto; o bloqueio é exclusivamente do ambiente.

### Por que o `apply` também falharia (mesmo contornando o data source)

O módulo EKS precisa **criar recursos IAM** que o lab nega:
- `aws_iam_role` da cluster role + attachments;
- `aws_iam_role` da node group role + 3 attachments (`AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly`);
- `aws_iam_openid_connect_provider` por causa de `enable_irsa = true` (`infra/eks.tf:15`) — necessário p/ External Secrets Operator e AWS LB Controller.

### O CD (GitHub Actions) também não funciona no lab

O `cd.yml` autentica via **OIDC**, que exige criar previamente na conta um **IAM OIDC Provider** (`token.actions.githubusercontent.com`) e uma **IAM Role** (`AWS_ROLE_ARN`) com trust policy — ambas operações IAM **negadas** no Academy. A alternativa de usar **Access Keys estáticas** nos secrets do GitHub não serve: as credenciais do lab são **temporárias** (`aws_session_token`, expiram em horas), exigindo reescrever os secrets a cada sessão. **No Academy, qualquer deploy é necessariamente manual** (`kubectl apply` local), nunca pelo pipeline.

### Caminhos possíveis (do mais simples ao mais trabalhoso)

1. **Conta AWS própria (recomendado).** O código está correto; numa conta com IAM liberado, roda como está. Custo ~US$ 6–9/dia; lembrar do `terraform destroy`.
2. **EKS fora do Terraform + só os manifestos.** Criar o cluster via console/`eksctl` (que usa a `LabRole` automaticamente) e rodar `kubectl apply -k k8s/overlays/prod`. Evita o Terraform do EKS por completo.
3. **Reescrever `infra/` para o Academy (frágil).** `create_iam_role = false` + `iam_role_arn = <LabRole>` no cluster e nos node groups, `enable_irsa = false`, `enable_cluster_creator_admin_permissions = false`. Porém o `aws_iam_session_context` é interno ao módulo e só sai forkando/vendorizando o módulo EKS; e desligar IRSA quebra ESO/LB Controller. Bastante esforço, foge do propósito do projeto.

## Pontos de atenção

- O fluxo automático para produção depende de duas coisas configuradas na AWS/GitHub: o secret `AWS_ROLE_ARN` (role OIDC) e a variável `ENABLE_CD=true`. Sem elas, o CD não roda.
- O `k8s/README.md` está **desatualizado**: afirma que `base/` ainda não inclui Deployment/Service/Ingress/HPA, mas esses manifestos já existem e estão no `base/kustomization.yaml`. Vale corrigir o README para manter a doc fiel.

## 12. Mensagens prontas (para compartilhar a investigação)

Textos para perguntar a colegas se passaram pelo mesmo erro no AWS Academy.

### Para o grupo do Discord

> Pessoal, alguém aí tentou rodar o `terraform apply` da infra (EKS) **dentro do AWS Academy Learner Lab** e bateu num erro de IAM? No meu caso o `terraform plan` calcula tudo (56 recursos), mas falha com:
>
> ```
> Error: unable to get role (voclabs): iam:GetRole ... explicit deny in policy Pvoclabs2
> ```
>
> Investigando, o lab **nega operações de IAM** (criar role, e até `GetRole` na própria role `voclabs`). O módulo EKS do Terraform precisa criar a cluster role, a node role e o OIDC provider (IRSA), e tudo isso é bloqueado pelo Academy. Os serviços em si (EKS, EC2, RDS, Secrets) estão liberados — o problema é só o IAM de escrita.
>
> Alguém conseguiu contornar isso no lab (reusando a `LabRole`, por ex.) ou todo mundo rodou em conta AWS própria? 👀

### Para o amigo de grupo

> E aí! Você chegou a conseguir rodar o deploy da infra (Terraform do EKS) no **AWS Academy**? Aqui eu **não consegui** e descobri o porquê:
>
> O Learner Lab **bloqueia operações de IAM**. O Terraform tenta criar roles (cluster role, node role) e o OIDC provider do IRSA, e o lab nega tudo isso — dá `AccessDenied`/`explicit deny` na policy `Pvoclabs2`. Até o `terraform plan` falha antes de criar nada, porque o módulo do EKS chama `iam:GetRole` na role `voclabs` da sessão, que também é negada.
>
> O código está certo (o plan calcula os 56 recursos numa boa), o impedimento é o ambiente do lab mesmo. O CD pelo GitHub Actions também não rola no lab, porque o OIDC precisa criar role/provider de IAM (bloqueado) e as credenciais do lab são temporárias.
>
> Você rodou em conta AWS própria ou achou um jeito de fazer funcionar no lab? Se conseguiu, me conta como 🙏
