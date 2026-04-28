# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev         # run API with watch (http://localhost:3000/api, docs at /api/docs)
npm run build             # nest build → dist/
npm run lint              # eslint --fix over src, apps, libs, test

npm test                  # unit tests (*.spec.ts under src/)
npm run test:cov          # coverage — thresholds enforced: 80% lines/branches/functions/statements
                          # on src/domain/** and src/application/** only
npm run test:e2e          # e2e via test/jest-e2e.json (tests named *.e2e-spec.ts under test/)
npx jest path/to/file.spec.ts         # single unit test file
npx jest -t "nome do teste"           # single test by name

npm run prisma:generate   # regenerate @prisma/client after schema.prisma changes
npm run prisma:migrate    # prisma migrate dev (creates new migration)
npm run prisma:deploy     # prisma migrate deploy (used in container startup)
npm run prisma:seed       # seeds admin user via ts-node

npm run docker:up         # docker-compose up --build -d (API + Postgres)
npm run docker:down
```

The Docker `api` service runs `prisma migrate deploy && prisma db seed && node dist/main.js` on start — schema + seed are applied automatically when the container boots.

## Architecture

Layered DDD monolith on NestJS. The dependency direction is strictly inward:
`modules → application → domain` and `infrastructure → domain` (domain has zero NestJS imports).

- `src/domain/<contexto>/` — pure TS. `entities/`, `value-objects/`, `repositories/` (interfaces only), `events/`, `services/`. Shared primitives in `src/domain/shared/` (`AggregateRoot`, `Entity`, `ValueObject`, `UniqueID`, `DomainError`, `DomainEvent`).
- `src/application/<contexto>/<use-case>/` — `@Injectable()` use cases that orchestrate the domain. One folder per use case.
- `src/infrastructure/` — `PrismaService`, `repositories/Prisma*Repository.ts` (implement domain interfaces), `auth/` (JWT strategy, guard, bcrypt hash provider).
- `src/modules/<contexto>/` — NestJS modules: controllers, DTOs (class-validator), and provider wiring for the use cases of that context.
- `src/common/` — `guards/`, `decorators/` (`@Public`, `@Roles`, `@CurrentUser`), `filters/`, `interceptors/`, and the DI token registry.

**Dependency injection by Symbol token.** All cross-layer bindings go through `INJECTION_TOKENS` in `src/common/constants/injection-tokens.ts`. `InfrastructureModule` is `@Global()` and binds each token to its Prisma implementation. Use cases inject repositories via `@Inject(INJECTION_TOKENS.X_REPOSITORY)` — **never import a Prisma repository directly from the application or domain layers.**

**Path aliases** (tsconfig + jest `moduleNameMapper` + e2e config all stay in sync): `@domain/*`, `@application/*`, `@infrastructure/*`, `@modules/*`, `@common/*`.

### Request pipeline

- Global prefix `api`; global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform` (DTOs must be exhaustive — extra fields are rejected).
- Global guards registered in `AppModule` via `APP_GUARD`: `JwtAuthGuard` then `RolesGuard`. Routes are **authenticated by default**; mark public ones with `@Public()`. Role gating uses `@Roles(PerfilAcesso.X)` (enum comes from `@prisma/client`).
- Global filters: `AllExceptionsFilter` (catch-all → 500) + `DomainExceptionFilter` (any `DomainError` → **HTTP 422** with `{ code, message }`). Throw NestJS `HttpException`s (`NotFoundException`, `ConflictException`, `UnauthorizedException`, `ForbiddenException`) for 4xx other than 422. Do **not** throw generic `Error`; use `DomainError` to surface invariant violations.

### Ordem de Serviço — the core aggregate

`OrdemDeServico` is the aggregate root with `ItemOrcamento[]` and `ExecucaoDeServico[]`. Status transitions are enforced by `StatusOS.transicionar()` + `TransicaoStatusService` in the domain; invalid transitions raise `DomainError` (→ 422). New business rules touching OS state belong in those domain classes, not in controllers or use cases.

## Testing

- **Unit tests** (`*.spec.ts` colocated with source under `src/`) exercise VOs, domain services, and use cases with fakes — no NestJS container, no DB.
- **E2E tests** (`test/integration/*.e2e-spec.ts`) bootstrap the full `AppModule` using `test/helpers/prisma-mock.ts` — an in-memory `PrismaService` override. **No Postgres needed to run `npm run test:e2e`.** When adding e2e coverage, extend the mock rather than reaching for a real DB.
- Coverage thresholds apply only to `domain` and `application` (see `jest.config.ts`). Keep infrastructure logic thin enough that missing coverage there doesn't matter.

## Conventions to preserve

- Domain code stays framework-free: no `@nestjs/*`, no Prisma types, no Express.
- When adding a new bounded context, mirror the existing folder layout in all four layers (`domain/`, `application/`, `infrastructure/repositories/`, `modules/`) and register a new `INJECTION_TOKENS` entry + binding in `InfrastructureModule`.
- Controllers should be thin: validate via DTOs, delegate to a use case, map the result to a response DTO. No business logic in controllers.
- Commit messages in the existing history follow Conventional Commits + gitmoji (e.g. `feat(ordem-de-servico): :sparkles: ...`). Match that style.
