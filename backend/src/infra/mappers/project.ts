import { Project } from "@domain/entities/project";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class ProjectMapper {
  static fromEntityToPrisma(entity: Project): Prisma.ProjectGetPayload<object> {
    return {
      id: entity.getProps().id.value,
      organizationId: entity.getProps().organizationId.value,
      name: entity.getProps().name,
      showPublicPage: entity.getProps().showPublicPage,
      publicPageSlug: entity.getProps().publicPageSlug,
      createdAt: entity.getProps().createdAt.value,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ProjectGetPayload<object>,
  ): Project {
    return new Project({
      id: new UUIDv7(prismaEntity.id),
      organizationId: new AssociationUUIDv7(prismaEntity.organizationId),
      name: prismaEntity.name,
      showPublicPage: prismaEntity.showPublicPage,
      publicPageSlug: prismaEntity.publicPageSlug,
      createdAt: new CreatedAt(prismaEntity.createdAt),
    });
  }
}
