import { HealthCheck } from "@domain/entities/health-check";
import { Organization } from "@domain/entities/organization";
import { Project } from "@domain/entities/project";
import { Service } from "@domain/entities/service";
import { User } from "@domain/entities/user";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { IMHealthChecksRep } from "./health-checks";
import { IMOrganizationsRep } from "./organizations";
import { IMProjectsRep } from "./projects";
import { IMServicesRep } from "./services";
import { IMUsersRep } from "./users";

export type IMUOWdb = {
  healthChecks: HealthCheck[];
  organizations: Organization[];
  projects: Project[];
  services: Service[];
  users: User[];
};

export class IMUOW implements UOW {
  private db: IMUOWdb = {
    healthChecks: [],
    organizations: [],
    projects: [],
    services: [],
    users: [],
  };

  constructor(readonly repositories = this.createRepositories()) {}

  private createRepositories() {
    return {
      healthChecks: new IMHealthChecksRep(this.db),
      organizations: new IMOrganizationsRep(this.db),
      projects: new IMProjectsRep(this.db),
      services: new IMServicesRep(this.db),
      users: new IMUsersRep(this.db),
    };
  }

  async transaction<T>(
    callback: (repositories: UOW["repositories"]) => Promise<T>,
  ): Promise<T> {
    return await callback(this.repositories);
  }
}
