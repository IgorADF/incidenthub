import { PrismaClient } from "@infra/db/generated/client";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { TPrismaClient } from "@infra/db/prisma-client";
import { PrismaHealthChecksRep } from "./health-checks";
import { PrismaOrganizationsRep } from "./organizations";
import { PrismaProjectsRep } from "./projects";
import { PrismaServicesRep } from "./services";
import { PrismaUsersRep } from "./users";

export class PrismaUOW implements UOW {
  constructor(
    private readonly client: PrismaClient,
    readonly repositories = this.createRepositories(client),
  ) {}

  private createRepositories(client: TPrismaClient) {
    return {
      healthChecks: new PrismaHealthChecksRep(client),
      organizations: new PrismaOrganizationsRep(client),
      projects: new PrismaProjectsRep(client),
      services: new PrismaServicesRep(client),
      users: new PrismaUsersRep(client),
    };
  }

  async transaction<T>(
    callback: (repositories: UOW["repositories"]) => Promise<T>,
  ): Promise<T> {
    return await this.client.$transaction(async (tx) => {
      const txRepositories = this.createRepositories(tx);
      return await callback(txRepositories);
    });
  }
}
