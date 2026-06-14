import { DefaultEntity } from "./_default";
import { Prisma } from "../db/generated/client";
import { uuidv7 } from "uuidv7";

interface IUser {
  id: string;
  organizationId: string;
  email: string;
  password: string;
  type: "ADMIN" | "DEV";
  createdAt: Date;
}

export class User extends DefaultEntity<IUser> {
  static create(props: Omit<IUser, "id" | "createdAt">) {
    return new User({
      id: uuidv7(),
      organizationId: props.organizationId,
      email: props.email,
      password: props.password,
      type: props.type,
      createdAt: new Date(),
    });
  }

  static fromEntityToPrisma(
    entity: User,
  ): Prisma.UserGetPayload<object> {
    return {
      id: entity.getProps().id,
      organizationId: entity.getProps().organizationId,
      email: entity.getProps().email,
      password: entity.getProps().password,
      type: entity.getProps().type as Prisma.UserGetPayload<object>["type"],
      createdAt: entity.getProps().createdAt,
      deletedAt: null,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.UserGetPayload<object>,
  ): User {
    return new User({
      id: prismaEntity.id,
      organizationId: prismaEntity.organizationId,
      email: prismaEntity.email,
      password: prismaEntity.password,
      type: prismaEntity.type as "ADMIN" | "DEV",
      createdAt: prismaEntity.createdAt,
    });
  }
}
