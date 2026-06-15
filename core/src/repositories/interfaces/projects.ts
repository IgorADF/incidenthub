import { Project } from "../../entities/project";

export interface ProjectsRepInterface {
  getByOrganizationId: (organizationId: string) => Promise<Project[]>;
  create: (data: Project) => Promise<Project>;
}
