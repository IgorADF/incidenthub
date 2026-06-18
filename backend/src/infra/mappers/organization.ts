import { Organization } from "@domain/entities/organization";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class OrganizationMapper {
  static fromEntityToPrisma(
    entity: Organization,
  ): Prisma.OrganizationGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.OrganizationGetPayload<object>,
  ): Organization {
    return Organization.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      name: prismaEntity.name,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
