import { PrismaClient } from "../../db/generated/client";
import { TPrismaClient } from "../../types/prisma-client";
import { UOW } from "../interfaces/_uow";
import { PrismaOrganizationsRep } from "./organizations";
import { PrismaUsersRep } from "./users";

export class PrismaUOW implements UOW {
  constructor(
    private readonly client: PrismaClient,
    readonly repositories = this.createRepositories(client),
  ) {}

  private createRepositories(client: TPrismaClient) {
    return {
      organizations: new PrismaOrganizationsRep(client),
      users: new PrismaUsersRep(client),
    };
  }

  async transaction(
    callback: (repositories: UOW["repositories"]) => Promise<any>,
  ) {
    return await this.client.$transaction(async (tx) => {
      const txRepositories = this.createRepositories(tx);
      return await callback(txRepositories);
    });
  }
}
