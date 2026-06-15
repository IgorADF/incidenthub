import { OrganizationsRepInterface } from "./organizations";
import { ProjectsRepInterface } from "./projects";
import { UsersRepInterface } from "./users";

export interface UOW {
  repositories: {
    organizations: OrganizationsRepInterface;
    projects: ProjectsRepInterface;
    users: UsersRepInterface;
  };

  transaction: (
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) => Promise<any>;
}
