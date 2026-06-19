import { Incident } from "@domain/entities/incident";
import { IncidentsRepInterface } from "@domain/repositories/interfaces/incidents";
import { IMUOWdb } from "./_uow";

export class IMIncidentsRep implements IncidentsRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.incidents.find((i) => i.getProps().id === id);
    return record ?? null;
  }

  async getByServiceId(serviceId: string) {
    return this.db.incidents.filter(
      (i) => i.getProps().serviceId === serviceId,
    );
  }

  async create(data: Incident) {
    this.db.incidents.push(data);
    return data;
  }
}
