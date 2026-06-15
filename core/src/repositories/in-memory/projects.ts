import { Project } from "../../entities/project";
import { ProjectsRepInterface } from "../interfaces/projects";
import { IMUOWdb } from "./_uow";

export class IMProjectsRep implements ProjectsRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.projects.find((p) => p.getProps().id === id);
    return record ?? null;
  }

  async getByPublicPageSlug(slug: string) {
    const record = this.db.projects.find(
      (p) => p.getProps().publicPageSlug === slug,
    );
    return record ?? null;
  }

  async getByNameAndOrganizationId(name: string, organizationId: string) {
    const record = this.db.projects.find(
      (p) =>
        p.getProps().name === name &&
        p.getProps().organizationId === organizationId,
    );
    return record ?? null;
  }

  async create(data: Project) {
    this.db.projects.push(data);
    return data;
  }
}
