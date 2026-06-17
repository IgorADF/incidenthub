import { Service } from "@domain/entities/service";

export interface ServicesRepInterface {
  getByProjectId: (projectId: string) => Promise<Service[]>;
  create: (data: Service) => Promise<Service>;
}
