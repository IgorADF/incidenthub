import { Service } from "@domain/entities/service";
import { ServicesRepInterface } from "@domain/repositories/interfaces/services";
import { ServiceMapper } from "@infra/mappers/service";
import { TPrismaClient } from "~types/prisma-client";

export class PrismaServicesRep implements ServicesRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByProjectId(projectId: string) {
    const records = await this.prisma.service.findMany({
      where: { projectId },
    });
    return records.map(ServiceMapper.fromPrismaToEntity);
  }

  async create(data: Service) {
    const record = await this.prisma.service.create({
      data: ServiceMapper.fromEntityToPrisma(data),
    });
    return ServiceMapper.fromPrismaToEntity(record);
  }
}
