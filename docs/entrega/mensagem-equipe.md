# Mensagem para o grupo — Fase 3

Duas versões: a **curta** para colar no grupo e a **completa** para fixar no canal ou mandar
em seguida, para quem quiser o detalhe.

---

## Versão curta (cole no grupo)

> **Fase 3 — código e infraestrutura prontos ✅**
>
> Pessoal, terminei a parte técnica da Fase 3. Subi a stack inteira na AWS, testei o fluxo
> ponta a ponta (autenticação por CPF → API Gateway → aplicação no EKS → banco) e **destruí
> tudo depois**, para não gerar custo. Sobe de novo em ~40 min no dia da gravação.
>
> **Pronto:** 4 repositórios com CI/CD e deploy automático · Lambda de autenticação por CPF ·
> API Gateway com authorizer · EKS com escala automática · RDS · Terraform · observabilidade
> instrumentada · documentação completa (ADRs, RFCs, diagramas, roteiro do vídeo).
>
> **Falta (preciso de vocês):**
> 1. 🎥 Gravar o vídeo — tem roteiro pronto, cena a cena
> 2. 📊 Montar os dashboards no Grafana — conta já criada e conectada, faltam os painéis
> 3. 📄 Montar o PDF da entrega — tem checklist pronto
>
> **📅 Cronograma que proponho** — vou entrar de férias e **volto dia 08/09**. A entrega é
> **15/09**, então sugiro fecharmos tudo em duas reuniões:
> - **09/09 (terça), 19h30** — subo a infraestrutura, montamos os dashboards e gravamos
> - **10/09 (quarta), 19h30** — ajustes finais, PDF e envio
>
> **Enquanto eu estiver fora**, o pedido é: **revisem e validem os fluxos que criei** (estão
> todos no `docs/oficina3.http`, com os diagramas de sequência ao lado). Se algo não fizer
> sentido, anotem que a gente ajusta na volta — melhor descobrir agora do que no dia 09.
>
> ⚠️ Só um aviso: **não vai dar para subir a AWS nesse período**, porque sou o único que
> aprova o deploy nas pipelines (é a trava de custo). Revisão de código, documentação e PRs
> seguem normalmente.
>
> **Sobre a conta AWS:** usei minha conta pessoal (o AWS Academy não permite o tipo de
> configuração que o desafio exige — explico no detalhe). O custo total do projeto deve
> ficar entre **US$ 10 e US$ 20**; divididos entre nós quatro, dá algo como **R$ 15 a R$ 30
> por pessoa**. Proponho rachar.
>
> Quem topa pegar cada item? Detalhes e links dos documentos no próximo texto 👇

---

## Versão completa

**Fase 3 — o que está pronto, o que falta e quanto custa**

### 1. Cobertura dos requisitos do enunciado

| Requisito | Status | Onde está |
| --- | --- | --- |
| API Gateway protegendo rotas sensíveis | ✅ Pronto e testado | `tc-infra-kubernetes/gateway/` |
| Function serverless valida CPF, consulta o cliente e devolve JWT | ✅ As três etapas | `tc-lambda-auth` |
| Quatro repositórios separados com CI/CD | ✅ Pronto | links no fim |
| Branch main protegida, merge só por PR | ✅ Ativo nos 4 | Settings → Rules |
| Deploy automático para a nuvem | ✅ Pronto | Actions de cada repo |
| Banco de dados gerenciado | ✅ RDS PostgreSQL 16 | `tc-infra-database` |
| Cluster Kubernetes com escalabilidade | ✅ EKS + HPA de 2 a 10 réplicas | `tc-infra-kubernetes` |
| Terraform provisionando tudo | ✅ Pronto | repositórios de infra |
| Logs estruturados com correlação | ✅ JSON com trace_id | aplicação instrumentada |
| Latência, CPU/memória, healthcheck | ✅ Instrumentado | OpenTelemetry + Grafana Alloy |
| Dashboards e alertas | ⏳ **Falta montar os painéis** | guia pronto no repositório |
| Diagrama de componentes | ✅ Pronto | `docs/diagramas/` |
| Diagramas de sequência (autenticação e abertura de OS) | ✅ Pronto | `docs/diagramas/` |
| RFCs e ADRs | ✅ 3 RFCs + 6 ADRs | `docs/rfc-propostas-tecnicas/` e `docs/adr-decisoes-arquiteturais/` |
| Justificativa do banco + modelo ER | ✅ Pronto | RFC 002 + `docs/DER.png` |
| Vídeo de até 15 min | ⏳ **Falta gravar** | roteiro pronto |
| PDF da entrega | ⏳ **Falta montar** | checklist pronto |

### 2. O que foi validado na prática

Subi a stack completa na AWS e testei de ponta a ponta:

- Cliente autentica com CPF no API Gateway e recebe o token ✅
- Rota protegida **com** token → 200; **sem** token → 401 barrado no próprio gateway ✅
- CPF inválido → 400; CPF válido sem cadastro → 404 ✅
- Login de funcionário e rotas internas funcionando pelo gateway ✅
- Pipeline completo: PR → CI (lint, testes, cobertura de 80%) → merge → build da imagem →
  ECR → deploy no EKS → rollout → smoke test ✅
- Aplicação no ar com 2 réplicas, migrations e seed rodando sozinhos ✅

Depois **destruí toda a infraestrutura**. A ideia é subir de novo só no dia da gravação.

### 3. Sobre a conta AWS e o custo

Usei a **minha conta pessoal da AWS**, não o AWS Academy. O motivo é técnico: o laboratório
do Academy não permite criar roles nem provedor de identidade IAM, o que inviabiliza o
deploy autenticado por OIDC (o jeito seguro, sem colar credenciais no GitHub) e o IRSA de
que o Load Balancer Controller precisa. Na conta pessoal a infraestrutura ficou do jeito que
o desafio pede.

**O custo:**

| Situação | Valor |
| --- | --- |
| Stack ligada 24 horas | ~US$ 6,50/dia |
| Uma sessão de trabalho (sobe, testa, destrói) | menos de US$ 1 |
| Estimativa do projeto inteiro (testes + gravação) | **US$ 10 a US$ 20** |
| Dividido entre os 4 membros | **R$ 15 a R$ 30 por pessoa** |

Duas travas que coloquei para ninguém gastar sem querer:

- **Alertas de orçamento** em US$ 10, 30 e 50
- **Aprovação obrigatória nas pipelines**: qualquer deploy na AWS fica parado esperando
  minha liberação. Vocês continuam abrindo e mergeando PRs normalmente — o que precisa de
  aprovação é só o que gera custo.

### 4. Cronograma até a entrega

Vou entrar de **férias** e **volto no dia 08/09**. A entrega é **15/09**. Proposta:

| Data | O que fazemos |
| --- | --- |
| **De agora até 08/09** | Vocês **revisam e validam os fluxos e a documentação** (sem precisar de AWS) |
| **09/09 (terça), 19h30** | Subo a infraestrutura, montamos os dashboards e alertas, gravamos o vídeo |
| **10/09 (quarta), 19h30** | Ajustes do que faltar, edição finalizada, PDF montado e enviado |
| **11 a 15/09** | Margem de segurança para imprevistos |

Duas reuniões bastam porque a parte técnica já está pronta e testada — o que resta é montar
painéis, gravar e documentar a entrega. A margem de cinco dias existe justamente para o caso
de algo dar errado na gravação.

**O que peço enquanto estou fora:**

1. **Validem os fluxos** — o `docs/oficina3.http` tem a sequência completa que será
   apresentada no vídeo (autenticação por CPF, rotas protegidas, abertura de OS, orçamento,
   execução, entrega). Leiam junto com os diagramas de sequência e me digam se algum passo
   está faltando ou se algo não representa bem o sistema.
2. **Revisem as RFCs e os ADRs** — são as decisões técnicas que vamos ter que defender.
3. **Leiam o roteiro do vídeo** e digam se falta alguma cena, principalmente quem for gravar.
4. **Anotem as dúvidas** em vez de travar: respondo tudo na volta, dia 08/09.

⚠️ **Não será possível subir a infraestrutura na AWS nesse período.** Eu sou o único
aprovador do gate de deploy — é a trava que impede custo acidental. Tudo que não depende da
nuvem (revisar código, documentação, abrir e mergear PRs, montar o rascunho do PDF) segue
funcionando normalmente.

### 5. O que falta — quem pega?

| # | Tarefa | Esforço | Precisa da infra no ar? |
| --- | --- | --- | --- |
| 1 | **Gravar o vídeo** (até 15 min) seguindo `docs/video/roteiro-fase-3.md` | ~2h com os ensaios | Sim — eu subo antes |
| 2 | **Montar 2 dashboards e 3 alertas** no Grafana (`docs/observability/setup-grafana-cloud.md`, Partes 5 a 8) | ~1h | Sim |
| 3 | **Montar o PDF final** com `docs/entrega/checklist-pdf.md` | ~30 min | Não |
| 4 | **Confirmar** que o `soat-architecture` aceitou o convite nos 4 repositórios | 5 min | Não |

Somos quatro: a sugestão é cada um pegar um item. As tarefas 3 e 4 podem ser feitas desde
já, sem depender das reuniões.

As tarefas 1 e 2 dão para fazer na mesma janela: eu subo a infraestrutura, quem for montar
os dashboards monta, e na sequência gravamos o vídeo já com os painéis populados.

No dia **09/09** eu subo a stack uns 40 minutos antes da reunião e passo as URLs no grupo
(elas mudam a cada deploy). Se as datas não funcionarem para alguém, me avisem agora que a
gente remarca — o que não dá é deixar para a semana da entrega.

### 6. Documentos para revisarem

Todos no repositório `tech_challange_1`:

| Documento | Caminho |
| --- | --- |
| Visão geral da Fase 3 | `README.md` (seção "Fase 3") |
| Diagrama de componentes (nuvem, APIs, banco, monitoramento) | `docs/diagramas/componentes-fase-3.md` |
| Diagrama de sequência — autenticação por CPF | `docs/diagramas/sequencia-autenticacao-cpf.md` |
| Diagrama de sequência — abertura de OS | `docs/diagramas/sequencia-abertura-os.md` |
| RFCs — propostas técnicas (nuvem, banco, autenticação) | `docs/rfc-propostas-tecnicas/` |
| ADRs — decisões arquiteturais (6 registros) | `docs/adr-decisoes-arquiteturais/` |
| Requisições da apresentação (fluxo completo) | `docs/oficina3.http` |
| Roteiro do vídeo, cena a cena | `docs/video/roteiro-fase-3.md` |
| Guia do Grafana Cloud | `docs/observability/setup-grafana-cloud.md` |
| Checklist da entrega | `docs/entrega/checklist-pdf.md` |

**Para quem tem pouco tempo:** o README da Fase 3 e o diagrama de componentes dão o panorama
em uns 10 minutos. As RFCs explicam *por que* cada escolha foi feita — útil se alguém do
grupo for questionado sobre isso na avaliação.

### 7. Repositórios

- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1 — aplicação e documentação
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-lambda-auth — autenticação por CPF
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes — VPC, EKS, ECR, API Gateway
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-database — RDS e Secrets Manager

Qualquer dúvida sobre as decisões técnicas, está tudo justificado nas RFCs e ADRs — e se
alguma escolha não fizer sentido para vocês, é só falar que a gente revisa.
