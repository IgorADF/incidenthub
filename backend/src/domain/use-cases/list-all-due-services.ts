import { Service } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";

export class ListAllDueServices {
  constructor(private readonly uow: UOW) {}

  async execute(now: Date = new Date()): Promise<{ services: Service[] }> {
    const services = await this.uow.repositories.services.listAllDue(now);
    return { services };
  }
}
