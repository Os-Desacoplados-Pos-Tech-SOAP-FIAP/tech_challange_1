# Diagrama de Sequência — Abertura de Ordem de Serviço

Fluxo de um atendente autenticado criando uma OS, atravessando as camadas da arquitetura
(módulo → caso de uso → domínio → persistência) e disparando os eventos que alimentam as
métricas de negócio.

```mermaid
sequenceDiagram
  autonumber
  actor A as Atendente
  participant GW as API Gateway
  participant API as Controller (modules)
  participant UC as CriarOSUseCase (application)
  participant D as OrdemDeServico (domain)
  participant R as PrismaOrdemDeServicoRepository
  participant DB as RDS PostgreSQL
  participant EV as EventDispatcher
  participant M as MetricasDeNegocioHandler

  A->>GW: POST /api/auth/login { email, senha }
  GW->>API: proxy pela rota catch-all
  API-->>A: 200 { accessToken } (JWT de funcionario)

  A->>GW: POST /api/ordens-de-servico<br/>Authorization: Bearer <accessToken>
  GW->>API: proxy
  API->>API: JwtAuthGuard valida o token; RolesGuard confere o perfil
  API->>API: ValidationPipe valida o DTO (whitelist + forbidNonWhitelisted)
  API->>UC: execute({ clienteId, veiculoId, observacoes })

  UC->>R: buscar cliente e veiculo
  R->>DB: SELECT
  DB-->>R: registros
  R-->>UC: entidades

  UC->>D: OrdemDeServico.criar(...)
  D->>D: gera NumeroOS, status inicial RECEBIDA
  D->>D: addDomainEvent(OSCriada)
  D-->>UC: agregado com eventos pendentes

  UC->>R: salvar(os)
  R->>DB: INSERT (transacao)
  DB-->>R: ok
  R->>EV: publish(os.pullEvents())
  EV->>M: OSCriada
  M->>M: incrementa os_criadas_total e marca o instante da etapa RECEBIDA
  Note over M: metricas exportadas via OTLP<br/>para o Alloy e o Grafana Cloud

  R-->>UC: os persistida
  UC-->>API: resultado
  API-->>GW: 201 { id, numero, status: RECEBIDA }
  GW-->>A: 201
```

## Observações

- Uma transição de status inválida levanta `DomainError` no domínio, traduzido para
  **HTTP 422** pelo `DomainExceptionFilter` — regra de negócio nunca vaza para o controller.
- Os eventos são publicados **após** a persistência: nenhum efeito colateral ocorre se a
  transação falhar.
- Falha em um handler de evento é registrada em log e não propaga, para não desfazer uma
  operação de negócio já concluída.
