import { Service } from "@domain/entities/service";

export interface ServicesRepInterface {
  getById: (id: string) => Promise<Service | null>;
  getByProjectId: (projectId: string) => Promise<Service[]>;
  listAllDue: (now: Date) => Promise<Service[]>;
  create: (data: Service) => Promise<Service>;
  update: (data: Service) => Promise<Service>;
  delete: (id: string) => Promise<void>;
}
