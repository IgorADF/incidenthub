import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { MyPrismaClient, TPrismaClient } from "@infra/db/prisma-client";
import { PrismaHealthChecksRep } from "./health-checks";
import { PrismaIncidentsRep } from "./incidents";
import { PrismaOrganizationsRep } from "./organizations";
import { PrismaProjectsRep } from "./projects";
import { PrismaServicesRep } from "./services";
import { PrismaUsersRep } from "./users";

export class PrismaUOW implements UOW {
	constructor(
		private readonly client: MyPrismaClient,
		readonly repositories = this.createRepositories(client),
	) {}

	private createRepositories(client: TPrismaClient) {
		return {
			healthChecks: new PrismaHealthChecksRep(client),
			incidents: new PrismaIncidentsRep(client),
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
