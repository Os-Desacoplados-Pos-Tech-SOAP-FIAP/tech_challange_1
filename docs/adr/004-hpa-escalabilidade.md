# ADR 004 — Escalabilidade horizontal com HPA

**Status:** aceito · **Data:** 2026-08-19 (decisão originada na Fase 2) · **Fase:** 3

## Contexto

O enunciado pede escalabilidade dinâmica para horários de pico. A aplicação é *stateless*
(estado em Postgres), portanto escala horizontalmente sem coordenação entre réplicas.

## Decisão

`HorizontalPodAutoscaler` no Deployment da API: **2 a 10 réplicas**, com alvos de **70% de
CPU** e **80% de memória** sobre os *requests* declarados (200m / 256Mi).

O piso de 2 réplicas garante disponibilidade durante rollouts e falha de nó; o teto de 10
é compatível com o node group (`t3.medium`, 2 a 5 nós).

## Consequências

- Requests e limits precisam permanecer coerentes com os alvos do HPA: alterá-los muda o
  ponto de escala. Estão no mesmo arquivo do Deployment justamente para não divergirem.
- O HPA depende do *metrics-server* (presente no EKS).
- A escala de nós fica a cargo do *managed node group*; Karpenter foi considerado
  desnecessário para a variação de carga do projeto.
- Métricas de negócio (volume de OS) são exportadas via OpenTelemetry e podem, no futuro,
  alimentar escala por métrica customizada (KEDA) em vez de apenas CPU/memória.
