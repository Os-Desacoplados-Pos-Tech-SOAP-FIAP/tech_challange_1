# Passo a passo — Grafana Cloud

Guia para criar a conta, ligar a observabilidade na aplicação e montar os dashboards e
alertas exigidos pela Fase 3. Tempo estimado: **40 minutos** (20 de configuração, 20 de
dashboards).

O código já está pronto: a aplicação emite logs JSON com `trace_id`, traces e métricas via
OpenTelemetry, e o Terraform já tem o Grafana Alloy. Falta apenas **criar a conta e
cadastrar as credenciais** — enquanto os segredos não existirem, o Alloy simplesmente não é
instalado (`count = 0`) e a aplicação roda normalmente, só que sem telemetria.

---

## Parte 1 — Criar a conta (5 min)

1. Acesse **https://grafana.com/auth/sign-up/create-user**
2. Cadastre-se com GitHub, Google ou e-mail. Não pede cartão de crédito.
3. Ao criar o *stack*, escolha uma região dos **Estados Unidos** (fica próxima do
   `us-east-1`, onde a infraestrutura roda). O nome do stack pode ser
   `techchallengefase3`.
4. Aguarde o provisionamento (leva menos de um minuto).

**O que o plano gratuito oferece** (muito acima do que o projeto consome): 10 mil séries de
métricas, 50 GB de logs, 50 GB de traces e 3 usuários.

---

## Parte 2 — Obter as três credenciais (5 min)

1. No menu lateral, vá em **Connections → Add new connection**.
2. Pesquise por **OpenTelemetry** e abra o card **OpenTelemetry (OTLP)**.
3. A página mostra a configuração do endpoint. Anote:

| Credencial | Onde aparece | Formato |
| --- | --- | --- |
| **OTLP Endpoint** | campo *OTLP Endpoint* | `https://otlp-gateway-prod-us-east-2.grafana.net/otlp` |
| **Instance ID** | campo *Instance ID* / *Username* | número, ex.: `1234567` |
| **Token** | botão **Generate now** (nomeie `tech-challenge-fase3`) | começa com `glc_` |

> ⚠️ O token aparece **uma única vez**. Copie antes de sair da página. Se perder, gere
> outro em **Security → Access Policies**.

---

## Parte 3 — Cadastrar os segredos no repositório (2 min)

Com o `gh` CLI autenticado, execute os três comandos abaixo e cole cada valor quando for
solicitado:

```bash
gh secret set GRAFANA_CLOUD_OTLP_ENDPOINT --repo Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes
gh secret set GRAFANA_CLOUD_INSTANCE_ID   --repo Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes
gh secret set GRAFANA_CLOUD_TOKEN         --repo Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes
```

Alternativa pela interface: **Settings → Secrets and variables → Actions → New repository
secret**, criando os três com exatamente esses nomes.

Conferir:

```bash
gh secret list --repo Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes
```

---

## Parte 4 — Ativar no cluster (5 min + tempo do apply)

1. No repositório `tc-infra-kubernetes`: **Actions → Terraform → Run workflow →
   `action: apply`**.
2. Aprove a execução em **Review deployments** (gate de custo).
3. O Terraform instala o chart `k8s-monitoring` no namespace `observability`.

Verificar:

```bash
export AWS_PROFILE=hailton-aws
aws eks update-kubeconfig --name oficina-mecanica --region us-east-1
kubectl get pods -n observability
```

Devem aparecer os pods do Alloy (`alloy-metrics`, `alloy-logs`, `alloy-receiver`) em
`Running`.

> **Se a aplicação já estava implantada antes deste passo**, rode o workflow **CD** do
> repositório `tech_challange_1` novamente. Os pods precisam reiniciar para enxergar o
> endereço do receiver OTLP que está no ConfigMap.

---

## Parte 5 — Gerar tráfego e conferir a chegada dos dados (5 min)

Execute algumas requisições do `docs/oficina3.http` (a **Seção 9** existe justamente para
isso: criar ordens de serviço, autenticar por CPF e provocar um erro).

No Grafana, em **Explore**:

| Fonte | Consulta | O que deve aparecer |
| --- | --- | --- |
| Prometheus | `os_criadas_total` | contador com as OS criadas |
| Prometheus | `container_cpu_usage_seconds_total{namespace="oficina-mecanica"}` | CPU dos pods |
| Loki | `{namespace="oficina-mecanica"} \| json` | logs em JSON com o campo `trace_id` |
| Tempo | busque pelo serviço `oficina-api` | traces das requisições |

Se as métricas não aparecerem em ~2 minutos, veja os logs do coletor:
`kubectl logs -n observability -l app.kubernetes.io/name=alloy-metrics --tail=50`

---

## Parte 6 — Dashboard "Oficina — Negócio" (10 min)

**Dashboards → New → New dashboard**, e adicione os painéis abaixo (fonte: Prometheus).

| Painel | Tipo | Consulta |
| --- | --- | --- |
| Volume diário de OS | Stat | `sum(increase(os_criadas_total[24h]))` |
| OS criadas ao longo do tempo | Time series | `sum(rate(os_criadas_total[5m])) * 300` |
| Tempo médio por etapa | Bar chart | `sum by (etapa) (rate(os_etapa_duracao_segundos_sum[1h])) / sum by (etapa) (rate(os_etapa_duracao_segundos_count[1h]))` |
| Orçamentos aprovados x recusados | Time series | `sum(increase(os_orcamentos_aprovados_total[1h]))` e `sum(increase(os_orcamentos_recusados_total[1h]))` |
| OS finalizadas e entregues | Stat | `sum(increase(os_finalizadas_total[24h]))` e `sum(increase(os_entregues_total[24h]))` |
| Erros no processamento | Stat (vermelho > 0) | `sum(increase(os_processamento_erros_total[1h]))` |

> Os nomes das métricas podem ganhar o sufixo `_total` conforme a conversão do OTel para o
> Prometheus. Se uma consulta não retornar nada, digite o prefixo `os_` no campo de métrica
> do Explore para ver a lista exata.

Salve como **Oficina — Negócio**.

---

## Parte 7 — Dashboard "Oficina — Plataforma" (10 min)

| Painel | Tipo | Consulta |
| --- | --- | --- |
| Latência p95 das APIs | Time series | `histogram_quantile(0.95, sum by (le) (rate(http_server_request_duration_seconds_bucket[5m])))` |
| Requisições por segundo | Time series | `sum(rate(http_server_request_duration_seconds_count[5m]))` |
| Taxa de erro 5xx | Stat | `sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[5m]))` |
| CPU por pod | Time series | `sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="oficina-mecanica"}[5m]))` |
| Memória por pod | Time series | `sum by (pod) (container_memory_working_set_bytes{namespace="oficina-mecanica"})` |
| Réplicas ativas (HPA) | Stat | `kube_deployment_status_replicas{namespace="oficina-mecanica"}` |

Salve como **Oficina — Plataforma**.

**Exportar para o repositório** (evidência da entrega): em cada dashboard,
**Share → Export → Save to file**, e salve os JSON em `docs/observability/`.

---

## Parte 8 — Alertas (5 min)

**Alerting → Alert rules → New alert rule**. Crie as três regras exigidas:

| Regra | Condição | Avaliação |
| --- | --- | --- |
| **Falha no processamento de OS** | `sum(increase(os_processamento_erros_total[15m])) > 0` | a cada 5 min |
| **Latência alta** | `histogram_quantile(0.95, sum by (le) (rate(http_server_request_duration_seconds_bucket[5m]))) > 2` | a cada 5 min, por 10 min |
| **Aplicação indisponível** | `sum(kube_deployment_status_replicas_available{namespace="oficina-mecanica"}) < 1` | a cada 1 min |

Em **Contact points**, confirme que o e-mail padrão é o seu (ou adicione um).

**Uptime do healthcheck (opcional):** em **Testing & synthetics → Synthetic Monitoring**,
crie um check HTTP apontando para `https://<gateway>/api/health`. Atenção: essa URL muda a
cada `apply` — atualize no dia da gravação.

---

## Resumo do que precisa existir ao final

- [ ] Conta criada e stack ativo
- [ ] Três segredos cadastrados em `tc-infra-kubernetes`
- [ ] Pods do Alloy rodando no namespace `observability`
- [ ] Métricas, logs e traces visíveis no Explore
- [ ] Dashboard **Oficina — Negócio** salvo e exportado
- [ ] Dashboard **Oficina — Plataforma** salvo e exportado
- [ ] Três alertas configurados

> Dashboards e alertas ficam **no Grafana Cloud**, não no cluster — por isso sobrevivem ao
> `terraform destroy` e estarão prontos no dia da gravação (decisão registrada no
> [ADR 006](../adr/006-observabilidade-otel-grafana-cloud.md)).
