# AGENTS.md

## Project Context

IncidentHub — operational platform for small SaaS companies to monitor service health and detect incidents.

Independent TypeScript packages, no root `package.json` or monorepo tooling.

- `backend/` — Single package that contains the domain layer, infrastructure, and two separate entrypoints:
  - `apps/api/` — Fastify v5 HTTP API.
  - `apps/worker/` — Background job processors (queue consumers).
- `ui/` — React/Vite frontend.
- `ProjectIdea.txt` — business requirements (Portuguese).

The API and worker are separate processes. They share `domain/` and `infra/` but never import each other.

## Commands

Run every command inside the `backend/` directory.

```bash
cd backend
npm install

npx prisma generate        # generate client → src/infra/db/generated/ (not in repo)
npx prisma migrate dev     # create & apply migration
npx prisma migrate reset   # reset DB
npx prisma studio          # open DB GUI

npm run dev:api            # tsx watch src/apps/api/server.ts, port 3000
npm run dev:worker         # tsx watch src/apps/worker/main.ts
npm run build              # tsc
npm run start:api          # node dist/apps/api/server.js
npm run start:worker       # node dist/apps/worker/main.js

npm run test               # vitest run (one-shot)
npx vitest run
npx vitest run src/domain/use-cases/create-organization.spec.ts
```

## TypeScript

- `"type": "module"` — ES Modules only.
- `moduleResolution: "bundler"` — `.js` extensions in relative imports are not required.
- `strict: true`; `noUncheckedIndexedAccess` not set.
- `verbatimModuleSyntax` not enabled — regular `import` works for types.

## backend — Architecture

Clean Architecture with Unit-of-Work.

```
backend/src/
  domain/
    entities/              ← domain entities extending DefaultEntity<T>
    value-objects/         ← UUIDv7, CreatedAt, AssociationUUIDv7
    repositories/
      interfaces/          ← repository contracts + UOW interface
      in-memory/           ← fakes for testing
    use-cases/             ← business-logic classes
      errors/              ← domain errors extending DefaultError
    utils/                 ← domain-safe test helpers
  infra/
    db/                    ← Prisma schema + generated client
    envs.ts                ← Zod env validation
    factories/             ← production wiring of use-cases
    mappers/               ← entity ↔ Prisma conversion
    queue/                 ← BullMQ queues
    redis/                 ← Redis connection
    repositories/prisma/   ← Prisma implementations
    utils/                 ← infra helpers (hashing, etc.)
  apps/
    api/                   ← Fastify server, routes, controllers
    worker/                ← background job processors
  types/                   ← shared types (TPrismaClient, HashedPassword)
```

### Path aliases

`tsconfig.json` defines:

- `@domain/*` → `src/domain/*`
- `@infra/*`  → `src/infra/*`
- `@apps/*`   → `src/apps/*`
- `~types/*`  → `src/types/*`

Use aliases for cross-layer imports. Use relative imports only within the same folder.

### Value-objects

- Simple immutable classes wrapping a primitive: `UUIDv7`, `CreatedAt`, `AssociationUUIDv7`.
- Prefer `readonly value` fields.
- Validate on construction when possible (e.g. UUIDv7 must match UUID format).
- Provide `equals(other)` for comparisons. Never compare value-object instances with `===` or `!==`.

### Entities

- Every domain entity extends `DefaultEntity<T>`, stores frozen props, and exposes them via `getProps()`.
- Entities generate their own `id` (via `UUIDv7`) and `createdAt` (via `CreatedAt`).
- IDs are typed as `UUIDv7`, foreign keys as `AssociationUUIDv7`, dates as `CreatedAt`.
- Entities provide only `create(props)` — omitting generated fields.
- Entities do **not** contain Prisma conversion methods. Mappers handle that.
- Prisma models for entity-managed tables do **not** use `@default(uuid())` or `@default(now())` for `id` / `createdAt`.

### Mappers

- Mappers live in `src/infra/mappers/` and convert between Prisma payloads and domain entities.
- Each mapper provides:
  - `fromEntityToPrisma(entity)` — maps the entity to the generated Prisma payload type.
  - `fromPrismaToEntity(prismaEntity)` — maps a Prisma record back to the entity.
- Mappers may call `new Entity(...)` to reconstruct persisted data. All other code uses `Entity.create(...)`.

### Repositories

- Every repository has an interface in `domain/repositories/interfaces/`.
- Production implementations live in `infra/repositories/prisma/`.
- In-memory fakes live in `domain/repositories/in-memory/`.
- Repositories accept and return entity instances.
  - Prisma implementations convert via `EntityMapper.fromEntityToPrisma` / `fromPrismaToEntity`.
  - In-memory implementations store the entity directly in the UOW db map.
- Repository methods operate on `TPrismaClient` so they can run inside or outside a transaction.

### Unit of Work

- `UOW` interface: `repositories` map + `transaction<T>(callback)`.
- `PrismaUOW.transaction` uses `client.$transaction` and passes transaction-scoped repositories to the callback.
- `IMUOW.transaction` calls the callback with the same in-memory repositories.
- In-memory db map holds entity instances (`Organization[]`, `User[]`, etc.).
- The transaction callback can return any value; the return type is preserved via the generic `<T>`.

### Use-cases

- A use-case is a class whose constructor takes a `UOW`.
- The public method is usually `execute(...)`.
- Business rules (e.g. uniqueness checks) query `uow.repositories` directly.
- Build the entities first, then persist them inside `uow.transaction`.

### Factories

- Production factories are in `infra/factories/<name>.usecase.ts`.
- They create a `PrismaUOW` from the singleton `prismaClient`, instantiate the use-case, and return `{ useCase }`.

### Errors

- Domain errors extend `DefaultError` and expose `code` + `message`.
- `EntityAlreadyExists` also carries an optional `context: { entity?, field? }` so callers can identify what conflicted.

### Tests

- Unit tests use `IMUOW` — no database needed.
- Pattern: `new IMUOW()` in `beforeEach`, pass it to the use-case constructor, assert behavior.
- Assert entity values through `.getProps()`, e.g. `result.organization.getProps().name`.
- See `src/domain/use-cases/create-organization.spec.ts` for the canonical example.

### Adding a new entity

1. Add the Prisma model to `src/infra/db/schema.prisma` (no `@default(uuid())` / `@default(now())` for entity-managed fields).
2. Create any new value-objects in `src/domain/value-objects/`.
3. Create the entity class in `src/domain/entities/<name>.ts` with `create`.
4. Create the mapper in `src/infra/mappers/<name>.ts`.
5. Add the repository interface to `domain/repositories/interfaces/`.
6. Implement it in `infra/repositories/prisma/` and `domain/repositories/in-memory/`.
7. Register it in `UOW.repositories`, `PrismaUOW.createRepositories`, and `IMUOW.createRepositories`.
8. Add use-case, factory, and spec following the existing naming conventions.

## Prisma notes

- Schema: `backend/src/infra/db/schema.prisma`.
- Generator output is `./generated` relative to the schema, so the client lands in `backend/src/infra/db/generated/`.
- `backend/prisma.config.ts` sets the datasource URL from `DATABASE_URL` via `dotenv` for CLI commands.
- `backend/prisma.config.ts` is excluded from `tsconfig.json`.

## Environment

- `backend/.env` needs `DATABASE_URL` (PostgreSQL) for runtime and Prisma CLI.
- `backend/.env` may set `PORT` for the API; defaults to `3000`.
- `backend/.env` may set `REDIS_URL` for BullMQ; defaults to `redis://localhost:6379`.
- `backend/src/infra/envs.ts` validates environment variables with Zod at import time.

## Current State

- `backend` has a working Vitest setup and passing use-case specs.
- `apps/api/` routes are stubbed; real endpoints need to be wired to factories.
- `apps/worker/` and `infra/queue/` are placeholders and not yet functional.
- `ui/` is a separate frontend package.
- No linting, formatting, or CI configured.
