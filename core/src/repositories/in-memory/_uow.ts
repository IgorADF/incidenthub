import { Organization } from "../../entities/organization";
import { Project } from "../../entities/project";
import { Service } from "../../entities/service";
import { User } from "../../entities/user";
import { UOW } from "../interfaces/_uow";
import { IMOrganizationsRep } from "./organizations";
import { IMProjectsRep } from "./projects";
import { IMServicesRep } from "./services";
import { IMUsersRep } from "./users";

export type IMUOWdb = {
  organizations: Organization[];
  projects: Project[];
  services: Service[];
  users: User[];
};

export class IMUOW implements UOW {
  private db: IMUOWdb = {
    organizations: [],
    projects: [],
    services: [],
    users: [],
  };

  constructor(readonly repositories = this.createRepositories()) {}

  private createRepositories() {
    return {
      organizations: new IMOrganizationsRep(this.db),
      projects: new IMProjectsRep(this.db),
      services: new IMServicesRep(this.db),
      users: new IMUsersRep(this.db),
    };
  }

  async transaction(
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) {
    return await callback(this.repositories);
  }
}
