import { UOW } from "@domain/repositories/interfaces/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export class DeleteService {
  constructor(private readonly uow: UOW) {}

  async execute(deleterUserId: string, serviceId: string) {
    const deleter = await this.uow.repositories.users.getById(deleterUserId);

    if (!deleter || deleter.getProps().type !== "ADMIN") {
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
      project.getProps().organizationId !== deleter.getProps().organizationId
    ) {
      throw new NotAllowedError();
    }

    return await this.uow.transaction(async (reps) => {
      if (service.getProps().currentIncidentId) {
        const incident = await reps.incidents.getById(
          service.getProps().currentIncidentId!,
        );
        if (incident && !incident.getProps().resolvedAt) {
          const resolved = incident.resolve(new Date());
          await reps.incidents.update(resolved);
        }
      }

      await reps.services.delete(serviceId);
      return { deleted: true };
    });
  }
}
