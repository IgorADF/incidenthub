import { ServiceSchema } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import z from "zod";

export const ListServicesByProjectOutputSchema = z.object({
  services: z.array(
    z.object(ServiceSchema.shape).omit({
      consecutivesIncidentDetectionFails: true,
      lastCheckedAt: true,
    }),
  ),
});

export type ListServicesByProjectOutput = z.infer<
  typeof ListServicesByProjectOutputSchema
>;

export class ListServicesByProject {
  constructor(private readonly uow: UOW) {}

  async execute(
    userId: string,
    projectId: string,
  ): Promise<ListServicesByProjectOutput> {
    const user = await this.uow.repositories.users.getById(userId);

    if (!user) {
      throw new NotAllowedError();
    }

    const project = await this.uow.repositories.projects.getById(projectId);

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.getProps().organizationId !== user.getProps().organizationId) {
      throw new NotAllowedError();
    }

    const services =
      await this.uow.repositories.services.getByProjectId(projectId);

    return ListServicesByProjectOutputSchema.parse({
      services: services.map((service) => service.getProps()),
    });
  }
}
