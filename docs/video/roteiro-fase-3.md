# Roteiro do vídeo — Tech Challenge Fase 3

**Duração alvo:** 13 minutos (limite oficial: 15) · **Formato:** gravação de tela com
narração · **Publicação:** YouTube, não listado.

Este roteiro é autossuficiente: quem grava não precisa conhecer o projeto. Todos os
comandos estão prontos para copiar e colar, e cada cena indica **o que mostrar na tela** e
**qual requisito do enunciado está sendo comprovado**.

---

## Cobertura dos requisitos (mapa rápido)

| Requisito do enunciado | Cena | Evidência na tela |
| --- | --- | --- |
| API Gateway | 4 e 5 | Console do API Gateway + requisições passando por ele |
| Function Serverless valida CPF | 4 | `POST /auth` com CPF inválido → 400 |
| Function consulta o cliente na base | 4 | CPF não cadastrado → 404 |
| Function gera e devolve o JWT | 4 | CPF válido → 200 com `access_token` |
| Rotas sensíveis protegidas por CPF | 4 | Mesma rota: 200 com token, 401 sem token |
| Quatro repositórios com CI/CD | 1 e 3 | Organização no GitHub + Actions rodando |
| Branch protegida e PR obrigatório | 1 e 3 | Ruleset em Settings + PR sendo mergeado |
| Deploy automático para a nuvem | 3 | CD publicando no ECR e no EKS |
| Banco de dados gerenciado | 2 e 6 | Console do RDS + dados retornados pela API |
| Cluster Kubernetes com escalabilidade | 2 e 6 | Console do EKS + HPA 2→10 réplicas |
| Terraform para provisionamento | 3 e 8 | Repos de infra + esteira de plan/apply |
| Monitoramento: latência, CPU/memória | 7 | Dashboard Plataforma |
| Healthchecks e uptime | 6 e 7 | `/api/health` + painel de disponibilidade |
| Alertas de falha no processamento | 7 | Lista de alertas no Grafana |
| Logs estruturados com correlação | 7 | Log JSON com `trace_id` → trace correspondente |
| Dashboard de volume diário de OS | 7 | Dashboard Negócio |
| Tempo médio por status | 7 | Painel de tempo por etapa |

---

## Cena 0 — Preparação (ANTES de gravar, ~40 minutos)

> Nada desta cena entra no vídeo.

### 0.1 Subir a infraestrutura

Em cada repositório: aba **Actions** → workflow indicado → **Run workflow** →
`action: apply`. **Cada execução para aguardando aprovação** (gate de custo): clique em
**Review deployments** → marque `aws-infra` → **Approve and deploy**.

| Ordem | Repositório | Workflow | Tempo |
| --- | --- | --- | --- |
| 1 | `tc-infra-kubernetes` | Terraform | ~20 min |
| 2 | `tc-infra-database` | Terraform | ~10 min |
| 3 | `tc-lambda-auth` | Pipeline | ~2 min |
| 4 | `tech_challange_1` | CD | ~5 min |
| 5 | `tc-infra-kubernetes` | Terraform Gateway | ~2 min |

### 0.2 Anotar as URLs desta subida

```bash
export AWS_PROFILE=hailton-aws
# API Gateway (usado na maioria das cenas)
aws apigatewayv2 get-apis --query "Items[?Name=='oficina-mecanica-gateway'].ApiEndpoint" --output text
# ALB (usado para abrir o Swagger)
aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName' --output text
```

Preencha `@gateway` e `@alb` no topo de **`docs/oficina3.http`**.

### 0.3 Conferir que está tudo de pé antes de gravar

```bash
GW=<url do gateway>
curl -s "$GW/api/health"                                                   # {"status":"ok"}
curl -s -X POST "$GW/auth" -H 'content-type: application/json' \
  -d '{"cpf":"620.324.110-59"}'                                            # 200 com access_token
```
Se o `/auth` responder **404**, o banco está sem seed: rode novamente o workflow **CD** do
repositório da aplicação.

### 0.4 Abas para deixar abertas

1. GitHub: a organização com os 4 repositórios
2. GitHub: aba **Actions** do `tech_challange_1`
3. AWS: **EKS** → cluster `oficina-mecanica` → aba *Compute*
4. AWS: **RDS**, **Lambda**, **API Gateway**, **ECR** (uma aba cada)
5. Grafana Cloud: os dois dashboards
6. Navegador: Swagger em `http://<ALB>/api/docs`
7. VS Code: `docs/oficina3.http`

### 0.5 Dados de teste

| Item | Valor |
| --- | --- |
| CPF cadastrado (Ana Lima) | `620.324.110-59` |
| CPF válido sem cadastro | `529.982.247-25` |
| CPF inválido | `111.111.111-11` |
| Administrador | `admin@oficina.local` / `admin123` |
| Atendente | `atendente@oficina.local` / `senha123` |
| Mecânico | `mecanico1@oficina.local` / `senha123` |

---

## Cena 1 — Abertura e estrutura de repositórios · 1 min

**Mostrar:** a organização no GitHub com os quatro repositórios.

**Narrar:** "O sistema da oficina foi separado em quatro repositórios independentes, cada
um com sua própria esteira de CI/CD: a aplicação em NestJS, a função serverless de
autenticação, a infraestrutura de Kubernetes e a infraestrutura de banco de dados."

**Mostrar em seguida:**
- `tc-infra-kubernetes` → **Settings → Rules**: o ruleset `protect-main` ativo
  (sem push direto, merge apenas por Pull Request).
- **Settings → Environments → `aws-infra`**: o revisor obrigatório.
  **Narrar:** "Nenhuma operação que crie recursos na AWS roda sem aprovação — é o controle
  de custo do projeto."
- Aba **Pull requests → Closed**: o histórico de PRs.

---

## Cena 2 — Arquitetura e recursos provisionados na AWS · 2 min

**Parte A — o desenho.** Abrir `docs/diagramas/componentes-fase-3.md` no GitHub (o Mermaid
renderiza sozinho) e percorrer o fluxo: cliente → API Gateway → Lambda ou ALB → aplicação
no EKS → RDS, com a telemetria saindo para o Grafana Cloud.

**Parte B — os recursos de verdade.** Percorrer as abas do console da AWS, uma por uma:

| Serviço | O que mostrar | Frase sugerida |
| --- | --- | --- |
| **VPC** | 3 AZs, subnets públicas e privadas | "Rede dedicada em três zonas de disponibilidade" |
| **EKS** | Cluster `oficina-mecanica` ativo, versão 1.34, node group com 2 nós | "O cluster Kubernetes gerenciado, com dois nós ativos" |
| **RDS** | Instância `oficina-mecanica-db`, PostgreSQL 16, *Publicly accessible: No* | "Banco gerenciado, em subnet privada, sem acesso pela internet" |
| **Lambda** | `oficina-mecanica-auth-cpf` e `oficina-mecanica-authorizer-cliente` | "As duas funções serverless: a de autenticação e o authorizer do gateway" |
| **API Gateway** | API `oficina-mecanica-gateway` → aba **Routes** | "As rotas: `/auth` para a Lambda e o proxy para a aplicação" |
| **ECR** | Repositório com as imagens versionadas por commit | "Cada deploy publica a imagem com a tag do commit" |
| **Secrets Manager** | `oficina-mecanica/DATABASE_URL` e `/JWT_SECRET` | "As credenciais ficam aqui, nunca no código" |

> Dica: no API Gateway, abrir a rota `ANY /api/publico/{proxy+}` e mostrar que o
> **Authorization** está configurado com o Lambda authorizer `cliente-jwt`.

---

## Cena 3 — Esteiras de CI/CD em execução · 3 min

**Objetivo:** provar que o deploy é automático, disparado por Pull Request, e que existe
governança.

### 3.1 Abrir um PR de verdade

```bash
cd tech_challange
git checkout main && git pull
git checkout -b demo/video
echo "" >> README.md && echo "<!-- demonstracao do video -->" >> README.md
git commit -am "docs: demonstracao do pipeline"
git push -u origin demo/video
gh pr create --title "docs: demonstracao do pipeline" --body "Demonstracao de CI/CD" --base main
```

### 3.2 Mostrar o CI rodando

Aba **Actions** → workflow **CI**: os passos de **lint**, **testes** e **cobertura mínima
de 80%**. Abrir o passo de testes e mostrar o total (231 unitários + 74 end-to-end).

**Narrar:** "Todo PR passa por lint, testes unitários, testes end-to-end e um gate de
cobertura. Sem isso, não há merge."

### 3.3 Mostrar a proteção da branch

Tentar (ou apenas apontar) que não existe botão de push direto: a única via é o merge do PR.

### 3.4 Mergear e acompanhar o CD

Após o merge, o workflow **CD** dispara sozinho. Mostrar, passo a passo:

1. **Credenciais AWS via OIDC** — "nenhuma senha da AWS guardada no GitHub"
2. **Build e push da imagem** — a tag é o SHA do commit
3. **Secret do Secrets Manager** aplicado no cluster
4. **`kubectl apply` + `rollout status`** — o Kubernetes trocando os pods
5. **Smoke test em `/api/health`** — o deploy só é considerado bom se a aplicação responder

Depois abrir o **ECR** e mostrar a imagem nova, com a tag igual ao commit do PR.

### 3.5 Mostrar a esteira de infraestrutura

Ir a `tc-infra-kubernetes` → **Actions** → execução recente do **Terraform**:
- o job **plan** (livre, apenas mostra o que mudaria);
- o job **apply**, com o registro **"Approved by ..."**.

**Narrar:** "A infraestrutura também é entregue por pipeline, com Terraform. O plano roda
livremente, mas criar ou destruir recursos exige aprovação."

---

## Cena 4 — Autenticação por CPF · 2 min

**Mostrar:** `docs/oficina3.http` no VS Code, executando a **Seção 2** e a **Seção 3** na
ordem.

| Passo | Requisição | Resultado esperado | Narração |
| --- | --- | --- | --- |
| 2.1 | `POST /auth` com CPF cadastrado | **200** com `access_token` | "A função validou o CPF, encontrou o cliente no banco e emitiu o token" |
| 2.2 | CPF inválido | **400** `CPF_INVALIDO` | "Aqui ela rejeita pelos dígitos verificadores" |
| 2.3 | CPF válido sem cadastro | **404** `CLIENTE_NAO_ENCONTRADO` | "E aqui ela consultou a base e não encontrou o cliente" |
| 3.1 | `GET /api/publico/os/1/status` **com** token | **200** com os dados da OS | "Com o token, o cliente acessa a própria ordem de serviço" |
| 3.2 | Mesma rota **sem** token | **401** | "Sem token, o próprio API Gateway barra — nem chega na aplicação" |
| 3.4 | Direto no ALB, sem token | **401** da aplicação | "E se alguém tentar contornar o gateway, a aplicação também valida" |

> Opcional (10s): abrir [jwt.io](https://jwt.io), colar o `access_token` e mostrar os
> claims `cpf` e `scope: CLIENTE`.

---

## Cena 5 — Consumo das APIs protegidas · 2 min

Continuar no `docs/oficina3.http`:

1. **Seção 4** — login do atendente (`4.1`) e a comparação decisiva:
   - `4.5`: rota interna com o **token de cliente** → **401**
   - `4.6`: mesma rota com o **token de funcionário** → **200**

   **Narrar:** "São dois públicos diferentes. O token do cliente serve só para as rotas
   dele; as rotas administrativas exigem o login do funcionário."

2. **Seção 5** — abrir uma OS (`5.4`) e mostrar o `201` com status `RECEBIDA`.
3. **Seção 6** — adicionar itens e avançar o status (`6.1` a `6.5`).

   **Narrar:** "Cada transição publica um evento de domínio, e é desses eventos que saem as
   métricas de negócio que veremos nos dashboards."

4. **Swagger**: abrir `http://<ALB>/api/docs` e mostrar a documentação interativa com o
   cadeado nas rotas protegidas.

---

## Cena 6 — Escalabilidade e saúde · 1 min

1. **Console do EKS** → aba *Resources* (ou terminal):
   ```bash
   kubectl get hpa,pods -n oficina-mecanica
   ```
   Mostrar o **HPA configurado de 2 a 10 réplicas** com alvos de 70% de CPU e 80% de
   memória, e os pods em `Running`.

2. **Narrar:** "A aplicação escala sozinha em horários de pico, de duas até dez réplicas."

3. Mostrar o `GET /api/health` (Seção 1 do arquivo `.http`) e explicar que é o mesmo
   endpoint usado pelos *probes* do Kubernetes e pelo monitor de disponibilidade.

---

## Cena 7 — Observabilidade ao vivo · 3 min

> Antes: execute a **Seção 9** do `oficina3.http` algumas vezes para gerar dados frescos.

1. **Dashboard "Oficina — Negócio"**
   - Volume diário de ordens de serviço (deve refletir as OS criadas há pouco)
   - Tempo médio por etapa: diagnóstico, execução, finalização
   - Orçamentos aprovados e recusados
   - Contador de erros no processamento

2. **Dashboard "Oficina — Plataforma"**
   - Latência das APIs (p95)
   - Taxa de erro
   - CPU e memória dos pods
   - Réplicas ativas

3. **Logs estruturados e correlação** (o ponto alto da cena)
   - Em **Explore → Logs**: `{namespace="oficina-mecanica"} | json`
   - Mostrar uma linha de log em JSON com o campo `trace_id`
   - **Clicar no `trace_id`** e abrir o **trace** completo, com os spans da requisição HTTP
     e da consulta ao banco

   **Narrar:** "Os logs são JSON estruturado e carregam o identificador do trace. De uma
   linha de log eu chego direto no rastreamento completo da requisição."

4. **Alertas** — abrir **Alerting → Alert rules** e mostrar as três regras: falha no
   processamento de ordens de serviço, latência alta e disponibilidade do healthcheck.

---

## Cena 8 — Infraestrutura como código e encerramento · 1 min

1. Abrir `tc-infra-kubernetes` e mostrar os arquivos Terraform: `vpc.tf`, `eks.tf`,
   `ecr.tf`, `addons.tf`, `observability.tf` e a pasta `gateway/`.
2. Abrir `tc-infra-database`: `rds.tf` e `secrets.tf`.
3. Mostrar a aba **Actions** com o workflow **Terraform** e a opção `destroy` no
   **Run workflow**.

**Narrar:** "Toda a infraestrutura é descrita em Terraform e provisionada por pipeline. Ela
pode ser criada e destruída sob demanda, o que mantém o custo do projeto sob controle."

**Fechar:** os quatro repositórios na tela e o agradecimento.

---

## Depois de gravar (IMPORTANTE)

Destruir a infraestrutura na ordem inversa — aba **Actions** de cada repositório,
`action: destroy`, aprovando cada execução:

1. `tc-infra-kubernetes` → **Terraform Gateway**
2. `tc-lambda-auth` → **Pipeline**
3. `tc-infra-database` → **Terraform**
4. `tc-infra-kubernetes` → **Terraform** (remove sozinho o ALB e os security groups órfãos)

Conferir que não sobrou nada cobrando:

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

## Se algo falhar durante a gravação

| Sintoma | O que fazer |
| --- | --- |
| `/auth` responde 404 para o CPF do seed | O banco está sem dados: rode o workflow **CD** da aplicação e repita |
| Rotas respondem 503 ou não conectam | O ALB pode ter acabado de subir; aguarde 2 minutos |
| O CD para em "Cluster disponível?" | A infraestrutura foi destruída; refaça a Cena 0 |
| Dashboards vazios | Execute a Seção 9 do `oficina3.http` e aguarde ~1 minuto |
| Um workflow fica parado sem rodar | Está aguardando aprovação: **Review deployments** → aprovar |
| `terraform destroy` falha com erro de lock | `aws s3 rm s3://tc-fase3-tfstate-538880133939/infra-kubernetes/terraform.tfstate.tflock` e repita |
