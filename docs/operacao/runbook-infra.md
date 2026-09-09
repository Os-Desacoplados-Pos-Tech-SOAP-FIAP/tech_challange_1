# Runbook — subir e derrubar a infraestrutura

Procedimentos operacionais da Fase 3. **Não é o roteiro do vídeo** — quem for gravar deve
seguir `docs/video/roteiro-fase-3.md`, que assume o ambiente já no ar.

> ⚠️ A infraestrutura gera custo enquanto estiver de pé (EKS, RDS e NAT Gateway são a maior
> parte). Regra do projeto: **subir para usar, destruir ao terminar.**

---

## Quem pode fazer o quê

O `apply` e o `destroy` param em **"Review deployments"** aguardando aprovação no
environment `aws-infra`. Qualquer pessoa do time dispara; **só o dono da conta aprova**.
É a trava de custo — o `plan` roda livre, sem aprovação e sem gasto.

---

## Subir (~40 min no total)

Em cada repositório: **Actions → workflow → Run workflow → `action: apply`**, e então
**Review deployments → marcar `aws-infra` → Approve and deploy**.

| Ordem | Repositório | Workflow | Tempo |
| --- | --- | --- | --- |
| 1 | `tc-infra-kubernetes` | [Terraform](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes/actions/workflows/terraform.yml) | ~20 min |
| 2 | `tc-infra-database` | [Terraform](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-database/actions/workflows/terraform.yml) | ~10 min |
| 3 | `tc-lambda-auth` | [Pipeline](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-lambda-auth/actions/workflows/pipeline.yml) | ~2 min |
| 4 | `tech_challange_1` | [CD](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1/actions/workflows/cd.yml) | ~5 min |
| 5 | `tc-infra-kubernetes` | [Terraform Gateway](https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes/actions/workflows/terraform-gateway.yml) | ~2 min |

O passo 2 pode rodar em paralelo com o 1 assim que a VPC existir — os outputs do cluster
já ficam gravados no state antes do fim do apply.

### Depois de subir: anotar as URLs

```bash
export AWS_PROFILE=hailton-aws
aws apigatewayv2 get-apis --query "Items[?Name=='oficina-mecanica-gateway'].ApiEndpoint" --output text
aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName' --output text
```

Atualize `@gateway` e `@alb` no topo de `docs/oficina3.http` — **elas mudam a cada subida**.

### Conferir que está tudo de pé

```bash
export AWS_PROFILE=hailton-aws
aws eks update-kubeconfig --name oficina-mecanica --region us-east-1
kubectl get pods -n oficina-mecanica      # 2 pods Running
kubectl get pods -n observability         # pods do Alloy Running
curl -s -o /dev/null -w '%{http_code}\n' "$GATEWAY/api/health"   # 200
```

---

## Derrubar (ordem inversa)

Mesmo caminho, com `action: destroy`:

1. `tc-infra-kubernetes` → **Terraform Gateway**
2. `tc-lambda-auth` → **Pipeline**
3. `tc-infra-database` → **Terraform**
4. `tc-infra-kubernetes` → **Terraform** — remove sozinho o ALB, os target groups e os
   security groups `k8s-*` que o Load Balancer Controller cria fora do state e que, se
   sobrarem, impedem a exclusão da VPC.

### Conferir que não sobrou nada cobrando

```bash
export AWS_PROFILE=hailton-aws
aws eks list-clusters --query clusters
aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'
aws ec2 describe-nat-gateways --filter Name=state,Values=available --query 'NatGateways[].NatGatewayId'
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName'
aws lambda list-functions --query 'Functions[].FunctionName'
aws apigatewayv2 get-apis --query 'Items[].Name'
aws ec2 describe-vpcs --filters Name=isDefault,Values=false --query 'Vpcs[].VpcId'
```

Todas as respostas devem ser listas vazias.

---

## Acesso de leitura à AWS (para demonstração)

Quando alguém precisa **ver** o console da AWS sem ser o dono da conta — por exemplo, para
gravar a cena de arquitetura.

> A opção mais simples continua sendo o dono da conta compartilhar a tela. Só crie usuário
> se realmente for necessário.

```bash
export AWS_PROFILE=hailton-aws

# 1. Usuário com senha de console, sem chave de acesso programático
aws iam create-user --user-name gravacao-fase3
aws iam create-login-profile --user-name gravacao-fase3 \
  --password 'TROQUE-POR-UMA-SENHA-FORTE'

# 2. Leitura da conta. Esta política NÃO permite ler valor de segredo
#    (concede secretsmanager:GetResourcePolicy, não GetSecretValue).
aws iam attach-user-policy --user-name gravacao-fase3 \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# 3. Bloqueio do bucket de state. O tfstate guarda a senha do RDS e o JWT_SECRET em
#    texto plano; sem este Deny, o ReadOnlyAccess permitiria baixá-lo do S3.
aws iam put-user-policy --user-name gravacao-fase3 --policy-name nega-tfstate \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Deny","Action":"s3:*","Resource":["arn:aws:s3:::tc-fase3-tfstate-538880133939","arn:aws:s3:::tc-fase3-tfstate-538880133939/*"]}]}'
```

Login: **https://538880133939.signin.aws.amazon.com/console** · usuário `gravacao-fase3`.
Entrega a senha por canal privado, nunca pelo grupo. Como o acesso é descartado logo após
o uso, não há troca de senha no primeiro acesso — apague o usuário assim que terminar.

### Remover quando não precisar mais

```bash
aws iam delete-login-profile --user-name gravacao-fase3
aws iam detach-user-policy --user-name gravacao-fase3 \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
aws iam delete-user-policy --user-name gravacao-fase3 --policy-name nega-tfstate
aws iam delete-user --user-name gravacao-fase3
```

Usuário IAM não gera custo, mas acesso temporário que sobrevive ao propósito vira porta
aberta esquecida. Confirme com `aws iam list-users`.

---

## Problemas conhecidos

| Sintoma | Causa e solução |
| --- | --- |
| `Error acquiring the state lock` | Execução anterior cancelada. Apague o lock: `aws s3 rm s3://tc-fase3-tfstate-538880133939/infra-kubernetes/terraform.tfstate.tflock` |
| Destroy da VPC trava com `DependencyViolation` | ALB ou security groups `k8s-*` órfãos. O workflow de destroy já limpa antes; se persistir, apague-os pelo console e rode de novo. |
| `You must be logged in to the server` no kubectl | Seu usuário IAM não está em `cluster_admin_principal_arns` (`eks.tf`). Adicione e rode o apply. |
| Job parado em "Review deployments" | Comportamento esperado: aguarda aprovação do dono da conta. |
| Pods sem telemetria no Grafana | A aplicação precisa subir **depois** do Alloy, para ler o endpoint OTLP do ConfigMap. Rode o CD novamente. |
