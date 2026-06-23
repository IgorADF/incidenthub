# API Routes for All Use-Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose 11 of 14 use-cases as Fastify HTTP routes with JWT auth, Zod schema declaration, a global error handler, and Swagger/OpenAPI integration.

**Architecture:** A `verifyJwt` preHandler hook decodes `{ userId, organizationId, type }` from the `Authorization: Bearer` token and attaches it to `request.user`. A global `setErrorHandler` maps domain errors to HTTP status codes so route handlers stay clean. Each route plugin uses Fastify's `schema: { body, params, response }` with Zod schemas so `fastify-type-provider-zod` generates rich OpenAPI docs. The `JwtInterface` is extended with `signAuth`/`verifyAuth` to mint session tokens at the API boundary.

**Tech Stack:** Fastify v5, `fastify-type-provider-zod` v6, `@fastify/cors`, `@fastify/swagger`, `@fastify/swagger-ui`, Zod v4, `jsonwebtoken`, TypeScript ES Modules.

## Global Constraints

- All commands run inside `backend/` directory.
- ES Modules only (`"type": "module"`); no `.js` extensions in relative imports.
- Path aliases: `@domain/*`, `@infra/*`, `@apps/*`, `~types/*`.
- Entities generate their own `id` (UUIDv7) and `createdAt`; Prisma models must not use `@default(uuid())`/`@default(now())`.
- Use-cases depend only on `UOW` and domain service interfaces; never import infra from a use-case.
- User type enum: `"ADMIN" | "DEV"`.
- JWT auth secret: `envs.AUTH_JWT_SECRET` (already validated as `z.string().min(16)` in `src/infra/envs.ts`).
- Domain errors all extend `DefaultUseCasesError` (exposes `code: string`, `message: string`).
- Zod v4 syntax: `z.string()`, `z.email()`, `z.url()`, `z.enum([...])`, `z.object(...)`, `.partial()`, `.safeParse()`.
- `JwtInterface` is implemented by `JwtService` (infra) and `JwtTestService` (domain test double). Both must be updated when the interface changes.
- No comments in code unless requested.

---

## File Structure

```
backend/src/
  domain/
    services/
      jwt.interface.ts        ← MODIFY: add signAuth/verifyAuth
      jwt.ts                  ← MODIFY: JwtTestService add signAuth/verifyAuth
  infra/
    services/
      jwt.ts                  ← MODIFY: JwtService add signAuth/verifyAuth
  apps/api/
    app.ts                    ← MODIFY: register errorHandler, update swagger metadata
    plugins/
      auth.ts                 ← CREATE: authHook + request.user type augmentation
    handlers/
      error.ts                ← REWRITE: global setErrorHandler
    routes/
      _init.ts                ← MODIFY: register all route plugins
      organizations.ts        ← REWRITE: use schema + rely on global handler
      auth.ts                 ← CREATE: POST /auth/login, POST /password/forgot
      projects.ts             ← CREATE: POST /projects, GET /projects
      project-services.ts     ← CREATE: POST/GET /projects/:projectId/services
      services.ts             ← CREATE: PUT/PATCH/DELETE /services/:serviceId
      users.ts                ← CREATE: POST /users
```

---

### Task 1: Extend JwtInterface with auth-token methods

**Files:**
- Modify: `backend/src/domain/services/jwt.interface.ts`
- Modify: `backend/src/infra/services/jwt.ts`
- Modify: `backend/src/domain/services/jwt.ts`

**Interfaces:**
- Produces: `JwtInterface.signAuth(input: JwtAuthSignInput): Promise<string>`, `JwtInterface.verifyAuth(token: string): Promise<JwtAuthVerifyResult>` where `JwtAuthSignInput = { userId: string; organizationId: string; type: "ADMIN" | "DEV" }` and `JwtAuthVerifyResult = { userId: string; organizationId: string; type: "ADMIN" | "DEV" }`.

- [ ] **Step 1: Rewrite `backend/src/domain/services/jwt.interface.ts`**

```ts
export interface JwtSignInput {
  sub: string;
}

export interface JwtVerifyResult {
  sub: string;
}

export interface JwtAuthSignInput {
  userId: string;
  organizationId: string;
  type: "ADMIN" | "DEV";
}

export interface JwtAuthVerifyResult {
  userId: string;
  organizationId: string;
  type: "ADMIN" | "DEV";
}

export interface JwtInterface {
  signForgotPassword: (input: JwtSignInput) => Promise<string>;
  verifyForgotPassword: (token: string) => Promise<JwtVerifyResult>;
  signAuth: (input: JwtAuthSignInput) => Promise<string>;
  verifyAuth: (token: string) => Promise<JwtAuthVerifyResult>;
}
```

- [ ] **Step 2: Update `backend/src/infra/services/jwt.ts` — add JWT_SECRET constant + signAuth/verifyAuth**

Replace the entire file with:

```ts
import jwt from "jsonwebtoken";
import {
  JwtInterface,
  JwtSignInput,
  JwtVerifyResult,
  JwtAuthSignInput,
  JwtAuthVerifyResult,
} from "@domain/services/jwt.interface";
import { envs } from "@infra/envs";

const FORGOT_PASSWORD_EXPIRES_IN_SECONDS = 60 * 10;
const AUTH_EXPIRES_IN_SECONDS = 60 * 60 * 24;

export class JwtService implements JwtInterface {
  async signForgotPassword(input: JwtSignInput) {
    return jwt.sign({ sub: input.sub }, envs.FORGOT_PASSWORD_JWT_SECRET, {
      expiresIn: FORGOT_PASSWORD_EXPIRES_IN_SECONDS,
    });
  }

  async verifyForgotPassword(token: string) {
    const payload = jwt.verify(
      token,
      envs.FORGOT_PASSWORD_JWT_SECRET,
    ) as jwt.JwtPayload;
    return { sub: payload.sub as string };
  }

  async signAuth(input: JwtAuthSignInput) {
    return jwt.sign(
      { userId: input.userId, organizationId: input.organizationId, type: input.type },
      envs.AUTH_JWT_SECRET,
      { expiresIn: AUTH_EXPIRES_IN_SECONDS },
    );
  }

  async verifyAuth(token: string) {
    const payload = jwt.verify(token, envs.AUTH_JWT_SECRET) as jwt.JwtPayload;
    return {
      userId: payload.userId as string,
      organizationId: payload.organizationId as string,
      type: payload.type as "ADMIN" | "DEV",
    };
  }
}
```

- [ ] **Step 3: Update `backend/src/domain/services/jwt.ts` — JwtTestService add signAuth/verifyAuth**

Replace the entire file with:

```ts
import {
  JwtInterface,
  JwtSignInput,
  JwtVerifyResult,
  JwtAuthSignInput,
  JwtAuthVerifyResult,
} from "./jwt.interface";

export class JwtTestService implements JwtInterface {
  private counter = 0;
  private tokens: { [token: string]: JwtVerifyResult | JwtAuthVerifyResult } = {};

  async signForgotPassword(input: JwtSignInput) {
    this.counter += 1;
    const token = `test-token-${this.counter}`;
    this.tokens[token] = { sub: input.sub };
    return token;
  }

  async verifyForgotPassword(token: string) {
    const payload = this.tokens[token] as JwtVerifyResult | undefined;
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }

  async signAuth(input: JwtAuthSignInput) {
    this.counter += 1;
    const token = `test-auth-token-${this.counter}`;
    this.tokens[token] = { ...input };
    return token;
  }

  async verifyAuth(token: string) {
    const payload = this.tokens[token] as JwtAuthVerifyResult | undefined;
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }
}
```

- [ ] **Step 4: Type-check and run tests**

Run from `backend/`:
```
npx tsc --noEmit
npx vitest run
```
Expected: `tsc` passes with zero errors (interface is fully implemented by both implementers). All existing specs pass (no behavioral change to existing forgot-password flow).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/services/jwt.interface.ts backend/src/infra/services/jwt.ts backend/src/domain/services/jwt.ts
git commit -m "feat(jwt): add signAuth/verifyAuth to JwtInterface and implementations"
```

---

### Task 2: Global error handler

**Files:**
- Rewrite: `backend/src/apps/api/handlers/error.ts`
- Modify: `backend/src/apps/api/app.ts` (register the handler)

**Interfaces:**
- Consumes: domain error classes from `@domain/use-cases/errors/*` (all extend `DefaultUseCasesError` with `code` and `message`).
- Produces: `errorHandler` export registered via `app.setErrorHandler` in `app.ts`.

- [ ] **Step 1: Rewrite `backend/src/apps/api/handlers/error.ts`**

```ts
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DefaultUseCasesError } from "@domain/use-cases/errors/_DefaultUseCasesError";
import { EntityAlreadyExists } from "@domain/use-cases/errors/EntityAlreadyExists";
import { NotAllowedError } from "@domain/use-cases/errors/NotAllowedError";
import { NotFoundError } from "@domain/use-cases/errors/NotFoundError";
import { LimitExceededError } from "@domain/use-cases/errors/LimitExceededError";
import { InvalidCredentialError } from "@domain/use-cases/errors/InvalidCredentialError";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  }

  if (error instanceof InvalidCredentialError) {
    return reply.status(401).send({ code: error.code, message: error.message });
  }

  if (error instanceof NotAllowedError) {
    return reply.status(403).send({ code: error.code, message: error.message });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({ code: error.code, message: error.message });
  }

  if (
    error instanceof EntityAlreadyExists ||
    error instanceof LimitExceededError
  ) {
    const body: Record<string, unknown> = {
      code: error.code,
      message: error.message,
    };
    if (error instanceof EntityAlreadyExists && error.context) {
      body.context = error.context;
    }
    return reply.status(409).send(body);
  }

  if (error instanceof DefaultUseCasesError) {
    return reply.status(400).send({ code: error.code, message: error.message });
  }

  request.log.error(error);
  return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
```

- [ ] **Step 2: Register the handler in `backend/src/apps/api/app.ts`**

Modify the `createApp` function in `backend/src/apps/api/app.ts`. Add the import at the top (after the swaggerUi import):

```ts
import { errorHandler } from "./handlers/error";
```

Then, immediately after `app.setSerializerCompiler(serializerCompiler);` (line 19), add:

```ts
  app.setErrorHandler(errorHandler);
```

Leave the rest of `app.ts` untouched for now (swagger metadata is updated in Task 9).

- [ ] **Step 3: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/apps/api/handlers/error.ts backend/src/apps/api/app.ts
git commit -m "feat(api): add global error handler mapping domain errors to HTTP statuses"
```

---

### Task 3: Auth plugin (`verifyJwt` hook + type augmentation)

**Files:**
- Create: `backend/src/apps/api/plugins/auth.ts`

**Interfaces:**
- Consumes: `JwtService.verifyAuth(token)` from Task 1.
- Produces: `authHook` (Fastify preHandler), `AuthUser` type, and module augmentation that adds `request.user: AuthUser | null`. Protected routes use `{ preHandler: [authHook] }`.

- [ ] **Step 1: Create `backend/src/apps/api/plugins/auth.ts`**

```ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { JwtService } from "@infra/services/jwt";

export type AuthUser = {
  userId: string;
  organizationId: string;
  type: "ADMIN" | "DEV";
};

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}

export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const jwtService = new JwtService();
    const payload = await jwtService.verifyAuth(token);
    request.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      type: payload.type,
    };
  } catch {
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/plugins/auth.ts
git commit -m "feat(api): add verifyJwt auth plugin with request.user type augmentation"
```

---

### Task 4: Refactor `POST /organizations` route to use schema + global handler

**Files:**
- Rewrite: `backend/src/apps/api/routes/organizations.ts`

**Interfaces:**
- Consumes: `createOrganizationFactory()` (already exists), `CreateOrganizationInputSchema` (already exported from `@domain/use-cases/create-organization`), global error handler from Task 2.
- Produces: `organizationRoutes` plugin with `POST /organizations` using `schema: { body, response }`. No per-route try/catch.

- [ ] **Step 1: Rewrite `backend/src/apps/api/routes/organizations.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createOrganizationFactory } from "@infra/factories/create-organization.usecase";
import { CreateOrganizationInputSchema } from "@domain/use-cases/create-organization";

export async function organizationRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/organizations",
    {
      schema: {
        body: CreateOrganizationInputSchema,
        response: {
          201: z.object({
            organization: z.object({
              id: z.string(),
              name: z.string(),
              createdAt: z.date(),
            }),
            user: z.object({
              id: z.string(),
              organizationId: z.string(),
              name: z.string(),
              email: z.string(),
              type: z.enum(["ADMIN", "DEV"]),
              createdAt: z.date(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createOrganizationFactory();
      const { organization, user } = await useCase.execute(request.body);

      const orgProps = organization.getProps();
      const userProps = user.getProps();

      return reply.status(201).send({
        organization: {
          id: orgProps.id,
          name: orgProps.name,
          createdAt: orgProps.createdAt,
        },
        user: {
          id: userProps.id,
          organizationId: userProps.organizationId,
          name: userProps.name,
          email: userProps.email,
          type: userProps.type,
          createdAt: userProps.createdAt,
        },
      });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/organizations.ts
git commit -m "refactor(api): use schema declaration + global handler for POST /organizations"
```

---

### Task 5: Auth routes — `POST /auth/login` (mints JWT) and `POST /password/forgot`

**Files:**
- Create: `backend/src/apps/api/routes/auth.ts`

**Interfaces:**
- Consumes: `authenticateUserFactory()`, `forgotPasswordFactory()` (both already exist), `AuthenticateUserInputSchema` and `ForgotPasswordInputSchema` (already exported), `JwtService.signAuth` from Task 1, `UserSchema` from `@domain/entities/user` (for the `type` enum shape).
- Produces: `authRoutes` plugin exposing two public routes.

- [ ] **Step 1: Create `backend/src/apps/api/routes/auth.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { authenticateUserFactory } from "@infra/factories/authenticate-user.usecase";
import { forgotPasswordFactory } from "@infra/factories/forgot-password.usecase";
import { AuthenticateUserInputSchema } from "@domain/use-cases/authenticate-user";
import { ForgotPasswordInputSchema } from "@domain/use-cases/forgot-password";
import { JwtService } from "@infra/services/jwt";

export async function authRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/auth/login",
    {
      schema: {
        body: AuthenticateUserInputSchema,
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              organizationId: z.string(),
              name: z.string(),
              email: z.string(),
              type: z.enum(["ADMIN", "DEV"]),
              createdAt: z.date(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = authenticateUserFactory();
      const { user } = await useCase.execute(request.body);
      const userProps = user.getProps();

      const jwtService = new JwtService();
      const token = await jwtService.signAuth({
        userId: userProps.id,
        organizationId: userProps.organizationId,
        type: userProps.type,
      });

      return reply.status(200).send({
        token,
        user: {
          id: userProps.id,
          organizationId: userProps.organizationId,
          name: userProps.name,
          email: userProps.email,
          type: userProps.type,
          createdAt: userProps.createdAt,
        },
      });
    },
  );

  app.post(
    "/password/forgot",
    {
      schema: {
        body: ForgotPasswordInputSchema,
        response: {
          200: z.object({ sent: z.boolean() }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = forgotPasswordFactory();
      await useCase.execute(request.body);
      return reply.status(200).send({ sent: true });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/auth.ts
git commit -m "feat(api): add POST /auth/login (mints JWT) and POST /password/forgot routes"
```

---

### Task 6: Project routes — `POST /projects` and `GET /projects`

**Files:**
- Create: `backend/src/apps/api/routes/projects.ts`

**Interfaces:**
- Consumes: `createProjectFactory()`, `listProjectsByOrganizationFactory()` (both exist); `CreateProjectInputSchema` (exported from `@domain/use-cases/create-project`); `authHook` from Task 3; `request.user` from Task 3.
- Produces: `projectRoutes` plugin. `POST /projects` requires admin (use-case enforces this); `GET /projects` scoped to the authenticated user's organization via `request.user.organizationId`.

- [ ] **Step 1: Create `backend/src/apps/api/routes/projects.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createProjectFactory } from "@infra/factories/create-project.usecase";
import { listProjectsByOrganizationFactory } from "@infra/factories/list-projects-by-organization.usecase";
import { CreateProjectInputSchema } from "@domain/use-cases/create-project";
import { authHook } from "../plugins/auth";

export async function projectRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/projects",
    {
      preHandler: [authHook],
      schema: {
        body: CreateProjectInputSchema,
        response: {
          201: z.object({
            id: z.string(),
            organizationId: z.string(),
            name: z.string(),
            showPublicPage: z.boolean(),
            publicPageSlug: z.string().nullable(),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createProjectFactory();
      const { project } = await useCase.execute(
        request.user!.userId,
        request.body,
      );
      const props = project.getProps();
      return reply.status(201).send({
        id: props.id,
        organizationId: props.organizationId,
        name: props.name,
        showPublicPage: props.showPublicPage,
        publicPageSlug: props.publicPageSlug,
        createdAt: props.createdAt,
      });
    },
  );

  app.get(
    "/projects",
    {
      preHandler: [authHook],
      schema: {
        response: {
          200: z.object({
            projects: z.array(
              z.object({
                id: z.string(),
                organizationId: z.string(),
                name: z.string(),
                showPublicPage: z.boolean(),
                publicPageSlug: z.string().nullable(),
                createdAt: z.date(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = listProjectsByOrganizationFactory();
      const { projects } = await useCase.execute(
        request.user!.organizationId,
      );
      return reply.status(200).send({
        projects: projects.map((p) => {
          const props = p.getProps();
          return {
            id: props.id,
            organizationId: props.organizationId,
            name: props.name,
            showPublicPage: props.showPublicPage,
            publicPageSlug: props.publicPageSlug,
            createdAt: props.createdAt,
          };
        }),
      });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/projects.ts
git commit -m "feat(api): add POST /projects and GET /projects routes with JWT auth"
```

---

### Task 7: Project-services routes — `POST /projects/:projectId/services` and `GET /projects/:projectId/services`

**Files:**
- Create: `backend/src/apps/api/routes/project-services.ts`

**Interfaces:**
- Consumes: `createServiceFactory()`, `listServicesByProjectFactory()` (both exist); `CreateServiceInputSchema` (exported from `@domain/use-cases/create-service`); `authHook` from Task 3; `request.user` from Task 3.
- Produces: `projectServiceRoutes` plugin. Two routes sharing the `:projectId` path param.

- [ ] **Step 1: Create `backend/src/apps/api/routes/project-services.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createServiceFactory } from "@infra/factories/create-service.usecase";
import { listServicesByProjectFactory } from "@infra/factories/list-services-by-project.usecase";
import { CreateServiceInputSchema } from "@domain/use-cases/create-service";
import { authHook } from "../plugins/auth";

const serviceResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  url: z.string(),
  intervalSeconds: z.number().int(),
  timeoutSeconds: z.number().int(),
  expectedResponseStatus: z.number().int(),
  incidentDetectionFails: z.number().int(),
  emailToAlert: z.array(z.string()),
  enabled: z.boolean(),
  currentIncidentId: z.string().nullable(),
  createdAt: z.date(),
});

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export async function projectServiceRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/projects/:projectId/services",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        body: CreateServiceInputSchema,
        response: { 201: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { useCase } = createServiceFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        projectId,
        request.body,
      );
      const props = service.getProps();
      return reply.status(201).send({
        id: props.id,
        projectId: props.projectId,
        name: props.name,
        url: props.url,
        intervalSeconds: props.intervalSeconds,
        timeoutSeconds: props.timeoutSeconds,
        expectedResponseStatus: props.expectedResponseStatus,
        incidentDetectionFails: props.incidentDetectionFails,
        emailToAlert: props.emailToAlert,
        enabled: props.enabled,
        currentIncidentId: props.currentIncidentId,
        createdAt: props.createdAt,
      });
    },
  );

  app.get(
    "/projects/:projectId/services",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        response: { 200: z.object({ services: z.array(serviceResponseSchema) }) },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { useCase } = listServicesByProjectFactory();
      const { services } = await useCase.execute(projectId);
      return reply.status(200).send({
        services: services.map((s) => {
          const props = s.getProps();
          return {
            id: props.id,
            projectId: props.projectId,
            name: props.name,
            url: props.url,
            intervalSeconds: props.intervalSeconds,
            timeoutSeconds: props.timeoutSeconds,
            expectedResponseStatus: props.expectedResponseStatus,
            incidentDetectionFails: props.incidentDetectionFails,
            emailToAlert: props.emailToAlert,
            enabled: props.enabled,
            currentIncidentId: props.currentIncidentId,
            createdAt: props.createdAt,
          };
        }),
      });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/project-services.ts
git commit -m "feat(api): add POST/GET /projects/:projectId/services routes"
```

---

### Task 8: Service routes — `PUT /services/:serviceId`, `PATCH /services/:serviceId/enabled`, `DELETE /services/:serviceId`

**Files:**
- Create: `backend/src/apps/api/routes/services.ts`

**Interfaces:**
- Consumes: `updateServiceFactory()`, `toggleServiceEnabledFactory()`, `deleteServiceFactory()` (all exist); `UpdateServiceInputSchema` (exported from `@domain/use-cases/update-service`); `authHook` from Task 3; `request.user` from Task 3.
- Produces: `serviceRoutes` plugin with three routes.

- [ ] **Step 1: Create `backend/src/apps/api/routes/services.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { updateServiceFactory } from "@infra/factories/update-service.usecase";
import { toggleServiceEnabledFactory } from "@infra/factories/toggle-service-enabled.usecase";
import { deleteServiceFactory } from "@infra/factories/delete-service.usecase";
import { UpdateServiceInputSchema } from "@domain/use-cases/update-service";
import { authHook } from "../plugins/auth";

const paramsSchema = z.object({
  serviceId: z.string().uuid(),
});

const serviceResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  url: z.string(),
  intervalSeconds: z.number().int(),
  timeoutSeconds: z.number().int(),
  expectedResponseStatus: z.number().int(),
  incidentDetectionFails: z.number().int(),
  emailToAlert: z.array(z.string()),
  enabled: z.boolean(),
  currentIncidentId: z.string().nullable(),
  createdAt: z.date(),
});

export async function serviceRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.put(
    "/services/:serviceId",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        body: UpdateServiceInputSchema,
        response: { 200: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params as { serviceId: string };
      const { useCase } = updateServiceFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        serviceId,
        request.body,
      );
      const props = service.getProps();
      return reply.status(200).send({
        id: props.id,
        projectId: props.projectId,
        name: props.name,
        url: props.url,
        intervalSeconds: props.intervalSeconds,
        timeoutSeconds: props.timeoutSeconds,
        expectedResponseStatus: props.expectedResponseStatus,
        incidentDetectionFails: props.incidentDetectionFails,
        emailToAlert: props.emailToAlert,
        enabled: props.enabled,
        currentIncidentId: props.currentIncidentId,
        createdAt: props.createdAt,
      });
    },
  );

  app.patch(
    "/services/:serviceId/enabled",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        body: z.object({ enable: z.boolean() }),
        response: { 200: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params as { serviceId: string };
      const body = request.body as { enable: boolean };
      const { useCase } = toggleServiceEnabledFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        serviceId,
        body.enable,
      );
      const props = service.getProps();
      return reply.status(200).send({
        id: props.id,
        projectId: props.projectId,
        name: props.name,
        url: props.url,
        intervalSeconds: props.intervalSeconds,
        timeoutSeconds: props.timeoutSeconds,
        expectedResponseStatus: props.expectedResponseStatus,
        incidentDetectionFails: props.incidentDetectionFails,
        emailToAlert: props.emailToAlert,
        enabled: props.enabled,
        currentIncidentId: props.currentIncidentId,
        createdAt: props.createdAt,
      });
    },
  );

  app.delete(
    "/services/:serviceId",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        response: { 200: z.object({ deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params as { serviceId: string };
      const { useCase } = deleteServiceFactory();
      const { deleted } = await useCase.execute(
        request.user!.userId,
        serviceId,
      );
      return reply.status(200).send({ deleted });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/services.ts
git commit -m "feat(api): add PUT/PATCH/DELETE /services/:serviceId routes"
```

---

### Task 9: Users route — `POST /users`

**Files:**
- Create: `backend/src/apps/api/routes/users.ts`

**Interfaces:**
- Consumes: `createUserToOrganizationFactory()` (exists); `CreateUserToOrganizationInputSchema` (exported from `@domain/use-cases/create-user-to-organization`); `authHook` from Task 3; `request.user` from Task 3.
- Produces: `userRoutes` plugin with `POST /users` (admin-only — enforced by the use-case).

- [ ] **Step 1: Create `backend/src/apps/api/routes/users.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createUserToOrganizationFactory } from "@infra/factories/create-user-to-organization.usecase";
import { CreateUserToOrganizationInputSchema } from "@domain/use-cases/create-user-to-organization";
import { authHook } from "../plugins/auth";

export async function userRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/users",
    {
      preHandler: [authHook],
      schema: {
        body: CreateUserToOrganizationInputSchema,
        response: {
          201: z.object({
            id: z.string(),
            organizationId: z.string(),
            name: z.string(),
            email: z.string(),
            type: z.enum(["ADMIN", "DEV"]),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createUserToOrganizationFactory();
      const { user } = await useCase.execute(
        request.user!.userId,
        request.body,
      );
      const props = user.getProps();
      return reply.status(201).send({
        id: props.id,
        organizationId: props.organizationId,
        name: props.name,
        email: props.email,
        type: props.type,
        createdAt: props.createdAt,
      });
    },
  );
}
```

- [ ] **Step 2: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/apps/api/routes/users.ts
git commit -m "feat(api): add POST /users route (admin-only via use-case)"
```

---

### Task 10: Wire all route plugins in `_init.ts` and update swagger metadata in `app.ts`

**Files:**
- Rewrite: `backend/src/apps/api/routes/_init.ts`
- Modify: `backend/src/apps/api/app.ts` (swagger `info` metadata)

**Interfaces:**
- Consumes: all route plugins from Tasks 4–9.
- Produces: a single Fastify `routes` plugin that registers all route plugins + the `GET /` health route.

- [ ] **Step 1: Rewrite `backend/src/apps/api/routes/_init.ts`**

```ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { organizationRoutes } from "./organizations";
import { authRoutes } from "./auth";
import { projectRoutes } from "./projects";
import { projectServiceRoutes } from "./project-services";
import { serviceRoutes } from "./services";
import { userRoutes } from "./users";

export async function routes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.get("/", async () => {
    return { message: "API is running!" };
  });

  await app.register(organizationRoutes);
  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(projectServiceRoutes);
  await app.register(serviceRoutes);
  await app.register(userRoutes);
}
```

- [ ] **Step 2: Update the swagger `info` metadata in `backend/src/apps/api/app.ts`**

In `backend/src/apps/api/app.ts`, replace the `info` object inside the `swagger` registration block (currently lines 24–28):

```ts
      info: {
        title: "Test swagger",
        description: "Testing the Fastify swagger API",
        version: "0.1.0",
      },
```

with:

```ts
      info: {
        title: "IncidentHub API",
        description: "Operational platform API for service health monitoring",
        version: "1.0.0",
      },
```

Do not change any other part of `app.ts`.

- [ ] **Step 3: Type-check**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/apps/api/routes/_init.ts backend/src/apps/api/app.ts
git commit -m "feat(api): wire all route plugins and update swagger metadata"
```

---

### Task 11: Full verification

**Files:** none

- [ ] **Step 1: Type-check the whole backend**

Run from `backend/`:
```
npx tsc --noEmit
```
Expected: passes with zero errors.

- [ ] **Step 2: Run the full test suite**

Run from `backend/`:
```
npx vitest run
```
Expected: all existing specs pass (no new specs were added; routes are integration-level and out of scope per the design).

- [ ] **Step 3: Smoke-test the server boots**

Run from `backend/`:
```
npm run dev:api
```
Expected: server starts on port 3000 (or `envs.PORT`) and logs `Server is running on port <port>`. Swagger UI is reachable at `http://localhost:<port>/documentation`. Stop the server with `Ctrl+C` once confirmed.

- [ ] **Step 4: Final commit (if any remaining changes)**

If steps 1–3 required no further edits, this step is a no-op. Otherwise:
```bash
git add -A
git commit -m "fix(api): post-verification adjustments"
```

---

## Verification Summary

| Spec section | Implementing task(s) |
|---|---|
| Auth plugin (verifyJwt + request.user) | Task 3 |
| Global error handler | Task 2 |
| POST /organizations (refactor) | Task 4 |
| POST /auth/login (mints JWT) | Task 5 |
| POST /password/forgot | Task 5 |
| POST /projects | Task 6 |
| GET /projects | Task 6 |
| POST /projects/:projectId/services | Task 7 |
| GET /projects/:projectId/services | Task 7 |
| PUT /services/:serviceId | Task 8 |
| PATCH /services/:serviceId/enabled | Task 8 |
| DELETE /services/:serviceId | Task 8 |
| POST /users | Task 9 |
| Route registration | Task 10 |
| Swagger metadata update | Task 10 |
| Precondition: JwtInterface.signAuth/verifyAuth | Task 1 |
| tsc --noEmit + vitest run pass | Task 11 |

All 11 routed use-cases are covered. The 3 excluded use-cases (`ExecuteHealthCheck`, `ListAllDueServices`, `RepopulateSchedules`) have no route and are untouched.