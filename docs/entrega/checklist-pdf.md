# Checklist da entrega — Tech Challenge Fase 3

Base para montar o PDF único enviado no Portal do Aluno. Prazo: **15/09/2026**.

## 1. Repositórios (todos públicos, main protegida, deploy automático)

| # | Repositório | Conteúdo | Link |
| --- | --- | --- | --- |
| 1 | Função serverless | Lambda de autenticação por CPF + authorizer | https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-lambda-auth |
| 2 | Infraestrutura Kubernetes | VPC, EKS, ECR, API Gateway, observabilidade | https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-kubernetes |
| 3 | Infraestrutura de banco | RDS PostgreSQL 16 + Secrets Manager | https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tc-infra-database |
| 4 | Aplicação | API NestJS, manifestos Kubernetes, documentação | https://github.com/Os-Desacoplados-Pos-Tech-SOAP-FIAP/tech_challange_1 |

## 2. Vídeo

- [ ] Link (YouTube, não listado): `PREENCHER`
- [ ] Duração conferida: até 15 minutos
- [ ] Conteúdo obrigatório demonstrado:
  - [ ] Autenticação com CPF
  - [ ] Execução da pipeline de CI/CD
  - [ ] Deploy automatizado
  - [ ] Consumo das APIs protegidas
  - [ ] Dashboard de monitoramento com análise ao vivo
  - [ ] Logs e traces em execução

## 3. Documentação (repositório da aplicação)

| Item | Caminho |
| --- | --- |
| Diagrama de componentes (nuvem, APIs, banco, monitoramento) | `docs/diagramas/componentes-fase-3.md` |
| Diagrama de sequência — autenticação por CPF | `docs/diagramas/sequencia-autenticacao-cpf.md` |
| Diagrama de sequência — abertura de OS | `docs/diagramas/sequencia-abertura-os.md` |
| RFCs (nuvem, banco, autenticação) | `docs/rfc/` |
| ADRs (6 decisões arquiteturais) | `docs/adr/` |
| Justificativa do banco + modelo ER | `docs/rfc/002-banco-gerenciado.md` e `docs/DER.png` |
| Coleção HTTP das APIs | `docs/oficina.http` |
| Swagger / OpenAPI | `/api/docs` na aplicação publicada |
| Roteiro do vídeo | `docs/video/roteiro-fase-3.md` |

## 4. Confirmações finais

- [ ] Usuário **`soat-architecture`** com acesso aos **4** repositórios (convite aceito)
- [ ] README de cada repositório com: propósito, tecnologias, execução/deploy, diagrama e
      link do Swagger/Postman quando aplicável
- [ ] Dockerfiles presentes onde aplicável (aplicação)
- [ ] Pipelines de CI/CD funcionando (evidência no histórico do Actions)
- [ ] Branch `main` protegida em todos os repositórios, com merge apenas por Pull Request

## 5. Observação sobre "links de deploy ativo"

A infraestrutura é provisionada sob demanda pelas esteiras e destruída após cada uso, para
manter o custo do projeto sob controle (conforme orientação dos professores de
desconsiderar o requisito de link ativo). As URLs de gateway e ALB são geradas a cada
`apply` e aparecem no vídeo e no histórico das execuções do GitHub Actions.
