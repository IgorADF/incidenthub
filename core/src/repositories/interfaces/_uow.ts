import { OrganizationsRepInterface } from "./organizations";
import { UsersRepInterface } from "./users";

export interface UOW {
  repositories: {
    organizations: OrganizationsRepInterface;
    users: UsersRepInterface;
  };

  transaction: (
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) => Promise<any>;
}
