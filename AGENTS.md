# AGENTS.md

## Project Context

IncidentHub — operational platform for small SaaS companies to monitor service health and detect incidents.

Two independent TypeScript packages, no root `package.json` or monorepo tooling.

- `api/` — Fastify v5 HTTP API. Entry: `src/server.ts`.
- `core/` — Domain layer: Prisma schema, entities, repositories, use-cases. Not an HTTP app.
- `ProjectIdea.txt` — business requirements (Portuguese).

## Commands

Run every command inside the relevant package directory.

### api

```bash
cd api
npm install
npm run dev      # tsx watch src/server.ts, port 3000
npm run build    # tsc
npm run start    # node dist/server.js
```

No tests are configured.

### core

```bash
cd core
npm install
npx prisma generate        # generate client → src/db/generated/ (not in repo)
npx prisma migrate dev     # create & apply migration
npx prisma migrate reset   # reset DB
npx prisma studio          # open DB GUI

npm run test                        # vitest (watch mode in terminal)
npx vitest run                      # one-shot run
npx vitest run src/use-cases/create-organization.spec.ts   # single file
```

## TypeScript (both packages)

- `"type": "module"` — ES Modules only.
- `moduleResolution: "bundler"` — `.js` extensions in relative imports are not required.
- `strict: true`; `noUncheckedIndexedAccess` not set.
- `verbatimModuleSyntax` not enabled — regular `import` works for types.

## core — Architecture

Clean Architecture with Unit-of-Work.

```
core/src/
  db/
    schema.prisma          ← single Prisma schema (PostgreSQL)
    prisma-client.ts       ← singleton PrismaClient with @prisma/adapter-pg
    generated/             ← gitignored; run `npx prisma generate`
  entities/
    _default.ts            ← DefaultEntity<T>: frozen props, exposed via getProps()
    organization.ts        ← domain entity: create + fromEntityToPrisma + fromPrismaToEntity
    user.ts
  repositories/
    interfaces/            ← contracts: OrganizationsRepInterface, UsersRepInterface, UOW
    prisma/                ← Prisma implementations: PrismaUOW, PrismaOrganizationsRep, PrismaUsersRep
    in-memory/             ← fakes for testing: IMUOW, IMOrganizationsRep, IMUsersRep
  use-cases/
    <name>.ts              ← business-logic class, receives UOW via constructor
    <name>.spec.ts         ← unit tests using IMUOW
    factories/<name>.ts    ← production wiring with PrismaUOW
    errors/                ← domain errors extending DefaultError
  types/
    prisma-client.ts       ← TPrismaClient = PrismaClient | Prisma.TransactionClient
```

### Entities

- Every domain entity extends `DefaultEntity<T>`, stores frozen props, and exposes them via `getProps()`.
- Entities generate their own `id` (uuidv7) and `createdAt`.
- Each entity provides:
  - `create(props)` — omitting generated fields.
  - `fromEntityToPrisma(entity)` — maps the entity to the generated Prisma payload type.
  - `fromPrismaToEntity(prismaEntity)` — maps a Prisma record back to the entity.
- Prisma models for entity-managed tables do **not** use `@default(uuid())` or `@default(now())` for `id` / `createdAt`.

### Repositories

- Every repository has an interface in `repositories/interfaces/`.
- Implementations live in `repositories/prisma/` (production) and `repositories/in-memory/` (tests).
- Repositories accept and return entity instances.
  - Prisma implementations convert via `Entity.fromEntityToPrisma` / `Entity.fromPrismaToEntity`.
  - In-memory implementations store the entity directly in the UOW db map.
- Repository methods operate on `TPrismaClient` so they can run inside or outside a transaction.

### Unit of Work

- `UOW` interface: `repositories` map + `transaction(callback)`.
- `PrismaUOW.transaction` uses `client.$transaction` and passes transaction-scoped repositories to the callback.
- `IMUOW.transaction` calls the callback with the same in-memory repositories.
- In-memory db map holds entity instances (`Organization[]`, `User[]`, etc.).

### Use-cases

- A use-case is a class whose constructor takes a `UOW`.
- The public method is usually `execute(...)`.
- Business rules (e.g. uniqueness checks) query `uow.repositories` directly.
- Build the entities first, then persist them inside `uow.transaction`.

### Factories

- Production factories are in `use-cases/factories/<use-case>.ts`.
- They create a `PrismaUOW` from the singleton `prismaClient`, instantiate the use-case, and return `{ useCase }`.

### Errors

- Domain errors extend `DefaultError` and expose `code` + `message`.
- `EntityAlreadyExists` also carries an optional `context: { entity?, field? }` so callers can identify what conflicted.

### Tests

- Unit tests use `IMUOW` — no database needed.
- Pattern: `new IMUOW()` in `beforeEach`, pass it to the use-case constructor, assert behavior.
- Assert entity values through `.getProps()`, e.g. `result.organization.getProps().name`.
- See `src/use-cases/create-organization.spec.ts` for the canonical example.

### Adding a new entity

1. Add the Prisma model to `src/db/schema.prisma` (no `@default(uuid())` / `@default(now())` for entity-managed fields).
2. Create the entity class in `src/entities/<name>.ts` with `create`, `fromEntityToPrisma`, and `fromPrismaToEntity`.
3. Add the repository interface to `repositories/interfaces/`.
4. Implement it in `repositories/prisma/` and `repositories/in-memory/`.
5. Register it in `UOW.repositories`, `PrismaUOW.createRepositories`, and `IMUOW.createRepositories`.
6. Add use-case, factory, and spec following the existing naming conventions.

## Prisma notes

- Schema: `core/src/db/schema.prisma`.
- Generator output is `./generated` relative to the schema, so the client lands in `core/src/db/generated/`.
- `core/prisma.config.ts` sets the datasource URL from `DATABASE_URL` via `dotenv` for CLI commands.
- `core/prisma.config.ts` is excluded from `tsconfig.json`.

## Environment

- `core/.env` needs `DATABASE_URL` (PostgreSQL) for runtime and Prisma CLI.
- `api/.env` can set `PORT`; defaults to `3000`.
- `core/src/envs.ts` validates `DATABASE_URL` with Zod at import time.

## Current State

- `core` has a working Vitest setup and one passing use-case spec.
- `api` has no tests and no installed dependencies in this checkout.
- No linting, formatting, or CI configured.
