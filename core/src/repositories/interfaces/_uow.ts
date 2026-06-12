import { OrganizationsRepInterface } from "./organizations";

export interface UOW {
  repositories: {
    organizations: OrganizationsRepInterface;
  };

  transaction: (
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) => Promise<any>;
}
