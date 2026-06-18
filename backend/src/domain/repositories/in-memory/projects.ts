import { Project } from "@domain/entities/project";
import { ProjectsRepInterface } from "@domain/repositories/interfaces/projects";
import { IMUOWdb } from "./_uow";

export class IMProjectsRep implements ProjectsRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.projects.find((p) => p.getProps().id === id);
    return record ?? null;
  }

  async getByOrganizationId(organizationId: string) {
    return this.db.projects.filter(
      (p) => p.getProps().organizationId === organizationId,
    );
  }

  async getByPublicPageSlug(slug: string) {
    const record = this.db.projects.find(
      (p) => p.getProps().publicPageSlug === slug,
    );
    return record ?? null;
  }

  async create(data: Project) {
    this.db.projects.push(data);
    return data;
  }
}
