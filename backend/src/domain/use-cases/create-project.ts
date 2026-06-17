import { Project } from "@domain/entities/project";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";

const MAX_PROJECTS_PER_ORGANIZATION = 5;

type CreateProjectInput = {
  name: string;
  showPublicPage?: boolean;
  publicPageSlug?: string;
};

export class CreateProject {
  constructor(private readonly uow: UOW) {}

  async execute(creatorUserId: string, input: CreateProjectInput) {
    const creator = await this.uow.repositories.users.getById(creatorUserId);

    if (!creator || creator.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const organizationProjects =
      await this.uow.repositories.projects.getByOrganizationId(
        creator.getProps().organizationId.value,
      );

    const projectWithSameName = organizationProjects.find(
      (project) => project.getProps().name === input.name,
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

    if (organizationProjects.length >= MAX_PROJECTS_PER_ORGANIZATION) {
      throw new LimitExceededError(
        `Organization cannot have more than ${MAX_PROJECTS_PER_ORGANIZATION} projects`,
      );
    }

    const project = Project.create({
      organizationId: new AssociationUUIDv7(
        creator.getProps().organizationId.value,
      ),
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
