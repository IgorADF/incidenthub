# AGENTS.md

## Project Context
IncidentHub — a platform for small SaaS companies to monitor service health and detect incidents.
Two independent TypeScript packages (no monorepo tooling, no root `package.json`).

## Repository Structure
- `api/` — Fastify v5 HTTP API. Entry: `src/server.ts`.
- `core/` — Domain layer: Prisma schema, repositories, use-cases. Not an HTTP app.
- `ProjectIdea.txt` — business requirements (Portuguese).

## Commands
All commands run **inside the relevant package directory** — there is no root-level script.

### api
```bash
cd api
npm run dev      # tsx watch src/server.ts (port 3000)
npm run build    # tsc
npm run start    # node dist/server.js
```

### core
```bash
cd core
npx prisma generate        # regenerate client → src/db/generated/
npx prisma migrate dev     # create & apply migration
npx prisma migrate reset   # reset DB
npx prisma studio          # open DB GUI
```

## TypeScript (both packages)
- `"type": "module"` — ES Modules only.
- `moduleResolution: "bundler"` — `.js` extensions in relative imports are **not** required.
- `strict: true`, `noUncheckedIndexedAccess` not set (api has it off; core uses default strict).
- `verbatimModuleSyntax` is **not** enabled — regular `import` works for types.

## core — Architecture
Clean Architecture with Unit-of-Work pattern.

```
core/src/
  db/
    schema.prisma          ← single Prisma schema (PostgreSQL)
    prisma-client.ts       ← singleton PrismaClient (uses @prisma/adapter-pg)
    generated/             ← gitignored, run `prisma generate`
    migrations/
  repositories/
    interfaces/            ← contracts (OrganizationsRepInterface, UOW)
    prisma/                ← Prisma implementations (PrismaUOW, PrismaOrganizationsRep)
    in-memory/             ← in-memory fakes for testing (IMOrganizationsRep)
  use-cases/               ← business logic classes (receive UOW via constructor)
  types/                   ← shared types (TPrismaClient)
```

**Key patterns:**
- Every repository has an **interface** in `interfaces/` and implementations in `prisma/` and `in-memory/`.
- `UOW` (Unit of Work) wraps repositories + `$transaction`. Use-cases receive `UOW` in constructor.
- New entity? Add: Prisma model → interface → Prisma impl → in-memory impl → register in `UOW.repositories`.

## api — Architecture
Minimal Fastify app. Routes are plugins registered in `src/routes/index.ts`.
Controllers go in `src/controllers/`, middlewares in `src/middlewares/` (both empty for now).

## Domain Model
Organizations → Users → Projects → Services → HealthChecks / Incidents.

## Environment
Both `api/.env` and `core/.env` exist. `DATABASE_URL` points to PostgreSQL.
`core/prisma.config.ts` reads `DATABASE_URL` via `dotenv` for Prisma CLI commands.

## Current State
- No tests configured in either package.
- No linting or formatting tools.
- No CI workflows.
- `core` use-cases and repositories are scaffolded but mostly stubs (TODO).
