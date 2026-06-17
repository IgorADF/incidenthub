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

  transaction<T>(
    callback: (repositories: UOW["repositories"]) => Promise<T>,
  ): Promise<T>;
}
