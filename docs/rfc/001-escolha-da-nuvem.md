# RFC 001 — Escolha da nuvem

**Status:** decidido (AWS) · **Data:** 2026-08-19 · **Autor:** equipe Os Desacoplados

## Problema

A Fase 3 exige API Gateway, função serverless, banco gerenciado, cluster Kubernetes com
escalabilidade e provisionamento por Terraform, com deploy automático. A escolha do
provedor define o conjunto de serviços, o custo da demonstração e o esforço de migração
do que já existe (a Fase 2 já entregou EKS, RDS e ECR na AWS).

## Opções consideradas

### A. AWS (recomendada)

- **A favor:** todos os serviços exigidos com integração nativa (API Gateway HTTP, Lambda,
  RDS, EKS, Secrets Manager, ECR); a infraestrutura da Fase 2 é aproveitada quase
  integralmente; módulos Terraform maduros e amplamente usados; OIDC com GitHub Actions
  sem credenciais estáticas; experiência prévia da equipe.
- **Contra:** EKS cobra US$ 0,10/h pelo control plane mesmo ocioso, e o NAT Gateway pesa
  no custo de um ambiente que fica pouco tempo no ar.

### B. Google Cloud

- **A favor:** GKE Autopilot cobra por pod e dispensa gestão de nós; Cloud Run resolveria
  a parte serverless com menos configuração.
- **Contra:** migrar o Terraform da Fase 2 significaria reescrever VPC, cluster, banco e
  registry; o equivalente ao API Gateway é menos direto para o caso de uso; nenhum ganho
  de nota que justifique o retrabalho.

### C. Azure

- **A favor:** AKS competente e integração natural com Azure DevOps.
- **Contra:** mesma reescrita completa da opção B, com menos familiaridade da equipe.

## Recomendação

**AWS**, em conta pessoal com controle de custo — e não no AWS Academy. O laboratório do
Academy não permite criar roles nem provedores de identidade IAM, o que inviabilizaria o
deploy por OIDC (obrigando a colar credenciais temporárias, que expiram a cada sessão) e o
IRSA usado pelo AWS Load Balancer Controller.

## Impacto e mitigação de custo

Com tudo no ar, a stack custa aproximadamente **US$ 6,50/dia** (control plane do EKS, dois
nós `t3.medium`, NAT, ALB e RDS `db.t3.micro`). A mitigação é operacional: a infraestrutura
sobe pela esteira, é usada, e é destruída no fim de cada sessão — o custo real de uma
sessão de trabalho de quatro horas fica em torno de US$ 1. Alertas de orçamento em
US$ 10, US$ 30 e US$ 50 avisam qualquer esquecimento.
