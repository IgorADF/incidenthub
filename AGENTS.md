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

npm run tests              # vitest run (one-shot)
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
    value-objects/         ← Zod schemas: UUIDv7, CreatedAt
    errors/                ← domain-wide errors (e.g. ValidationEntitiesError)
    repositories/
      interfaces/          ← repository contracts + UOW interface
      in-memory/           ← fakes for testing
    services/              ← domain service interfaces (ports)
    use-cases/             ← business-logic classes
      errors/              ← use-case errors extending DefaultUseCasesError
      utils/tests/         ← use-case test helpers (createTestOrganization, etc.)
  infra/
    db/                    ← Prisma schema + generated client
    envs.ts                ← Zod env validation
    factories/             ← production wiring of use-cases + services
    mappers/               ← entity ↔ Prisma conversion
    queue/                 ← BullMQ queues
    redis:                 ← Redis connection
    repositories/prisma/   ← Prisma implementations
    services/              ← infra implementations of domain service interfaces (adapters)
  apps/
    api/                   ← Fastify server, routes, controllers
    worker/                ← background job processors
  types/                   ← shared types (TPrismaClient)
```

### Path aliases

`tsconfig.json` defines:

- `@domain/*` → `src/domain/*`
- `@infra/*` → `src/infra/*`
- `@apps/*` → `src/apps/*`
- `~types/*` → `src/types/*`

Use aliases for cross-layer imports. Use relative imports only within the same folder.

### Value-objects

- Reusable Zod schemas that validate primitives: `UUIDv7`, `CreatedAt`, `Email`, `URL`, `Slug`, `Password`.
- Example:
  ```ts
  export const Email = z.email();
  export type Email = z.infer<typeof Email>;
  ```
- Use the schema to parse values (`Email.parse(rawEmail)`), which validates and returns the typed value.
- IDs are typed with the `UUIDv7` schema; both primary keys and foreign keys use the same schema.

### Entities

- Every domain entity extends `DefaultEntity<T>`, stores frozen props, and exposes them via `getProps()`.
- Each entity defines a Zod schema for its full props and a create-input schema.
- `DefaultEntity` validates props against the schema in the constructor and throws `ValidationEntitiesError` on failure.
- Entities generate their own `id` (via `UUIDv7.parse(uuidv7())`) and `createdAt` (via `CreatedAt.parse(new Date())`).
- IDs are typed as `UUIDv7`; foreign keys also use `UUIDv7`; dates are `CreatedAt`.
- Entities provide:
  - `create(props)` — omitting generated fields and fields with defaults.
  - `fromProps(props)` — for mappers to reconstruct persisted data.
- When the full entity schema uses `.refine()`, the create-input type is a plain TypeScript type derived with `OmitDefaultValues` instead of a derived Zod schema, because refined schemas cannot be omitted:
  ```ts
  type ServiceType = z.infer<typeof ServiceSchema>;
  export type CreateServiceType = OmitDefaultValues<
    ServiceType,
    "status" | "consecutivesIncidentDetectionFails" | "enabled"
  >;
  ```
- Entities do **not** contain Prisma conversion methods. Mappers handle that.
- Prisma models for entity-managed tables do **not** use `@default(uuid())` or `@default(now())` for `id` / `createdAt`.

### Mappers

- Mappers live in `src/infra/mappers/` and convert between Prisma payloads and domain entities.
- Each mapper provides:
  - `fromEntityToPrisma(entity)` — maps the entity to the generated Prisma payload type.
  - `fromPrismaToEntity(prismaEntity)` — maps a Prisma record back to the entity.
- Mappers may call `Entity.fromProps(props)` to reconstruct persisted data. All other code uses `Entity.create(...)`.

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

- A use-case is a class whose constructor takes a `UOW` and any domain service interfaces it needs (e.g., `HashPasswordInterface`).
- The public method is usually `execute(...)`.
- Business rules (e.g. uniqueness checks) query `uow.repositories` directly.
- Outward-facing concerns (hashing, external APIs, email) are handled by injected domain services, never by importing infra directly.
- Build the entities first, then persist them inside `uow.transaction`.

### Domain services

- Domain service interfaces (ports) live in `src/domain/services/`.
- They declare operations the domain needs but does not implement (e.g., password hashing).
- Infra provides concrete adapters in `src/infra/services/`.
- Use-cases depend on the interface; factories inject the production adapter.

### Factories

- Production factories are in `infra/factories/<name>.usecase.ts`.
- They create a `PrismaUOW` from the singleton `prismaClient`, instantiate the required infra services, inject them into the use-case, and return `{ useCase }`.

### Errors

- Domain errors extend `DefaultUseCasesError` and expose `code` + `message`.
- `EntityAlreadyExists` also carries an optional `context: { entity?, field? }` so callers can identify what conflicted.
- `ValidationEntitiesError` lives in `domain/entities/errors/` and is thrown by `DefaultEntity` when schema validation fails.
- `ValidationEntitiesError` exposes `issues: { path: string; message: string }[]` so callers can react per field. The `message` is a human-readable concatenation of all issues.

### Tests

- Unit tests use `IMUOW` — no database needed.
- Pattern: `new IMUOW()` in `beforeEach`, pass it to the use-case constructor, assert behavior.
- When a use-case depends on a domain service, instantiate a test double (e.g., `HashPasswordTestService`) and pass it to the constructor.
- Assert entity values through `.getProps()`, e.g. `result.organization.getProps().name`.
- See `src/domain/use-cases/create-organization.spec.ts` for the canonical example.

### Value-object tests

- Each value-object schema has a co-located `.spec.ts` file in `src/domain/value-objects/`.
- Tests exercise `.parse()` for valid inputs and `.safeParse()` for invalid inputs.
- Cover success boundaries (min/max lengths, valid formats) and failure cases (empty values, wrong types, malformed formats).
- Example:

  ```ts
  import { describe, it, expect } from "vitest";
  import { Email } from "./email";

  describe("Email value object", () => {
    it("should parse a valid email", () => {
      expect(Email.parse("admin@acme.com")).toBe("admin@acme.com");
    });

    it("should reject a string without @", () => {
      expect(Email.safeParse("not-an-email").success).toBe(false);
    });
  });
  ```

### Entity tests

- Each entity has a co-located `.spec.ts` file in `src/domain/entities/`.
- Test `Entity.create` validation directly — do not route entity-level assertions through use-case specs.
- Include boundary tests for every min/max constraint (e.g., exactly `min` accepted, `min - 1` rejected, exactly `max` accepted, `max + 1` rejected).
- Example:

  ```ts
  import { describe, it, expect } from "vitest";
  import { Organization } from "./organization";
  import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";

  describe("Organization entity", () => {
    it("should accept a name with exactly 50 characters", () => {
      expect(() => Organization.create({ name: "a".repeat(50) })).not.toThrow();
    });

    it("should reject a name longer than 50 characters", () => {
      expect(() => Organization.create({ name: "a".repeat(51) })).toThrow(
        ValidationEntitiesError,
      );
    });
  });
  ```

### Adding a new entity, repository, and use-case

The full workflow for adding a domain feature, with templates. Each step references the conventions described in the sections above.

#### 1. Prisma model

Add the model to `src/infra/db/schema.prisma`:
- Use `@id` on the primary key, but **do not** use `@default(uuid())`.
- Use `createdAt DateTime` but **do not** use `@default(now())`.
- These values are generated and validated by the entity class, not the database.
- Map fields with `@map("snake_case")` and the table with `@@map("table_name")`.

#### 2. Value-objects

Create new value-object schemas in `src/domain/value-objects/` only if the entity needs new domain primitives that do not exist yet. Reuse `UUIDv7` and `CreatedAt` for ids and timestamps; do not recreate them.

```ts
export const Email = z.email();
export type Email = z.infer<typeof Email>;
```

#### 3. Entity

Create the entity class in `src/domain/entities/<name>.ts`:
- Extend `DefaultEntity<T>` from `./_default`.
- Define a Zod schema for the full entity props (include `id` and `createdAt`).
- Define a create-input type by omitting generated fields.
- Provide `create(props)` and `fromProps(props)` static methods.
- Do **not** add Prisma conversion methods to the entity.

```ts
// backend/src/domain/entities/example.ts
import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { OmitDefaultValues } from "~types/omit-default-values";

const ExampleSchema = z.object({
  id: UUIDv7,
  organizationId: UUIDv7,
  name: z.string().min(1).max(100),
  createdAt: CreatedAt,
});

type ExampleType = z.infer<typeof ExampleSchema>;

export type CreateExampleType = OmitDefaultValues<ExampleType>;

export class Example extends DefaultEntity<ExampleType> {
  static create(props: CreateExampleType) {
    return Example.fromProps({
      ...props,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: ExampleType) {
    return new Example(props, ExampleSchema);
  }
}
```

Entity special cases:
- **Passwords** are typed as `Password` from `@domain/value-objects/password` and hashed outside the entity by a domain service implementing `HashPasswordInterface`; never hash directly with bcrypt in a use-case.
- **Optional fields** in Prisma become `field: Type | null` in the entity interface; never use `undefined`.
- **Enums** from Prisma are cast via `z.enum([...])` inside the entity.
- **Cross-field validation** (e.g. `timeoutSeconds < intervalSeconds`) is done with `.refine()` on the entity schema. When the schema uses `.refine()`, the create-input type is a plain TypeScript type derived with `OmitDefaultValues` instead of a derived Zod schema (refined schemas cannot be omitted).
- **Soft-delete fields** such as `deletedAt` are carried in the mapper but are not part of the core domain interface unless required by business rules.

#### 4. Entity spec

Create the spec in `src/domain/entities/<name>.spec.ts` following the entity test conventions above (boundary tests for every min/max constraint, test `Entity.create` directly).

#### 5. Mapper

Create the mapper in `src/infra/mappers/<name>.ts`:

```ts
// backend/src/infra/mappers/example.ts
import { Example } from "@domain/entities/example";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class ExampleMapper {
  static fromEntityToPrisma(entity: Example): Prisma.ExampleGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ExampleGetPayload<object>,
  ): Example {
    return Example.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      organizationId: UUIDv7.parse(prismaEntity.organizationId),
      name: prismaEntity.name,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
```

#### 6. Repository interface

Create the interface in `domain/repositories/interfaces/<plural>.ts`:
- Import the entity from `@domain/entities/<name>`.
- Return `Entity | null` for lookups and `Entity` for writes.

```ts
// backend/src/domain/repositories/interfaces/examples.ts
import { Example } from "@domain/entities/example";

export interface ExamplesRepInterface {
  getById: (id: string) => Promise<Example | null>;
  getByName: (name: string) => Promise<Example | null>;
  create: (data: Example) => Promise<Example>;
}
```

#### 7. Prisma repository implementation

Implement in `infra/repositories/prisma/<plural>.ts`:
- Import `TPrismaClient` from `@infra/db/prisma-client`.
- Accept `TPrismaClient` in the constructor so the repo works inside and outside transactions.
- Convert results with `<Entity>Mapper.fromPrismaToEntity` and writes with `<Entity>Mapper.fromEntityToPrisma`.

```ts
// backend/src/infra/repositories/prisma/examples.ts
import { Example } from "@domain/entities/example";
import { TPrismaClient } from "@infra/db/prisma-client";
import { ExamplesRepInterface } from "@domain/repositories/interfaces/examples";
import { ExampleMapper } from "@infra/mappers/example";

export class PrismaExamplesRep implements ExamplesRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.example.findUnique({ where: { id } });
    return record ? ExampleMapper.fromPrismaToEntity(record) : null;
  }

  async getByName(name: string) {
    const record = await this.prisma.example.findUnique({ where: { name } });
    return record ? ExampleMapper.fromPrismaToEntity(record) : null;
  }

  async create(data: Example) {
    const record = await this.prisma.example.create({
      data: ExampleMapper.fromEntityToPrisma(data),
    });
    return ExampleMapper.fromPrismaToEntity(record);
  }
}
```

#### 8. In-memory repository implementation

Implement in `domain/repositories/in-memory/<plural>.ts`:
- Accept `IMUOWdb` from `./_uow`.
- Store and query entity instances directly in the corresponding db array.
- Compare IDs with `entity.getProps().id`.

```ts
// backend/src/domain/repositories/in-memory/examples.ts
import { Example } from "@domain/entities/example";
import { ExamplesRepInterface } from "@domain/repositories/interfaces/examples";
import { IMUOWdb } from "./_uow";

export class IMExamplesRep implements ExamplesRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.examples.find((e) => e.getProps().id === id);
    return record ?? null;
  }

  async getByName(name: string) {
    const record = this.db.examples.find((e) => e.getProps().name === name);
    return record ?? null;
  }

  async create(data: Example) {
    this.db.examples.push(data);
    return data;
  }
}
```

#### 9. UOW registration

Register the repository in three places:

`domain/repositories/interfaces/_uow.ts`:

```ts
import { ExamplesRepInterface } from "./examples";

export interface UOW {
  repositories: {
    examples: ExamplesRepInterface;
    // ...
  };

  transaction<T>(
    callback: (repositories: UOW["repositories"]) => Promise<T>,
  ): Promise<T>;
}
```

`infra/repositories/prisma/_uow.ts`:

```ts
import { PrismaExamplesRep } from "./examples";

private createRepositories(client: TPrismaClient) {
  return {
    examples: new PrismaExamplesRep(client),
    // ...
  };
}
```

`domain/repositories/in-memory/_uow.ts`:

```ts
import { Example } from "@domain/entities/example";
import { IMExamplesRep } from "./examples";

export type IMUOWdb = {
  examples: Example[];
  // ...
};

private createRepositories() {
  return {
    examples: new IMExamplesRep(this.db),
    // ...
  };
}
```

#### 10. Use-case

Create the use-case class in `src/domain/use-cases/<name>.ts`:
- Import `UOW` from `@domain/repositories/interfaces/_uow`.
- Import domain service interfaces (ports) from `@domain/services/<name>.interface` when the use-case needs hashing, external APIs, email, etc.
- Define an input type for the `execute` parameters.
- Query repositories for business-rule checks (authorization, uniqueness, limits).
- Throw domain errors from `use-cases/errors/` when rules are violated.
- Build entities, then persist them inside `this.uow.transaction(...)`.
- Do **not** validate format/range rules here; those live in the entity Zod schemas.
- Do **not** import infra directly; depend on domain service interfaces and let factories inject adapters.

```ts
// backend/src/domain/use-cases/create-example.ts
import { Example } from "@domain/entities/example";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { HashPasswordInterface } from "@domain/services/hash-password.interface";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

type CreateExampleInput = {
  name: string;
  password: string;
};

export class CreateExample {
  constructor(
    private readonly uow: UOW,
    private readonly hashPasswordService: HashPasswordInterface,
  ) {}

  async execute(creatorUserId: string, input: CreateExampleInput) {
    const creator = await this.uow.repositories.users.getById(creatorUserId);

    if (!creator || creator.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const existing = await this.uow.repositories.examples.getByName(input.name);

    if (existing) {
      throw new EntityAlreadyExists({ entity: "example", field: "name" });
    }

    const example = Example.create({
      organizationId: creator.getProps().organizationId,
      name: input.name,
      password: await this.hashPasswordService.hashPassword(input.password),
    });

    return await this.uow.transaction(async (reps) => {
      await reps.examples.create(example);
      return { example };
    });
  }
}
```

#### 11. Factory

Create the production factory in `infra/factories/<name>.usecase.ts`:
- Build a `PrismaUOW` from the singleton `prismaClient`.
- Instantiate the infra service adapters the use-case needs.
- Inject the adapters into the use-case and return `{ useCase }`.

```ts
// backend/src/infra/factories/create-example.usecase.ts
import { CreateExample } from "@domain/use-cases/create-example";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function createExampleFactory() {
  const uow = new PrismaUOW(prismaClient);
  const hashPasswordService = new HashPasswordService();
  const useCase = new CreateExample(uow, hashPasswordService);

  return { useCase };
}
```

#### 12. Use-case spec

Create the unit test in `src/domain/use-cases/<name>.spec.ts`:
- Use `IMUOW` and instantiate the use-case directly.
- When the use-case depends on a domain service, pass a test double to the constructor.
- Seed helper data with `createTestOrganization`, `createTestAdminUser`, `createTestDevUser`, and `createTestProject` from `@domain/use-cases/utils/tests/organization`, `@domain/use-cases/utils/tests/user`, and `@domain/use-cases/utils/tests/project`.
- Assert on `result.entity.getProps().field`.
- Assert errors by class instance.
- Keep entity-level validation (format, range, cross-field rules) in the entity spec; use-case specs test auth, uniqueness, limits, and wiring.

```ts
// backend/src/domain/use-cases/create-example.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CreateExample } from "./create-example";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
  createTestAdminUser,
  createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let hashPasswordTestService: HashPasswordTestService;
let sut: CreateExample;

describe("Create Example", () => {
  beforeEach(() => {
    uow = new IMUOW();
    hashPasswordTestService = new HashPasswordTestService();
    sut = new CreateExample(uow, hashPasswordTestService);
  });

  it("should create an example when creator is admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    const result = await sut.execute(admin.getProps().id, { name: "Foo", password: "secret" });

    expect(result.example.getProps()).toEqual(
      expect.objectContaining({
        name: "Foo",
        organizationId: organization.getProps().id,
      }),
    );
  });

  it("should throw NotAllowedError when creator is not admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, { name: "Foo", password: "secret" }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
```

#### Use-case conventions

- **Class naming:** convert the kebab-case file name to PascalCase, preserving every word boundary, e.g. `create-organization` → `CreateOrganization`, `authenticate-user` → `AuthenticateUser`, `create-user-to-organization` → `CreateUserToOrganization`.
- **Authorization:** always verify the actor exists and has permission before processing the input.
- **Uniqueness checks:** query repositories before building entities; throw `EntityAlreadyExists` with `{ entity, field }` context.
- **Transactions:** build entities outside the transaction, then pass them into `uow.transaction` for persistence.
- **Entity validation:** keep format/range/cross-field rules in the entity Zod schemas and test them in the entity spec; do not duplicate them in use-case specs.
- **Domain services:** depend on interfaces from `@domain/services/<name>.interface`; let factories inject infra adapters. Never import infra directly from a use-case.
- **Passwords:** never store plain text; hash with the injected `HashPasswordInterface` before passing to `User.create`.
- **Test factories:** prefer `createTestOrganization`, `createTestAdminUser`, `createTestDevUser`, and `createTestProject` over inline entity creation.

#### Verification

Run the new spec in isolation first:

```bash
npx vitest run src/domain/use-cases/<name>.spec.ts
```

Then run the full suite and type-check:

```bash
npx vitest run
npx tsc --noEmit
```

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
