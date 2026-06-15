import { UOW } from "../repositories/interfaces/_uow";

export class ListProjectsByOrganization {
  constructor(private readonly uow: UOW) {}

  async execute(organizationId: string) {
    const projects =
      await this.uow.repositories.projects.getByOrganizationId(organizationId);

    return { projects };
  }
}
