---
name: create-repository
description: Use when the user asks to create a new repository, data access layer, or persistence methods for an entity in the backend package. Covers interface, Prisma implementation, in-memory fake, mapper usage, and UOW registration.
---

# Creating a Repository in IncidentHub

Repositories abstract persistence for a single entity. Each repository has a contract, a Prisma implementation for production, and an in-memory fake for tests. Repositories accept and return entity instances; Prisma implementations convert via mappers.

## Steps

1. **Create the repository interface** at `backend/src/domain/repositories/interfaces/<plural>.ts`.
   - Import the entity from `@domain/entities/<name>`.
   - Expose methods the use-cases need (typically `getById`, `getBy<Field>`, `create`, etc.).
   - Return `Entity | null` for lookups and `Entity` for writes.

2. **Create the mapper** at `backend/src/infra/mappers/<name>.ts` if it does not exist yet.
   - See the `create-entity` skill for the mapper template.

3. **Implement for Prisma** at `backend/src/infra/repositories/prisma/<plural>.ts`.
   - Import `TPrismaClient` from `~types/prisma-client`.
   - Accept `TPrismaClient` in the constructor so the repo works inside and outside transactions.
   - Convert results with `<Entity>Mapper.fromPrismaToEntity` and writes with `<Entity>Mapper.fromEntityToPrisma`.

4. **Implement in-memory fake** at `backend/src/domain/repositories/in-memory/<plural>.ts`.
   - Accept `IMUOWdb` from `./_uow`.
   - Store and query entity instances directly in the corresponding db array.

5. **Register the repository in the UOW**:
   - `backend/src/domain/repositories/interfaces/_uow.ts` — add the interface to `repositories`.
   - `backend/src/infra/repositories/prisma/_uow.ts` — instantiate `Prisma<Name>Rep`.
   - `backend/src/domain/repositories/in-memory/_uow.ts` — add the array to `IMUOWdb` and instantiate `IM<Name>Rep`.

## Template

### Interface

```ts
// backend/src/domain/repositories/interfaces/examples.ts
import { Example } from "@domain/entities/example";

export interface ExamplesRepInterface {
  getById: (id: string) => Promise<Example | null>;
  getByName: (name: string) => Promise<Example | null>;
  create: (data: Example) => Promise<Example>;
}
```

### Mapper

```ts
// backend/src/infra/mappers/example.ts
import { Example } from "@domain/entities/example";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class ExampleMapper {
  static fromEntityToPrisma(
    entity: Example,
  ): Prisma.ExampleGetPayload<object> {
    return {
      id: entity.getProps().id.value,
      name: entity.getProps().name,
      createdAt: entity.getProps().createdAt.value,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ExampleGetPayload<object>,
  ): Example {
    return new Example({
      id: new UUIDv7(prismaEntity.id),
      name: prismaEntity.name,
      createdAt: new CreatedAt(prismaEntity.createdAt),
    });
  }
}
```

### Prisma implementation

```ts
// backend/src/infra/repositories/prisma/examples.ts
import { Example } from "@domain/entities/example";
import { TPrismaClient } from "~types/prisma-client";
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

### In-memory implementation

```ts
// backend/src/domain/repositories/in-memory/examples.ts
import { Example } from "@domain/entities/example";
import { ExamplesRepInterface } from "@domain/repositories/interfaces/examples";
import { IMUOWdb } from "./_uow";

export class IMExamplesRep implements ExamplesRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.examples.find((e) => e.getProps().id.value === id);
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

In `backend/src/domain/repositories/interfaces/_uow.ts`:

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

In `backend/src/infra/repositories/prisma/_uow.ts`:

```ts
import { PrismaExamplesRep } from "./examples";

private createRepositories(client: TPrismaClient) {
  return {
    examples: new PrismaExamplesRep(client),
    // ...
  };
}
```

In `backend/src/domain/repositories/in-memory/_uow.ts`:

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

## Verification

After wiring the repository, run `npx tsc --noEmit` in `backend/` and write a minimal in-memory spec to confirm reads and writes work.
