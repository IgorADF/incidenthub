import type { Project } from "@domain/entities/project";
import type { ProjectsRepInterface } from "@domain/repositories/interfaces/projects";
import type { IMUOWdb } from "./_uow";

export class IMProjectsRep implements ProjectsRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	async getById(id: string) {
		const record = this.db.projects.find((p) => p.getProps().id === id);
		return record ?? null;
	}

	async getByOrganizationId(organizationId: string) {
		return this.db.projects.filter(
			(p) => p.getProps().organizationId === organizationId,
		);
	}

	async getByPublicPageSlug(slug: string) {
		const record = this.db.projects.find(
			(p) => p.getProps().publicPageSlug === slug,
		);
		return record ?? null;
	}

	async create(data: Project) {
		this.db.projects.push(data);
		return data;
	}

	async update(data: Project) {
		const index = this.db.projects.findIndex(
			(p) => p.getProps().id === data.getProps().id,
		);
		if (index === -1) {
			return null;
		}
		this.db.projects[index] = data;
		return data;
	}

	async delete(id: string) {
		const index = this.db.projects.findIndex((p) => p.getProps().id === id);
		if (index !== -1) {
			this.db.projects.splice(index, 1);
		}
	}
}
