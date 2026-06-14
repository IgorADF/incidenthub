import { Organization } from "../../entities/organization";
import { TPrismaClient } from "../../types/prisma-client";
import { OrganizationsRepInterface } from "../interfaces/organizations";

export class PrismaOrganizationsRep implements OrganizationsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByName(name: string) {
    const record = await this.prisma.organization.findUnique({
      where: { name },
    });
    return record ? Organization.fromPrismaToEntity(record) : null;
  }

  async create(data: Organization) {
    const record = await this.prisma.organization.create({
      data: Organization.fromEntityToPrisma(data),
    });
    return Organization.fromPrismaToEntity(record);
  }
}
