---
name: create-use-case
description: Use when the user asks to create a new use-case, business operation, domain action, or use-case test in the core package. Covers use-case class, factory, unit tests, and domain error conventions.
---

# Creating a Use-Case in IncidentHub

Use-cases encapsulate a single business operation. They receive a `UOW` via constructor, perform domain checks through repositories, build entities, and persist inside a transaction. Production wiring lives in a factory; behavior is verified with in-memory unit tests.

## Steps

1. **Create the use-case class** at `core/src/use-cases/<name>.ts`.
   - Import `UOW` from `../repositories/interfaces/_uow`.
   - Define an input type for the `execute` parameters.
   - Query repositories for business-rule checks.
   - Throw domain errors from `use-cases/errors/` when rules are violated.
   - Build entities, then persist them inside `this.uow.transaction(...)`.

2. **Create the production factory** at `core/src/use-cases/factories/<name>.ts`.
   - Build a `PrismaUOW` from the singleton `prismaClient`.
   - Instantiate the use-case and return `{ useCase }`.

3. **Create unit tests** at `core/src/use-cases/<name>.spec.ts`.
   - Use `IMUOW` and instantiate the use-case directly.
   - Seed helper data with `createOrganization`, `createAdminUser`, `createDevUser`, and `createUser` from `../utils/test-factories`.
   - Assert on `result.entity.getProps().field`.
   - Assert errors by class instance.

4. **Create or reuse domain errors** in `core/src/use-cases/errors/`.
   - Errors extend `DefaultError` from `./_DefaultError`.
   - Provide a `code` (class name) and a default message.

## Template

### Use-case

```ts
import { Example } from "../entities/example";
import { UOW } from "../repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

type CreateExampleInput = {
  name: string;
};

export class Createexample {
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
import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { Createexample } from "../create-example";

export function createExampleFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new Createexample(uow);

  return { useCase };
}
```

### Unit test

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { Createexample } from "./create-example";
import { IMUOW } from "../repositories/in-memory/_uow";
import {
  createAdminUser,
  createDevUser,
  createOrganization,
} from "../utils/test-factories";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: Createexample;

describe("Create Example", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createexample(uow);
  });

  it("should create an example when creator is admin", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    const result = await sut.execute(admin.getProps().id, { name: "Foo" });

    expect(result.example.getProps()).toEqual(
      expect.objectContaining({
        name: "Foo",
        organizationId: organization.getProps().id,
      }),
    );
  });

  it("should throw NotAllowedError when creator is not admin", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const dev = await createDevUser(uow, organization, "dev@acme.com");

    await expect(
      sut.execute(dev.getProps().id, { name: "Foo" }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
```

## Conventions

- **Class naming:** remove hyphens and capitalize the first letter, e.g. `create-organization` → `Createorganization`.
- **Authorization:** always verify the actor exists and has permission before processing the input.
- **Uniqueness checks:** query repositories before building entities; throw `EntityAlreadyExists` with `{ entity, field }` context.
- **Transactions:** build entities outside the transaction, then pass them into `uow.transaction` for persistence.
- **Passwords:** never store plain text; hash with `hashPassword` from `../utils/password` before passing to `User.create`.
- **Test factories:** prefer `createOrganization`, `createAdminUser`, and `createDevUser` from `../utils/test-factories` over inline entity creation.

## Verification

Run the new spec in isolation first:

```bash
npx vitest run src/use-cases/<name>.spec.ts
```

Then run the full suite and type-check:

```bash
npx vitest run
npx tsc --noEmit
```
