# Roteiro do vídeo — Tech Challenge Fase 3

**Duração alvo:** 13 minutos (limite oficial: 15) · **Formato:** gravação de tela com
narração · **Publicação:** YouTube, não listado.

Este roteiro é autossuficiente: quem grava não precisa conhecer o projeto. Todos os
comandos estão prontos para copiar e colar.

---

## Cena 0 — Preparação (ANTES de gravar, ~40 minutos)

> Nada desta cena entra no vídeo.

1. **Subir a infraestrutura** (nesta ordem, esperando cada uma terminar). Em cada
   repositório: aba **Actions** → workflow indicado → **Run workflow** → `action: apply`.

   | Ordem | Repositório | Workflow | Tempo |
   | --- | --- | --- | --- |
   | 1 | `tc-infra-kubernetes` | Terraform | ~20 min |
   | 2 | `tc-infra-database` | Terraform | ~10 min |
   | 3 | `tc-lambda-auth` | Pipeline | ~2 min |
   | 4 | `tech_challange_1` | CD (Run workflow) | ~5 min |
   | 5 | `tc-infra-kubernetes` | Terraform Gateway | ~2 min |

2. **Anotar as URLs desta subida** (mudam a cada apply):

   ```bash
   export AWS_PROFILE=hailton-aws
   # URL do API Gateway (usada em quase todas as cenas)
   aws apigatewayv2 get-apis --query "Items[?Name=='oficina-mecanica-gateway'].ApiEndpoint" --output text
   # URL do ALB (usada para abrir o Swagger)
   aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName' --output text
   ```

3. **Substituir** a variável `@gateway` no topo de `docs/oficina.http` pela URL obtida.
4. **Deixar abertas**, em abas separadas: os 4 repositórios no GitHub, a aba Actions de um
   deles, os dois dashboards do Grafana Cloud, o Swagger (`http://<ALB>/api/docs`) e o
   editor com `docs/oficina.http`.
5. **Conferir** que o teste rápido funciona antes de gravar:

   ```bash
   curl -s -X POST "$GW/auth" -H 'content-type: application/json' -d '{"cpf":"620.324.110-59"}'
   ```
   Deve responder `200` com `access_token`. Se responder `404`, o seed não rodou: execute o
   workflow **CD** do repositório da aplicação novamente.

**Dados de teste:**

| Item | Valor |
| --- | --- |
| CPF do cliente (seed) | `620.324.110-59` |
| Login de funcionário | `admin@oficina.local` / `admin123` |
| Atendente | `atendente@oficina.local` / `senha123` |

---

## Cena 1 — Abertura e estrutura de repositórios · 1 min

**Mostrar:** a organização no GitHub com os quatro repositórios.

**Narrar:** "O sistema da oficina foi separado em quatro repositórios independentes, cada
um com sua própria esteira de CI/CD: a aplicação, a função serverless de autenticação, a
infraestrutura de Kubernetes e a infraestrutura de banco de dados."

**Mostrar em seguida** (em `tc-infra-kubernetes` → Settings → Rules): o ruleset
`protect-main` ativo. Depois, a aba **Pull requests** → **Closed**, evidenciando que todo
o trabalho entrou por PR, sem commit direto na main.

---

## Cena 2 — Arquitetura · 2 min

**Mostrar:** `docs/diagramas/componentes-fase-3.md` renderizado no GitHub.

**Narrar, apontando no diagrama:** "O cliente entra pelo API Gateway. A rota `/auth` vai
para uma função Lambda que valida o CPF, consulta o cliente no banco e devolve um token.
As rotas do cliente passam por um Lambda authorizer antes de chegar na aplicação, que roda
no EKS com escala automática de 2 a 10 réplicas. O banco é um RDS PostgreSQL em subnets
privadas, e toda a telemetria é exportada por OpenTelemetry para o Grafana Cloud."

**Abrir** `docs/diagramas/sequencia-autenticacao-cpf.md` e percorrer o primeiro diagrama.

---

## Cena 3 — Pipeline de CI/CD em execução · 3 min

**Objetivo:** provar que o deploy é automático e disparado por Pull Request.

1. No repositório da aplicação, criar um PR pequeno (ex.: uma linha no README):

   ```bash
   cd tech_challange
   git checkout main && git pull
   git checkout -b demo/video
   echo "" >> README.md && echo "<!-- demonstracao do video -->" >> README.md
   git commit -am "docs: demonstracao do pipeline"
   git push -u origin demo/video
   gh pr create --title "docs: demonstracao do pipeline" --body "Demonstracao de CI/CD" --base main
   ```

2. **Mostrar** a aba Actions: o CI rodando **lint, testes e cobertura de 80%**.
3. **Mostrar** que a main é protegida: o PR precisa do merge (não há botão de push direto).
4. Após o CI ficar verde, mergear e **mostrar o CD** disparando sozinho: build da imagem,
   push para o ECR com a tag do commit, `kubectl apply`, `rollout status` e o smoke test em
   `/api/health`.

**Narrar:** "Nenhum comando de deploy é executado manualmente. O merge na main dispara a
esteira, que publica a imagem no ECR e faz o rollout no cluster, verificando a saúde da
aplicação no final."

---

## Cena 4 — Autenticação por CPF · 2 min

**Mostrar:** `docs/oficina.http` no editor (REST Client), executando as requisições da
seção "FASE 3" na ordem.

1. **`POST {{gateway}}/auth`** com o CPF do seed → resposta `200` com `access_token`.
   **Narrar:** "A função serverless validou os dígitos do CPF, encontrou o cliente no banco
   e emitiu um JWT com escopo de cliente, válido por uma hora."

2. Copiar o token para a variável `@tokenCliente` e executar
   **`GET {{gateway}}/api/publico/os/1/status`** → `200` com os dados da OS.

3. Executar a **mesma requisição sem o header** `Authorization` → **`401`**.
   **Narrar:** "Sem token, o próprio API Gateway barra a requisição antes de chegar na
   aplicação — é o Lambda authorizer em ação."

4. **`POST {{gateway}}/auth`** com um CPF inválido (`111.111.111-11`) → **`400`**
   `CPF_INVALIDO`.

---

## Cena 5 — Consumo das APIs protegidas · 2 min

1. **`POST {{gateway}}/api/auth/login`** com `admin@oficina.local` / `admin123` → `200`
   com o token de funcionário. **Narrar:** "Funcionários continuam com login próprio; o
   token de cliente não abre as rotas administrativas."

2. Executar a sequência de negócio (gera dados para os dashboards):
   criar cliente → criar veículo → criar OS → avançar status.
   **Narrar:** "Cada transição publica um evento de domínio que vira métrica de negócio."

3. **Abrir o Swagger** em `http://<ALB>/api/docs` e mostrar as rotas documentadas.

---

## Cena 6 — Observabilidade ao vivo · 3 min

**No Grafana Cloud:**

1. **Dashboard "Oficina — Negócio":** volume de ordens de serviço criadas hoje (deve
   refletir as OS criadas na cena anterior), tempo médio por etapa, aprovados e recusados.
2. **Dashboard "Oficina — Plataforma":** latência das APIs, taxa de erro, CPU e memória
   dos pods, número de réplicas do HPA.
3. **Logs:** em Explore, consultar `{namespace="oficina-mecanica"} | json` e mostrar um log
   estruturado com o campo `trace_id`.
4. **Correlação:** clicar no `trace_id` e abrir o **trace** correspondente, mostrando os
   spans da requisição (HTTP e consulta ao banco).
5. **Alertas:** abrir a lista de alertas configurados — falha no processamento de ordens de
   serviço, latência alta e disponibilidade do healthcheck.

**Narrar:** "Os logs são JSON estruturado e carregam o identificador do trace, o que
permite sair de uma linha de log direto para o rastreamento completo da requisição."

---

## Cena 7 — Encerramento · 1 min

**Mostrar:** a aba Actions de `tc-infra-kubernetes` com o workflow **Terraform** e o botão
**Run workflow** com a opção `destroy`.

**Narrar:** "Toda a infraestrutura é descrita em Terraform e provisionada por pipeline —
pode ser criada e destruída sob demanda, o que mantém o custo do projeto sob controle."

**Fechar:** repositórios na tela, agradecimento.

---

## Depois de gravar (IMPORTANTE)

**Destruir a infraestrutura** na ordem inversa — cada uma pela aba Actions, `action: destroy`:

1. `tc-infra-kubernetes` → **Terraform Gateway**
2. `tc-lambda-auth` → **Pipeline**
3. `tc-infra-database` → **Terraform**
4. `tc-infra-kubernetes` → **Terraform**

Conferir que não sobrou nada cobrando:

```bash
export AWS_PROFILE=hailton-aws
aws eks list-clusters --query clusters
aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'
aws ec2 describe-nat-gateways --filter Name=state,Values=available --query 'NatGateways[].NatGatewayId'
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName'
aws lambda list-functions --query 'Functions[].FunctionName'
aws apigatewayv2 get-apis --query 'Items[].Name'
```

Todas as respostas devem ser listas vazias.

---

## Se algo falhar durante a gravação

| Sintoma | O que fazer |
| --- | --- |
| `/auth` responde 404 para o CPF do seed | O banco está vazio: rode o workflow **CD** da aplicação (ele executa o seed) e repita |
| Qualquer rota responde 503 ou não conecta | O ALB pode ter acabado de subir; aguarde 2 minutos e repita |
| O CD falha em "Cluster disponível?" | A infraestrutura foi destruída; refaça a cena 0 |
| Dashboards vazios | Gere tráfego executando a cena 5 e aguarde ~1 minuto pela coleta |
