import { Service, ServiceSchema } from "@domain/entities/service";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

const MAX_SERVICES_PER_PROJECT = 10;

export const CreateServiceInputSchema = z.object({
	url: ServiceSchema.shape.url,
	name: ServiceSchema.shape.name,
	intervalSeconds: ServiceSchema.shape.intervalSeconds,
	timeoutSeconds: ServiceSchema.shape.timeoutSeconds,
	expectedResponseStatus: ServiceSchema.shape.expectedResponseStatus,
	incidentDetectionFails: ServiceSchema.shape.incidentDetectionFails,
	emailToAlert: ServiceSchema.shape.emailToAlert,
});

export type CreateServiceInput = z.infer<typeof CreateServiceInputSchema>;

export const CreateServiceOutputSchema = z.object({
	service: z.object(ServiceSchema.shape).omit({
		consecutivesIncidentDetectionFails: true,
		lastCheckedAt: true,
	}),
});

export type CreateServiceOutput = z.infer<typeof CreateServiceOutputSchema>;

export class CreateService {
	constructor(private readonly uow: UOW) {}

	async execute(
		creatorUserId: string,
		projectId: string,
		input: CreateServiceInput,
	): Promise<CreateServiceOutput> {
		const creator = await this.uow.repositories.users.getById(creatorUserId);

		if (creator?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const project = await this.uow.repositories.projects.getById(projectId);

		if (!project) {
			throw new NotFoundError("Project");
		}

		if (
			project.getProps().organizationId !== creator.getProps().organizationId
		) {
			throw new NotAllowedError();
		}

		const projectServices =
			await this.uow.repositories.services.getByProjectId(projectId);

		if (projectServices.length >= MAX_SERVICES_PER_PROJECT) {
			throw new LimitExceededError(
				`Project cannot have more than ${MAX_SERVICES_PER_PROJECT} services`,
			);
		}

		const service = Service.create({
			projectId: project.getProps().id,
			name: input.name,
			url: input.url,
			intervalSeconds: input.intervalSeconds,
			timeoutSeconds: input.timeoutSeconds,
			expectedResponseStatus: input.expectedResponseStatus,
			incidentDetectionFails: input.incidentDetectionFails,
			emailToAlert: input.emailToAlert,
		});

		return await this.uow.transaction(async (reps) => {
			const created = await reps.services.create(service);
			return CreateServiceOutputSchema.parse({ service: created.getProps() });
		});
	}
}
