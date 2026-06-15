import { Project } from "../../entities/project";

export interface ProjectsRepInterface {
  getById: (id: string) => Promise<Project | null>;
  getByPublicPageSlug: (slug: string) => Promise<Project | null>;
  getByNameAndOrganizationId: (
    name: string,
    organizationId: string,
  ) => Promise<Project | null>;
  create: (data: Project) => Promise<Project>;
}
