import { Prisma } from "@infra/db/generated/client";
import { User } from "@domain/entities/user";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class UserMapper {
  static fromEntityToPrisma(entity: User): Prisma.UserGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      organizationId: props.organizationId,
      email: props.email,
      password: props.password,
      type: props.type,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(prismaEntity: Prisma.UserGetPayload<object>): User {
    return User.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      organizationId: UUIDv7.parse(prismaEntity.organizationId),
      name: prismaEntity.name,
      email: prismaEntity.email,
      password: prismaEntity.password,
      type: prismaEntity.type,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
