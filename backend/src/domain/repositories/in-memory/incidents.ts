import type { Incident } from "@domain/entities/incident";
import type { IncidentsRepInterface } from "@domain/repositories/interfaces/incidents";
import type { ListPaginationType } from "@domain/use-cases/utils/paginations/pagination";
import type { IMUOWdb } from "./_uow";

export class IMIncidentsRep implements IncidentsRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	async getById(id: string) {
		const record = this.db.incidents.find((i) => i.getProps().id === id);
		return record ?? null;
	}

	async getByServiceId(serviceId: string) {
		return this.db.incidents.filter(
			(i) => i.getProps().serviceId === serviceId,
		);
	}

	async listByServiceId(serviceId: string, pagination: ListPaginationType) {
		const limit = pagination.limit;
		const cursorId = pagination.cursor.id;

		const sorted = this.db.incidents
			.filter((i) => i.getProps().serviceId === serviceId)
			.sort((a, b) => b.getProps().id.localeCompare(a.getProps().id));

		const afterCursor = cursorId
			? sorted.filter((i) => i.getProps().id < cursorId)
			: sorted;

		const incidents = afterCursor.slice(0, limit);
		const hasNextPage = afterCursor.length > limit;
		const lastIncident = incidents.at(-1);

		return {
			incidents,
			pagination: {
				limit,
				hasNextPage,
				nextCursor:
					hasNextPage && lastIncident
						? { id: lastIncident.getProps().id }
						: { id: null },
			},
		};
	}

	async create(data: Incident) {
		this.db.incidents.push(data);
		return data;
	}

	async update(data: Incident) {
		const index = this.db.incidents.findIndex(
			(i) => i.getProps().id === data.getProps().id,
		);
		if (index !== -1) {
			this.db.incidents[index] = data;
		}
		return data;
	}

	async deleteByServiceId(serviceId: string) {
		this.db.incidents = this.db.incidents.filter(
			(i) => i.getProps().serviceId !== serviceId,
		);
	}
}
