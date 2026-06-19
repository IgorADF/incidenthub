import { HealthCheck } from "@domain/entities/health-check";
import { HealthChecksRepInterface } from "@domain/repositories/interfaces/health-checks";
import { IMUOWdb } from "./_uow";

export class IMHealthChecksRep implements HealthChecksRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.healthChecks.find((h) => h.getProps().id === id);
    return record ?? null;
  }

  async getByServiceId(serviceId: string) {
    return this.db.healthChecks.filter(
      (h) => h.getProps().serviceId === serviceId,
    );
  }

  async create(data: HealthCheck) {
    this.db.healthChecks.push(data);
    return data;
  }
}
