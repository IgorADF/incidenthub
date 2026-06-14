import { Organization } from "../../entities/organization";
import { User } from "../../entities/user";
import { UOW } from "../interfaces/_uow";
import { IMOrganizationsRep } from "./organizations";
import { IMUsersRep } from "./users";

export type IMUOWdb = {
  organizations: Organization[];
  users: User[];
};

export class IMUOW implements UOW {
  private db: IMUOWdb = {
    organizations: [],
    users: [],
  };

  constructor(readonly repositories = this.createRepositories()) {}

  private createRepositories() {
    return {
      organizations: new IMOrganizationsRep(this.db),
      users: new IMUsersRep(this.db),
    };
  }

  async transaction(
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) {
    return await callback(this.repositories);
  }
}
