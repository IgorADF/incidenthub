import { Organization } from "@domain/entities/organization";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class OrganizationMapper {
  static fromEntityToPrisma(
    entity: Organization,
  ): Prisma.OrganizationGetPayload<object> {
    return {
      id: entity.getProps().id.value,
      name: entity.getProps().name,
      createdAt: entity.getProps().createdAt.value,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.OrganizationGetPayload<object>,
  ): Organization {
    return new Organization({
      id: new UUIDv7(prismaEntity.id),
      name: prismaEntity.name,
      createdAt: new CreatedAt(prismaEntity.createdAt),
    });
  }
}
