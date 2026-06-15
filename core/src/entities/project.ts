import { DefaultEntity } from "./_default";
import { Prisma } from "../db/generated/client";
import { uuidv7 } from "uuidv7";

interface IProject {
  id: string;
  organizationId: string;
  name: string;
  showPublicPage: boolean;
  publicPageSlug: string | null;
  createdAt: Date;
}

export class Project extends DefaultEntity<IProject> {
  static create(props: Omit<IProject, "id" | "createdAt">) {
    return new Project({
      id: uuidv7(),
      organizationId: props.organizationId,
      name: props.name,
      showPublicPage: props.showPublicPage,
      publicPageSlug: props.publicPageSlug,
      createdAt: new Date(),
    });
  }

  static fromEntityToPrisma(
    entity: Project,
  ): Prisma.ProjectGetPayload<object> {
    return {
      id: entity.getProps().id,
      organizationId: entity.getProps().organizationId,
      name: entity.getProps().name,
      showPublicPage: entity.getProps().showPublicPage,
      publicPageSlug: entity.getProps().publicPageSlug,
      createdAt: entity.getProps().createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ProjectGetPayload<object>,
  ): Project {
    return new Project({
      id: prismaEntity.id,
      organizationId: prismaEntity.organizationId,
      name: prismaEntity.name,
      showPublicPage: prismaEntity.showPublicPage,
      publicPageSlug: prismaEntity.publicPageSlug,
      createdAt: prismaEntity.createdAt,
    });
  }
}
