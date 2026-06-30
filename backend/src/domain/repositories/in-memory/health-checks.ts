import type { HealthCheck } from "@domain/entities/health-check";
import type { HealthChecksRepInterface } from "@domain/repositories/interfaces/health-checks";
import type { ListPaginationType } from "@domain/use-cases/utils/paginations/pagination";
import type { IMUOWdb } from "./_uow";

export class IMHealthChecksRep implements HealthChecksRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	async getById(id: string) {
		const record = this.db.healthChecks.find((h) => h.getProps().id === id);
		return record ?? null;
	}

	async getByServiceId(serviceId: string) {
		return this.db.healthChecks.filter(
			(h) => h.getProps().serviceId === serviceId,
		);
	}

	async listByServiceId(serviceId: string, pagination: ListPaginationType) {
		const limit = pagination.limit;
		const cursorId = pagination.cursor.id;

		const sorted = this.db.healthChecks
			.filter((h) => h.getProps().serviceId === serviceId)
			.sort((a, b) => b.getProps().id.localeCompare(a.getProps().id));

		const afterCursor = cursorId
			? sorted.filter((h) => h.getProps().id < cursorId)
			: sorted;

		const healthChecks = afterCursor.slice(0, limit);
		const hasNextPage = afterCursor.length > limit;
		const lastHealthCheck = healthChecks.at(-1);

		return {
			healthChecks,
			pagination: {
				limit,
				hasNextPage,
				nextCursor:
					hasNextPage && lastHealthCheck
						? { id: lastHealthCheck.getProps().id }
						: { id: null },
			},
		};
	}

	async create(data: HealthCheck) {
		this.db.healthChecks.push(data);
		return data;
	}

	async deleteByServiceId(serviceId: string) {
		this.db.healthChecks = this.db.healthChecks.filter(
			(h) => h.getProps().serviceId !== serviceId,
		);
	}
}
