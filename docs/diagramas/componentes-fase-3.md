# Diagrama de Componentes — Fase 3

Visão de nuvem completa: entrada pelo API Gateway, autenticação serverless, aplicação em
Kubernetes, banco gerenciado, segredos e observabilidade — com os quatro repositórios e
suas esteiras.

```mermaid
flowchart TB
  subgraph internet["Internet"]
    cliente["Cliente final<br/>(autentica por CPF)"]
    func["Funcionario<br/>(e-mail e senha)"]
    dev["Desenvolvedor<br/>(Pull Request)"]
  end

  subgraph github["GitHub - 4 repositorios com CI/CD"]
    r1["tech_challange_1<br/>app NestJS + k8s"]
    r2["tc-lambda-auth<br/>funcao serverless"]
    r3["tc-infra-kubernetes<br/>VPC, EKS, ECR, Gateway"]
    r4["tc-infra-database<br/>RDS, Secrets"]
  end

  subgraph aws["AWS us-east-1"]
    gw["API Gateway HTTP<br/>rotas /auth e proxy"]
    authz["Lambda authorizer<br/>valida JWT escopo CLIENTE"]
    lauth["Lambda auth-cpf<br/>valida CPF, consulta cliente, emite JWT"]
    alb["ALB internet-facing<br/>criado pelo Load Balancer Controller"]

    subgraph eks["EKS - namespace oficina-mecanica"]
      pods["Pods API NestJS<br/>initContainer roda migrations"]
      hpa["HPA 2 a 10 replicas<br/>CPU 70% / memoria 80%"]
      alloy["Grafana Alloy<br/>metricas, logs e receiver OTLP"]
    end

    rds[("RDS PostgreSQL 16<br/>subnets privadas")]
    sm["Secrets Manager<br/>DATABASE_URL e JWT_SECRET"]
    ecr[("ECR<br/>imagens por SHA")]
  end

  grafana["Grafana Cloud<br/>dashboards, alertas e traces"]

  cliente -->|"POST /auth com CPF"| gw
  cliente -->|"/api/publico/* com Bearer"| gw
  func -->|"/api/* com Bearer interno"| gw
  gw --> authz
  gw --> lauth
  gw --> alb --> pods
  hpa -. escala .-> pods
  lauth --> rds
  pods --> rds
  lauth -. le segredos .-> sm
  pods -. secret injetado no deploy .-> sm

  dev --> r1 & r2 & r3 & r4
  r1 -->|"build e push"| ecr
  r1 -->|"kubectl apply -k overlays/prod"| eks
  r2 -->|"terraform apply"| lauth & authz
  r3 -->|"terraform apply"| eks & gw & ecr
  r4 -->|"terraform apply"| rds & sm
  ecr -->|"pull da imagem por SHA"| pods

  pods -->|"OTLP: traces, metricas, logs JSON"| alloy
  alloy --> grafana
```

## Ordem de provisionamento

`tc-infra-kubernetes` → `tc-infra-database` → `tc-lambda-auth` → deploy da aplicação →
stack `gateway/`. A destruição segue a ordem inversa. O gateway é o último porque
referencia o ALB, que só existe depois que a aplicação é implantada (ver ADR 002).

## Fronteiras de segurança

- Rotas `/api/publico/*` são validadas **duas vezes**: no Lambda authorizer do gateway e
  novamente pelo `ClienteJwtGuard` na aplicação.
- O RDS não é acessível pela internet: só os security groups dos nós do EKS e da Lambda
  alcançam a porta 5432.
- Nenhuma credencial estática nos repositórios — as esteiras autenticam por OIDC e os
  segredos vêm do Secrets Manager.
