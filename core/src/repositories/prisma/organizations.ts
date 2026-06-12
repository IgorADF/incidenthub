import { Organization } from "../../types/entities";
import { TPrismaClient } from "../../types/prisma-client";
import { createPrismaDefaultValues } from "../../utils/prisma-default-values";
import { OrganizationsRepInterface } from "../interfaces/organizations";

export class PrismaOrganizationsRep implements OrganizationsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByName(name: string) {
    return await this.prisma.organization.findUnique({ where: { name } });
  }

  async create({ name }: { name: string }) {
    const newOrg: Organization = {
      name,
      ...createPrismaDefaultValues(),
    };

    return await this.prisma.organization.create({ data: newOrg });
  }
}
