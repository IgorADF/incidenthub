# AGENTS.md

## Project Context

IncidentHub — operational platform for small SaaS companies to monitor service health and detect incidents.

Independent TypeScript packages, no root `package.json` or monorepo tooling.

- `backend/` — Single package containing domain layer, infrastructure, and three separate entrypoints:
  - `apps/api/` — Fastify v5 HTTP API.
  - `apps/workers/` — Background job processors (queue consumers): `healthcheck/`, `notification/`, `shared/`.
  - `apps/crons/` — Cron-scheduled jobs (e.g. `clear-test-schemas.ts`).
- `ui/` — React 19 + Vite 8 SPA with TanStack Router (file-based) + shadcn/ui + Tailwind v4 (separate package — see "UI vs Backend" below).
- `ProjectIdea.txt` — business notes (Portuguese, sparse).

API, workers, and crons are separate processes. They share `domain/` and `infra/` but never import each other.

## UI vs Backend

**All implemented features live in `backend/`.** The `ui/` package is the TanStack Router scaffold (`tanstackcli-router-test`) — routing + styling wired, but no app features yet (no auth/API integration, no state management, single placeholder home route). Do not assume any frontend feature exists because its backend route does.

| Aspect | `backend/` | `ui/` |
|---|---|---|
| Stack | Fastify v5, Prisma 7, BullMQ, Zod 4, TS 6 | Vite 8 + React 19 + TanStack Router (file-based), TS 6 |
| Entry | `apps/api/server.ts` (API), `apps/workers/*/main.ts` (workers), `apps/crons/*.ts` | `src/main.tsx` → `RouterProvider` |
| Build | `npm run build` → `dist/` | `npm run build` → `dist/` |
| Test | Vitest unit (`vitest.config.ts`) + e2e (`vitest.e2e.config.ts`, real PostgreSQL) | Vitest configured (`vitest run`) with jsdom + Testing Library, but **no specs written** |
| Lint | Biome (`lint`, `format`, `organize:all`) | Biome (`biome.json`: tab indent, double quotes, ignores `routeTree.gen.ts` + `styles.css`) — NOT ESLint |
| Routing | n/a | TanStack Router file-based. Routes in `src/routes/`. Route tree auto-generated to `src/routeTree.gen.ts` (committed; do not hand-edit). Vite plugin `tanstackRouter({ target: 'react', autoCodeSplitting: true })` regenerates on dev/build. `npm run generate-routes` → `tsr generate` for manual regen. Root layout at `src/routes/__root.tsx`. README mentions "TanStack Start" / server functions / API routes — **that is stale template prose; no `@tanstack/react-start` dep, this is a pure SPA.** Ignore those sections. |
| Styling | n/a | Tailwind v4 via `@tailwindcss/vite` + shadcn/ui (style `radix-nova`, baseColor `neutral`, cssVariables). `src/styles.css` imports `tailwindcss` + `tw-animate-css` + `shadcn/tailwind.css` + Inter Variable font; `@custom-variant dark` and `@theme inline` tokens already set. Add components via the shadcn MCP / `npx shadcn@latest add`. |
| Path aliases | `@domain/*`, `@infra/*`, `@apps/*`, `~types/*` | Both `#/*` and `@/*` → `./src/*` (tsconfig). `#/*` is the package.json `imports` map; `@/*` is the shadcn convention — prefer `#/*` for app code, `@/*` for shadcn-generated components (matches `components.json` aliases). |
| TS quirks | `moduleResolution: "bundler"`, `verbatimModuleSyntax` off | `moduleResolution: "bundler"`, `verbatimModuleSyntax: **on**` (use `import type` for types), `noUnusedLocals`/`noUnusedParameters`/`noUncheckedSideEffectImports` on, `allowImportingTsExtensions` on |
| Implemented | Domain layer, all use-cases, full REST API, cookie auth, workers, crons | Router shell + shadcn/Tailwind + login screen (TanStack Query, AuthProvider, `apiFetch`, RHF+Zod). No protected routes/guards yet. |
| API client | n/a | `apiFetch<T>()` wrapper (`src/lib/api/client.ts`) with `credentials: "include"` always + `ApiError` normalization. Per-resource modules in `src/lib/api/<resource>.ts` (mirror backend routes). |
| Auth | Cookie-based (`@fastify/cookie`, `authHook`) | Login form + `AuthProvider` + localStorage (`ih_user`) + `apiFetch` wrapper with `credentials: "include"`. No `GET /auth/me` on backend yet; refresh rehydrates from localStorage (cookie validity assumed). |
| Routes | `POST /organizations`, `POST/GET/PATCH/DELETE /users`, `POST/GET/PATCH/DELETE /projects`, `POST/GET/PUT/PATCH/DELETE /projects/:projectId/services`, `GET /services/:id/health-checks`, `GET /services/:id/incidents`, `POST /auth/login`, `POST /auth/logout`, `POST /password/forgot`, `POST /password/reset` | File-based: `__root.tsx` (layout + devtools) + `_public.tsx` (pathless public layout w/ header + LanguageSwitcher) + `_public/login.tsx`. Add new routes as files in `src/routes/`; route tree regenerates automatically. |

**`ui/` commands (run inside `ui/`):**

```bash
npm run dev              # vite dev, port 5173 (Vite default; matches backend UI_URL)
npm run generate-routes  # tsr generate (manual route-tree regen; dev/build do it automatically)
npm run build            # vite build → dist/
npm run test             # vitest run (no specs yet)
npm run lint             # biome lint
npm run format           # biome format
npm run check            # biome check (lint + format + organize imports)
npx shadcn@latest add <component>   # add shadcn component → src/components/ui/
```

No `type:check` script — `tsc --noEmit` is implied by Vite during `build`. For standalone typecheck run `npx tsc --noEmit` (note `verbatimModuleSyntax` is stricter than backend).

**When working on `ui/`:** greenfield frontend consuming backend HTTP API over cookies. Routing + shadcn/Tailwind + auth/data layer established (see "UI — building a screen") — extend patterns, don't rewire. The backend API contract is the source of truth (see "API routes implemented" in Current State). Mirror `src/routes/login.tsx` and `src/lib/api/auth.ts` for new screens/endpoints.

**When working on `backend/`:** ignore `ui/`. Backend has no dependency on frontend. API responses are JSON (`{ data: ... }`), error shapes are `{ code, message, context? }` / `{ code, issues }` — frontend-friendly but backend does not tailor responses for any specific UI.

## Commands

Run every command inside the `backend/` directory.

```bash
cd backend
npm install

npx prisma generate        # generate client → src/infra/db/generated/ (not in repo)
npm run db:generate        # alias: prisma generate --sql (always use --sql)
npm run db:migrate:dev     # db:generate && prisma migrate dev (composite — use this for dev)
npm run db:migrate:deploy  # prisma migrate deploy (CI/test)
npx prisma migrate reset   # reset DB
npx prisma studio          # open DB GUI

npm run dev:api                  # tsx src/apps/api/server.ts, port 3000
npm run dev:worker:healthcheck   # tsx src/apps/workers/healthcheck/main.ts
npm run dev:worker:notification  # tsx src/apps/workers/notification/main.ts
npm run build                    # tsc
npm run start:api                # node dist/apps/api/server.js
npm run start:worker:healthcheck # node dist/apps/workers/healthcheck/main.js
npm run start:worker:notification# node dist/apps/workers/notification/main.js

npm run tests              # vitest run --config vitest.config.ts (unit only, excludes e2e)
npm run tests:e2e          # vitest run --config vitest.e2e.config.ts (serial, real PostgreSQL)
npm run type:check         # npx tsc --noEmit
npm run lint               # biome lint
npm run format             # biome format --write ./src
npm run organize:all       # biome check --write ./src (lint + format + organize imports)

npx vitest run src/domain/use-cases/create-organization.spec.ts   # single unit spec
NODE_ENV=test npx vitest run --config ./vitest.e2e.config.ts src/apps/api/e2e/auth.e2e.spec.ts  # single e2e
```

**Required verification order after any backend change:** `npm run type:check` → `npm run tests` → `npm run tests:e2e` (e2e needs PostgreSQL + `.env.test`).

## TypeScript

- `"type": "module"` — ES Modules only.
- `moduleResolution: "bundler"` — `.js` extensions in relative imports are not required.
- `strict: true`; `noUncheckedIndexedAccess` not set.
- `verbatimModuleSyntax` not enabled — regular `import` works for types.
- TypeScript 6.x, Zod 4.x.

## backend — Architecture

Clean Architecture with Unit-of-Work.

```
backend/src/
  domain/
    entities/              ← domain entities extending DefaultEntity<T>
    value-objects/         ← Zod schemas: UUIDv7, CreatedAt, Email, URL, Slug, Password, NormalizedString
    errors/                ← domain-wide errors (ValidationEntitiesError)
    repositories/
      interfaces/          ← repository contracts + UOW interface
      in-memory/           ← fakes for testing
    services/              ← domain service interfaces (ports) + test doubles
    use-cases/             ← business-logic classes
      errors/              ← use-case errors extending DefaultUseCasesError
      utils/paginations/   ← pagination schemas + types (base + per-entity cursor)
      utils/tests/         ← use-case test helpers (createTestOrganization, etc.)
  infra/
    db/                    ← Prisma schema + generated client
    envs.ts                ← Zod env validation
    factories/             ← production wiring of use-cases + services
    mappers/               ← entity ↔ Prisma conversion
    queue/                 ← BullMQ queues
    redis/                 ← Redis connection
    repositories/prisma/   ← Prisma implementations
    services/              ← infra implementations of domain service interfaces (adapters)
  apps/
    api/                   ← Fastify server, routes, plugins, handlers, e2e/
    workers/               ← healthcheck/ + notification/ + shared/
    crons/                 ← cron-scheduled jobs
  types/                   ← shared types (TPrismaClient, OmitDefaultValues, FastifyZodInstance)
```

### Path aliases

`tsconfig.json` defines:

- `@domain/*` → `src/domain/*`
- `@infra/*` → `src/infra/*`
- `@apps/*` → `src/apps/*`
- `~types/*` → `src/types/*`

Use aliases for cross-layer imports. Use relative imports only within the same folder.

### Value-objects

Reusable Zod schemas validating primitives: `UUIDv7`, `CreatedAt`, `Email`, `URL`, `Slug`, `Password`, `NormalizedString`.

```ts
export const Email = z.email();
export type Email = z.infer<typeof Email>;
```

- Use `Schema.parse(rawValue)` to validate + return typed value.
- IDs typed with `UUIDv7`; primary keys and foreign keys use the same schema.

**Non-obvious transforms (applied at parse time):**
- `Slug`: trim → strip leading `/` → regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase alphanumeric + single hyphens between groups, no uppercase/space).
- `NormalizedString`: trim → NFKD normalize → strip combining marks → lowercase → collapse whitespace. `User.normalizedName` derived from `name` (raw name stored, normalized computed at entity `create`).

### Entities

- Every entity extends `DefaultEntity<T>`, stores frozen props via `Object.freeze`, exposes `getProps(): Readonly<T>`.
- `DefaultEntity` validates props against the schema in the constructor and throws `ValidationEntitiesError` on failure.
- Entities generate their own `id` (`UUIDv7.parse(uuidv7())`) and `createdAt` (`CreatedAt.parse(new Date())`).
- IDs typed `UUIDv7`; foreign keys also `UUIDv7`; dates `CreatedAt`.
- Entities provide:
  - `create(props)` — omits generated fields (`id`, `createdAt`) and fields with defaults.
  - `fromProps(props)` — for mappers + use-case updates (reconstruct persisted data).
- Some entities add domain methods returning new instances via `Entity.fromProps({ ...this.getProps(), ...changes })` (e.g. `Service.resolveCurrentIncident()`, `Incident.resolve()`, `Service.enable()`/`disable()`). User/Project have no update methods — use `fromProps` spread in use-cases.
- When the full schema uses `.refine()`, the create-input type is a plain TypeScript type derived with `OmitDefaultValues` (refined schemas cannot be `.omit()`-ed as Zod schemas):
  ```ts
  type ServiceType = z.infer<typeof ServiceSchema>;
  export type CreateServiceType = OmitDefaultValues<ServiceType, "status" | "consecutivesIncidentDetectionFails" | "enabled">;
  ```
- `ProjectSchema` uses `.refine()` (showPublicPage=true requires non-null publicPageSlug) + `.overwrite()` (showPublicPage=false forces publicPageSlug=null). Use-cases trust these schema rules — don't duplicate in use-case logic.
- Entities do **not** contain Prisma conversion methods. Mappers handle that.
- Prisma models for entity-managed tables do **not** use `@default(uuid())` or `@default(now())` for `id` / `createdAt`.

### Entity update pattern (frozen entities)

Entities are immutable. To "update", rebuild via `fromProps`:

```ts
const updated = Project.fromProps({
  ...project.getProps(),
  name: newName,
  showPublicPage: newShowPublicPage,
  publicPageSlug: newSlug !== undefined ? newSlug : props.publicPageSlug,
});
```

- Use `input.field !== undefined ? input.field : props.field` for nullable fields to distinguish "not provided" from "explicit null" (e.g. clearing a slug).
- Use `input.field ?? props.field` for non-nullable primitives.

### Mappers

- Live in `src/infra/mappers/` and convert between Prisma payloads and domain entities.
- Each mapper provides `fromEntityToPrisma(entity)` and `fromPrismaToEntity(prismaEntity)`.
- `fromPrismaToEntity` parses id/createdAt/foreign keys via `UUIDv7.parse` / `CreatedAt.parse` before `Entity.fromProps`.
- Some entities have separate `User` (no password) vs `UserWithPassword` mappers — pick the one matching the repo method.
- Mappers may call `Entity.fromProps(props)`. All other code uses `Entity.create(...)`.

### Repositories

- Interface in `domain/repositories/interfaces/`, Prisma impl in `infra/repositories/prisma/`, in-memory fake in `domain/repositories/in-memory/`.
- Repositories accept and return entity instances.
  - Prisma impls convert via `EntityMapper.fromEntityToPrisma` / `fromPrismaToEntity`.
  - In-memory impls store the entity directly in the UOW db array.
- Repository methods operate on `TPrismaClient` so they work inside or outside a transaction.
- `TPrismaClient = MyPrismaClient | Prisma.TransactionClient` — single type for both contexts.

### Unit of Work

- `UOW` interface: `repositories` map + `transaction<T>(callback)`.
- `PrismaUOW.transaction` uses `client.$transaction` and passes transaction-scoped repositories to the callback.
- `IMUOW.transaction` calls the callback with the same in-memory repositories (no real rollback).
- In-memory db map holds entity instances: `healthChecks`, `incidents`, `organizations`, `projects`, `services`, `users` (each typed as entity array).
- **Prisma `$transaction` does NOT support nesting.** A use-case running inside a transaction must not call another use-case's `execute` (which opens its own `$transaction`). Use extracted helper methods (e.g. `DeleteService.cascadeDelete(reps, service)`) that accept caller-provided `reps`.

### Use-cases

- A use-case is a class whose constructor takes a `UOW` and any domain service interfaces it needs.
- The public method is `execute(...)`.
- Business rules query `uow.repositories` directly; throw domain errors from `use-cases/errors/`.
- Outward-facing concerns (hashing, JWT, external APIs, email) handled by injected domain services — never import infra directly.
- Build entities outside the transaction, then persist inside `uow.transaction`.
- Use-cases are pure business logic. They report truthful domain outcomes (`NotFoundError`, `NotAllowedError`, etc.). Security, anti-enumeration, and transport-level concerns belong at the route boundary.

#### Conventions

- **Class naming:** kebab-case file → PascalCase preserving every word boundary: `create-organization` → `CreateOrganization`, `create-user-to-organization` → `CreateUserToOrganization`.
- **Authorization:** always verify actor exists + has permission before processing. All mutating use-cases and ALL list use-cases require `type === "ADMIN"` else `NotAllowedError`. Resolve org from requester (`requester.getProps().organizationId`), never from route param.
- **Uniqueness checks:** query before building entities; throw `EntityAlreadyExists({ entity, field })`. Email is globally unique (Prisma `@unique`). Project name is org-scoped (`@@unique([organizationId, name])`). Project `publicPageSlug` is globally unique.
- **Transactions:** build entities outside, persist inside `uow.transaction`.
- **Entity validation:** format/range/cross-field rules live in entity Zod schemas + entity specs. Use-case specs cover auth, uniqueness, limits, wiring — not format validation.
- **Partial input:** use `.partial()` + `.refine` enforcing ≥1 field provided. For nullable fields use `!== undefined` check to allow explicit null.
- **Output schema:** each use-case exports `<Name>OutputSchema` (Zod object). Route response: `200: z.object({ data: <Name>OutputSchema })`. Don't redefine output shape in route.
- **Test factories:** prefer `createTestOrganization`, `createTestAdminUser`, `createTestDevUser`, `createTestProject`, `createTestService` over inline entity creation.
- **Security:** never swallow domain errors or alter a use-case result to hide information. Use-case returns/throws truthful outcome; route handler decides client view (e.g. `POST /password/forgot` catches `NotFoundError` → 200).

#### Last-admin invariant

- Deleting or demoting the last ADMIN of an org → `NotAllowedError`.
- Uses `users.countByOrganizationIdAndType(orgId, "ADMIN")` repo method.
- Applies in `DeleteUser` (cannot delete last admin) and `UpdateUser` (cannot demote ADMIN→DEV when only one admin).
- Self-delete also blocked (`DeleteUser`).

#### Cascade delete pattern

**No `onDelete: Cascade` anywhere in Prisma schema — all relations default RESTRICT.** Manual ordered deletion required, inside one outer `uow.transaction`.

`DeleteService.cascadeDelete(reps, service)` is a public method reused by `DeleteProject`:

```
per service (inside caller's transaction):
  1. if service.currentIncidentId set → service.resolveCurrentIncident() → reps.services.update(resolved)
     (clears Service→Incident FK so incident can be deleted without RESTRICT violation)
  2. reps.healthChecks.deleteByServiceId(serviceId)
  3. reps.incidents.deleteByServiceId(serviceId)
  4. reps.services.delete(serviceId)

DeleteProject: loop cascadeDelete per service (services.getByProjectId), then reps.projects.delete(projectId)
```

Reuse mechanism: extract public `cascadeDelete(reps, entity)` on the inner use-case; outer use-case injects the inner via factory and loops it within its own transaction. Avoids nested `$transaction`.

### Domain services

- Interfaces (ports) in `src/domain/services/<name>.interface.ts`.
- Infra adapters in `src/infra/services/<name>.ts`.
- Test doubles co-located in `src/domain/services/<name>.ts` (e.g. `HashPasswordTestService`).
- Use-cases depend on the interface; factories inject the production adapter; specs inject the test double.

### Factories

- Production factories in `infra/factories/<name>.usecase.ts`.
- Signature: `<name>Factory(dbClient: MyPrismaClient)` — takes `dbClient` parameter (NOT singleton `prismaClient` import). Route passes its `dbClient` through.
- Body: `new PrismaUOW(dbClient)`, instantiate required infra services, inject into use-case, return `{ useCase }`.
- Use-cases needing cross-use-case reuse inject sibling use-cases directly (e.g. `new DeleteProject(uow, new DeleteService(uow))`) — share the same UOW instance.

### Route handlers

- Route plugins in `apps/api/routes/<resource>.ts`. Each exports `<name>Routes(dbClient)` returning `async (app, _options)`. Registered in `apps/api/routes/_init.ts`.
- Use `FastifyZodInstance` from `~types/fastify-zod-instance` as the `app` type. Wires `fastify-type-provider-zod` — Zod schemas in `schema` both **validate at runtime** (via `validatorCompiler` / `serializerCompiler` set in `app.ts`) and **narrow at compile time**.
- Declare input/output schemas in `schema: { params, body, querystring, response }`. Single source of truth for validation + TS narrowing. Never add manual route generics (`app.post<{ Body: ... }>(...)`) or `request.body as ...` casts.
- Path params with IDs: `z.object({ serviceId: z.string().uuid() })` etc.
- Domain errors propagate to global handler in `apps/api/handlers/error.ts`. Status map: `EntityAlreadyExists`→409, `NotAllowedError`→403, `NotFoundError`→404, `LimitExceededError`→409, `InvalidCredentialError`→401, `ValidationEntitiesError`→400. Unmapped codes → 400 via `DefaultUseCasesError`/`DefaultEntitiesError`. Specific branches kept only for errors with extra payload (`EntityAlreadyExists` → `context`, `ValidationEntitiesError` → `issues`). Vendor: request Zod validation → 400, response serialization → 500. Route handlers do **not** catch domain errors, except anti-enumeration at transport boundary (`POST /password/forgot` catches `NotFoundError` → 200).

### Auth (cookie-based)

- `@fastify/cookie` registered in `app.ts` with `secret: envs.AUTH_JWT_SECRET`.
- CORS: `credentials: true, origin: [envs.UI_URL]` (cross-origin cookies need explicit origin + credentials).
- `POST /auth/login` → `reply.setCookie(envs.COOKIE_NAME, token, { httpOnly, secure, sameSite, path, domain, maxAge })`, returns `{ data: { user } }` (NO token in body).
- `POST /auth/logout` → `reply.clearCookie(envs.COOKIE_NAME, { path, domain })`, returns `{ data: { ok: true } }`.
- `POST /password/forgot` / `POST /password/reset` — reset token delivered via email link as JWT (one-shot flow), not via cookie.
- `authHook` in `apps/api/plugins/auth.ts` reads `request.cookies[envs.COOKIE_NAME]`, verifies via `JwtService.verifyAuth`, populates `request.user: AuthUser | null`.
- `AuthUser = { userId: string; organizationId: string; type: "ADMIN" | "DEV" }`.
- Attach as `{ preHandler: [authHook] }`. Access `request.user!.userId` / `.organizationId` in handlers — `!` intentional since hook 401s when unauthenticated.
- Env: `COOKIE_NAME` (default `"ih_session"`), `COOKIE_DOMAIN?`, `COOKIE_SECURE` (default false), `COOKIE_SAMESITE` (default `"lax"`), `COOKIE_PATH` (default `"/"`).

### Errors

- Domain errors extend `DefaultUseCasesError` and expose `code` + `message`.
- `EntityAlreadyExists` carries optional `context: { entity?, field? }` — forwarded to client by handler.
- `ValidationEntitiesError` lives in `domain/entities/errors/`, thrown by `DefaultEntity` on schema failure. Exposes `issues: { path, message }[]`; `message` is human-readable concatenation.

## Pagination

Base schemas in `src/domain/use-cases/utils/paginations/pagination.ts`:

- `LimitPagination` — int 1..100, default 20.
- `ListCursor` — `{ id: UUIDv7.nullable() }` (id-only cursor).
- `ListPagination` — `{ limit, cursor }`.
- `NextPaginationList` — `{ limit, hasNextPage, nextCursor }`.

Composite cursor example: `ListUserCursor = { normalizedName, id }` in `list-user-by-organization.ts` (two-column tie-breaker). When adding new paginated list, prefer the base `ListCursor` (id-only) unless a secondary sort is required.

**Repo `listByX` contract:** returns `{ entities, pagination: { limit, hasNextPage, nextCursor } }`. Implementation: `take: limit + 1`, slice first `limit`, `hasNextPage = records.length > limit`, `nextCursor.id = lastEntity.id` (or `null` when no next page).

**Direction conventions:**
- Ascending (older first): `orderBy: { id: "asc" }`, `where: { id: { gt: cursorId } }`, in-memory `a.id.localeCompare(b.id)` + `id > cursorId`. Used by `list-users-by-organization` (composite normalizedName+id).
- **Descending (newest first, default for time-series):** `orderBy: { id: "desc" }`, `where: { id: { lt: cursorId } }`, in-memory `b.id.localeCompare(a.id)` + `id < cursorId`. Used by `list-health-checks-by-service` and `list-incidents-by-service`. UUIDv7 is time-ordered ascending, so desc by id = newest first.

**Route querystring pattern:**

```ts
querystring: z.object({
  limit: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    LimitPagination,
  ),
  id: ListCursor.shape.id.optional().default(null),
  // or for composite: normalizedName: ListUserCursor.shape.normalizedName.optional().default(null),
})
```

Handler:

```ts
const data = await useCase.execute(request.user!.userId, serviceId, {
  limit: request.query.limit,
  cursor: { id: request.query.id },
});
```

Response: `200: z.object({ data: ListXOutputSchema })` where `ListXOutputSchema = z.object({ x: z.array(EntitySchema), pagination: NextPaginationList })`.

## Tests

### Unit tests (`vitest.config.ts`)

- Exclude `dist/**`, `node_modules/**`, `src/apps/api/e2e/**`.
- Use `IMUOW` — no database needed.
- Pattern: `new IMUOW()` in `beforeEach`, pass to use-case constructor, assert behavior.
- When use-case depends on a domain service, pass a test double (e.g. `new HashPasswordTestService()`).
- Assert entity values via `.getProps()`.
- Assert errors by class instance (`rejects.toBeInstanceOf(NotFoundError)`).
- Canonical example: `src/domain/use-cases/create-organization.spec.ts`.

### E2E tests (`vitest.e2e.config.ts`)

- Separate config. Run via `npm run tests:e2e`.
- Include: `src/apps/api/e2e/**/*.e2e.spec.ts`.
- `fileParallelism: false`, `maxWorkers: 1` — serial execution.
- `testTimeout` / `hookTimeout`: 120s.
- **Needs real PostgreSQL** via `DATABASE_URL` from `.env.test`. Each spec mints a unique test schema via `runInitTestConfigs()` → `CreateTestDatabaseHelper` (applies migrations, drops schema on teardown via `runFinalTestConfigs()`).
- Seed helpers in `apps/api/e2e/helpers/seed.ts`:
  - `seedOrganizationAndAdmin(app)` → POST `/organizations` + POST `/auth/login`, returns `{ token, userId, organizationId, email, password, organizationName }`. Token extracted from `Set-Cookie` header.
  - `seedDevUserAndLogin(app, adminToken)` → POST `/users` type DEV + login.
  - `seedSecondAdmin(app, adminToken)` → POST `/users` type ADMIN (no login).
  - `seedProject(app, token, overrides?)`, `seedService(app, token, projectId)`.
  - `authCookies(token)` → `{ cookies: { [envs.COOKIE_NAME]: token } }` (use spread `...authCookies(token)` in inject).
  - `uniqueEmail()`, `uniqueName(prefix)`.
- Auth pattern: `app.inject({ method, url, ...authCookies(token), payload })`. No `Authorization` header.
- Workers/crons create health-checks + incidents (not via HTTP API), so e2e for those endpoints asserts empty-list + auth/cross-org guards + limit param + bad-uuid. Pagination traversal covered by unit tests with direct `Entity.create` + repo.

### Value-object tests

Each value-object schema has co-located `.spec.ts` in `src/domain/value-objects/`. Exercise `.parse()` for valid, `.safeParse()` for invalid. Cover boundaries (exactly min/max accepted, min-1/max+1 rejected).

### Entity tests

Each entity has co-located `.spec.ts` in `src/domain/entities/`. Test `Entity.create` validation directly (not via use-case). Boundary tests for every min/max constraint.

## Adding a new entity, repository, and use-case

Workflow with templates. Each step references conventions above.

### 1. Prisma model

Add to `src/infra/db/schema.prisma`:
- `@id` on primary key, **no** `@default(uuid())`.
- `createdAt DateTime`, **no** `@default(now())`.
- `@map("snake_case")` on fields, `@@map("table_name")` on model.
- Declare `@unique` / `@@unique` / `@@index` per business rules.
- **No `onDelete: Cascade`** — default RESTRICT everywhere. Cascade deletes are manual in use-cases.

### 2. Value-objects

Create in `src/domain/value-objects/` only if entity needs new domain primitives. Reuse `UUIDv7`, `CreatedAt`, `Email`, `URL`, `Slug`, `Password`, `NormalizedString`.

### 3. Entity

Create `src/domain/entities/<name>.ts`. Extend `DefaultEntity<T>`. Define Zod schema for full props (include `id`, `createdAt`). Define `CreateXType = OmitDefaultValues<...>`. Provide `create` + `fromProps`. No Prisma methods.

Add domain methods (e.g. `resolve()`, `enable()`) returning new instances via `fromProps({ ...this.getProps(), ...changes })` when business logic warrants.

### 4. Entity spec

`src/domain/entities/<name>.spec.ts` — boundary tests for `Entity.create`.

### 5. Mapper

`src/infra/mappers/<name>.ts` — `fromEntityToPrisma` + `fromPrismaToEntity`. Parse id/createdAt/FKs via value-object `.parse()`.

### 6. Repository interface

`domain/repositories/interfaces/<plural>.ts`. Return `Entity | null` for lookups, `Entity` for writes, `void` for deletes.

### 7. Prisma repository

`infra/repositories/prisma/<plural>.ts`. Constructor takes `TPrismaClient`. Convert via mapper.

### 8. In-memory repository

`domain/repositories/in-memory/<plural>.ts`. Constructor takes `IMUOWdb`. Store/query entity instances directly in `db.<plural>` array. Compare IDs via `entity.getProps().id`.

### 9. UOW registration

Three places:
- `domain/repositories/interfaces/_uow.ts` — add to `repositories` map.
- `infra/repositories/prisma/_uow.ts` — add to `createRepositories`.
- `domain/repositories/in-memory/_uow.ts` — add to `IMUOWdb` type + `createRepositories`.

### 10. Use-case

`src/domain/use-cases/<name>.ts`. Import `UOW` + domain service interfaces. Define input schema (with `.refine` for partial ≥1 field when editing). Query repos for authz/uniqueness/limits. Throw domain errors. Build entities outside transaction, persist inside. Don't duplicate entity schema rules.

### 11. Factory

`infra/factories/<name>.usecase.ts`. Signature `<name>Factory(dbClient: MyPrismaClient)`. Build `PrismaUOW(dbClient)`, inject infra services + any sibling use-cases, return `{ useCase }`.

```ts
import { UpdateProject } from "@domain/use-cases/update-project";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function updateProjectFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new UpdateProject(uow);
  return { useCase };
}
```

### 12. Use-case spec

`src/domain/use-cases/<name>.spec.ts`. Use `IMUOW`. Seed via `createTestOrganization` / `createTestAdminUser` / `createTestDevUser` / `createTestProject` / `createTestService`. Assert on `result.entity.getProps().field`. Assert errors by class. Cover: happy path, non-admin, not-found, no-actor, cross-org, uniqueness conflicts, last-admin invariant (when applicable).

### 13. Route

`apps/api/routes/<resource>.ts`. Add `app.<method>(path, { preHandler: [authHook], schema: { params, body, querystring, response } }, handler)`. Call factory, `useCase.execute(request.user!.userId, ...)`, `reply.status(...).send({ data })`.

### 14. E2E spec

`apps/api/e2e/<resource>.e2e.spec.ts`. Use `runInitTestConfigs` / `runFinalTestConfigs`. Seed via helpers. Use `...authCookies(token)` for authed requests. Cover: success, 401 no-cookie, 403 non-admin, 404 not-found, 403 cross-org, 400 bad-uuid, 400 invalid body.

### Verification

```bash
npx vitest run src/domain/use-cases/<name>.spec.ts   # isolated unit spec
npm run type:check                                    # tsc --noEmit
npm run tests                                         # full unit suite
NODE_ENV=test npx vitest run --config ./vitest.e2e.config.ts src/apps/api/e2e/<resource>.e2e.spec.ts  # isolated e2e
npm run tests:e2e                                     # full e2e suite
```

## Prisma notes

- Schema: `backend/src/infra/db/schema.prisma`.
- Generator output `./generated` relative to schema → client lands in `backend/src/infra/db/generated/` (not in repo, must `prisma generate` after clone).
- `backend/prisma.config.ts` sets datasource URL from `DATABASE_URL` via `dotenv` for CLI commands.
- `backend/prisma.config.ts` excluded from `tsconfig.json`.
- `prisma generate` / `db:generate` use `--sql` flag (always run via npm scripts, not raw `prisma generate`).

## Environment

- `backend/.env` for runtime + Prisma CLI; `backend/.env.test` for e2e (loaded when `NODE_ENV=test`).
- Required: `DATABASE_URL` (PostgreSQL), `AUTH_JWT_SECRET` (min 16 chars), `FORGOT_PASSWORD_JWT_SECRET` (min 16), `UI_URL`, `NODE_ENV`, `PORT`, `REDIS_URL`.
- Cookie env (all have defaults except `COOKIE_DOMAIN`): `COOKIE_NAME`, `COOKIE_DOMAIN?`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_PATH`.
- SMTP defaults: `SMTP_URL=smtp://localhost:25`, `SMTP_FROM=noreply@incidenthub.com`.
- `backend/src/infra/envs.ts` validates via Zod at import time — invalid env throws at boot.
- **Known bug (unfixed):** `envs.ts` `isProdEnv: data.NODE_ENV === "development"` and `isDevEnv: data.NODE_ENV === "test"` are swapped. `isDevEnv` actually means test env. Don't rely on these flags without checking the source.

## UI — building a screen

Hard-earned conventions established by the `/login` screen. Mirror these for every new screen.

### Provider stack (mounted in `ui/src/main.tsx`, outer→inner)

`QueryClientProvider` → `ThemeProvider` (`defaultTheme="dark"`, `storageKey="vite-ui-theme"`) → `AuthProvider` → `RouterProvider` (via `RouterWithAuth`).

```
ui/src/
  components/
    ui/                ← shadcn components ONLY (added via `npx shadcn@latest add`; aliases @/*)
    language-switcher.tsx ← reusable `<LanguageSwitcher />` dropdown
    mode-toggle.tsx    ← reusable `<ModeToggle />` dark/light/system dropdown
    <custom>/          ← non-shadcn components live here or in own subfolder, NOT in ui/
  context/
    auth/
      auth-context.tsx ← AuthProvider + useAuth() (React context)
      auth-storage.ts  ← localStorage read/write helpers (key "ih_user")
    theme/
      theme-provider.tsx ← ThemeProvider + useTheme() (React context; defaultTheme="dark", storageKey="vite-ui-theme")
  lib/
    api/
      client.ts        ← apiFetch<T>() wrapper + ApiError (credentials: "include" always)
      <resource>.ts    ← per-resource endpoint modules (mirror backend apps/api/routes/<resource>.ts)
    envs.ts            ← Zod-validated envs object (parses import.meta.env; throws if missing)
    query-client.ts    ← single QueryClient instance (retry:false, no refetchOnWindowFocus)
    utils.ts           ← cn() (tailwind-merge + clsx) — shadcn-owned, do NOT edit manually
  types/
    user.ts            ← AuthUser type (UI-side; subset of backend UserSchema output, no normalizedName)
  i18n/
    config.ts          ← i18next init (side-effect import) + `resources`/`supportedLngs`/`defaultLng`/`defaultNS` exports
    locales/
      en/translation.json   ← English strings (only `login.*` keys now)
      pt-BR/translation.json ← Brazilian Portuguese strings
  routes/
    __root.tsx         ← root layout + devtools
    _public.tsx        ← pathless public layout (header + LanguageSwitcher + Outlet)
    _public/login.tsx  ← public login screen (child of _public layout; no inline header/switcher)
    _authenticated.tsx ← (future) pathless protected layout w/ beforeLoad guard
    <path>.tsx         ← one file per route; `export const Route = createFileRoute("/path")({ component })`
  routeTree.gen.ts     ← AUTO-GENERATED, never hand-edit; regen via `npm run generate-routes`
  styles.css           ← Tailwind v4 + shadcn tokens + @custom-variant dark (auto dark mode)
```

**Folder rules:**
- `components/ui/` — shadcn-generated ONLY. Custom components → `src/components/` root or own subfolder.
- `lib/utils.ts` — shadcn-owned `cn()`. Never edit manually.
- `routeTree.gen.ts` — auto-generated. Never hand-edit; regen via `npm run generate-routes` after route changes.
- `lib/api/` — HTTP transport layer (fetch wrapper + per-resource endpoint fns). No cache/state here.
- `lib/query-client.ts` — `QueryClient` instance + config (cache/state). Separate from `api/` (transport vs cache).

### Data layer

- **TanStack Query only** — no axios, no raw fetch in components. `useMutation` for writes, `useQuery` for reads.
- `apiFetch<T>(path, init?)` in `src/lib/api/client.ts` is the only fetch surface. It:
  - always sets `credentials: "include"` (cookie auth, UI is cross-origin 5173→3000),
  - prefixes `envs.VITE_API_URL` from `src/lib/envs.ts`,
  - normalizes backend errors into `ApiError { code, message, status, details?, issues? }`,
  - throws `ApiError` with `status: 0` + `code: "NETWORK_ERROR"` on fetch failure (CORS misconfig, server down).
- **Backend API contract is source of truth**: response is `{ data: ... }`; error shapes are `{ code, message, context? }` (domain), `{ code, message, details }` (request validation), `{ code, message, issues }` (entity validation). Status map: 401 `INVALID_CREDENTIAL`, 403 `NotAllowedError`, 404 `NotFoundError`, 409 `EntityAlreadyExists`/`LimitExceededError`, 400 `ValidationEntitiesError`/request Zod, 500 `INTERNAL_ERROR`.
- Per-resource modules in `src/lib/api/<resource>.ts` export typed `input → Promise<T>` functions. Example: `auth.ts` exports `login(input: LoginInput): Promise<LoginResponse>` where `LoginResponse = { data: { user: AuthUser } }`. One module per backend route resource.

### Auth

- `AuthProvider` (`src/context/auth/auth-context.tsx`) holds `{ user, setUser, clearUser, isAuthenticated }`. `useAuth()` throws if used outside provider.
- User from login response stored in context + `localStorage` key `ih_user` (helpers in `src/context/auth/auth-storage.ts`). On mount, provider hydrates state from `readInitialUser()`.
- **No `GET /auth/me` on backend yet** — refresh assumes cookie validity; protected calls return 401 and that's the re-validation path. Add `GET /auth/me` to backend later for true rehydration.
- `AuthUser` type (`src/types/user.ts`) is the UI-side shape — subset of backend `UserSchema` output (drops `normalizedName` the UI doesn't need). Don't import backend types (separate package, no shared types).
- **Router context:** `main.tsx` creates the router once with `context: { auth: undefined }` placeholder, then `RouterWithAuth` calls `router.update({ context: { auth } })` in an effect when `useAuth()` changes. Route `beforeLoad` guards (future protected routes) read `context.auth.isAuthenticated` — this effect is what keeps guards seeing fresh auth after login/logout.

### Internationalization (i18next + react-i18next)

- **`i18next` + `react-i18next`** — deps in `package.json`. No `i18next-browser-languagedetector` / `i18next-http-backend` — resources are bundled statically (single SPA chunk), no async loading, no localStorage caching of language yet. Add later if needed.
- Config in `src/i18n/config.ts` — initializes i18next with `initReactI18next` at module load (guarded by `if (!i18n.isInitialized)` so HMR + tests don't double-init). Re-exports: `default i18n`, `resources`, `supportedLngs`, `defaultLng`, `defaultNS`.
- Resources cast `as unknown as Resource` because JSON imports don't satisfy i18next's `ResourceLanguage` index signature type (concrete shapes miss the `[key: string]` index) — TS workaround, not a runtime concern. Cast stays even with non-empty JSONs.
- **Wire:** `import "#/i18n/config";` once at top of `src/main.tsx` (before `ReactDOM.createRoot`). Side-effect import initializes i18n synchronously before first render. **No `I18nextProvider`** — react-i18next hooks (`useTranslation`) read the global init'd instance; provider wrapper skipped for SPA simplicity (fine since resources are static, not async-loaded).
- **Languages:** `en` (default, English-first) + `pt-BR` (Brazilian Portuguese — backend business notes are Brazilian RH context). Locale codes use BCP-47 region subtag (`pt-BR`, not `pt`). Add new language → new folder `src/i18n/locales/<code>/translation.json` + register in `resources` + `supportedLngs` in `config.ts`.
- **Translation files:** `src/i18n/locales/<lang>/translation.json` — one namespace (`translation`) per language. Structured by screen: `login.*` (login route labels), `theme.*` (mode-toggle labels: toggle/light/dark/system). Built form-validation messages live under `login.errors.*` (`emailInvalid`, `passwordRequired`, `network`, `invalidCredentials`, `validation`, `generic`). Reference keys from components via `useTranslation()` (`t("login.title")`). Keep Zod messages translatable by building the schema inside the component body so messages re-translate on language change.
- **Schema re-build on i18n change:** for forms whose Zod messages need translation, define the schema inside the component body with `const schema = z.object({ email: z.email(t("login.errors.emailInvalid")), ... })` and pass it to `useForm({ resolver: zodResolver(schema), ... })`. Schema re-renders when language changes (via `useTranslation()`'s `t` identity). Module-level schemas can't read `t()` (no hook context). **No `useMemo`/`useCallback` needed** — React Compiler memoizes automatically (see "React Compiler" below).
- **Usage in components:** `import { useTranslation } from "react-i18next"; const { t } = useTranslation(); ... <h1>{t("login.title")}</h1>`. Keys are dot-notation paths into the JSON tree. Backend error messages are NOT translated — they come as English strings from the API; only UI chrome strings go through i18n.
- Changing language at runtime: `i18n.changeLanguage("pt-BR")` (import `i18n` from `#/i18n/config`) or via `<LanguageSwitcher />` (see below). Persisted to `localStorage` key `ih_lang` (read on boot in `config.ts` as initial `lng`, written on every switch). No `i18next-browser-languagedetector` dep — manual localStorage is simpler + explicit.

### Language switcher (`<LanguageSwitcher />`)

- `src/components/language-switcher.tsx` — reusable dropdown for the header. shadcn `DropdownMenu` + `Button` (`variant="ghost" size="sm"`) + `lucide-react` `Languages`/`Check`. Trigger shows active language label; menu lists all `supportedLngs` with a checkmark on the active one. Click → `i18nInstance.changeLanguage(code)` + persist to `localStorage["ih_lang"]`. Uses `useTranslation()`'s `i18n` ref (re-renders on change) — no local React state; i18n instance is source of truth. `try/catch` on localStorage (private mode).
- Lives in `src/components/` (NOT `components/ui/` — that's shadcn-only). Custom components go here or in own subfolder.
- Language labels map (locale → human label) is co-located in the component: `en: "English"`, `pt-BR: "Português (Brasil)"`. Add new languages here too + in `config.ts` `resources`/`supportedLngs` + new `locales/<code>/translation.json`. No flag icons (flags ≠ languages).
- **Reusable on public + protected screens.** Public screens share the `_public.tsx` pathless layout (header bar with `<LanguageSwitcher />` + `<ModeToggle />` grouped right, centered `<Outlet />` for child content) — screens don't mount their own switcher/toggle or header. Protected screens (future, `_authenticated.tsx` layout) will do the same. NOT mounted in `__root.tsx` (a global header would force layout on every route including bare full-screen ones).
- No `<AppHeader />` wrapper yet — `_public.tsx` layout has a minimal header (right-aligned switcher + mode toggle). Build a shared header component when the first protected screen lands and you know what else goes in the header (logo/nav/user menu/auth state). The atoms are ready now.
- TS: `verbatimModuleSyntax` on → `import type { Resource }` for the i18next type. JSON imports resolve via Vite's `resolveJsonModule` (implied by `moduleResolution: "bundler"`) — no extra tsconfig flag needed.

### Theme (dark mode)

- `ThemeProvider` + `useTheme()` in `src/context/theme/theme-provider.tsx` — standard shadcn context provider. State: `"dark" | "light" | "system"`. Applies via `classList.add/remove` on `document.documentElement`. Persists to `localStorage` key `ih_theme` (default) — but `main.tsx` mounts with `defaultTheme="dark" storageKey="vite-ui-theme"` (override defaults). The `storageKey` prop controls the persisted key name.
- Wired in `src/main.tsx` provider stack (outer→inner): `QueryClientProvider` → `ThemeProvider` → `AuthProvider` → `RouterProvider`. Theme is outermost (no deps on query/auth) — theme persists across all screens + survives auth state changes.
- `<ModeToggle />` in `src/components/mode-toggle.tsx` — shadcn `DropdownMenu` + `Button` (`variant="outline" size="icon"`) + `lucide-react` `Sun`/`Moon` (animated swap via `dark:` variants). Menu: Light / Dark / System. Labels i18n'd via `t("theme.toggle")` / `t("theme.light")` / `t("theme.dark")` / `t("theme.system")`.
- Lives in `src/components/` (custom, not shadcn-only — mirrors `language-switcher.tsx`). Reads theme via `useTheme()` from `#/context/theme/theme-provider` (NOT `@/components/theme-provider` — moved).
- Grouped with `<LanguageSwitcher />` in the `_public.tsx` public layout header (gap-2, flex row). Same pattern will apply to future `_authenticated.tsx` protected layout.
- **Dark mode automatic** at CSS level — `@custom-variant dark` already in `styles.css`; components use shadcn tokens (`bg-background`, `text-foreground`). Never write raw `dark:` hardcoded variants in custom components — use tokens.

### Routing & routes

- File-based via TanStack Router. New route = new file `src/routes/<path>.tsx` using `createFileRoute("/path")({ component })`. Route tree regenerates automatically on dev/build (`@tanstack/router-plugin` in `vite.config.ts` with `autoCodeSplitting: true` — `/login` ships as its own chunk).
- After adding a route, `routeTree.gen.ts` updates on next dev/build. For manual regen: `npm run generate-routes` (`tsr generate`). **Never hand-edit `routeTree.gen.ts`** (biome.json ignores it).
- Public routes (login) live under `_public.tsx` pathless layout (header + `<LanguageSwitcher />` + `<Outlet />`). New public route = new file `src/routes/_public/<path>.tsx` using `createFileRoute("/_public/<path>")`. Public routes set no `beforeLoad`. Protected routes (future, sibling `_authenticated.tsx` layout) use `beforeLoad: ({ context }) => { if (!context.auth.isAuthenticated) throw redirect({ to: "/login" }) }`.
- Post-login navigation: `const navigate = useNavigate(); ... navigate({ to: "/" })`. No manual `window.location` — breaks SPA.

### Forms (react-hook-form + Zod)

- `react-hook-form` + `@hookform/resolvers/zod` + UI-side Zod schema. **shadcn `form` component is not in the radix-nova registry** — wire RHF directly with `useForm()` + shadcn `Input`/`Label`/`Button` (matches `ui/src/routes/login.tsx`).
- **UI Zod validation stays coarse** (presence + format). Backend Zod owns the authoritative rules (e.g. `Password` VO min/complexity). Don't duplicate backend rules in UI schemas — they drift. Show backend 400/401 `message` verbatim on server error.
- Server errors → local `useState<string | null>("serverError")` (not RHF `setError("root.serverError")` since shadcn form abstraction isn't installed) → render in a shadcn `Alert variant="destructive"` above the submit button. Reset to `null` on `onSuccess`.
- Branch on `ApiError`: `isNetworkError` → "Unable to reach the server"; `status === 401` → backend message (credentials); `status === 400` → backend message (validation); else fallback message.
- Submit button: `disabled={mutation.isPending}`, show `<Loader2 className="size-4 animate-spin" />` + label while pending.
- Password fields: prepend `type="password"` Input + toggle button with `lucide-react` `Eye`/`EyeOff` (absolute-positioned, `tabIndex={-1}` to skip keyboard nav) — mobile usability. Install lucide-react if missing (it's a default shadcn iconLibrary dep, already present).

### React Compiler

- **React Compiler is enabled** (`babel-plugin-react-compiler` 1.0.0) via `@vitejs/plugin-react`'s `reactCompilerPreset()` in `vite.config.ts` — applies to every component/hook automatically at build + dev time. No ESLint react-compiler plugin configured yet; the plugin does the work.
- **Do NOT hand-write `useMemo`/`useCallback`/`React.memo` for memoization.** The compiler auto-memoizes component bodies, hook return values, and context values. Manual memo is redundant noise — skip it unless you hit a measured perf problem the compiler can't handle (rare).
- Inline objects/arrays/classes passed to deps are fine — compiler re-memoizes them. Example: a `useForm` resolver rebuilt per render (e.g. i18n-driven Zod schema) re-renders correctly without `useMemo([t])`.
- Context providers: if you previously wrapped the context `value` object + setter callbacks in `useMemo`/`useCallback` (as `auth-context.tsx` once did), drop the wrappers — pass the plain object/functions. Compiler memoizes the object identity across renders when inputs don't change.

### Styling & responsiveness (desktop-first, full mobile)

- Desktop-first Tailwind classes; mobile works at all widths ≥320px. **Use `min-h-svh` not `min-h-screen`** — `svh` (small viewport height) avoids mobile URL-bar resize jump. Common auth/form wrapper:
  ```tsx
  <div className="bg-background flex min-h-svh items-center justify-center p-4 md:p-8">
    <Card className="w-full max-w-sm md:max-w-md"> ... </Card>
  </div>
  ```
- `Card` sets max-width (`max-w-sm md:max-w-md`); inside, inputs/buttons are `w-full`. **No fixed widths on inputs** — card constrains. Prevents horizontal scroll on mobile.
- Type scale: title `text-2xl md:text-3xl`, subtitle `text-sm md:text-base`. Touch targets ≥40px (shadcn defaults satisfy this).
- **Use shadcn tokens** (`bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `text-destructive`, `focus-visible:ring-ring`). **Dark mode automatic** — `@custom-variant dark` already in `styles.css`; never write raw hex/arbitrary colors or `dark:` hardcoded variants.
- Field error text: `<p className="text-destructive text-xs">...</p>` + `aria-invalid` on the input.
- **No `<br />` for line breaks between text strings.** Each distinct text string lives in its own element (`<p>`, `<span>`, `<div>`) — the layout/spacing is owned by the parent flex/grid + `space-y-*`/`gap-*`, not by inline break tags.
- **Do not reuse existing element class names as styling hooks for adjacent/child content.** Each element owns its own className; never piggyback on a sibling's container class to position another element (e.g. nesting buttons inside a `text-center` div to "inherit" the alignment). Keep interactive elements in their own well-named containers.
- No custom CSS, no `styles.css` edits for components.

### Adding shadcn components

```bash
cd ui
npx shadcn@latest add <component>     # or use the shadcn MCP
```
- Lands in `src/components/ui/`. `$schema`-checked against `components.json` (style `radix-nova`, baseColor `neutral`, cssVariables, iconLibrary `lucide`).
- **shadcn files ship single-quote + 2-space + no-semicolons** (template defaults) — they violate Biome (tab indent, double quotes, semicolons). After `add`, run `npx biome check --write` to normalize. shadcn `form` is not in the radix-nova registry — wire RHF manually (see login.tsx).
- Aliases: **`@/*` for shadcn-generated** (matches `components.json` `aliases`); **`#/*` for app code** (package.json `imports` map). Both resolve to `./src/*` per `tsconfig.json`'.
- `src/lib/utils.ts` `cn()` already present from template.

### Env & dev server

- `ui/.env` (gitignored) holds `VITE_API_URL=http://localhost:3000` (backend API). Copy `ui/.env.example`. Only `VITE_`-prefixed vars exposed to client; `src/lib/envs.ts` validates via Zod at import time (throws at boot if missing) — mirrors backend `infra/envs.ts`. Import `envs` and read `envs.VITE_API_URL`.
- **UI dev port must match backend `UI_URL`**. Currently UI runs on 5173 (Vite default, `vite dev` no port flag) and backend `.env` sets `UI_URL=http://localhost:5173` for CORS allowlist — cookies work with zero backend config. If you change the UI port, update backend `.env` `UI_URL` to match or cookies break.
- Backend API on port 3000 (`PORT=3000`, `npm run dev:api` from `backend/`).

### TypeScript quirks (stricter than backend)

- `verbatimModuleSyntax: true` → **`import type` for all type-only imports** (`import type { AuthUser }`, `import type { ReactNode } from "react"`). Biome `useImportType` rule auto-fixes; run `npx biome check --write` after pulling in raw libs.
- `noUnusedLocals` + `noUnusedParameters` + `noUncheckedSideEffectImports` on. Remove dead imports (e.g. deleted `src/router.tsx` template file).
- `allowImportingTsExtensions: true` (allowed, not required — relative imports use no extension, e.g. `./routeTree.gen`).
- `moduleResolution: "bundler"` — no `.js` extensions in relative imports.

### Verification order after UI work (run inside `ui/`)

```bash
npm run generate-routes   # regen routeTree.gen.ts after adding/changing routes
npx tsc --noEmit          # typecheck (verbatimModuleSyntax strict — catches import type misses)
npm run lint             # biome lint
npm run check            # biome check (lint + format + organize imports)
npx biome check --write  # auto-fix shadcn file formatting/import-order after `shadcn add`
npm run build            # vite build → dist/ (route tree regenerates, type errors surface here too)
npm run dev              # manual smoke, port 5173
```
No `type:check` script — `tsc --noEmit` is implied by `build`; run it explicitly for faster iteration.

**Manual auth smoke (both processes running):**
- `backend/`: `npm run dev:api` (port 3000)
- `ui/`: `npm run dev` (port 5173)
- Login at `/login` with a seeded backend user → verify `ih_session` cookie in browser devtools (Application → Cookies, httpOnly), `localStorage` key `ih_user`, redirect to `/`.

### Tests (Vitest + Testing Library, configured but no specs yet)

- `vitest run` + jsdom + `@testing-library/react` configured in `ui/package.json` (`"test": "vitest run"`). `vitest.config.ts` is Vite's default — no separate config.
- Pattern for component specs: **mock `#/lib/api`** (`vi.mock("#/lib/api/auth", ...)`) — never hit the network. Assert: form validation errors on empty submit, mutation called with right args, `onSuccess` → `setUser` + `navigate` invoked, 401 → destructive `Alert` shown.
- Mock TanStack Router hooks (`useNavigate`) via `vi.mock("@tanstack/react-router", ...)` or render inside a `createMemoryRouter` test harness.

- **Backend:** Vitest unit + e2e suites green. Biome lint/format configured. Cookie-based auth shipped.
- **API routes implemented:** `POST /organizations`, `POST/GET/PATCH/DELETE /users`, `POST/GET/PATCH/DELETE /projects`, `POST/GET/PUT/PATCH/DELETE /projects/:projectId/services` + `GET /services/:serviceId/health-checks` + `GET /services/:serviceId/incidents`, `POST /auth/login`, `POST /auth/logout`, `POST /password/forgot`, `POST /password/reset`.
- **Pagination:** `GET /users` (composite normalizedName+id asc), `GET /services/:id/health-checks` (id desc), `GET /services/:id/incidents` (id desc).
- **Workers:** BullMQ consumers (healthcheck + notification) with DLQs, Redis locking, graceful shutdown.
- **Crons:** `clear-test-schemas.ts` for test cleanup.
- **ui/:** TanStack Router scaffold + shadcn/Tailwind wiring. Login screen implemented (see "UI — building a screen"): TanStack Query data layer, `AuthProvider` + localStorage persistence, `apiFetch` wrapper with `credentials: "include"`, `/login` route with RHF + Zod. Dev port now 5173 (Vite default). No protected routes / guards yet.
- **No CI configured** (Biome + tests run locally).
