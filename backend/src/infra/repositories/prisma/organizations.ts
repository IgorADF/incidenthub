import { Organization } from "@domain/entities/organization";
import { OrganizationsRepInterface } from "@domain/repositories/interfaces/organizations";
import { OrganizationMapper } from "@infra/mappers/organization";
import { TPrismaClient } from "~types/prisma-client";

export class PrismaOrganizationsRep implements OrganizationsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByName(name: string) {
    const record = await this.prisma.organization.findUnique({
      where: { name },
    });
    return record ? OrganizationMapper.fromPrismaToEntity(record) : null;
  }

  async create(data: Organization) {
    const record = await this.prisma.organization.create({
      data: OrganizationMapper.fromEntityToPrisma(data),
    });
    return OrganizationMapper.fromPrismaToEntity(record);
  }
}
