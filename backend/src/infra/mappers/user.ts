import { HashedPassword } from "~types/hashed-password";
import { Prisma } from "@infra/db/generated/client";
import { User } from "@domain/entities/user";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class UserMapper {
  static fromEntityToPrisma(entity: User): Prisma.UserGetPayload<object> {
    return {
      id: entity.getProps().id.value,
      organizationId: entity.getProps().organizationId.value,
      email: entity.getProps().email,
      password: entity.getProps().password,
      type: entity.getProps().type as Prisma.UserGetPayload<object>["type"],
      createdAt: entity.getProps().createdAt.value,
    };
  }

  static fromPrismaToEntity(prismaEntity: Prisma.UserGetPayload<object>): User {
    return new User({
      id: new UUIDv7(prismaEntity.id),
      organizationId: new AssociationUUIDv7(prismaEntity.organizationId),
      email: prismaEntity.email,
      password: prismaEntity.password as HashedPassword,
      type: prismaEntity.type as "ADMIN" | "DEV",
      createdAt: new CreatedAt(prismaEntity.createdAt),
    });
  }
}
