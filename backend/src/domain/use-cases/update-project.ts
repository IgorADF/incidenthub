import { Project, ProjectSchema } from "@domain/entities/project";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const UpdateProjectInputSchema = z
	.object({
		name: ProjectSchema.shape.name.optional(),
		showPublicPage: ProjectSchema.shape.showPublicPage.optional(),
		publicPageSlug: ProjectSchema.shape.publicPageSlug.optional(),
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.showPublicPage !== undefined ||
			data.publicPageSlug !== undefined,
		{ message: "At least one field must be provided" },
	);

export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

export const UpdateProjectOutputSchema = z.object({
	project: ProjectSchema,
});

export type UpdateProjectOutput = z.infer<typeof UpdateProjectOutputSchema>;

export class UpdateProject {
	constructor(private readonly uow: UOW) { }

	async execute(
		actorUserId: string,
		projectId: string,
		input: UpdateProjectInput,
	): Promise<UpdateProjectOutput> {
		const actor = await this.uow.repositories.users.getById(actorUserId);

		if (actor?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const project = await this.uow.repositories.projects.getById(projectId);

		if (!project) {
			throw new NotFoundError("Project");
		}

		if (project.getProps().organizationId !== actor.getProps().organizationId) {
			throw new NotAllowedError();
		}

		const props = project.getProps();
		const newName = input.name ?? props.name;
		const newShowPublicPage = input.showPublicPage ?? props.showPublicPage;
		const newSlug =
			input.publicPageSlug !== undefined
				? input.publicPageSlug
				: props.publicPageSlug;

		if (input.name !== undefined && input.name !== props.name) {
			const orgProjects =
				await this.uow.repositories.projects.getByOrganizationId(
					props.organizationId,
				);

			const conflict = orgProjects.find(
				(p) =>
					p.getProps().name === newName &&
					p.getProps().id !== projectId,
			);

			if (conflict) {
				throw new EntityAlreadyExists({ entity: "project", field: "name" });
			}
		}

		if (
			input.publicPageSlug !== undefined &&
			input.publicPageSlug !== null &&
			input.publicPageSlug !== props.publicPageSlug
		) {
			const conflict =
				await this.uow.repositories.projects.getByPublicPageSlug(
					input.publicPageSlug,
				);

			if (conflict && conflict.getProps().id !== projectId) {
				throw new EntityAlreadyExists({
					entity: "project",
					field: "publicPageSlug",
				});
			}
		}

		const projectToUpdate = Project.fromProps({
			...props,
			name: newName,
			showPublicPage: newShowPublicPage,
			publicPageSlug: newSlug,
		});

		const updatedProject = await this.uow.transaction(async (reps) => {
			const result = await reps.projects.update(projectToUpdate);
			if (!result) {
				throw new NotFoundError("Project");
			}

			return result
		});

		return UpdateProjectOutputSchema.parse({ project: updatedProject.getProps() });
	}
}