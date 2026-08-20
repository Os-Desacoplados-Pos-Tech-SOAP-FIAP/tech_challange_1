# ADR 006 — OpenTelemetry com Grafana Cloud

**Status:** aceito · **Data:** 2026-08-19 · **Fase:** 3

## Contexto

O enunciado pede latência de API, consumo de recursos do cluster, healthchecks, alertas,
logs estruturados com correlação e dashboards de negócio, citando Datadog ou New Relic
como exemplos (ferramenta livre, conforme esclarecimento dos professores).

Uma característica do projeto pesa na decisão: **a infraestrutura é efêmera** — sobe para
testes e demonstrações e é destruída em seguida, para conter custo.

## Decisão

Instrumentação com **OpenTelemetry** (padrão aberto, sem acoplamento a fornecedor) e
backend no **Grafana Cloud** (free tier).

- Aplicação: `nestjs-pino` para logs JSON, com `trace_id`/`span_id` do span ativo
  injetados em cada log; OTel SDK com auto-instrumentação (HTTP, Prisma) exportando OTLP.
- Cluster: chart `k8s-monitoring` (Grafana Alloy) coletando métricas de CPU/memória dos
  pods, logs dos containers e recebendo o OTLP da aplicação.
- Negócio: `MetricasDeNegocioHandler` traduz *domain events* já existentes (`OSCriada`,
  `DiagnosticoConcluido`, `OrcamentoAprovado`, `OSFinalizada`, `OSEntregue`) em contadores
  e histogramas OTel — **sem alterar as camadas `domain` e `application`**.

## Consequências

- **Dashboards, alertas e histórico sobrevivem ao `terraform destroy`**, porque residem no
  SaaS e não no cluster. Foi o fator decisivo contra a stack self-hosted.
- Trocar de backend exige mudar apenas o destino do Alloy — a instrumentação é padrão.
- O tempo entre transições de status é calculado com estado em memória por pod: a medição
  só ocorre quando as duas pontas da transição caem no mesmo processo. É uma aproximação
  consciente; a alternativa (consultar o banco a cada evento) custaria mais do que vale.
- O free tier impõe limites de séries e retenção, muito acima do volume do projeto.

## Alternativas consideradas

- **Prometheus + Loki + Tempo + Grafana no cluster:** aceito pelos professores, mas
  consome recursos dos nós e é destruído junto com a infraestrutura, zerando o histórico
  e exigindo provisionar dashboards como código a cada subida.
- **Datadog / New Relic:** atenderiam à letra do enunciado, porém o trial expira antes da
  entrega ou impõe limites menores no plano gratuito.
