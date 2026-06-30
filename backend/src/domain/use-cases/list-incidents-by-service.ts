import { IncidentSchema } from "@domain/entities/incident";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import {
	type ListPaginationType,
	NextPaginationList,
} from "./utils/paginations/pagination";

export const ListIncidentsByServiceOutputSchema = z.object({
	incidents: z.array(IncidentSchema),
	pagination: NextPaginationList,
});

export type ListIncidentsByServiceOutput = z.infer<
	typeof ListIncidentsByServiceOutputSchema
>;

export class ListIncidentsByService {
	constructor(private readonly uow: UOW) {}

	async execute(
		requesterUserId: string,
		serviceId: string,
		pagination: ListPaginationType,
	): Promise<ListIncidentsByServiceOutput> {
		const requester =
			await this.uow.repositories.users.getById(requesterUserId);

		if (requester?.getProps()?.type !== "ADMIN") {
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
			project.getProps().organizationId !== requester.getProps().organizationId
		) {
			throw new NotAllowedError();
		}

		const { incidents, pagination: nextPagination } =
			await this.uow.repositories.incidents.listByServiceId(
				serviceId,
				pagination,
			);

		return ListIncidentsByServiceOutputSchema.parse({
			incidents: incidents.map((incident) => incident.getProps()),
			pagination: nextPagination,
		});
	}
}
