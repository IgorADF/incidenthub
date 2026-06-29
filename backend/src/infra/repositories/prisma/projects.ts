import type { Project } from "@domain/entities/project";
import type { ProjectsRepInterface } from "@domain/repositories/interfaces/projects";
import type { TPrismaClient } from "@infra/db/prisma-client";
import { ProjectMapper } from "@infra/mappers/project";

export class PrismaProjectsRep implements ProjectsRepInterface {
	constructor(private readonly prisma: TPrismaClient) {}

	async getById(id: string) {
		const record = await this.prisma.project.findUnique({ where: { id } });
		return record ? ProjectMapper.fromPrismaToEntity(record) : null;
	}

	async getByOrganizationId(organizationId: string) {
		const records = await this.prisma.project.findMany({
			where: { organizationId },
		});
		return records.map(ProjectMapper.fromPrismaToEntity);
	}

	async getByPublicPageSlug(slug: string) {
		const record = await this.prisma.project.findUnique({
			where: { publicPageSlug: slug },
		});
		return record ? ProjectMapper.fromPrismaToEntity(record) : null;
	}

	async create(data: Project) {
		const record = await this.prisma.project.create({
			data: ProjectMapper.fromEntityToPrisma(data),
		});
		return ProjectMapper.fromPrismaToEntity(record);
	}

	async update(data: Project) {
		const props = data.getProps();
		const record = await this.prisma.project.update({
			where: { id: props.id },
			data: ProjectMapper.fromEntityToPrisma(data),
		});
		return ProjectMapper.fromPrismaToEntity(record);
	}

	async delete(id: string) {
		await this.prisma.project.delete({ where: { id } });
	}
}
