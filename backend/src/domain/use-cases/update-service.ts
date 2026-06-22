import { Service } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import z from "zod";

export const UpdateServiceInputSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  intervalSeconds: z.number().optional(),
  timeoutSeconds: z.number().optional(),
  expectedResponseStatus: z.number().optional(),
  incidentDetectionFails: z.number().optional(),
  emailToAlert: z.string().nullable().optional(),
});

export type UpdateServiceInput = z.infer<typeof UpdateServiceInputSchema>;

export class UpdateService {
  constructor(private readonly uow: UOW) {}

  async execute(
    updaterUserId: string,
    serviceId: string,
    input: UpdateServiceInput,
  ) {
    const updater = await this.uow.repositories.users.getById(updaterUserId);

    if (!updater || updater.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const service = await this.uow.repositories.services.getById(serviceId);

    if (!service) {
      throw new NotFoundError("Service");
    }

    if (service.getProps().enabled) {
      throw new NotAllowedError(
        "Service can only be updated when disabled",
      );
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
      return { service: result };
    });
  }
}
