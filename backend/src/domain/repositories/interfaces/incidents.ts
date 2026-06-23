import { Incident } from "@domain/entities/incident";

export interface IncidentsRepInterface {
  getById: (id: string) => Promise<Incident | null>;
  getByServiceId: (serviceId: string) => Promise<Incident[]>;
  create: (data: Incident) => Promise<Incident>;
  update: (data: Incident) => Promise<Incident>;
  deleteByServiceId: (serviceId: string) => Promise<void>;
}
