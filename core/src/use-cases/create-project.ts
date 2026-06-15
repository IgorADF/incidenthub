import { Project } from "../entities/project";
import { UOW } from "../repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

type CreateProjectInput = {
  name: string;
  showPublicPage?: boolean;
  publicPageSlug?: string;
};

export class Createproject {
  constructor(private readonly uow: UOW) {}

  async execute(creatorUserId: string, input: CreateProjectInput) {
    const creator = await this.uow.repositories.users.getById(creatorUserId);

    if (!creator || creator.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const projectWithSameName =
      await this.uow.repositories.projects.getByNameAndOrganizationId(
        input.name,
        creator.getProps().organizationId,
      );

    if (projectWithSameName) {
      throw new EntityAlreadyExists({
        entity: "project",
        field: "name",
      });
    }

    if (input.publicPageSlug) {
      const projectWithSameSlug =
        await this.uow.repositories.projects.getByPublicPageSlug(
          input.publicPageSlug,
        );

      if (projectWithSameSlug) {
        throw new EntityAlreadyExists({
          entity: "project",
          field: "publicPageSlug",
        });
      }
    }

    const project = Project.create({
      organizationId: creator.getProps().organizationId,
      name: input.name,
      showPublicPage: input.showPublicPage ?? false,
      publicPageSlug: input.publicPageSlug ?? null,
    });

    return await this.uow.transaction(async (reps) => {
      await reps.projects.create(project);
      return { project };
    });
  }
}
