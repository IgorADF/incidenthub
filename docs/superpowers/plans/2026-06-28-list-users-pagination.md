# List Users Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only `GET /users` endpoint that lists users in the caller's organization with reusable cursor pagination.

**Architecture:** Add focused cursor pagination helpers under domain use-case utilities, extend the users repository with an organization-scoped paginated list method, add a `ListUsersByOrganization` use case, wire it through a factory and the existing `users` route plugin. Pagination uses keyset ordering by `name asc, id asc` and opaque base64url cursors.

**Tech Stack:** TypeScript, Zod v4, Fastify v5, Prisma, Vitest, existing UOW repository pattern.

## Global Constraints

- Run commands inside `backend/`.
- Use path aliases for cross-layer imports.
- Route schemas must use Fastify Zod `schema` fields, without manual route generics or casts.
- Domain use-cases must not import infra.
- User list responses must not expose `password`.
- Do not commit unless explicitly requested.

---

### Task 1: Reusable Cursor Pagination Helpers

**Files:**
- Create: `backend/src/domain/use-cases/utils/pagination.ts`
- Create: `backend/src/domain/use-cases/utils/pagination.spec.ts`

**Interfaces:**
- Produces: `CursorPaginationInputSchema`, `CursorPaginationInput`, `PaginationMetadataSchema`, `PaginationMetadata`, `createPaginationOutputSchema`, `encodeCursor`, `decodeCursor`, `normalizeCursorPaginationInput`.

- [ ] **Step 1: Write failing tests**

```ts
expect(CursorPaginationInputSchema.parse({})).toEqual({ limit: 20 });
expect(CursorPaginationInputSchema.parse({ limit: "2" })).toEqual({ limit: 2 });
const cursor = encodeCursor({ name: "Ana", id: "id-1" });
expect(decodeCursor(cursor)).toEqual({ name: "Ana", id: "id-1" });
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/domain/use-cases/utils/pagination.spec.ts`

- [ ] **Step 3: Implement helpers**

```ts
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const CursorPaginationInputSchema = z.object({ limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT), cursor: z.string().min(1).optional() });
export function encodeCursor(payload: Record<string, unknown>) { return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"); }
export function decodeCursor<T>(cursor: string): T { return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as T; }
```

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/domain/use-cases/utils/pagination.spec.ts`

---

### Task 2: Paginated User Repository and Use Case

**Files:**
- Create: `backend/src/domain/use-cases/list-users-by-organization.ts`
- Create: `backend/src/domain/use-cases/list-users-by-organization.spec.ts`
- Modify: `backend/src/domain/repositories/interfaces/users.ts`
- Modify: `backend/src/domain/repositories/in-memory/users.ts`
- Modify: `backend/src/infra/repositories/prisma/users.ts`
- Create: `backend/src/infra/factories/list-users-by-organization.usecase.ts`

**Interfaces:**
- Consumes: pagination helpers from Task 1.
- Produces: `ListUsersByOrganization`, `ListUsersByOrganizationOutputSchema`, and `users.listByOrganizationId(organizationId, pagination)`.

- [ ] **Step 1: Write failing use-case tests**

```ts
const result = await sut.execute(admin.getProps().id, { limit: 2 });
expect(result.users).toHaveLength(2);
expect(result.pagination.hasNextPage).toBe(true);
expect(result.pagination.nextCursor).toEqual(expect.any(String));
expect(result.users[0].name).toBe("Ana");
expect(result.users[0]).not.toHaveProperty("password");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/domain/use-cases/list-users-by-organization.spec.ts`

- [ ] **Step 3: Implement repository and use case**

```ts
const actor = await this.uow.repositories.users.getById(actorUserId);
if (!actor || actor.getProps().type !== "ADMIN") throw new NotAllowedError();
const result = await this.uow.repositories.users.listByOrganizationId(actor.getProps().organizationId, pagination);
return ListUsersByOrganizationOutputSchema.parse({ users: result.items.map((user) => user.getProps()), pagination: result.pagination });
```

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/domain/use-cases/list-users-by-organization.spec.ts`

---

### Task 3: API Route and E2E Coverage

**Files:**
- Modify: `backend/src/apps/api/routes/users.ts`
- Modify: `backend/src/apps/api/e2e/users.e2e.spec.ts`

**Interfaces:**
- Consumes: `ListUsersByOrganization` factory and schemas.
- Produces: `GET /users?limit=2&cursor=<opaque>`.

- [ ] **Step 1: Write failing E2E tests**

```ts
const first = await app.inject({ method: "GET", url: "/users?limit=2", headers: authHeader(admin.token) });
expect(first.statusCode).toBe(200);
expect(first.json().data.pagination.hasNextPage).toBe(true);
const second = await app.inject({ method: "GET", url: `/users?limit=2&cursor=${first.json().data.pagination.nextCursor}`, headers: authHeader(admin.token) });
expect(second.statusCode).toBe(200);
```

- [ ] **Step 2: Run E2E and verify RED**

Run: `npm run tests:e2e -- src/apps/api/e2e/users.e2e.spec.ts`

- [ ] **Step 3: Implement route**

```ts
app.get("/users", { preHandler: [authHook], schema: { querystring: CursorPaginationInputSchema, response: { 200: z.object({ data: ListUsersByOrganizationOutputSchema }) } } }, async (request, reply) => {
  const { useCase } = listUsersByOrganizationFactory(dbClient);
  const data = await useCase.execute(request.user!.userId, request.query);
  return reply.status(200).send({ data });
});
```

- [ ] **Step 4: Verify GREEN**

Run: `npm run tests:e2e -- src/apps/api/e2e/users.e2e.spec.ts`

---

### Task 4: Full Verification

**Files:**
- No new files.

**Interfaces:**
- Consumes all previous tasks.

- [ ] **Step 1: Run targeted unit tests**

Run: `npx vitest run src/domain/use-cases/utils/pagination.spec.ts src/domain/use-cases/list-users-by-organization.spec.ts`

- [ ] **Step 2: Run type-check**

Run: `npm run type:check`

- [ ] **Step 3: Run backend unit tests**

Run: `npm run tests`

- [ ] **Step 4: Run users e2e tests**

Run: `npm run tests:e2e -- src/apps/api/e2e/users.e2e.spec.ts`

## Self-Review

- Spec coverage: reusable cursor pagination, admin-only user list, organization scoping, route, tests, and no password exposure are covered.
- Placeholder scan: no `TBD` or deferred implementation instructions remain.
- Type consistency: repository and use-case interfaces consistently use cursor pagination input and metadata.
