import type { Service } from "@domain/entities/service";
import type { ServicesRepInterface } from "@domain/repositories/interfaces/services";
import type { TPrismaClient } from "@infra/db/prisma-client";
import { ServiceMapper } from "@infra/mappers/service";

export class PrismaServicesRep implements ServicesRepInterface {
	constructor(private readonly prisma: TPrismaClient) {}

	async getById(id: string) {
		const record = await this.prisma.service.findUnique({
			where: { id },
		});
		return record ? ServiceMapper.fromPrismaToEntity(record) : null;
	}

	async getByProjectId(projectId: string) {
		const records = await this.prisma.service.findMany({
			where: { projectId },
		});
		return records.map(ServiceMapper.fromPrismaToEntity);
	}

	async listAllDue(now: Date) {
		const records = await this.prisma.service.findMany({
			where: { enabled: true },
		});

		return records.map(ServiceMapper.fromPrismaToEntity).filter((service) => {
			const props = service.getProps();
			if (props.lastCheckedAt === null) return true;
			const dueAt = new Date(
				props.lastCheckedAt.getTime() + props.intervalSeconds * 1000,
			);
			return dueAt <= now;
		});
	}

	async create(data: Service) {
		const record = await this.prisma.service.create({
			data: ServiceMapper.fromEntityToPrisma(data),
		});
		return ServiceMapper.fromPrismaToEntity(record);
	}

	async update(data: Service) {
		const record = await this.prisma.service.update({
			where: { id: data.getProps().id },
			data: ServiceMapper.fromEntityToPrisma(data),
		});
		return ServiceMapper.fromPrismaToEntity(record);
	}

	async delete(id: string) {
		await this.prisma.service.delete({ where: { id } });
	}
}
