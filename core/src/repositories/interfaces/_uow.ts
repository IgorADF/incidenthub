import { OrganizationsRepInterface } from "./organizations";
import { ProjectsRepInterface } from "./projects";
import { ServicesRepInterface } from "./services";
import { UsersRepInterface } from "./users";

export interface UOW {
  repositories: {
    organizations: OrganizationsRepInterface;
    projects: ProjectsRepInterface;
    services: ServicesRepInterface;
    users: UsersRepInterface;
  };

  transaction: (
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) => Promise<any>;
}
