import type { Service } from "@domain/entities/service";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const DeleteServiceOutputSchema = z.object({
	deleted: z.boolean(),
});

export type DeleteServiceOutput = z.infer<typeof DeleteServiceOutputSchema>;

export class DeleteService {
	constructor(private readonly uow: UOW) {}

	async cascadeDelete(reps: UOW["repositories"], service: Service) {
		const serviceId = service.getProps().id;

		if (service.getProps().currentIncidentId) {
			const resolved = service.resolveCurrentIncident();
			await reps.services.update(resolved);
		}

		await reps.healthChecks.deleteByServiceId(serviceId);
		await reps.incidents.deleteByServiceId(serviceId);
		await reps.services.delete(serviceId);
	}

	async execute(
		deleterUserId: string,
		serviceId: string,
	): Promise<DeleteServiceOutput> {
		const deleter = await this.uow.repositories.users.getById(deleterUserId);

		if (deleter?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const service = await this.uow.repositories.services.getById(serviceId);

		if (!service) {
			throw new NotFoundError("Service");
		}

		const project = await this.uow.repositories.projects.getById(
			service.getProps().projectId,
		);

		if (
			!project ||
			project.getProps().organizationId !== deleter.getProps().organizationId
		) {
			throw new NotAllowedError();
		}

		return await this.uow.transaction(async (reps) => {
			await this.cascadeDelete(reps, service);
			return DeleteServiceOutputSchema.parse({ deleted: true });
		});
	}
}
