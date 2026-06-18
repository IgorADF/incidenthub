---
name: create-use-case
description: Use when the user asks to create a new use-case, business operation, domain action, or use-case test in the backend package. Covers use-case class, factory, unit tests, and domain error conventions.
---

# Creating a Use-Case in IncidentHub

Use-cases encapsulate a single business operation. They receive a `UOW` via constructor, perform domain checks through repositories, build entities, and persist inside a transaction. Production wiring lives in a factory; behavior is verified with in-memory unit tests.

## Steps

1. **Create the use-case class** at `backend/src/domain/use-cases/<name>.ts`.
   - Import `UOW` from `@domain/repositories/interfaces/_uow`.
   - Define an input type for the `execute` parameters.
   - Query repositories for business-rule checks (authorization, uniqueness, limits).
   - Throw domain errors from `use-cases/errors/` when rules are violated.
   - Build entities, then persist them inside `this.uow.transaction(...)`.
   - Do **not** validate format/range rules here; those live in the entity Zod schemas.

2. **Create the production factory** at `backend/src/infra/factories/<name>.usecase.ts`.
   - Build a `PrismaUOW` from the singleton `prismaClient`.
   - Instantiate the use-case and return `{ useCase }`.

3. **Create unit tests** at `backend/src/domain/use-cases/<name>.spec.ts`.
   - Use `IMUOW` and instantiate the use-case directly.
   - Seed helper data with `createTestOrganization`, `createTestAdminUser`, `createTestDevUser`, and `createTestProject` from `@domain/use-cases/utils/tests/organization`, `@domain/use-cases/utils/tests/user`, and `@domain/use-cases/utils/tests/project`.
   - Assert on `result.entity.getProps().field`.
   - Assert errors by class instance.
   - Keep entity-level validation (format, range, cross-field rules) in the entity spec; use-case specs should test auth, uniqueness, limits, and wiring.

4. **Create or reuse domain errors** in `backend/src/domain/use-cases/errors/`.
   - Errors extend `DefaultUseCasesError` from `./_DefaultUseCasesError`.
   - Provide a `code` (class name) and a default message.

## Template

### Use-case

```ts
// backend/src/domain/use-cases/create-example.ts
import { Example } from "@domain/entities/example";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

type CreateExampleInput = {
  name: string;
};

export class CreateExample {
  constructor(private readonly uow: UOW) {}

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
    });

    return await this.uow.transaction(async (reps) => {
      await reps.examples.create(example);
      return { example };
    });
  }
}
```

### Factory

```ts
// backend/src/infra/factories/create-example.usecase.ts
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { CreateExample } from "@domain/use-cases/create-example";

export function createExampleFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateExample(uow);

  return { useCase };
}
```

### Unit test

```ts
// backend/src/domain/use-cases/create-example.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CreateExample } from "./create-example";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
  createTestAdminUser,
  createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: CreateExample;

describe("Create Example", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new CreateExample(uow);
  });

  it("should create an example when creator is admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    const result = await sut.execute(admin.getProps().id, { name: "Foo" });

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
      sut.execute(dev.getProps().id, { name: "Foo" }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
```

## Conventions

- **Class naming:** convert the kebab-case file name to PascalCase, preserving every word boundary, e.g. `create-organization` → `CreateOrganization`, `authenticate-user` → `AuthenticateUser`, and `create-user-to-organization` → `CreateUserToOrganization`.
- **Authorization:** always verify the actor exists and has permission before processing the input.
- **Uniqueness checks:** query repositories before building entities; throw `EntityAlreadyExists` with `{ entity, field }` context.
- **Transactions:** build entities outside the transaction, then pass them into `uow.transaction` for persistence.
- **Entity validation:** keep format/range/cross-field rules in the entity Zod schemas and test them in the entity spec; do not duplicate them in use-case specs.
- **Passwords:** never store plain text; hash with `hashPassword` from `@utils/password` before passing to `User.create`.
- **Test factories:** prefer `createTestOrganization`, `createTestAdminUser`, `createTestDevUser`, and `createTestProject` from `@domain/use-cases/utils/tests/organization`, `@domain/use-cases/utils/tests/user`, and `@domain/use-cases/utils/tests/project` over inline entity creation.

## Verification

Run the new spec in isolation first:

```bash
npx vitest run src/domain/use-cases/<name>.spec.ts
```

Then run the full suite and type-check:

```bash
npx vitest run
npx tsc --noEmit
```
