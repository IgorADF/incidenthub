import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";
import { Service } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";

const MAX_SERVICES_PER_PROJECT = 10;

type CreateServiceInput = {
  url: string;
  intervalSeconds?: number;
  timeoutSeconds?: number;
  expectedResponseStatus?: number;
  incidentDetectionFails?: number;
  emailToAlert?: string;
  enabled?: boolean;
};

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
      throw new NotAllowedError();
    }

    if (
      project.getProps().organizationId.value !==
      creator.getProps().organizationId.value
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
      projectId: new AssociationUUIDv7(project.getProps().id.value),
      url: input.url,
      intervalSeconds: input.intervalSeconds,
      timeoutSeconds: input.timeoutSeconds,
      expectedResponseStatus: input.expectedResponseStatus,
      incidentDetectionFails: input.incidentDetectionFails,
      emailToAlert: input.emailToAlert,
      enabled: input.enabled,
    });

    return await this.uow.transaction(async (reps) => {
      await reps.services.create(service);
      return { service };
    });
  }
}
