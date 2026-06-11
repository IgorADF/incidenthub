# AGENTS.md

## Project Context
IncidentHub — a platform for small SaaS companies to monitor service health and detect incidents. The API is a TypeScript + Fastify app.

## Repository Structure
- `api/` — all application code. No root-level package.json.
- `api/src/` — TypeScript source.
- `api/dist/` — build output (ignored in git).
- `ProjectIdea.txt` — business requirements (Portuguese).

## Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Fastify v5
- **Language**: TypeScript with strict settings
- **Dev server**: `tsx` (hot reload)
- **Build**: `tsc`
- **No root-level tooling**: all scripts are inside `api/`.

## Working in the API
All commands must run from `api/`:
```bash
cd api
npm run dev      # tsx watch src/server.ts
npm run build    # tsc
npm run start    # node dist/server.js
```

## TypeScript Quirks
- `"type": "module"` in `api/package.json` — ES modules only.
- `moduleResolution: nodenext` — **always use `.js` extensions in relative imports** (e.g., `import { app } from './app.js'`).
- `verbatimModuleSyntax: true` — **always use `import type` for type-only imports** (e.g., `import type { FastifyInstance } from 'fastify'`). Using `import` for types causes a build error.
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` — no sloppy types.

## Entry Points
- **Dev**: `api/src/server.ts` — boots Fastify on `PORT` (default 3000).
- **Build**: `api/dist/server.js` — compiled output.
- **App wiring**: `api/src/app.ts` creates Fastify instance, registers routes.
- **Routes**: `api/src/routes/index.ts` (Fastify plugin pattern).

## Domain Model (from `ProjectIdea.txt`)
- Organizations → Users → Projects → Services
- Services have HealthChecks and Incidents
- Incident detection logic based on consecutive failed health checks
- Future: configurable thresholds for incident start/recovery

## Important Notes
- There is no database configured yet. No ORM, no migration tool, no env file.
- There are no tests yet (`npm test` is a placeholder).
- No linting or formatting tools configured yet.
- All Fastify routes should be registered as plugins in `api/src/routes/` and imported in `api/src/app.ts`.
