# AGENTS.md

## Project Context
IncidentHub — operational platform for small SaaS companies to monitor service health and detect incidents.

Two independent TypeScript packages, no root `package.json` or monorepo tooling.

- `api/` — Fastify v5 HTTP API. Entry: `src/server.ts`.
- `core/` — Domain layer: Prisma schema, repositories, use-cases. Not an HTTP app.
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
  repositories/
    interfaces/            ← contracts: OrganizationsRepInterface, UsersRepInterface, UOW
    prisma/                ← Prisma implementations: PrismaUOW, PrismaOrganizationsRep, PrismaUsersRep
    in-memory/             ← fakes for testing: IMUOW, IMOrganizationsRep, IMUsersRep
  use-cases/
    <name>.ts              ← business-logic class, receives UOW via constructor
    <name>.spec.ts         ← unit tests using IMUOW
    factories/<name>.ts    ← production wiring with PrismaUOW
    errors/                ← domain errors (e.g. EntityAlreadyExists)
  types/
    entities.ts            ← re-exports Prisma generated types
    prisma-client.ts       ← TPrismaClient = PrismaClient | Prisma.TransactionClient
  utils/
    prisma-default-values.ts
    im-default-values.ts   ← both produce { id: uuidv7(), createdAt, updatedAt }
```

### Repositories
- Every repository has an interface in `repositories/interfaces/`.
- Implementations live in `repositories/prisma/` (production) and `repositories/in-memory/` (tests).
- Repository methods operate on `TPrismaClient` so they can run inside or outside a transaction.

### Unit of Work
- `UOW` interface: `repositories` map + `transaction(callback)`.
- `PrismaUOW.transaction` uses `client.$transaction` and passes transaction-scoped repositories to the callback.
- `IMUOW.transaction` calls the callback with the same in-memory repositories.

### Use-cases
- A use-case is a class whose constructor takes a `UOW`.
- The public method is usually `execute(...)`.
- Business rules (e.g. uniqueness checks) query `uow.repositories` directly; mutations go inside `uow.transaction`.

### Factories
- Production factories are in `use-cases/factories/<use-case>.ts`.
- They create a `PrismaUOW` from the singleton `prismaClient`, instantiate the use-case, and return `{ useCase }`.

### Tests
- Unit tests use `IMUOW` — no database needed.
- Pattern: `new IMUOW()` in `beforeEach`, pass it to the use-case constructor, assert behavior.
- See `src/use-cases/create-organization.spec.ts` for the canonical example.

### Adding a new entity
1. Add the Prisma model to `src/db/schema.prisma`.
2. Add the repository interface to `repositories/interfaces/`.
3. Implement it in `repositories/prisma/` and `repositories/in-memory/`.
4. Register it in `UOW.repositories`, `PrismaUOW.createRepositories`, and `IMUOW.createRepositories`.
5. Add generated type re-export in `types/entities.ts` if useful.
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
