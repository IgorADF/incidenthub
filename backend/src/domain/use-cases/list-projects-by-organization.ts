import { ProjectSchema } from "@domain/entities/project";
import { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";

export const ListProjectsByOrganizationOutputSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type ListProjectsByOrganizationOutput = z.infer<
  typeof ListProjectsByOrganizationOutputSchema
>;

export class ListProjectsByOrganization {
  constructor(private readonly uow: UOW) {}

  async execute(
    organizationId: string,
  ): Promise<ListProjectsByOrganizationOutput> {
    const projects =
      await this.uow.repositories.projects.getByOrganizationId(organizationId);

    return ListProjectsByOrganizationOutputSchema.parse({
      projects: projects.map((project) => project.getProps()),
    });
  }
}
