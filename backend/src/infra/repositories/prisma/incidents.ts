import { Incident } from "@domain/entities/incident";
import { IncidentsRepInterface } from "@domain/repositories/interfaces/incidents";
import { TPrismaClient } from "@infra/db/prisma-client";
import { IncidentMapper } from "@infra/mappers/incident";

export class PrismaIncidentsRep implements IncidentsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.incident.findUnique({
      where: { id },
    });
    return record ? IncidentMapper.fromPrismaToEntity(record) : null;
  }

  async getByServiceId(serviceId: string) {
    const records = await this.prisma.incident.findMany({
      where: { serviceId },
    });
    return records.map(IncidentMapper.fromPrismaToEntity);
  }

  async create(data: Incident) {
    const record = await this.prisma.incident.create({
      data: IncidentMapper.fromEntityToPrisma(data),
    });
    return IncidentMapper.fromPrismaToEntity(record);
  }
}
