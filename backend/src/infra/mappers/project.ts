import { Project } from "@domain/entities/project";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class ProjectMapper {
  static fromEntityToPrisma(entity: Project): Prisma.ProjectGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      showPublicPage: props.showPublicPage,
      publicPageSlug: props.publicPageSlug,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ProjectGetPayload<object>,
  ): Project {
    return Project.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      organizationId: UUIDv7.parse(prismaEntity.organizationId),
      name: prismaEntity.name,
      showPublicPage: prismaEntity.showPublicPage,
      publicPageSlug: prismaEntity.publicPageSlug,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
