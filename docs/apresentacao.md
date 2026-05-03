# Script de Apresentação em Vídeo — Tech Challenge 1
**Público:** Banca avaliadora FIAP  
**Formato:** Narração + demo no Swagger UI  
**Duração estimada:** 15–18 minutos

---

## Estrutura Geral

| Bloco | Conteúdo | Tempo |
|-------|----------|-------|
| 1 | Introdução e contexto de negócio | ~1 min |
| 2 | Justificativa das tecnologias | ~2 min |
| 3 | Banco de dados — justificativa | ~1 min |
| 4 | Docker, Docker Compose e seed | ~1.5 min |
| 5 | Testes automatizados | ~1.5 min |
| 6 | Organização de pastas e arquitetura | ~2 min |
| 7 | Swagger — documentação automática | ~1.5 min |
| 8 | Demo: Autenticação | ~0.5 min |
| 9 | Demo: Cadastros de apoio | ~0.5 min |
| 10 | Demo: Fluxo completo da OS (8 etapas) | ~5 min |
| 11 | Demo: Métricas e erros de domínio | ~1 min |
| 12 | Fechamento | ~1 min |

---

## Bloco 1 — Introdução (~1 min)

> "Bom dia. Vou apresentar o Tech Challenge 1: o back-end de um sistema de gerenciamento de oficina mecânica, desenvolvido como MVP para a pós-graduação da FIAP."

> "O problema que o sistema resolve é real: uma oficina que precisa digitalizar todo o processo de atendimento. O fluxo começa com a chegada do veículo, passa pelo diagnóstico e orçamento, pela aprovação do cliente, pela execução dos serviços com controle de estoque de peças, e termina na entrega do veículo. Cada etapa tem um responsável diferente — atendente, mecânico, cliente — e o sistema garante que ninguém pule uma etapa nem acesse o que não deve."

---

## Bloco 2 — Justificativa das tecnologias (~2 min)

> "Antes de mostrar o sistema rodando, vou justificar as escolhas técnicas."

> "**NestJS com TypeScript** foi a escolha central para o back-end. NestJS fornece uma estrutura modular opinativa — módulos, controllers, providers com injeção de dependência nativa — que se alinha diretamente com os conceitos de DDD que aplicamos. TypeScript com modo strict garante tipagem forte em todas as camadas, eliminando erros de tipo em runtime."

> "**Prisma** como ORM porque ele gera tipos TypeScript diretamente do schema do banco. Qualquer mudança de schema que quebrar o código é detectada em tempo de compilação, não em produção. As migrations ficam versionadas no git — cada alteração no banco é rastreável."

> "**JWT com Passport** para autenticação. Padrão de mercado para APIs stateless — sem sessão no servidor. O Passport permite trocar a estratégia de autenticação no futuro sem alterar o resto do código."

> "**class-validator e class-transformer** para validação de DTOs. O `ValidationPipe` global rejeita qualquer campo extra na requisição — proteção contra mass assignment — e garante que nenhum dado inválido passa da camada de apresentação para a aplicação."

> "**Jest** para testes, por ser o padrão do ecossistema NestJS, com suporte nativo a TypeScript via `ts-jest`."

> "**Swagger/OpenAPI** gerado automaticamente via decorators do NestJS — a documentação fica sempre sincronizada com o código."

---

## Bloco 3 — Banco de dados: justificativa (~1 min)

> "A escolha do **PostgreSQL** foi deliberada. O sistema tem dados fortemente relacionais: clientes têm veículos, veículos têm ordens de serviço, ordens têm itens de orçamento, itens têm execuções. Transações ACID são críticas aqui — quando um insumo é reservado para uma OS, precisamos garantir atomicidade. Se a inserção do item falhar, a reserva de estoque não pode ter ocorrido."

> "PostgreSQL também oferece suporte real a UUIDs como chave primária, que usamos em todo o sistema para evitar IDs sequenciais previsíveis na API."

> "Optamos por **não usar um banco NoSQL** porque o modelo de dados não tem variabilidade de schema — todos os clientes têm os mesmos campos, todas as OSs têm a mesma estrutura. Bancos document-oriented trariam complexidade sem nenhum ganho para este caso."

> "O Prisma gerencia o schema em `prisma/schema.prisma` e as migrations ficam em `prisma/migrations/` — cada versão do banco é rastreada e reproduzível em qualquer ambiente."

---

## Bloco 4 — Docker, Docker Compose e seed (~1.5 min)

> "O ambiente completo sobe com um único comando: `npm run docker:up`."

**Ação: mostrar o arquivo `docker-compose.yml`**

> "O compose define dois serviços. O `db` usa `postgres:16-alpine`. Tem um healthcheck que verifica se o PostgreSQL está pronto para aceitar conexões."

> "O `api` tem `depends_on: db: condition: service_healthy` — a API só sobe depois que o banco estiver saudável. Sem isso, a API tentaria conectar antes do banco estar pronto e falharia na inicialização."

> "O comando de entrada do container da API é: `prisma migrate deploy && prisma db seed && node dist/main.js`. Em sequência: aplica todas as migrations pendentes, roda o seed com dados iniciais, e só então inicia a aplicação. O ambiente sempre sobe consistente — não precisa de nenhum passo manual."

> "O seed popula usuários com os três perfis, seis clientes, seis veículos, seis serviços e seis insumos com IDs fixos e determinísticos. Isso permite que qualquer pessoa que baixar o repositório tenha exatamente o mesmo ambiente que vou usar na demo agora."

---

## Bloco 5 — Testes automatizados (~1.5 min)

> "O projeto tem dois tipos de teste."

> "**Testes unitários** — arquivos `*.spec.ts` colocados junto ao código em `src/`. Eles exercitam Value Objects, domain services e use cases com fakes e mocks. Sem NestJS, sem banco, sem container. Rodam com `npm test` em segundos."

> "**Testes E2E** — em `test/integration/*.e2e-spec.ts`. Eles sobem o `AppModule` completo do NestJS, mas substituem o `PrismaService` por um mock em memória. Ou seja, testam toda a pipeline HTTP — guards, pipes, controllers, use cases, domínio — sem precisar de Postgres. Rodam com `npm run test:e2e`."

> "A cobertura é obrigatória em **80%** de branches, funções, linhas e statements — mas apenas nas camadas de domínio e aplicação."

**Ação: mostrar o `jest.config.ts` — as linhas `collectCoverageFrom` e `coverageThreshold`**

> "Esse recorte foi intencional: infraestrutura deve ser fina o suficiente para não precisar de cobertura. Se a lógica vazou para o repositório Prisma, é um problema de arquitetura, não de cobertura. Rodando `npm run test:cov`, o build falha se qualquer métrica cair abaixo de 80%."

---

## Bloco 6 — Organização de pastas e arquitetura (~2 min)

> "A estrutura de diretórios reflete diretamente a arquitetura DDD com Clean Architecture."

**Ação: abrir o explorador de arquivos ou mostrar a estrutura `src/` no editor**

> "No centro, `src/domain/` — código TypeScript puro, zero dependências de framework. Nenhum arquivo aqui pode importar NestJS, Prisma ou Express. Dentro de cada bounded context temos: `entities/`, `value-objects/`, `repositories/` com interfaces, e `services/` de domínio."

> "Em `src/domain/shared/` ficam os primitivos base: `Entity`, `AggregateRoot`, `ValueObject`, `UniqueID` e `DomainError`. Todos os agregados e entidades do sistema estendem essas classes."

> "Em `src/application/` ficam os use cases — um folder por caso de uso, cada um com um único `@Injectable()`. Eles orquestram o domínio sem conhecer Prisma ou Express."

> "Em `src/infrastructure/` ficam as implementações concretas: os repositórios Prisma, a estratégia JWT, o hash provider com bcrypt. O `InfrastructureModule` é `@Global()` e registra os bindings de interface para implementação via Symbol tokens."

> "Em `src/modules/` ficam os controllers NestJS e os DTOs. Controllers são intencionalmente finos: recebem o DTO, chamam um use case, retornam o resultado. Nenhuma lógica de negócio aqui."

> "Em `src/common/` ficam os guards globais, os decorators `@Public`, `@Roles` e `@CurrentUser`, os filtros de exceção e os `INJECTION_TOKENS` — o registry central de injeção de dependência."

> "O resultado prático: se amanhã trocarmos Prisma por outra ORM, apenas `src/infrastructure/` muda. O domínio e os use cases não sabem que o Prisma existe."

---

## Bloco 7 — Swagger: documentação automática (~1.5 min)

> "Antes de entrar na demo, quero mostrar a documentação da API — ela é parte do entregável."

**Ação: abrir `http://localhost:3000/api/docs` no browser**

> "O Swagger é configurado no `main.ts` em quatro linhas: `DocumentBuilder` define título e versão, `addBearerAuth()` habilita o botão de autenticação, `SwaggerModule.createDocument` lê todos os decorators da aplicação e monta o documento OpenAPI, e `SwaggerModule.setup` serve a UI em `/api/docs`."

> "A documentação não é mantida à mão — ela é gerada automaticamente a partir dos decorators nos controllers e DTOs. Quando um endpoint muda, a documentação muda junto."

> "Todos os endpoints estão agrupados por recurso. Cada um mostra os parâmetros de entrada, os schemas de request e response com os tipos corretos, e os possíveis códigos de retorno."

**Ação: expandir um endpoint e mostrar o schema de resposta**

> "O botão **Authorize** no topo é o que vou usar durante a demo. Cole o JWT e todas as requisições já incluem o header `Authorization: Bearer`. O Swagger vira uma ferramenta de teste funcional, não só documentação estática."

**Ação: mostrar um endpoint protegido com cadeado fechado vs. uma rota pública sem cadeado**

> "Endpoints protegidos têm o ícone de cadeado. As rotas públicas — consulta de status e aprovação de orçamento — aparecem sem cadeado. Isso reflete exatamente o decorator `@Public()` no código."

---

## Bloco 8 — Demo: Autenticação (~0.5 min)

> "Vou fazer login como Administrador para começar."

**Ação: expandir `POST /api/auth/login` → Execute**

```json
{
  "email": "admin@oficina.local",
  "senha": "admin123"
}
```

> "JWT recebido. Vou autorizar no Swagger para que todas as próximas requisições já estejam autenticadas."

**Ação: clicar em Authorize → colar token → Authorize**

---

## Bloco 9 — Demo: Cadastros de apoio (~0.5 min)

**Ação: `GET /api/servicos` → Execute**

> "O seed já populou o catálogo: Alinhamento, Balanceamento, Limpeza de bicos, Revisão geral, Troca de pastilhas, Troca de óleo. Cada serviço tem valor padrão que entra automaticamente no orçamento."

**Ação: `GET /api/insumos` → Execute**

> "Os insumos têm `quantidadeEstoque` e `quantidadeReservada` separados. A reserva acontece no momento em que o insumo entra no orçamento — antes de qualquer execução."

---

## Bloco 10 — Demo: Fluxo completo da OS (~5 min)

> "Agora o coração do sistema. Vou percorrer todos os estados da OS com dados reais do seed."

### 10.1 — Login como Atendente

**Ação: `POST /api/auth/login` → Execute**

```json
{
  "email": "atendente@oficina.local",
  "senha": "senha123"
}
```

**Ação: Authorize com o token do atendente**

### 10.2 — Criar OS (status: RECEBIDA)

**Ação: `POST /api/ordens-de-servico` → Execute**

```json
{
  "clienteId": "00000000-0000-4001-8000-000000000004",
  "veiculoId": "00000000-0000-4002-8000-000000000004",
  "observacoes": "Cliente relata barulho ao frear e consumo alto"
}
```

> "OS criada — status `RECEBIDA`, número sequencial automático, `valorEstimado` zero. Vou anotar o `id` e o `numero`."

**Ação: anotar o id e numero retornados**

### 10.3 — Adicionar itens (transição automática: RECEBIDA → EM_DIAGNOSTICO)

**Ação: `POST /api/ordens-de-servico/{ID_DA_OS}/itens` → Execute**

```json
{
  "tipo": "SERVICO",
  "servicoId": "00000000-0000-4003-8000-000000000005",
  "quantidade": 1
}
```

> "Primeiro item adicionado — a OS transitou automaticamente para `EM_DIAGNOSTICO`. Regra encapsulada no aggregate, não no controller."

**Ação: adicionar segundo item**

```json
{
  "tipo": "INSUMO",
  "insumoId": "00000000-0000-4004-8000-000000000003",
  "quantidade": 1
}
```

> "Insumo adicionado — `quantidadeReservada` incrementada no estoque. `valorEstimado` da OS já reflete a soma: R$ 250 de serviço + R$ 180 de peça."

**Ação: `GET /api/insumos` para mostrar a reserva de estoque**

### 10.4 — Enviar para aprovação (EM_DIAGNOSTICO → AGUARDANDO_APROVACAO)

**Ação: `POST /api/ordens-de-servico/{ID_DA_OS}/status` → Execute (sem body)**

> "Sistema avançou para `AGUARDANDO_APROVACAO` e gerou um token de aprovação. Em produção esse token chega por e-mail ao cliente. Aqui pego o token direto da resposta."

**Ação: copiar o token da resposta**

### 10.5 — Cliente consulta e aprova (rota pública, sem JWT)

> "Simulo o cliente agora. Rotas públicas — sem Authorization header."

**Ação: `GET /api/publico/os/{NUMERO}/orcamento?token={TOKEN}` → Execute**

> "Cliente vê o orçamento completo com itens e valores."

**Ação: `POST /api/publico/os/{NUMERO}/orcamento/decisao` → Execute**

```json
{
  "token": "<token copiado>",
  "decisao": "APROVADA"
}
```

> "Orçamento aprovado. Token marcado como usado — não pode ser reutilizado. OS agora está `APROVADA`."

### 10.6 — Execução (transição automática: APROVADA → EM_EXECUCAO)

> "Troco para o mecânico."

**Ação: `POST /api/auth/login` com mecanico1@oficina.local / senha123 → Authorize**

**Ação: `GET /api/ordens-de-servico/{ID_DA_OS}` → copiar o id do item de serviço em `itensOrcamento`**

**Ação: `POST /api/itens-de-orcamento/{ID_DO_ITEM}/execucoes` → Execute (sem body)**

> "Primeira chamada — início da execução registrado. OS transitou automaticamente para `EM_EXECUCAO`. O mecânico é identificado pelo JWT."

**Ação: chamar o mesmo endpoint novamente**

> "Segunda chamada — fim registrado, `tempoExecucaoMinutos` calculado automaticamente."

### 10.7 — OS finalizada automaticamente (EM_EXECUCAO → FINALIZADA)

> "Todos os itens de serviço executados — OS marcada automaticamente como `FINALIZADA`."

**Ação: `GET /api/ordens-de-servico/{ID_DA_OS}` para confirmar status FINALIZADA**

### 10.8 — Entrega (FINALIZADA → ENTREGUE)

**Ação: login como atendente → Authorize**

**Ação: `POST /api/ordens-de-servico/{ID_DA_OS}/status` → Execute (sem body)**

> "Status `ENTREGUE`. Fluxo completo: RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → APROVADA → EM_EXECUCAO → FINALIZADA → ENTREGUE. Duas transições manuais, cinco automáticas."

---

## Bloco 11 — Métricas e erros de domínio (~1 min)

**Ação: login como admin → Authorize**

**Ação: `GET /api/ordens-de-servico/metricas/tempo-medio` → Execute**

> "Tempo médio de execução geral."

**Ação: `GET /api/ordens-de-servico/metricas/tempo-medio-por-servico` → Execute**

> "Tempo médio por tipo de serviço — útil para o gestor identificar gargalos operacionais."

> "Por fim, vou mostrar como o sistema protege as regras de negócio. Vou tentar adicionar um item a uma OS que já está `ENTREGUE`."

**Ação: `POST /api/ordens-de-servico/{ID_DA_OS}/itens` → Execute com qualquer body**

> "HTTP 422 — Unprocessable Entity. A regra está no aggregate, não no controller. Qualquer violação de invariante de negócio retorna 422 com `code` e `message` estruturados. Isso é o `DomainExceptionFilter` global em ação."

---

## Bloco 12 — Fechamento (~1 min)

> "Resumindo:"

> "Back-end completo de oficina mecânica com NestJS, TypeScript, PostgreSQL e Prisma. Arquitetura DDD com Clean Architecture — quatro camadas com dependência estritamente interna. Seis bounded contexts. Máquina de estados com sete transições para o fluxo de OS. Controle de estoque com reserva automática. Aprovação de orçamento via token público de uso único. RBAC com três perfis mais rotas públicas. Métricas de execução. Cobertura de 80% nas camadas de domínio e aplicação. Ambiente Docker com seed automático na inicialização."

> "Obrigado."

---

## Referência rápida — IDs do seed

| O quê | Dado | ID |
|-------|------|-----|
| **Admin** | admin@oficina.local / admin123 | `00000000-0000-4000-8000-000000000001` |
| **Atendente** | atendente@oficina.local / senha123 | `00000000-0000-4000-8000-000000000002` |
| **Mecânico** | mecanico1@oficina.local / senha123 | `00000000-0000-4000-8000-000000000003` |
| **Cliente** | João Silva | `00000000-0000-4001-8000-000000000004` |
| **Veículo** | Gol (João Silva) | `00000000-0000-4002-8000-000000000004` |
| **Serviço** | Troca de pastilhas — R$ 250 | `00000000-0000-4003-8000-000000000005` |
| **Serviço** | Limpeza de bicos — R$ 160 | `00000000-0000-4003-8000-000000000003` |
| **Insumo** | Pastilha de freio dianteira — R$ 180 | `00000000-0000-4004-8000-000000000003` |

---

## Dicas de gravação

- Suba o ambiente antes de gravar: `npm run docker:up`
- Reset limpo se necessário: `npm run docker:down && docker volume rm tech_challange_1_oficina-db-data && npm run docker:up`
- Confirme que o Swagger abre em `http://localhost:3000/api/docs`
- Sempre clique em **Authorize** logo após cada login — evita 401 no meio da gravação
- Ao trocar de perfil, refaça o login e atualize a autorização
- Use `GET /api/ordens-de-servico/numero/{numero}` entre as etapas para mostrar a evolução do status
- O `id` do item de orçamento aparece na resposta de `POST /itens` — guarde-o para a etapa de execução
