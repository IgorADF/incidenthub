import type { Service } from "@domain/entities/service";
import type { ServicesRepInterface } from "@domain/repositories/interfaces/services";
import type { IMUOWdb } from "./_uow";

export class IMServicesRep implements ServicesRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	async getById(id: string) {
		const record = this.db.services.find((s) => s.getProps().id === id);
		return record ?? null;
	}

	async getByProjectId(projectId: string) {
		return this.db.services.filter((s) => s.getProps().projectId === projectId);
	}

	async listAllDue(now: Date) {
		return this.db.services.filter((s) => {
			const props = s.getProps();
			if (!props.enabled) return false;
			if (props.lastCheckedAt === null) return true;
			const dueAt = new Date(
				props.lastCheckedAt.getTime() + props.intervalSeconds * 1000,
			);
			return dueAt <= now;
		});
	}

	async create(data: Service) {
		this.db.services.push(data);
		return data;
	}

	async update(data: Service) {
		const index = this.db.services.findIndex(
			(s) => s.getProps().id === data.getProps().id,
		);
		if (index !== -1) {
			this.db.services[index] = data;
		}
		return data;
	}

	async delete(id: string) {
		const index = this.db.services.findIndex((s) => s.getProps().id === id);
		if (index !== -1) {
			this.db.services.splice(index, 1);
		}
	}
}
