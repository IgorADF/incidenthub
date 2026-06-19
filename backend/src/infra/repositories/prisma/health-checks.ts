import { HealthCheck } from "@domain/entities/health-check";
import { HealthChecksRepInterface } from "@domain/repositories/interfaces/health-checks";
import { TPrismaClient } from "@infra/db/prisma-client";
import { HealthCheckMapper } from "@infra/mappers/health-check";

export class PrismaHealthChecksRep implements HealthChecksRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.healthCheck.findUnique({
      where: { id },
    });
    return record ? HealthCheckMapper.fromPrismaToEntity(record) : null;
  }

  async getByServiceId(serviceId: string) {
    const records = await this.prisma.healthCheck.findMany({
      where: { serviceId },
    });
    return records.map(HealthCheckMapper.fromPrismaToEntity);
  }

  async create(data: HealthCheck) {
    const record = await this.prisma.healthCheck.create({
      data: HealthCheckMapper.fromEntityToPrisma(data),
    });
    return HealthCheckMapper.fromPrismaToEntity(record);
  }
}
