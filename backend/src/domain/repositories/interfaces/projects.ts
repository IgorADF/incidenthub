import type { Project } from "@domain/entities/project";

export interface ProjectsRepInterface {
	getById: (id: string) => Promise<Project | null>;
	getByOrganizationId: (organizationId: string) => Promise<Project[]>;
	getByPublicPageSlug: (slug: string) => Promise<Project | null>;
	create: (data: Project) => Promise<Project>;
	update: (data: Project) => Promise<Project | null>;
}
