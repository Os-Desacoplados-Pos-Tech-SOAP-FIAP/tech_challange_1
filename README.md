# Tech Challenge — Sistema de Oficina Mecânica

Back-end em **NestJS** (TypeScript) para o MVP de um **Sistema Integrado de Atendimento e Execução de Serviços Automotivos**, organizado em **Domain-Driven Design (DDD)**.

## Tecnologias

- **Node.js 20** / **TypeScript 5** (strict)
- **NestJS 10** — framework modular
- **PostgreSQL 16** + **Prisma 5**
- **JWT** (`@nestjs/jwt` + Passport) + **bcryptjs**
- **class-validator** / **class-transformer**
- **Swagger** (`@nestjs/swagger`)
- **Jest** + **Supertest**
- **Docker** / **Docker Compose**

## Arquitetura

Monolito modular DDD com dependência estritamente para dentro: `modules → application → domain` e `infrastructure → domain` (o domínio não conhece NestJS nem Prisma).

```
src/
├── domain/           # Entidades, value objects, eventos e interfaces de repositório (puro)
├── application/      # Use cases (@Injectable) que orquestram o domínio
├── infrastructure/   # PrismaService, repositórios, auth (JWT, bcrypt), eventos
├── modules/          # Módulos NestJS: controllers, DTOs e wiring de providers
└── common/           # Guards, decorators, filters, interceptors, tokens de DI
```

Bounded contexts: **cliente**, **veículo**, **serviço**, **insumo** e **ordem-de-servico** (agregado raiz com `ItemOrcamento` e `ExecucaoDeServico`).

Guards globais (`JwtAuthGuard` + `RolesGuard`) deixam todas as rotas autenticadas por padrão — exceções são marcadas com `@Public()` e o controle por perfil usa `@Roles(PerfilAcesso.X)`. Violações de invariantes do domínio levantam `DomainError` e são traduzidas para **HTTP 422** pelo `DomainExceptionFilter`.

## Como iniciar o projeto

### Opção A — Docker (recomendada)

```bash
cp .env.example .env
npm run docker:up
```

O container `api` aplica `prisma migrate deploy` e roda o seed automaticamente na subida.

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Postgres: `localhost:5432` (user: `oficina`, senha: `oficina123`)

### Opção B — Local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### Variáveis de ambiente

Definidas em `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (padrão `8h`), `PORT` (padrão `3000`), `NODE_ENV`.

### Usuários criados pelo seed

| Email                       | Perfil          | Senha       |
|-----------------------------|-----------------|-------------|
| `admin@oficina.local`       | ADMINISTRADOR   | `admin123`  |
| `atendente@oficina.local`   | ATENDENTE       | `senha123`  |
| `mecanico1@oficina.local`   | MECANICO        | `senha123`  |
| `mecanico2@oficina.local`   | MECANICO        | `senha123`  |

O seed também popula clientes, veículos, serviços, insumos e ordens de serviço de exemplo (uma em cada status) para facilitar testes manuais.

## Fluxo de uso da API

O passo a passo completo de uso da API ponta a ponta — autenticação, cadastros, criação da OS, aprovação do orçamento, execução e entrega — está documentado em **[`docs/fluxo-completo.pdf`](docs/fluxo-completo.pdf)**. Comece por ele para entender a sequência esperada de chamadas e os perfis envolvidos em cada etapa.

Recursos auxiliares:

- **Swagger interativo** em `/api/docs` — explore e teste as rotas direto no navegador.
- **Coleção HTTP** em [`docs/oficina.http`](docs/oficina.http) — exemplos prontos para o REST Client (VS Code/JetBrains).
- **Diagrama entidade-relacional** em [`docs/diagrama-entidade-relacional.md`](docs/diagrama-entidade-relacional.md).

## Testes

```bash
npm test           # unitários (*.spec.ts em src/)
npm run test:cov   # cobertura — mínimo 80% em domain e application
npm run test:e2e   # end-to-end com PrismaService mockado em memória (não exige DB)
```

## Scripts úteis

```bash
npm run start:dev         # API com watch
npm run build             # nest build → dist/
npm run lint              # eslint --fix
npm run prisma:generate   # gera o client após alterar schema.prisma
npm run prisma:migrate    # cria nova migração em dev
npm run prisma:seed       # popula dados iniciais
npm run docker:up         # docker-compose up --build -d
npm run docker:down       # docker-compose down
```

## Licença

Projeto acadêmico — Pós-graduação em Arquitetura de Software (FIAP).
