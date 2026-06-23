import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export class ListServicesByProject {
  constructor(private readonly uow: UOW) {}

  async execute(userId: string, projectId: string) {
    const user = await this.uow.repositories.users.getById(userId);

    if (!user) {
      throw new NotAllowedError();
    }

    const project = await this.uow.repositories.projects.getById(projectId);

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (
      project.getProps().organizationId !== user.getProps().organizationId
    ) {
      throw new NotAllowedError();
    }

    const services =
      await this.uow.repositories.services.getByProjectId(projectId);

    return { services };
  }
}
