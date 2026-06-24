import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export class ListServicesByProject {
  constructor(private readonly uow: UOW) {}

  async execute(userOrganizationId: string, projectId: string) {
    const project = await this.uow.repositories.projects.getById(projectId);

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.getProps().organizationId !== userOrganizationId) {
      throw new NotAllowedError();
    }

    const services =
      await this.uow.repositories.services.getByProjectId(projectId);

    return { services };
  }
}
