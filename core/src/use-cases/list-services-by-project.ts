import { UOW } from "../repositories/interfaces/_uow";

export class ListServicesByProject {
  constructor(private readonly uow: UOW) {}

  async execute(projectId: string) {
    const services = await this.uow.repositories.services.getByProjectId(
      projectId,
    );

    return { services };
  }
}
