import { Service, ServiceSchema } from "@domain/entities/service";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const UpdateServiceInputSchema = z
	.object({
		name: ServiceSchema.shape.name,
		url: ServiceSchema.shape.url,
		intervalSeconds: ServiceSchema.shape.intervalSeconds,
		timeoutSeconds: ServiceSchema.shape.timeoutSeconds,
		expectedResponseStatus: ServiceSchema.shape.expectedResponseStatus,
		incidentDetectionFails: ServiceSchema.shape.incidentDetectionFails,
		emailToAlert: ServiceSchema.shape.emailToAlert,
	})
	.partial();

export type UpdateServiceInput = z.infer<typeof UpdateServiceInputSchema>;

export const UpdateServiceOutputSchema = z.object({
	service: z.object(ServiceSchema.shape).omit({
		consecutivesIncidentDetectionFails: true,
		lastCheckedAt: true,
	}),
});

export type UpdateServiceOutput = z.infer<typeof UpdateServiceOutputSchema>;

export class UpdateService {
	constructor(private readonly uow: UOW) {}

	async execute(
		updaterUserId: string,
		serviceId: string,
		input: UpdateServiceInput,
	): Promise<UpdateServiceOutput> {
		const updater = await this.uow.repositories.users.getById(updaterUserId);

		if (!updater || updater.getProps().type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const service = await this.uow.repositories.services.getById(serviceId);

		if (!service) {
			throw new NotFoundError("Service");
		}

		if (service.getProps().enabled) {
			throw new NotAllowedError("Service can only be updated when disabled");
		}

		const project = await this.uow.repositories.projects.getById(
			service.getProps().projectId,
		);

		if (
			!project ||
			project.getProps().organizationId !== updater.getProps().organizationId
		) {
			throw new NotAllowedError();
		}

		const props = service.getProps();

		const updated = Service.fromProps({
			...props,
			name: input.name ?? props.name,
			url: input.url ?? props.url,
			intervalSeconds: input.intervalSeconds ?? props.intervalSeconds,
			timeoutSeconds: input.timeoutSeconds ?? props.timeoutSeconds,
			expectedResponseStatus:
				input.expectedResponseStatus ?? props.expectedResponseStatus,
			incidentDetectionFails:
				input.incidentDetectionFails ?? props.incidentDetectionFails,
			emailToAlert:
				input.emailToAlert !== undefined
					? input.emailToAlert
					: props.emailToAlert,
		});

		return await this.uow.transaction(async (reps) => {
			const result = await reps.services.update(updated);
			return UpdateServiceOutputSchema.parse({ service: result.getProps() });
		});
	}
}
