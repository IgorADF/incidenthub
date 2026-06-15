import { Project } from "../../entities/project";
import { TPrismaClient } from "../../types/prisma-client";
import { ProjectsRepInterface } from "../interfaces/projects";

export class PrismaProjectsRep implements ProjectsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByOrganizationId(organizationId: string) {
    const records = await this.prisma.project.findMany({
      where: { organizationId },
    });
    return records.map(Project.fromPrismaToEntity);
  }

  async create(data: Project) {
    const record = await this.prisma.project.create({
      data: Project.fromEntityToPrisma(data),
    });
    return Project.fromPrismaToEntity(record);
  }
}
