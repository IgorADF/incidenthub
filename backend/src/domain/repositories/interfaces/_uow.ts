import type { HealthChecksRepInterface } from "./health-checks";
import type { IncidentsRepInterface } from "./incidents";
import type { OrganizationsRepInterface } from "./organizations";
import type { ProjectsRepInterface } from "./projects";
import type { ServicesRepInterface } from "./services";
import type { UsersRepInterface } from "./users";

export interface UOW {
	repositories: {
		healthChecks: HealthChecksRepInterface;
		incidents: IncidentsRepInterface;
		organizations: OrganizationsRepInterface;
		projects: ProjectsRepInterface;
		services: ServicesRepInterface;
		users: UsersRepInterface;
	};

	transaction<T>(
		callback: (repositories: UOW["repositories"]) => Promise<T>,
	): Promise<T>;
}
