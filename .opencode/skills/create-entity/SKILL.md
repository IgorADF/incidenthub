---
name: create-entity
description: Use when the user asks to create a new domain entity in the backend package, or when adding a new Prisma model that will be managed by an entity class. Covers entities, value object schemas, and Prisma model conventions.
---

# Creating a Domain Entity in IncidentHub

This project uses Clean Architecture with domain entities that manage their own identity, creation time, and validation. Every entity lives in `backend/src/domain/entities/` and mirrors a Prisma model in `backend/src/infra/db/schema.prisma`.

## Steps

1. **Add the Prisma model** to `backend/src/infra/db/schema.prisma`.
   - Use `@id` on the primary key, but **do not** use `@default(uuid())`.
   - Use `createdAt DateTime` but **do not** use `@default(now())`.
   - These values are generated and validated by the entity class, not the database.
   - Map fields with `@map("snake_case")` and the table with `@@map("table_name")`.

2. **Create value-object schemas** if the entity needs new identifiers or dates.
   - Existing value-objects live in `backend/src/domain/value-objects/`.
   - They are simple Zod branded schemas.
   - Example:
     ```ts
     export const UUIDv7 = z.string().uuid().brand<"UUIDv7">();
     export type UUIDv7 = z.infer<typeof UUIDv7>;
     ```

3. **Create the entity class** at `backend/src/domain/entities/<name>.ts`.
   - Extend `DefaultEntity<T>` from `./_default`.
   - Define a Zod schema for the full entity props (include `id` and `createdAt`).
   - Define a create-input schema by omitting generated fields.
   - Provide two static methods:
     - `create(props)` — accepts the create-input schema; assigns `UUIDv7.parse(uuidv7())` and `CreatedAt.parse(new Date())`.
     - `fromProps(props)` — for mappers to reconstruct persisted data.
   - Do **not** add Prisma conversion methods to the entity.

## Template

```ts
// backend/src/domain/entities/example.ts
import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { uuidv7 } from "uuidv7";

const ExampleSchema = z.object({
  id: UUIDv7,
  organizationId: UUIDv7,
  name: z.string().min(1).max(100),
  createdAt: CreatedAt,
});

const ExampleCreateSchema = ExampleSchema.omit({ id: true, createdAt: true });

type ExampleType = z.infer<typeof ExampleSchema>;

export class Example extends DefaultEntity<ExampleType> {
  static create(props: z.infer<typeof ExampleCreateSchema>) {
    return Example.fromProps({
      ...props,
      id: UUIDv7.parse(uuidv7()),
      createdAt: CreatedAt.parse(new Date()),
    });
  }

  static fromProps(props: ExampleType) {
    return new Example(props, ExampleSchema);
  }
}
```

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

## Special cases

- **Passwords** should be typed as `Password` from `backend\src\domain\value-objects\hashed-password.ts` and hashed outside the entity (use `hashPassword` from `@utils/password`).
- **Optional fields** in Prisma become `field: Type | null` in the entity interface; never use `undefined` in the interface.
- **Enums** from Prisma are cast via `z.enum([...])` inside the entity.
- **Cross-field validation** (e.g. `timeoutSeconds < intervalSeconds`) is done with `.refine()` on the entity schema.
- **Soft-delete fields** such as `deletedAt` should be carried in the mapper but are not part of the core domain interface unless required by business rules.

## Verification

After creating the entity and mapper, run `npx tsc --noEmit` in `backend/` and resolve any type errors against the generated Prisma client.
