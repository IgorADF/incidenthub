# API Routes for All Use-Cases — Design

## Context

IncidentHub's backend has 14 use-cases with factories, but only `POST /organizations` is exposed via Fastify. The API already has CORS, Swagger, and a Zod type provider wired in `apps/api/app.ts`. This design adds routes for all 11 applicable use-cases (excluding `ExecuteHealthCheck`, `ListAllDueServices`, and `RepopulateSchedules`, which are worker-only).

## Decisions

- **Authentication**: JWT in `Authorization: Bearer <token>` header, verified by a Fastify `preHandler` hook. The JWT payload encodes `{ userId, organizationId, type }`. `organizationId` is read from the token, not the URL.
- **Schema style**: Fastify `schema: { body, params, response }` declaration using Zod schemas. The `fastify-type-provider-zod` provider converts these to OpenAPI. The existing `POST /organizations` is refactored to match.
- **URL structure**: Nested REST resources scoped to the authenticated user's organization.
- **Error handling**: A global `setErrorHandler` maps domain errors to HTTP status codes. Route handlers no longer need per-route `try/catch`.
- **Token minting on login**: `POST /auth/login` calls `AuthenticateUser`, then signs a JWT with `JwtService` and returns `{ token, user }`. Token logic stays at the API boundary; the use-case remains pure domain.

## Shared Infrastructure

### Auth plugin — `apps/api/plugins/auth.ts`

- `authHook` preHandler: reads `Authorization: Bearer <token>`, verifies with `JwtService` using `envs.AUTH_JWT_SECRET`, decodes `{ userId, organizationId, type }`, attaches to `request.user`.
- Fastify `request.user` type augmentation via module declaration.
- On missing/invalid token → 401 `{ code: "UNAUTHORIZED", message: "..." }`.
- Used on protected routes via `{ preHandler: [authHook] }`.

### Global error handler — `apps/api/handlers/error.ts`

- Registered via `app.setErrorHandler` in `app.ts`.
- Mapping:

  | Domain error | HTTP |
  |---|---|
  | `EntityAlreadyExists` | 409 |
  | `NotAllowedError` | 403 |
  | `NotFoundError` | 404 |
  | `LimitExceededError` | 409 |
  | `InvalidCredentialError` | 401 |
  | Zod validation (thrown by compiler) | 400 |
  | Unknown | 500 |

  Response body: `{ code, message, context? }`.

## Route Table

| # | Use-case | Method | Path | Auth | Body schema |
|---|---|---|---|---|---|
| 1 | `CreateOrganization` (refactor) | POST | `/organizations` | Public | `CreateOrganizationInputSchema` |
| 2 | `AuthenticateUser` (+ mints JWT) | POST | `/auth/login` | Public | `AuthenticateUserInputSchema` |
| 3 | `ForgotPassword` | POST | `/password/forgot` | Public | `ForgotPasswordInputSchema` |
| 4 | `CreateProject` | POST | `/projects` | Bearer (ADMIN) | `CreateProjectInputSchema` |
| 5 | `ListProjectsByOrganization` | GET | `/projects` | Bearer | — |
| 6 | `CreateService` | POST | `/projects/:projectId/services` | Bearer | `CreateServiceInputSchema` |
| 7 | `ListServicesByProject` | GET | `/projects/:projectId/services` | Bearer | — |
| 8 | `UpdateService` | PUT | `/services/:serviceId` | Bearer | `UpdateServiceInputSchema` |
| 9 | `ToggleServiceEnabled` | PATCH | `/services/:serviceId/enabled` | Bearer | `z.object({ enable: boolean })` |
| 10 | `DeleteService` | DELETE | `/services/:serviceId` | Bearer | — |
| 11 | `CreateUserToOrganization` | POST | `/users` | Bearer (ADMIN) | `CreateUserToOrganizationInputSchema` |

`organizationId` for project routes comes from `request.user.organizationId` (JWT).

## File Organization

```
apps/api/
  app.ts                        ← add setErrorHandler registration
  plugins/
    auth.ts                     ← authHook + type augmentation
  handlers/
    error.ts                    ← global setErrorHandler (refill)
  routes/
    _init.ts                    ← registers all route plugins
    organizations.ts            ← POST /organizations (refactor)
    auth.ts                     ← POST /auth/login, POST /password/forgot
    projects.ts                 ← POST /projects, GET /projects
    project-services.ts         ← POST/GET /projects/:projectId/services
    services.ts                 ← PUT/PATCH/DELETE /services/:serviceId
    users.ts                    ← POST /users
```

Handlers stay inline in route files (no controller layer) — matches the existing pattern.

## Execution Order

1. Auth plugin + type augmentation (`plugins/auth.ts`).
2. Global error handler (`handlers/error.ts`) and register in `app.ts`.
3. Refactor `POST /organizations` to use `schema` declaration + rely on global handler.
4. `POST /auth/login` (mints JWT).
5. `POST /password/forgot`.
6. `POST /projects` + `GET /projects`.
7. `POST /projects/:projectId/services` + `GET /projects/:projectId/services`.
8. `PUT /services/:serviceId`, `PATCH /services/:serviceId/enabled`, `DELETE /services/:serviceId`.
9. `POST /users`.
10. Update `_init.ts` to register all new route plugins.
11. Verify: `npx tsc --noEmit` and `npx vitest run` (existing specs still pass).

## Out of Scope

- No new unit tests for routes (existing vitest scope is domain-level).
- No integration/HTTP tests.
- No CI changes.
- Worker-only use-cases (`ExecuteHealthCheck`, `ListAllDueServices`, `RepopulateSchedules`) are not exposed.