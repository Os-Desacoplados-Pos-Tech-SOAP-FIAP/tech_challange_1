# Infraestrutura (Terraform) — Oficina Mecânica (Fase 2)

Provisiona, na AWS, toda a base para rodar a API NestJS em Kubernetes gerenciado
(EKS), com banco gerenciado (RDS), registro de imagens (ECR) e segredos
(Secrets Manager). Os manifestos da aplicação ficam em [`../k8s`](../k8s).

## Recursos provisionados

| Arquivo | Recursos |
| --- | --- |
| `versions.tf` | Versões de Terraform e providers (`aws ~> 5`, `kubernetes`, `helm`, `random`) + provider AWS com `default_tags`. |
| `vpc.tf` | VPC dedicada (módulo `terraform-aws-modules/vpc`): 3 AZs, 1 subnet pública + 1 privada por AZ (6 subnets), **1 NAT gateway** único, tags de descoberta para EKS/ALB. |
| `eks.tf` | Cluster **EKS** (módulo `terraform-aws-modules/eks`) + 1 managed node group `t3.medium` (`desired 2 / min 2 / max 5`), **IRSA** habilitado. Providers `kubernetes`/`helm` autenticados via `aws eks get-token`. |
| `rds.tf` | **RDS Postgres 16** `db.t3.micro` em subnets privadas, SG dedicado liberando 5432 apenas para os nós do EKS, `storage_encrypted`. |
| `ecr.tf` | Repositório **ECR** `oficina-mecanica-api`, scan on push, tags `IMMUTABLE` por padrão. |
| `secrets.tf` | **Secrets Manager**: `DATABASE_URL` (montada do RDS) e `JWT_SECRET` (gerado via `random_password`). Sincronizados ao cluster pelo External Secrets Operator. |
| `outputs.tf` | `cluster_name`, `cluster_endpoint`, `rds_endpoint`, `ecr_repository_url`, `kubeconfig_command`, nomes dos secrets. |

## Pré-requisitos

- [Terraform](https://developer.hashicorp.com/terraform) >= 1.5
- [AWS CLI](https://docs.aws.amazon.com/cli/) autenticado (`aws configure` ou SSO) com permissões para VPC/EKS/RDS/ECR/Secrets Manager/IAM
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) para operar o cluster após o apply

## Variáveis principais

| Variável | Default | Descrição |
| --- | --- | --- |
| `aws_region` | `us-east-1` | Região da stack. |
| `cluster_name` | `oficina-mecanica` | Nome do cluster e prefixo dos recursos. |
| `cluster_version` | `1.30` | Versão do Kubernetes. |
| `vpc_cidr` | `10.0.0.0/16` | CIDR da VPC. |
| `db_password` | **(obrigatória)** | Senha master do RDS (≥ 8 caracteres). |

Variáveis adicionais permitem endurecer o ambiente para produção
(`db_multi_az`, `db_deletion_protection`, `db_skip_final_snapshot`,
`cluster_endpoint_public_access_cidrs`, etc.) — ver `variables.tf`.

> A `db_password` **nunca** deve ser versionada. Forneça via variável de ambiente
> `TF_VAR_db_password` ou um arquivo `*.tfvars` fora do controle de versão.

## Comandos

```bash
cd infra

# 1. Inicializa providers e módulos
terraform init

# 2. Revisa o plano (informe a senha do banco via env var)
export TF_VAR_db_password='uma-senha-forte-aqui'
terraform plan

# 3. Aplica
terraform apply

# 4. Destrói tudo quando não precisar mais
terraform destroy
```

## Obter o kubeconfig

Após o `apply`, configure o `kubectl` apontando para o cluster recém-criado:

```bash
# O comando exato também sai em `terraform output kubeconfig_command`
aws eks update-kubeconfig --name "$(terraform output -raw cluster_name)" --region us-east-1

kubectl get nodes        # deve listar 2 nós Ready
```

Em seguida, faça o deploy da aplicação:

```bash
kubectl apply -k ../k8s/overlays/prod
```

## Custo estimado (rough)

Estimativa grosseira em `us-east-1` (on-demand), apenas como ordem de grandeza:

| Item | ~/dia |
| --- | --- |
| Control plane EKS (US$ 0,10/h) | ~US$ 2,40 |
| 2× nós `t3.medium` | ~US$ 2,00 |
| NAT gateway (1×) | ~US$ 1,10 |
| RDS `db.t3.micro` + 20 GB | ~US$ 0,50 |
| ALB (Ingress) | ~US$ 0,55 |
| ECR + Secrets Manager + EBS | ~US$ 0,20 |
| **Total aproximado** | **~US$ 6–9 / dia** |

> Custos reais variam por região, tráfego e tempo de execução. **Rode
> `terraform destroy` ao terminar** para não acumular cobrança.

## Estado do Terraform (segurança)

Este projeto usa, por padrão, o **backend local** (arquivo `terraform.tfstate`).
O state contém valores sensíveis em texto plano (ex.: `DATABASE_URL` e
`JWT_SECRET`). Para uso compartilhado/produção, configure um backend remoto
**criptografado e com acesso restrito**, por exemplo S3 + SSE/KMS com bloqueio
via DynamoDB. Nunca versione o arquivo de state.
