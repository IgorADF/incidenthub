import { DefaultEntity } from "./_default";
import { Prisma } from "../db/generated/client";
import { uuidv7 } from "uuidv7";

interface IOrganization {
  id: string;
  name: string;
  createdAt: Date;
}

export class Organization extends DefaultEntity<IOrganization> {
  static create(props: Omit<IOrganization, "id" | "createdAt">) {
    return new Organization({
      id: uuidv7(),
      name: props.name,
      createdAt: new Date(),
    });
  }

  static fromEntityToPrisma(
    entity: Organization,
  ): Prisma.OrganizationGetPayload<object> {
    return {
      id: entity.getProps().id,
      name: entity.getProps().name,
      createdAt: entity.getProps().createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.OrganizationGetPayload<object>,
  ): Organization {
    return new Organization({
      id: prismaEntity.id,
      name: prismaEntity.name,
      createdAt: prismaEntity.createdAt,
    });
  }
}
