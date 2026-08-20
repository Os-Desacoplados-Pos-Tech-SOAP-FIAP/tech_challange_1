# Mensagem para o grupo — Fase 3

> Copie o bloco abaixo e cole no grupo da equipe.

---

**Fase 3 — infra e código prontos, subi tudo, testei ponta a ponta e destruí 🚀**

Pessoal, avancei bastante na Fase 3 e quero alinhar o que já está pronto e o que falta.

**O que foi feito**

Separei o projeto nos 4 repositórios exigidos, cada um com CI/CD próprio e deploy
automático, main protegida e merge só por Pull Request:

1. **`tc-lambda-auth`** — função serverless de autenticação por CPF (valida o CPF, consulta
   o cliente no banco e emite o JWT) + o Lambda authorizer do gateway
2. **`tc-infra-kubernetes`** — Terraform da VPC, EKS, ECR e do API Gateway
3. **`tc-infra-database`** — Terraform do RDS PostgreSQL 16 e do Secrets Manager
4. **`tech_challange_1`** — a aplicação NestJS, manifestos do Kubernetes e a documentação

**O que já foi testado de verdade (subi a stack completa na AWS e validei)**

- Autenticação por CPF pelo API Gateway → devolve o JWT do cliente ✅
- Rota protegida `/api/publico/*` **com** token → 200; **sem** token → 401 barrado no
  próprio gateway ✅
- CPF inválido → 400; CPF válido de cliente inexistente → 404 ✅
- Login de funcionário e rotas internas passando pelo gateway ✅
- Pipeline completo: PR → CI (lint, testes, cobertura 80%) → merge → build da imagem →
  ECR → deploy no EKS → rollout → smoke test no `/api/health` ✅
- Aplicação no ar no EKS com HPA de 2 a 10 réplicas e migrations rodando automaticamente ✅

**Depois de validar, destruí toda a infraestrutura** para não gerar gasto. A ideia é subir
de novo só no dia da gravação do vídeo — sobe em ~40 min pelas próprias pipelines, grava, e
derruba no fim.

**Sobre a conta AWS (importante)**

Fiz o deploy na **minha conta pessoal da AWS**, e não no AWS Academy. Motivo técnico: o
laboratório do Academy não deixa criar roles nem provedor de identidade IAM, o que
inviabiliza o deploy por OIDC (o jeito seguro, sem colar credenciais no GitHub) e o IRSA que
o Load Balancer Controller precisa. Com a conta pessoal a infraestrutura ficou do jeito
"profissional" mesmo, que é o que o desafio pede.

Isso tem um custo pequeno, e a ideia é **rachar entre a equipe**. Para dar a ordem de
grandeza: com tudo ligado a stack custa cerca de **US$ 6,50 por dia**, mas ela só fica de pé
durante os testes — a sessão inteira de ontem, subindo, validando tudo e destruindo, ficou
em **menos de US$ 1**. Somando os testes que já fiz e o dia da gravação, a conta toda deve
ficar na casa de **US$ 10 a US$ 20 no total** (uns R$ 60 a R$ 110), divididos entre nós. Já
deixei alertas de orçamento configurados e criei um gate de aprovação nas pipelines: nada
sobe na AWS sem aprovação, justamente para ninguém gerar custo sem querer.

**O que falta e onde preciso de vocês**

- 🎥 **Gravar o vídeo** (até 15 min) — deixei um **roteiro pronto, cena a cena**, com os
  comandos e o passo a passo de subir a infra antes e destruir depois:
  `docs/video/roteiro-fase-3.md`
- 📊 **Observabilidade** — o código já está instrumentado (OpenTelemetry, logs JSON com
  trace_id e métricas de negócio). Falta criar a conta no Grafana Cloud (free) e montar os
  dashboards e alertas
- 📄 **Montar o PDF final** da entrega — deixei o checklist pronto em
  `docs/entrega/checklist-pdf.md`
- ✅ Confirmar que o usuário **soat-architecture** aceitou o convite nos 4 repositórios

**Documentos para vocês revisarem** (todos no repositório `tech_challange_1`)

| Documento | Caminho |
| --- | --- |
| Visão geral da Fase 3 | `README.md` (seção "Fase 3") |
| Diagrama de componentes (nuvem, APIs, banco, monitoramento) | `docs/diagramas/componentes-fase-3.md` |
| Diagrama de sequência — autenticação por CPF | `docs/diagramas/sequencia-autenticacao-cpf.md` |
| Diagrama de sequência — abertura de OS | `docs/diagramas/sequencia-abertura-os.md` |
| RFC 001 — escolha da nuvem (propostas técnicas) | `docs/rfc-propostas-tecnicas/001-escolha-da-nuvem.md` |
| RFC 002 — banco de dados gerenciado + modelo ER | `docs/rfc-propostas-tecnicas/002-banco-gerenciado.md` |
| RFC 003 — estratégia de autenticação por CPF | `docs/rfc-propostas-tecnicas/003-autenticacao-por-cpf.md` |
| ADRs — decisões arquiteturais permanentes (6) | `docs/adr-decisoes-arquiteturais/` |
| Coleção de requisições (sequência da apresentação) | `docs/oficina3.http` |
| Guia para configurar o Grafana Cloud | `docs/observability/setup-grafana-cloud.md` |
| Roteiro do vídeo | `docs/video/roteiro-fase-3.md` |
| Checklist da entrega | `docs/entrega/checklist-pdf.md` |

**Repositórios**

- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-lambda-auth
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes
- https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-database

Quem for gravar, me avisa com antecedência que eu subo a infra e passo as URLs (elas mudam
a cada deploy). Qualquer dúvida sobre as decisões, está tudo justificado nos ADRs e RFCs.
