import { Project } from "../../entities/project";
import { TPrismaClient } from "../../types/prisma-client";
import { ProjectsRepInterface } from "../interfaces/projects";

export class PrismaProjectsRep implements ProjectsRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.project.findUnique({ where: { id } });
    return record ? Project.fromPrismaToEntity(record) : null;
  }

  async getByPublicPageSlug(slug: string) {
    const record = await this.prisma.project.findUnique({
      where: { publicPageSlug: slug },
    });
    return record ? Project.fromPrismaToEntity(record) : null;
  }

  async getByNameAndOrganizationId(name: string, organizationId: string) {
    const record = await this.prisma.project.findFirst({
      where: { name, organizationId },
    });
    return record ? Project.fromPrismaToEntity(record) : null;
  }

  async create(data: Project) {
    const record = await this.prisma.project.create({
      data: Project.fromEntityToPrisma(data),
    });
    return Project.fromPrismaToEntity(record);
  }
}
