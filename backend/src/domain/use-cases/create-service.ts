import { Service } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import z from "zod";

const MAX_SERVICES_PER_PROJECT = 10;

export const CreateServiceInputSchema = z.object({
  url: z.string(),
  name: z.string(),
  intervalSeconds: z.number(),
  timeoutSeconds: z.number(),
  expectedResponseStatus: z.number(),
  incidentDetectionFails: z.number(),
  emailToAlert: z.string(),
});

export type CreateServiceInput = z.infer<typeof CreateServiceInputSchema>;

export class CreateService {
  constructor(private readonly uow: UOW) {}

  async execute(
    creatorUserId: string,
    projectId: string,
    input: CreateServiceInput,
  ) {
    const creator = await this.uow.repositories.users.getById(creatorUserId);

    if (!creator || creator.getProps().type !== "ADMIN") {
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
      await reps.services.create(service);
      return { service };
    });
  }
}
