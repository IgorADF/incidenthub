import { Service } from "../../entities/service";
import { ServicesRepInterface } from "../interfaces/services";
import { IMUOWdb } from "./_uow";

export class IMServicesRep implements ServicesRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getByProjectId(projectId: string) {
    return this.db.services.filter(
      (s) => s.getProps().projectId === projectId,
    );
  }

  async create(data: Service) {
    this.db.services.push(data);
    return data;
  }
}
