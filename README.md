# Tech Challenge — Sistema de Oficina Mecânica

Back-end do MVP de um **Sistema Integrado de Atendimento e Execução de Serviços Automotivos**, desenvolvido em **NestJS** com arquitetura em **Domain-Driven Design (DDD)**.

## Stack

- **Node.js 20+** / **TypeScript** (strict)
- **NestJS 10** — framework modular
- **PostgreSQL 16** + **Prisma** ORM
- **JWT** (`@nestjs/jwt` + Passport) + **bcryptjs**
- **class-validator** / **class-transformer**
- **Swagger** (`@nestjs/swagger`)
- **Jest** + **supertest**
- **Docker** / **Docker Compose**

## Arquitetura

Monolito modular com separação clara em camadas:

```
src/
├── domain/           # Entidades, VOs, eventos, interfaces de repositório, domain services (puro, sem NestJS)
├── application/      # Use cases (@Injectable) que orquestram o domínio
├── infrastructure/   # PrismaService, implementações de repositórios, auth (JWT, bcrypt)
├── modules/          # Módulos NestJS: controllers + DTOs + binding de providers
└── common/           # Guards, decorators, filters, interceptors, tokens de DI
```

**Injeção de dependência:** interfaces de repositório no domínio; binding via `Symbol` tokens definidos em `src/common/constants/injection-tokens.ts` e registrados no `InfrastructureModule` (`@Global()`).

**Autorização global:** `JwtAuthGuard` + `RolesGuard` registrados via `APP_GUARD` em `app.module.ts`. Rotas públicas anotadas com `@Public()`. Controle por perfil via `@Roles(PerfilAcesso.X)`.

**Erros de domínio:** `DomainError` é capturado por `DomainExceptionFilter` e retorna **HTTP 422**. Exceções do NestJS (401/403/404/409) são respeitadas. Fallback catch-all em `AllExceptionsFilter` → 500.

## Domínio

Agregados:

- **Cliente** (PF/PJ com CPF ou CNPJ)
- **Veículo** (placa Mercosul ou antiga)
- **Serviço** (catálogo com valor padrão)
- **PeçaInsumo** (com estoque e baixa)
- **Ordem de Serviço (OS)** — Aggregate Root com `ItemOrcamento[]` e `ExecucaoDeServico[]`

Ciclo de status da OS:

```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE
                                   ↓ (recusa total)
                               CANCELADA
                                   ↓ (recusa parcial)
                            volta para EM_DIAGNOSTICO
```

Transições inválidas levantam `DomainError` (regra encapsulada em `StatusOS.transicionar()` + `TransicaoStatusService`).

## Como executar

### Com Docker (recomendado)

```bash
cp .env.example .env
docker-compose up --build -d
```

- API em: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Postgres: `localhost:5432` (user: `oficina`, senha: `oficina123`)

Rodar o seed para criar o administrador inicial:

```bash
docker-compose exec api node -e "require('./dist/src/infrastructure/database/prisma/seed.js')" || true
```

> Alternativamente, sem Docker:
> ```bash
> npm install
> npm run prisma:generate
> npm run prisma:migrate
> npm run prisma:seed
> npm run start:dev
> ```

### Primeiros passos via Swagger

1. `POST /api/auth/registrar` — primeiro usuário é livre (crie um Administrador).
2. `POST /api/auth/login` — pegue o `accessToken`.
3. Clique em **Authorize** no Swagger e informe `Bearer <token>`.
4. Use as rotas de Clientes, Veículos, Serviços, Peças e Ordens de Serviço.

## Perfis e permissões

| Perfil         | Pode                                                              |
|----------------|-------------------------------------------------------------------|
| ADMINISTRADOR  | tudo, incluindo catálogo de serviços/peças e métricas             |
| ATENDENTE      | clientes, veículos, criar OS, aprovar/recusar orçamento           |
| MECANICO       | peças (consulta/baixa), registrar execuções, avançar status da OS |

## Endpoints principais

### Público
- `GET /api/publico/os/:numero/status` — consulta de status pelo cliente (sem auth)
- `POST /api/auth/login` / `POST /api/auth/registrar`

### Administrativos (JWT)
- `POST/GET/PUT/DELETE /api/clientes`
- `POST/GET/PUT/DELETE /api/veiculos`
- `POST/GET/PUT/DELETE /api/servicos`
- `POST/GET/PATCH /api/pecas` + `PATCH /api/pecas/:id/estoque`
- `POST/GET /api/ordens-de-servico`
- `PATCH /api/ordens-de-servico/:id/status`
- `POST /api/ordens-de-servico/:id/aprovar`
- `POST /api/ordens-de-servico/:id/recusar`
- `POST /api/ordens-de-servico/:id/execucoes`
- `GET /api/ordens-de-servico/metricas/tempo-medio`

## Testes

```bash
npm test              # unitários
npm run test:cov      # cobertura (mínimo 80% em domain e application)
npm run test:e2e      # end-to-end (via TestingModule + Prisma mock)
```

Os testes **unitários** cobrem Value Objects (CPF, CNPJ, Placa, Email, StatusOS), Domain Services (BaixaEstoqueService) e Use Cases (CadastrarClienteUseCase, CriarOSUseCase).

Os testes **e2e** sobem o `AppModule` inteiro com um `PrismaService` mockado em memória — não exigem banco rodando.

## Scripts úteis

```bash
npm run build             # compila com nest build
npm run start:dev         # dev com watch
npm run prisma:generate   # gera client
npm run prisma:migrate    # cria migração em dev
npm run prisma:seed       # cria usuário admin
npm run docker:up         # docker-compose up --build -d
npm run docker:down       # docker-compose down
```

## Variáveis de ambiente

Veja `.env.example`:

- `DATABASE_URL` — string de conexão Postgres
- `JWT_SECRET` — segredo para assinatura do token
- `JWT_EXPIRES_IN` — tempo de expiração (padrão: `8h`)
- `PORT` — porta da API (padrão: `3000`)
- `NODE_ENV` — `development` | `production`

## Estrutura DDD detalhada

Cada bounded context tem esta organização dentro de `src/domain/`:

```
<contexto>/
├── entities/          # Aggregate root e entidades
├── value-objects/     # VOs imutáveis com validação
├── repositories/      # Interfaces (ports)
├── events/            # Domain events
└── services/          # Domain services (opcional)
```

A camada de `application/` espelha a estrutura de contextos, com um subdiretório por use case.

## Licença

Projeto acadêmico — parte do curso de Pós-graduação em Arquitetura de Software.
