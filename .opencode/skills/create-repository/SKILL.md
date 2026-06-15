---
name: create-repository
description: Use when the user asks to create a new repository, data access layer, or persistence methods for an entity in the core package. Covers interface, Prisma implementation, in-memory fake, and UOW registration.
---

# Creating a Repository in IncidentHub

Repositories abstract persistence for a single entity. Each repository has a contract, a Prisma implementation for production, and an in-memory fake for tests. Repositories accept and return entity instances; Prisma implementations convert via the entity's static mapper methods.

## Steps

1. **Create the repository interface** at `core/src/repositories/interfaces/<plural>.ts`.
   - Import the entity from `../../entities/<name>`.
   - Expose methods the use-cases need (typically `getById`, `getBy<Field>`, `create`, etc.).
   - Return `Entity | null` for lookups and `Entity` for writes.

2. **Implement for Prisma** at `core/src/repositories/prisma/<plural>.ts`.
   - Import `TPrismaClient` from `../../types/prisma-client`.
   - Accept `TPrismaClient` in the constructor so the repo works inside and outside transactions.
   - Convert results with `Entity.fromPrismaToEntity` and writes with `Entity.fromEntityToPrisma`.

3. **Implement in-memory fake** at `core/src/repositories/in-memory/<plural>.ts`.
   - Accept `IMUOWdb` from `./_uow`.
   - Store and query entity instances directly in the corresponding db array.

4. **Register the repository in the UOW**:
   - `core/src/repositories/interfaces/_uow.ts` — add the interface to `repositories`.
   - `core/src/repositories/prisma/_uow.ts` — instantiate `Prisma<Name>Rep`.
   - `core/src/repositories/in-memory/_uow.ts` — add the array to `IMUOWdb` and instantiate `IM<Name>Rep`.

## Template

### Interface

```ts
import { Example } from "../../entities/example";

export interface ExamplesRepInterface {
  getById: (id: string) => Promise<Example | null>;
  getByName: (name: string) => Promise<Example | null>;
  create: (data: Example) => Promise<Example>;
}
```

### Prisma implementation

```ts
import { Example } from "../../entities/example";
import { TPrismaClient } from "../../types/prisma-client";
import { ExamplesRepInterface } from "../interfaces/examples";

export class PrismaExamplesRep implements ExamplesRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.example.findUnique({ where: { id } });
    return record ? Example.fromPrismaToEntity(record) : null;
  }

  async getByName(name: string) {
    const record = await this.prisma.example.findUnique({ where: { name } });
    return record ? Example.fromPrismaToEntity(record) : null;
  }

  async create(data: Example) {
    const record = await this.prisma.example.create({
      data: Example.fromEntityToPrisma(data),
    });
    return Example.fromPrismaToEntity(record);
  }
}
```

### In-memory implementation

```ts
import { Example } from "../../entities/example";
import { ExamplesRepInterface } from "../interfaces/examples";
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

## UOW registration snippets

In `interfaces/_uow.ts`:

```ts
import { ExamplesRepInterface } from "./examples";

export interface UOW {
  repositories: {
    examples: ExamplesRepInterface;
    // ...
  };
  // ...
}
```

In `prisma/_uow.ts`:

```ts
import { PrismaExamplesRep } from "./examples";

private createRepositories(client: TPrismaClient) {
  return {
    examples: new PrismaExamplesRep(client),
    // ...
  };
}
```

In `in-memory/_uow.ts`:

```ts
import { Example } from "../../entities/example";
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

## Verification

After wiring the repository, run `npx tsc --noEmit` in `core/` and write a minimal in-memory spec to confirm reads and writes work.
