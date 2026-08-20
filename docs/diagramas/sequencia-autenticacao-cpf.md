# Diagrama de Sequência — Autenticação por CPF

## 1. Emissão do token

O cliente informa o CPF; a função serverless executa as três etapas exigidas (validar,
consultar, emitir) e devolve um JWT de escopo `CLIENTE` válido por uma hora.

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente
  participant GW as API Gateway
  participant L as Lambda auth-cpf
  participant SM as Secrets Manager
  participant DB as RDS PostgreSQL

  C->>GW: POST /auth { cpf }
  GW->>L: invoke (AWS_PROXY)

  L->>L: limpa mascara e valida digitos verificadores
  alt CPF invalido
    L-->>GW: 400 CPF_INVALIDO
    GW-->>C: 400
  else CPF valido
    L->>SM: GetSecretValue(DATABASE_URL)
    Note over L,SM: valor fica em cache no escopo do modulo<br/>(reaproveitado em invocacoes quentes)
    SM-->>L: connection string
    L->>DB: SELECT id, nome FROM "Cliente" WHERE documento = $1
    alt cliente nao cadastrado
      DB-->>L: vazio
      L-->>GW: 404 CLIENTE_NAO_ENCONTRADO
      GW-->>C: 404
    else cliente encontrado
      DB-->>L: { id, nome }
      L->>SM: GetSecretValue(JWT_SECRET)
      SM-->>L: segredo compartilhado com a API
      L->>L: assina JWT HS256 { sub, cpf, scope: CLIENTE, exp 1h }
      L-->>GW: 200 { access_token, token_type, expires_in, cliente }
      GW-->>C: 200 com o token
    end
  end
```

## 2. Uso do token em rota protegida

O token é validado no gateway e novamente na aplicação (defesa em profundidade — ADR 002).

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente
  participant GW as API Gateway
  participant AZ as Lambda authorizer
  participant ALB as ALB
  participant API as API NestJS (EKS)
  participant DB as RDS

  C->>GW: GET /api/publico/os/1001/status<br/>Authorization: Bearer <token>
  GW->>AZ: request authorizer (cache 300s)
  AZ->>AZ: verifica assinatura HS256 e scope = CLIENTE
  alt token ausente, expirado ou de outro escopo
    AZ-->>GW: isAuthorized = false
    GW-->>C: 401 Unauthorized
  else token valido
    AZ-->>GW: isAuthorized = true, context { sub, cpf }
    GW->>ALB: proxy HTTP
    ALB->>API: encaminha para um pod
    API->>API: ClienteJwtGuard revalida o mesmo token
    API->>DB: consulta a ordem de servico
    DB-->>API: dados da OS
    API-->>ALB: 200 { numero, status, valorEstimado }
    ALB-->>GW: 200
    GW-->>C: 200
  end
```
