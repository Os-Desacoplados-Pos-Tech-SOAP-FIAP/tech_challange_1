# ADR 005 — Segredos entregues pela esteira, sem operador no cluster

**Status:** aceito · **Data:** 2026-08-19 · **Fase:** 3

## Contexto

`DATABASE_URL` e `JWT_SECRET` são gerados pelo Terraform (senha do RDS e segredo do JWT
por `random_password`) e guardados no **AWS Secrets Manager**. A aplicação os consome como
variáveis de ambiente a partir de um `Secret` do Kubernetes.

Na Fase 2 o plano era sincronizá-los com o **External Secrets Operator** (ESO), o que
implica instalar o operador, criar `SecretStore`/`ExternalSecret` e uma role IRSA.

## Decisão

A esteira de deploy da aplicação lê os dois segredos do Secrets Manager (com as
credenciais OIDC que ela já possui) e aplica o `Secret` no cluster antes do `kubectl apply`.
O `overlay/prod` remove o `Secret` de exemplo da base, garantindo que nenhuma credencial
seja versionada.

## Consequências

- Uma peça a menos para instalar e manter no cluster.
- Rotação de segredo exige um novo deploy — aceitável, já que a rotação aqui é manual.
- O `Secret` continua sendo objeto do cluster (base64, não criptografado em repouso além
  do padrão do etcd no EKS).
- Os valores também residem em texto plano no *state* do Terraform, o que torna o backend
  S3 (criptografado, versionado, privado) parte da fronteira de segurança.
- Se o número de segredos crescer ou passar a haver rotação automática, o ESO volta a ser
  a escolha correta.
