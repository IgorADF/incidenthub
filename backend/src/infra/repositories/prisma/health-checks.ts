import type { HealthCheck } from "@domain/entities/health-check";
import type { HealthChecksRepInterface } from "@domain/repositories/interfaces/health-checks";
import type { ListPaginationType } from "@domain/use-cases/utils/paginations/pagination";
import type { TPrismaClient } from "@infra/db/prisma-client";
import { HealthCheckMapper } from "@infra/mappers/health-check";

export class PrismaHealthChecksRep implements HealthChecksRepInterface {
	constructor(private readonly prisma: TPrismaClient) {}

	async getById(id: string) {
		const record = await this.prisma.healthCheck.findUnique({
			where: { id },
		});
		return record ? HealthCheckMapper.fromPrismaToEntity(record) : null;
	}

	async getByServiceId(serviceId: string) {
		const records = await this.prisma.healthCheck.findMany({
			where: { serviceId },
		});
		return records.map(HealthCheckMapper.fromPrismaToEntity);
	}

	async listByServiceId(serviceId: string, pagination: ListPaginationType) {
		const limit = pagination.limit;
		const cursorId = pagination.cursor.id;
		const hasCursor = !!cursorId;

		const records = await this.prisma.healthCheck.findMany({
			where: {
				serviceId,
				...(hasCursor ? { id: { lt: cursorId } } : {}),
			},
			orderBy: { id: "desc" },
			take: limit + 1,
		});

		const healthChecks = records
			.slice(0, limit)
			.map(HealthCheckMapper.fromPrismaToEntity);

		const lastHealthCheck = healthChecks.at(-1);
		const hasNextPage = records.length > limit;
		const nextCursor =
			hasNextPage && lastHealthCheck
				? { id: lastHealthCheck.getProps().id }
				: { id: null };

		return {
			healthChecks,
			pagination: {
				limit,
				hasNextPage,
				nextCursor,
			},
		};
	}

	async create(data: HealthCheck) {
		const record = await this.prisma.healthCheck.create({
			data: HealthCheckMapper.fromEntityToPrisma(data),
		});
		return HealthCheckMapper.fromPrismaToEntity(record);
	}

	async deleteByServiceId(serviceId: string) {
		await this.prisma.healthCheck.deleteMany({ where: { serviceId } });
	}
}
