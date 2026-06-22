import { Service, ServiceType } from "@domain/entities/service";
import { ServicesRepInterface } from "@domain/repositories/interfaces/services";
import { TPrismaClient } from "@infra/db/prisma-client";
import { ServiceMapper } from "@infra/mappers/service";

export class PrismaServicesRep implements ServicesRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.service.findUnique({
      where: { id },
    });
    return record ? ServiceMapper.fromPrismaToEntity(record) : null;
  }

  async getByProjectId(projectId: string) {
    const records = await this.prisma.service.findMany({
      where: { projectId },
    });
    return records.map(ServiceMapper.fromPrismaToEntity);
  }

  async listAllDue(now: Date) {
    const records = await this.prisma.$queryRaw<ServiceType[]>`
      SELECT * FROM services
      WHERE enabled = true
      AND (
        last_checked_at IS NULL
        OR last_checked_at + (interval_seconds || ' seconds')::interval <= ${now}
      )
    `;

    return records.map(ServiceMapper.fromPrismaToEntity);
  }

  async create(data: Service) {
    const record = await this.prisma.service.create({
      data: ServiceMapper.fromEntityToPrisma(data),
    });
    return ServiceMapper.fromPrismaToEntity(record);
  }

  async update(data: Service) {
    const record = await this.prisma.service.update({
      where: { id: data.getProps().id },
      data: ServiceMapper.fromEntityToPrisma(data),
    });
    return ServiceMapper.fromPrismaToEntity(record);
  }

  async delete(id: string) {
    await this.prisma.service.delete({ where: { id } });
  }
}
