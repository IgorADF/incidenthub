import { Organization } from "../../types/entities";
import { UOW } from "../interfaces/_uow";
import { IMOrganizationsRep } from "./organizations";

export type IMUOWdb = {
  organizations: Organization[];
};

export class IMUOW implements UOW {
  private db: IMUOWdb = {
    organizations: [],
  };

  constructor(readonly repositories = this.createRepositories()) {}

  private createRepositories() {
    return {
      organizations: new IMOrganizationsRep(this.db),
    };
  }

  async transaction(
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) {
    return await callback(this.repositories);
  }
}
