import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import type { DeleteService } from "./delete-service";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const DeleteProjectOutputSchema = z.object({
	deleted: z.boolean(),
});

export type DeleteProjectOutput = z.infer<typeof DeleteProjectOutputSchema>;

export class DeleteProject {
	constructor(
		private readonly uow: UOW,
		private readonly deleteService: DeleteService,
	) {}

	async execute(
		deleterUserId: string,
		projectId: string,
	): Promise<DeleteProjectOutput> {
		const deleter = await this.uow.repositories.users.getById(deleterUserId);

		if (deleter?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const project = await this.uow.repositories.projects.getById(projectId);

		if (!project) {
			throw new NotFoundError("Project");
		}

		if (
			project.getProps().organizationId !== deleter.getProps().organizationId
		) {
			throw new NotAllowedError();
		}

		const services =
			await this.uow.repositories.services.getByProjectId(projectId);

		return await this.uow.transaction(async (reps) => {
			for (const service of services) {
				await this.deleteService.cascadeDelete(reps, service);
			}

			await reps.projects.delete(projectId);

			return DeleteProjectOutputSchema.parse({ deleted: true });
		});
	}
}
