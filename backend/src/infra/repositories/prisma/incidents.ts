import type { Incident } from "@domain/entities/incident";
import type { IncidentsRepInterface } from "@domain/repositories/interfaces/incidents";
import type { ListPaginationType } from "@domain/use-cases/utils/paginations/pagination";
import type { TPrismaClient } from "@infra/db/prisma-client";
import { IncidentMapper } from "@infra/mappers/incident";

export class PrismaIncidentsRep implements IncidentsRepInterface {
	constructor(private readonly prisma: TPrismaClient) {}

	async getById(id: string) {
		const record = await this.prisma.incident.findUnique({
			where: { id },
		});
		return record ? IncidentMapper.fromPrismaToEntity(record) : null;
	}

	async getByServiceId(serviceId: string) {
		const records = await this.prisma.incident.findMany({
			where: { serviceId },
		});
		return records.map(IncidentMapper.fromPrismaToEntity);
	}

	async listByServiceId(serviceId: string, pagination: ListPaginationType) {
		const limit = pagination.limit;
		const cursorId = pagination.cursor.id;
		const hasCursor = !!cursorId;

		const records = await this.prisma.incident.findMany({
			where: {
				serviceId,
				...(hasCursor ? { id: { lt: cursorId } } : {}),
			},
			orderBy: { id: "desc" },
			take: limit + 1,
		});

		const incidents = records
			.slice(0, limit)
			.map(IncidentMapper.fromPrismaToEntity);

		const lastIncident = incidents.at(-1);
		const hasNextPage = records.length > limit;
		const nextCursor =
			hasNextPage && lastIncident
				? { id: lastIncident.getProps().id }
				: { id: null };

		return {
			incidents,
			pagination: {
				limit,
				hasNextPage,
				nextCursor,
			},
		};
	}

	async create(data: Incident) {
		const record = await this.prisma.incident.create({
			data: IncidentMapper.fromEntityToPrisma(data),
		});
		return IncidentMapper.fromPrismaToEntity(record);
	}

	async update(data: Incident) {
		const record = await this.prisma.incident.update({
			where: { id: data.getProps().id },
			data: IncidentMapper.fromEntityToPrisma(data),
		});
		return IncidentMapper.fromPrismaToEntity(record);
	}

	async deleteByServiceId(serviceId: string) {
		await this.prisma.incident.deleteMany({ where: { serviceId } });
	}
}
