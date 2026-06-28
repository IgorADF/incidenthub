import { Prisma } from "@infra/db/generated/client";
import { User, UserType, UserWithPassword, UserWithPasswordType } from "@domain/entities/user";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";



export class UserMapper {
  static fromEntityWithPasswordToPrisma(entity: UserWithPassword): Prisma.UserGetPayload<object> {
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

  static getPrismaToEntityProps(prismaEntity: Prisma.UserGetPayload<object> | Prisma.UserGetPayload<{ omit: { password: true } }>): UserType {
    return {
      id: UUIDv7.parse(prismaEntity.id),
      organizationId: UUIDv7.parse(prismaEntity.organizationId),
      name: prismaEntity.name,
      email: prismaEntity.email,
      type: prismaEntity.type,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    }
  }

  static fromPrismaToEntity(prismaEntity: Prisma.UserGetPayload<{ omit: { password: true } }>): User {
    const props = UserMapper.getPrismaToEntityProps(prismaEntity)
    return User.fromProps(props);
  }

  static fromPrismaToEntityWithPassword(prismaEntity: Prisma.UserGetPayload<object>): UserWithPassword {
    const props = UserMapper.getPrismaToEntityProps(prismaEntity)
    return UserWithPassword.fromProps({
      ...props,
      password: prismaEntity.password,
    });
  }
}
