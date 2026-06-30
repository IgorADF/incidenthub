import { HealthCheckSchema } from "@domain/entities/health-check";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import {
	type ListPaginationType,
	NextPaginationList,
} from "./utils/paginations/pagination";

export const ListHealthChecksByServiceOutputSchema = z.object({
	healthChecks: z.array(HealthCheckSchema),
	pagination: NextPaginationList,
});

export type ListHealthChecksByServiceOutput = z.infer<
	typeof ListHealthChecksByServiceOutputSchema
>;

export class ListHealthChecksByService {
	constructor(private readonly uow: UOW) { }

	async execute(
		requesterUserId: string,
		serviceId: string,
		pagination: ListPaginationType,
	): Promise<ListHealthChecksByServiceOutput> {
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

		const { healthChecks, pagination: nextPagination } =
			await this.uow.repositories.healthChecks.listByServiceId(
				serviceId,
				pagination,
			);

		return ListHealthChecksByServiceOutputSchema.parse({
			healthChecks: healthChecks.map((hc) => hc.getProps()),
			pagination: nextPagination,
		});
	}
}
