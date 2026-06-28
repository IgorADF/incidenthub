import { Project, ProjectSchema } from "@domain/entities/project";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";

const MAX_PROJECTS_PER_ORGANIZATION = 5;

export const CreateProjectInputSchema = z.object({
	name: ProjectSchema.shape.name,
	showPublicPage: ProjectSchema.shape.showPublicPage,
	publicPageSlug: ProjectSchema.shape.publicPageSlug,
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const CreateProjectOutputSchema = z.object({
	project: ProjectSchema,
});

export type CreateProjectOutput = z.infer<typeof CreateProjectOutputSchema>;

export class CreateProject {
	constructor(private readonly uow: UOW) {}

	async execute(
		creatorUserId: string,
		input: CreateProjectInput,
	): Promise<CreateProjectOutput> {
		const creator = await this.uow.repositories.users.getById(creatorUserId);

		if (!creator || creator.getProps().type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const organizationProjects =
			await this.uow.repositories.projects.getByOrganizationId(
				creator.getProps().organizationId,
			);

		const projectWithSameName = organizationProjects.find(
			(project) => project.getProps().name === input.name,
		);

		if (projectWithSameName) {
			throw new EntityAlreadyExists({
				entity: "project",
				field: "name",
			});
		}

		if (input.publicPageSlug) {
			const projectWithSameSlug =
				await this.uow.repositories.projects.getByPublicPageSlug(
					input.publicPageSlug,
				);

			if (projectWithSameSlug) {
				throw new EntityAlreadyExists({
					entity: "project",
					field: "publicPageSlug",
				});
			}
		}

		if (organizationProjects.length >= MAX_PROJECTS_PER_ORGANIZATION) {
			throw new LimitExceededError(
				`Organization cannot have more than ${MAX_PROJECTS_PER_ORGANIZATION} projects`,
			);
		}

		const project = Project.create({
			organizationId: creator.getProps().organizationId,
			name: input.name,
			showPublicPage: input.showPublicPage ?? false,
			publicPageSlug: input.publicPageSlug ?? null,
		});

		return await this.uow.transaction(async (reps) => {
			const created = await reps.projects.create(project);
			return CreateProjectOutputSchema.parse({ project: created.getProps() });
		});
	}
}
