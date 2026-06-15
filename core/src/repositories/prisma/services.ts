import { Service } from "../../entities/service";
import { TPrismaClient } from "../../types/prisma-client";
import { ServicesRepInterface } from "../interfaces/services";

export class PrismaServicesRep implements ServicesRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByProjectId(projectId: string) {
    const records = await this.prisma.service.findMany({
      where: { projectId },
    });
    return records.map(Service.fromPrismaToEntity);
  }

  async create(data: Service) {
    const record = await this.prisma.service.create({
      data: Service.fromEntityToPrisma(data),
    });
    return Service.fromPrismaToEntity(record);
  }
}
