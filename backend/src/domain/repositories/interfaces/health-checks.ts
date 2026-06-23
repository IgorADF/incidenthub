import { HealthCheck } from "@domain/entities/health-check";

export interface HealthChecksRepInterface {
  getById: (id: string) => Promise<HealthCheck | null>;
  getByServiceId: (serviceId: string) => Promise<HealthCheck[]>;
  create: (data: HealthCheck) => Promise<HealthCheck>;
  deleteByServiceId: (serviceId: string) => Promise<void>;
}
