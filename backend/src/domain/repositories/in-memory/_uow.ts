import type { HealthCheck } from "@domain/entities/health-check";
import type { Incident } from "@domain/entities/incident";
import type { Organization } from "@domain/entities/organization";
import type { Project } from "@domain/entities/project";
import type { Service } from "@domain/entities/service";
import type { UserWithPassword } from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import { IMHealthChecksRep } from "./health-checks";
import { IMIncidentsRep } from "./incidents";
import { IMOrganizationsRep } from "./organizations";
import { IMProjectsRep } from "./projects";
import { IMServicesRep } from "./services";
import { IMUsersRep } from "./users";

export type IMUOWdb = {
	healthChecks: HealthCheck[];
	incidents: Incident[];
	organizations: Organization[];
	projects: Project[];
	services: Service[];
	users: UserWithPassword[];
};

export class IMUOW implements UOW {
	private db: IMUOWdb = {
		healthChecks: [],
		incidents: [],
		organizations: [],
		projects: [],
		services: [],
		users: [],
	};

	constructor(readonly repositories = this.createRepositories()) {}

	private createRepositories() {
		return {
			healthChecks: new IMHealthChecksRep(this.db),
			incidents: new IMIncidentsRep(this.db),
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
