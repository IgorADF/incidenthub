import { ServiceSchema } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import z from "zod";

export const ToggleServiceEnabledOutputSchema = z.object({
  service: z.object(ServiceSchema.shape).omit({
    consecutivesIncidentDetectionFails: true,
    lastCheckedAt: true,
  }),
});

export type ToggleServiceEnabledOutput = z.infer<
  typeof ToggleServiceEnabledOutputSchema
>;

export class ToggleServiceEnabled {
  constructor(private readonly uow: UOW) {}

  async execute(
    updaterUserId: string,
    serviceId: string,
    enable: boolean,
  ): Promise<ToggleServiceEnabledOutput> {
    const updater = await this.uow.repositories.users.getById(updaterUserId);

    if (!updater || updater.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const service = await this.uow.repositories.services.getById(serviceId);

    if (!service) {
      throw new NotFoundError("Service");
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

    const updated = enable ? service.enable() : service.disable();

    return await this.uow.transaction(async (reps) => {
      const result = await reps.services.update(updated);
      return ToggleServiceEnabledOutputSchema.parse({
        service: result.getProps(),
      });
    });
  }
}
